// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { CASHFREE_BASE_URL, cashfreeHeaders } from "@/lib/cashfree";
import crypto from "crypto";

// 499
const PRICE_TABLE = {
  starter: { amount: 2, currency: "INR", label: "Starter" },
  pro: { amount: 999, currency: "INR", label: "Pro" },
} as const;

type PlanId = keyof typeof PRICE_TABLE;

function makeOrderId(userId: string, planId: PlanId) {
  const rand = crypto.randomBytes(6).toString("hex");
  return `sub_${planId}_${userId}_${rand}`;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bodyIn = (await req.json()) as {
    planId?: PlanId;
    email?: string;
    phone?: string;
    name?: string;
  };

  const planId = bodyIn.planId;
  if (!planId || !(planId in PRICE_TABLE)) {
    return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
  }

  try {
    await connectToDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { amount, currency } = PRICE_TABLE[planId];

    const email = (
      bodyIn.email?.trim() ||
      user.email?.trim() ||
      ""
    ).toLowerCase();
    let phone = (bodyIn.phone || user.phone || "").replace(/[^\d]/g, "");
    const name = bodyIn.name || user.name || user.fullName || "Customer";

    const isSandbox = CASHFREE_BASE_URL.includes("sandbox");
    if (!/^\d{6,15}$/.test(phone)) {
      if (isSandbox) phone = "9999999999";
      else {
        return NextResponse.json(
          { error: "Phone number required (6–15 digits)." },
          { status: 400 }
        );
      }
    }
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const orderId = makeOrderId(userId, planId);

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: userId,
        customer_email: email,
        customer_phone: phone,
        customer_name: name,
      },
      order_note: `Upgrade to ${planId}`,
      order_meta: {
        // ⬇️ NEUTRAL return page — we’ll verify actual status there
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/return?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cashfree`,
      },
      // Optional: tag the plan for easier debugging/reporting
      order_tags: { plan: planId },
    };

    const res = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: cashfreeHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[CASHFREE_ORDER_ERROR]", data);
      return NextResponse.json(
        { error: "Failed to create payment order", details: data },
        { status: 400 }
      );
    }

    const paymentLink =
      data?.payment_link ||
      data?.order?.payment_link ||
      data?.payment_session_url;
    const paymentSessionId = data?.payment_session_id || null;

    // Create local order record (source of truth will be webhook + verify)
    await SubscriptionOrder.create({
      userId,
      planId,
      orderId,
      status: "created",
      amount,
      currency,
    });

    return NextResponse.json(
      {
        orderId,
        paymentLink: paymentLink || null,
        paymentSessionId,
        orderStatus: data?.order_status || "CREATED",
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[CHECKOUT_ERROR]", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
