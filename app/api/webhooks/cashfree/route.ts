// app/api/webhooks/cashfree/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { User } from "@/models/User";
import { monthsFromNow } from "@/lib/cashfree";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verify HMAC-SHA256 signature (base64) with timingSafeEqual */
function verifySignature(rawBody: string, signature: string | null) {
  // [WEBHOOK-SIG] must have secret & header
  const secret = process.env.CASHFREE_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  console.log('rawBody -->> ', rawBody)

  const parsedBody = JSON.parse(rawBody);
  console.log('parsedBody -->> ', parsedBody);

  const sortedKeys = Object.keys(parsedBody).sort();
  console.log('sortedKeys -->> ', sortedKeys);

  let postData = "";
  for (const key of sortedKeys) {
    // Concatenate the VALUE for each key
    postData += parsedBody[key];
  }
  console.log("postData -->> ", postData);

  // [WEBHOOK-SIG] some libs prefix with `sha256=` or `hmac=`
  // const clean = signature.replace(/^(sha256=|hmac=)/i, "").trim();
  // console.log('clean -->> ', clean)

  // [WEBHOOK-SIG] HMAC over the *raw bytes*, base64 output
  const expectedB64 = crypto
    .createHmac("sha256", secret)
    .update(postData)
    .digest("base64");
  console.log("expectedB64 -->> ", expectedB64);
  console.log("received signature -->> ", signature);

  // [WEBHOOK-SIG] constant-time compare
  // const a = Buffer.from(clean, "base64");
  // const b = Buffer.from(expectedB64, "base64");
  // if (a.length !== b.length) return false;
  return signature === expectedB64
}

/** Map Cashfree event/status to a canonical bucket */
function normalizeStatus(payload: any): {
  orderId: string | null;
  kind: "success" | "failed" | "pending" | "unknown";
  details?: string;
  cfOrderId?: string;
  cfPaymentId?: string;
  eventType?: string;
} {
  const eventType: string = (payload?.type || payload?.event || "")
    .toString()
    .toLowerCase();

  const orderId =
    payload?.data?.order?.order_id ??
    payload?.order?.order_id ??
    payload?.order_id ??
    payload?.data?.order_id ??
    null;

  const cfOrderId =
    payload?.data?.order?.cf_order_id ??
    payload?.order?.cf_order_id ??
    payload?.cf_order_id ??
    null;

  const paymentStatus =
    payload?.data?.payment?.payment_status ??
    payload?.payment?.payment_status ??
    payload?.payment_status ??
    "";

  const cfPaymentId =
    payload?.data?.payment?.cf_payment_id ??
    payload?.payment?.cf_payment_id ??
    payload?.cf_payment_id ??
    null;

  const orderStatus =
    payload?.data?.order?.order_status ??
    payload?.order?.order_status ??
    payload?.order_status ??
    "";

  const merged = `${eventType} ${paymentStatus} ${orderStatus}`.toLowerCase();

  // Success buckets seen in Cashfree:
  // - order.paid / order.completed
  // - payment.captured / payment.success
  // - order_status: "PAID", "COMPLETED"
  const success = /paid|completed|captured|payment_success/.test(merged);

  // Failure/cancel buckets seen in Cashfree:
  // - order.canceled / payment.failed / payment.user_dropped / payment.cancelled
  // - order_status: "FAILED", "CANCELLED"
  const failed = /failed|canceled|cancelled|user_dropped|payment_failure/.test(
    merged
  );

  // Pending/in-process
  const pending = /pending|authorized|initiated|created|requires_action/.test(
    merged
  );

  const kind: "success" | "failed" | "pending" | "unknown" = success
    ? "success"
    : failed
    ? "failed"
    : pending
    ? "pending"
    : "unknown";

  const details = merged.trim();

  return { orderId, kind, details, cfOrderId, cfPaymentId, eventType };
}

export async function POST(req: Request) {
  // 1) Read raw body (needed for signature)
  const raw = await req.text();

  // 2) Verify signature (enforce in prod)
  const signature =
    req.headers.get("x-webhook-signature") ||
    req.headers.get("x-cf-signature") ||
    req.headers.get("x-cf-webhook-signature") || // some integrations use this
    null;

  console.log('signature -->> ', signature)

  const isProd = process.env.NODE_ENV === "production";
  const hasSecret = !!process.env.CASHFREE_WEBHOOK_SECRET;
  const verified = verifySignature(raw, signature);

  console.log('isProd -->> ', isProd)
  console.log('hasSecret -->> ', hasSecret)
  console.log('verified -->> ', verified)

  if (isProd && hasSecret && !verified) {
    console.log('<<-- Invalid Signature ERROR -->>')
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3) Parse JSON
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  console.log('payload -->> ', payload)

  // 4) Normalize status
  const { orderId, kind, details, cfOrderId, cfPaymentId, eventType } =
    normalizeStatus(payload);
  if (!orderId) {
    return NextResponse.json(
      { error: "No order_id in webhook" },
      { status: 400 }
    );
  }

  console.log('orderId, kind, details, cfOrderId, cfPaymentId, eventType -->> ', orderId, kind, details, cfOrderId, cfPaymentId, eventType)

  try {
    await connectToDB();
    const order = await SubscriptionOrder.findOne({ orderId });

    console.log('order -->> ', order)

    // If we don’t know this order, ignore to avoid creating junk rows
    if (!order) {
      return NextResponse.json({
        ok: true,
        note: "Unknown order_id, ignored.",
      });
    }

    // Always store audit info
    order.raw = payload;
    if (cfOrderId) order.cfOrderId = cfOrderId;
    if (cfPaymentId) order.cfPaymentId = cfPaymentId;
    order.lastWebhookEvent = eventType || order.lastWebhookEvent;
    order.lastWebhookNote = details || order.lastWebhookNote; // most recent status text 
    
    console.log('order 2 -->> ', order)

    // Idempotency: don’t downgrade a PAID order
    if (order.status === "paid" && kind === "success") {
      await order.save();
      return NextResponse.json({ ok: true, note: "Already paid, ack." });
    }

    if (kind === "success") {
      console.log('Upgrading user... -->> ')
      order.status = "paid";
      await order.save();

      // Upgrade user once, only if not already upgraded
      const user = await User.findOne({ clerkId: order.userId });
      if (user) {
        const alreadyOnPlan =
          user.plan === order.planId && user.subscriptionId === order.orderId;
        console.log('alreadyOnPlan -->> ', alreadyOnPlan)
        if (!alreadyOnPlan) {
          user.plan = order.planId as any; // "starter" | "pro"
          user.subscriptionProvider = "cashfree";
          user.subscriptionId = order.orderId;
          user.planRenewsAt = monthsFromNow(1);
          user.cancelAtPeriodEnd = false;
          await user.save();
        }
        console.log('user upgraded -->> ', user)  
      }

      return NextResponse.json({ ok: true });
    }

    if (kind === "failed") {
      order.status = "failed";
      await order.save();
      return NextResponse.json({ ok: true });
    }

    // pending/unknown → store and ack
    await order.save();
    return NextResponse.json({ ok: true, kind, details });
  } catch (e) {
    console.error("[CASHFREE_WEBHOOK_ERROR]", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
