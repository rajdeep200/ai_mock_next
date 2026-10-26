// app/api/webhooks/cashfree/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import SubscriptionOrder from "@/models/SubscriptionOrder";
import { reconcileOrder } from "@/lib/billing";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cashfree signs webhooks (API version 2022-09-01 and later) as
 * base64(HMAC-SHA256(x-webhook-timestamp + rawBody, secretKey)) and sends it in x-webhook-signature.
 * This is only used as a signal for logging: the webhook body is never trusted. What actually decides
 * whether an order is paid is reconcileOrder(), which asks Cashfree's API directly.
 */
function signatureLooksValid(rawBody: string, signature: string | null, timestamp: string | null) {
  if (!signature || !timestamp) return false;
  const secrets = [process.env.CASHFREE_WEBHOOK_SECRET, process.env.CASHFREE_SECRET_KEY].filter(Boolean) as string[];
  return secrets.some((secret) => {
    const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

/** Pull the order id out of the different payload shapes Cashfree uses. */
function extractOrderId(payload: any): string | null {
  const id =
    payload?.data?.order?.order_id ??
    payload?.order?.order_id ??
    payload?.order_id ??
    payload?.data?.order_id ??
    null;
  return typeof id === "string" && id ? id : null;
}

export async function POST(req: Request) {
  const raw = await req.text();

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = extractOrderId(payload);
  if (!orderId) {
    return NextResponse.json({ error: "No order_id in webhook" }, { status: 400 });
  }

  const signed = signatureLooksValid(
    raw,
    req.headers.get("x-webhook-signature"),
    req.headers.get("x-webhook-timestamp")
  );
  const eventType = String(payload?.type ?? payload?.event ?? "");
  console.log("[CASHFREE_WEBHOOK]", { orderId, eventType, signed });

  try {
    await connectToDB();
    const order = await SubscriptionOrder.findOne({ orderId });

    // Unknown order: ignore so we don't create junk or leak whether an id exists
    if (!order) {
      return NextResponse.json({ ok: true, note: "Unknown order_id, ignored." });
    }

    // Audit info (never used to make a decision)
    order.raw = payload;
    order.lastWebhookEvent = eventType || order.lastWebhookEvent;
    const cfOrderId = payload?.data?.order?.cf_order_id ?? payload?.order?.cf_order_id;
    const cfPaymentId = payload?.data?.payment?.cf_payment_id ?? payload?.payment?.cf_payment_id;
    if (cfOrderId != null) order.cfOrderId = cfOrderId;
    if (cfPaymentId != null) order.cfPaymentId = String(cfPaymentId);

    // The decision: ask Cashfree. A forged webhook can at most trigger a harmless lookup.
    const outcome = await reconcileOrder(order);
    order.lastWebhookNote = outcome.detail;
    await order.save();

    return NextResponse.json({ ok: true, status: outcome.status });
  } catch (e) {
    console.error("[CASHFREE_WEBHOOK_ERROR]", e);
    // 500 makes Cashfree retry the webhook later
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
