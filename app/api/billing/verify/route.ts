// app/api/billing/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { CASHFREE_BASE_URL, cashfreeHeaders } from "@/lib/cashfree";

type CfPayment = {
  payment_id: string;
  payment_status: string; // "SUCCESS", "FAILED", "PENDING", "AUTHORIZED", etc.
  payment_amount: number;
  payment_currency: string;
  payment_time?: string;
};

function toCanonicalStatus(s: string) {
  const t = s.toUpperCase();
  if (["SUCCESS", "PAID", "COMPLETED", "CAPTURED"].some((k) => t.includes(k)))
    return "paid";
  if (["FAILED", "CANCELLED", "CANCELED"].some((k) => t.includes(k)))
    return "failed";
  // "PENDING", "AUTHORIZED", "INITIATED", "CREATED", "PARTIAL" etc.
  return "pending";
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  await connectToDB();
  const order = await SubscriptionOrder.findOne({ orderId });

  // If we have no record, report unknown (still show UI nicely)
  if (!order) {
    return NextResponse.json({
      ok: true,
      orderId,
      status: "unknown",
      details: "Order not found in DB",
    });
  }

  // If we already have a terminal state, return it immediately
  if (order.status === "paid" || order.status === "failed") {
    return NextResponse.json({
      ok: true,
      orderId: order.orderId,
      status: order.status,
      planId: order.planId,
      planLabel:
        order.planId === "pro"
          ? "Pro"
          : order.planId === "starter"
          ? "Starter"
          : order.planId,
      amount: order.amount,
      currency: order.currency,
      details: "From DB",
    });
  }

  // Otherwise, reconcile with Cashfree (fallback when webhook is missing/late)
  try {
    // Fetch payments associated with this order
    // Docs: GET /orders/{order_id}/payments
    const res = await fetch(
      `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(orderId)}/payments`,
      { headers: cashfreeHeaders(), cache: "no-store" }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: true,
          orderId: order.orderId,
          status: order.status || "pending",
          details: `Cashfree query failed (${res.status}): ${err || "no body"}`,
          planId: order.planId,
          planLabel:
            order.planId === "pro"
              ? "Pro"
              : order.planId === "starter"
              ? "Starter"
              : order.planId,
          amount: order.amount,
          currency: order.currency,
        },
        { status: 200 }
      );
    }

    const payments = (await res.json()) as
      | CfPayment[]
      | { payments?: CfPayment[] };
    const list = Array.isArray(payments) ? payments : payments?.payments || [];

    // If there are no payments yet, keep pending (user may have dropped before paying)
    if (!list.length) {
      return NextResponse.json({
        ok: true,
        orderId: order.orderId,
        status: order.status || "pending",
        planId: order.planId,
        planLabel:
          order.planId === "pro"
            ? "Pro"
            : order.planId === "starter"
            ? "Starter"
            : order.planId,
        amount: order.amount,
        currency: order.currency,
        details: "No payments found yet for this order",
      });
    }

    // Use the most recent payment (Cashfree array is usually newest first; sort if unsure)
    list.sort(
      (a, b) =>
        new Date(b.payment_time || 0).getTime() -
        new Date(a.payment_time || 0).getTime()
    );
    const latest = list[0];

    const canonical = toCanonicalStatus(latest.payment_status);

    // Update DB if we moved to a terminal state
    if (canonical === "paid" && order.status !== "paid") {
      order.status = "paid";
      order.raw = { latestPayment: latest };
      await order.save();
    } else if (canonical === "failed" && order.status !== "failed") {
      order.status = "failed";
      order.raw = { latestPayment: latest };
      await order.save();
    } else {
      // still pending; keep snapshot for audit
      order.raw = { latestPayment: latest };
      await order.save();
    }

    return NextResponse.json({
      ok: true,
      orderId: order.orderId,
      status: canonical,
      planId: order.planId,
      planLabel:
        order.planId === "pro"
          ? "Pro"
          : order.planId === "starter"
          ? "Starter"
          : order.planId,
      amount: order.amount,
      currency: order.currency,
      details: `Reconciled via Cashfree: ${latest.payment_status}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: true,
        orderId: order.orderId,
        status: order.status || "pending",
        planId: order.planId,
        planLabel:
          order.planId === "pro"
            ? "Pro"
            : order.planId === "starter"
            ? "Starter"
            : order.planId,
        amount: order.amount,
        currency: order.currency,
        details: `Reconciliation error: ${e?.message || e}`,
      },
      { status: 200 }
    );
  }
}
