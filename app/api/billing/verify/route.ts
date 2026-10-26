// app/api/billing/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { reconcileOrder } from "@/lib/billing";
import { auth } from "@clerk/nextjs/server";

const PLAN_LABEL: Record<string, string> = { starter: "Starter", pro: "Pro" };

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    await connectToDB();
    // Scoped to the signed-in user, like every other session/order query in the app
    const order = await SubscriptionOrder.findOne({ orderId, userId });

    // Unknown (or someone else's) order: report unknown, never reveal which
    if (!order) {
      return NextResponse.json({
        ok: true,
        orderId,
        status: "unknown",
        details: "Order not found",
      });
    }

    const summary = {
      ok: true,
      orderId: order.orderId,
      planId: order.planId,
      planLabel: PLAN_LABEL[order.planId] ?? order.planId,
      amount: order.amount,
      currency: order.currency,
    };

    // Same reconciliation the webhook uses: confirms with Cashfree and grants the plan if paid.
    try {
      const outcome = await reconcileOrder(order);
      return NextResponse.json({ ...summary, status: outcome.status, details: outcome.detail });
    } catch (e: any) {
      // Cashfree unreachable: report what we know and let the page keep polling
      console.error("[BILLING_VERIFY_ERROR]", e);
      return NextResponse.json({
        ...summary,
        status: order.status === "paid" ? "paid" : "pending",
        details: "Could not reach the payment provider yet",
      });
    }
  } catch (e) {
    console.error("[BILLING_VERIFY_ERROR]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
