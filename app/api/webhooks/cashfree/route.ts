// app/api/webhooks/cashfree/route.ts
import { NextResponse } from "next/server";                    // ← use NextResponse
import { connectToDB } from "@/lib/mongodb";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { User } from "@/models/User";
import { monthsFromNow } from "@/lib/cashfree";
import crypto from "crypto";

// ✅ App Router friendly flags (optional but useful for webhooks)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ safer signature check + timingSafeEqual
function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {                     // ← standard Request is fine
  // Read raw body first (needed for signature)
  const raw = await req.text();
  const signature =
    req.headers.get("x-webhook-signature") ||                  // Cashfree commonly uses this
    req.headers.get("x-cf-signature") ||                       // fallback
    null;

  // In dev, you can skip verification if no secret is set
  const skipVerify =
    process.env.NODE_ENV !== "production" &&
    !process.env.CASHFREE_WEBHOOK_SECRET;

  if (!skipVerify && !verifySignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse JSON AFTER signature verification
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Normalize fields from Cashfree
  const orderId =
    payload?.data?.order?.order_id ||
    payload?.order?.order_id ||
    payload?.order_id ||
    null;

  // status can appear under various keys; normalize to UPPER
  const statusRaw =
    payload?.data?.payment?.payment_status ||
    payload?.payment?.payment_status ||
    payload?.payment_status ||
    payload?.data?.order?.order_status ||
    payload?.order?.order_status ||
    payload?.order_status ||
    payload?.type ||
    "";

  const status = String(statusRaw).toUpperCase();

  if (!orderId) {
    return NextResponse.json({ error: "No order_id in webhook" }, { status: 400 });
  }

  // Define what counts as a success/failure
  const isSuccess =
    status.includes("SUCCESS") ||
    status.includes("PAID") ||
    status.includes("COMPLETED") ||
    status.includes("CAPTURED") ||
    status.includes("PAYMENT_SUCCESS");

  const isFailed =
    status.includes("FAILED") ||
    status.includes("CANCELLED") ||
    status.includes("PAYMENT_FAILED");

  try {
    await connectToDB();

    const order = await SubscriptionOrder.findOne({ orderId });
    if (!order) {
      // We don’t know this order — nothing to update
      return NextResponse.json({ ok: true, note: "Order not found, ignoring." });
    }

    // Always persist the raw payload for audit/debugging
    order.raw = payload;

    if (isSuccess) {
      order.status = "paid";

      // Upgrade the user based on the plan saved in our order
      const user = await User.findOne({ clerkId: order.userId });
      if (user) {
        user.plan = order.planId;                               // "starter" | "pro"
        user.subscriptionProvider = "cashfree";
        user.subscriptionId = order.orderId;
        user.planRenewsAt = monthsFromNow(1);
        user.cancelAtPeriodEnd = false;
        await user.save();
      }

      await order.save();
      return NextResponse.json({ ok: true });
    }

    if (isFailed) {
      order.status = "failed";
      await order.save();
      return NextResponse.json({ ok: true });
    }

    // For other intermediate events, just store and acknowledge
    await order.save();
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("[CASHFREE_WEBHOOK_ERROR]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ❌ Remove this — App Router route handlers do NOT support `export const config`
// export const config = { api: { bodyParser: false } } as any;
