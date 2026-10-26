// lib/billing.ts
// Single place that decides "was this order paid?" and "give the user their plan".
// Used by both the Cashfree webhook and /api/billing/verify so they can never disagree.
import { CASHFREE_BASE_URL, cashfreeHeaders } from "@/lib/cashfree";
import { effectivePlanId, PASS_DAYS, PLAN_RANK } from "@/lib/plans";
import { User } from "@/models/User";

export type OrderOutcome = {
  status: "paid" | "failed" | "pending";
  detail: string;
};

type OrderDoc = {
  userId: string;
  planId: "starter" | "pro";
  orderId: string;
  status: "created" | "paid" | "failed" | "cancelled";
  amount: number;
  currency: string;
  appliedAt?: Date | null;
  cfOrderId?: unknown;
  save: () => Promise<unknown>;
};

const FAILED_PAYMENT = ["FAILED", "CANCELLED", "USER_DROPPED", "VOID"];
const DEAD_ORDER = ["EXPIRED", "TERMINATED", "TERMINATION_REQUESTED"];

/**
 * Upgrade the user for a paid order. Safe to call any number of times: `appliedAt` records that this
 * order already granted its plan, so a late or repeated call can't overwrite a newer purchase.
 * Returns false when the user couldn't be upgraded (the order stays unapplied and is retried next time).
 */
export async function applyPaidOrder(order: OrderDoc): Promise<boolean> {
  const user = await User.findOne({ clerkId: order.userId });
  if (!user) {
    console.error("[BILLING] Paid order but no user found", { orderId: order.orderId });
    return false;
  }

  if (!order.appliedAt) {
    const now = new Date();
    const current = effectivePlanId(user, now);
    // Orders marked paid by the old verify route never upgraded anyone. Those users are still on Free,
    // so grant the plan. If the user is already on a paid plan we leave it alone.
    const legacyPaid = order.status === "paid";

    if (legacyPaid && current !== "free") {
      // already on a paid plan: nothing to grant for this old order
    } else if (PLAN_RANK[order.planId] < PLAN_RANK[current]) {
      // Checkout blocks this, so it only happens if two orders raced. Never downgrade a paying user.
      console.error("[BILLING] Paid order is below the user's active plan; plan left unchanged", {
        orderId: order.orderId,
        ordered: order.planId,
        active: current,
      });
    } else {
      // Buying the same plan while it's still active extends it; anything else starts a fresh pass now.
      const stillActive = user.planRenewsAt && new Date(user.planRenewsAt).getTime() > now.getTime();
      const base = current === order.planId && stillActive ? new Date(user.planRenewsAt) : now;
      user.plan = order.planId;
      user.subscriptionProvider = "cashfree";
      user.subscriptionId = order.orderId;
      user.planRenewsAt = new Date(base.getTime() + PASS_DAYS * 24 * 60 * 60 * 1000);
      user.cancelAtPeriodEnd = false;
      await user.save();
    }
    order.appliedAt = new Date();
  }

  order.status = "paid";
  await order.save();
  return true;
}

/**
 * Ask Cashfree for the truth about this order and update our records to match.
 * Nothing in a webhook body or a browser request is trusted: the decision comes from Cashfree's API.
 */
export async function reconcileOrder(order: OrderDoc): Promise<OrderOutcome> {
  // Already paid on our side: just make sure the plan was actually granted.
  if (order.status === "paid") {
    const applied = await applyPaidOrder(order);
    return { status: "paid", detail: applied ? "Paid" : "Paid; plan upgrade is being retried" };
  }

  const res = await fetch(`${CASHFREE_BASE_URL}/orders/${encodeURIComponent(order.orderId)}`, {
    headers: cashfreeHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Cashfree order lookup failed (${res.status})`);
  }
  const cf = await res.json();
  const orderStatus = String(cf?.order_status ?? "").toUpperCase();
  if (cf?.cf_order_id != null) order.cfOrderId = cf.cf_order_id;

  if (orderStatus === "PAID") {
    const amountOk = Number(cf?.order_amount) === Number(order.amount);
    const currencyOk = !cf?.order_currency || String(cf.order_currency).toUpperCase() === order.currency.toUpperCase();
    if (!amountOk || !currencyOk) {
      console.error("[BILLING] Paid amount/currency mismatch, not upgrading", {
        orderId: order.orderId,
        expected: `${order.currency} ${order.amount}`,
        got: `${cf?.order_currency} ${cf?.order_amount}`,
      });
      return { status: "pending", detail: "Amount mismatch; needs manual review" };
    }
    const applied = await applyPaidOrder(order);
    return { status: "paid", detail: applied ? "Paid" : "Paid; plan upgrade is being retried" };
  }

  if (DEAD_ORDER.includes(orderStatus)) {
    if (order.status !== "failed") {
      order.status = "failed";
      await order.save();
    }
    return { status: "failed", detail: `Order ${orderStatus.toLowerCase()}` };
  }

  // Order is still open (ACTIVE). Look at the latest attempt only to tell the user what happened.
  // This is not terminal: the user may retry on the same order and pay later.
  try {
    const pr = await fetch(`${CASHFREE_BASE_URL}/orders/${encodeURIComponent(order.orderId)}/payments`, {
      headers: cashfreeHeaders(),
      cache: "no-store",
    });
    if (pr.ok) {
      const body = await pr.json();
      const list: { payment_status?: string; payment_time?: string }[] = Array.isArray(body) ? body : body?.payments ?? [];
      if (list.length) {
        const latest = [...list].sort(
          (a, b) => new Date(b.payment_time || 0).getTime() - new Date(a.payment_time || 0).getTime()
        )[0];
        const ps = String(latest.payment_status ?? "").toUpperCase();
        if (FAILED_PAYMENT.includes(ps)) {
          if (order.status !== "failed") {
            order.status = "failed";
            await order.save();
          }
          return { status: "failed", detail: `Latest payment ${ps.toLowerCase()}` };
        }
      }
    }
  } catch {
    /* status text only; fall through to pending */
  }

  return { status: "pending", detail: `Order ${orderStatus.toLowerCase() || "open"}` };
}
