// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { CASHFREE_BASE_URL, cashfreeHeaders } from "@/lib/cashfree";
import crypto from "crypto";

// your price table (monthly)
const PRICE_TABLE = {
  starter: { amount: 499, currency: "INR", label: "Starter" }, // ₹499
  pro: { amount: 999, currency: "INR", label: "Pro" }, // ₹999
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

  // Accept optional email/phone/name override from client
  const bodyIn = (await req.json()) as {
    planId?: PlanId;
    email?: string;
    phone?: string; // allow client-provided phone
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

    // --- Derive customer details ---
    const email = (
      bodyIn.email?.trim() ||
      user.email?.trim() ||
      ""
    ).toLowerCase();
    let phone = (bodyIn.phone || user.phone || "").replace(/[^\d]/g, ""); // digits only
    const name = bodyIn.name || user.name || user.fullName || "Customer";

    const isSandbox = CASHFREE_BASE_URL.includes("sandbox");
    // In production, enforce a valid phone; in sandbox allow fallback
    if (!/^\d{6,15}$/.test(phone)) {
      if (isSandbox) {
        phone = "9999999999";
      } else {
        return NextResponse.json(
          {
            error:
              "Phone number required. Provide a valid digits-only phone (6-15 digits).",
          },
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
        customer_phone: phone, // ✅ REQUIRED by Cashfree
        customer_name: name,
      },
      order_note: `Upgrade to ${planId}`,
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cashfree`,
      },
    };

    const res = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: cashfreeHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();
    console.log('checkout data :: ', data)

    if (!res.ok) {
      console.error("[CASHFREE_ORDER_ERROR]", data);
      return NextResponse.json(
        { error: "Failed to create payment order", details: data },
        { status: 400 }
      );
    }

    // Cashfree response may differ; try common fields
    const paymentLink =
      data?.payment_link ||
      data?.order?.payment_link ||
      data?.payment_session_url;

    // Optional: you might prefer to return payment_session_id for Drop-in SDK
    const paymentSessionId = data?.payment_session_id;

    // Persist our order
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
        paymentSessionId: paymentSessionId || null,
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
