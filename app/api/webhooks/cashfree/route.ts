import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import SubscriptionOrder from '@/models/SubscriptionOrder';
import {User} from '@/models/User';
import { monthsFromNow } from '@/lib/cashfree';
import crypto from 'crypto';

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  return computed === signature;
}

export async function POST(req: NextRequest) {
    console.log("INSIDE CASHFREE ROUTE")
  const raw = await req.text(); // IMPORTANT: read raw for signature
  const signature =
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-cf-signature') ||
    null;

  // Optional: allow skipping verification in local dev
  const skipVerify = process.env.NODE_ENV !== 'production' && !process.env.CASHFREE_WEBHOOK_SECRET;

  if (!skipVerify && !verifySignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Parse after signature check
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // You may get different shapes per event. Try common fields:
  // order_id: payload?.data?.order?.order_id || payload?.order?.order_id || payload?.order_id
  // payment_status: payload?.data?.payment?.payment_status || payload?.payment?.payment_status || payload?.payment_status
  const orderId =
    payload?.data?.order?.order_id ||
    payload?.order?.order_id ||
    payload?.order_id;

  const paymentStatus =
    payload?.data?.payment?.payment_status ||
    payload?.payment?.payment_status ||
    payload?.payment_status ||
    payload?.status;

  if (!orderId) {
    return NextResponse.json({ error: 'No order_id in webhook' }, { status: 400 });
  }

  try {
    await connectToDB();

    const order = await SubscriptionOrder.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.raw = payload;

    if (String(paymentStatus).toUpperCase().includes('SUCCESS')) {
      order.status = 'paid';

      // upgrade user
      const user = await User.findOne({ clerkId: order.userId });
      if (user) {
        user.plan = order.planId;
        user.subscriptionProvider = 'cashfree';
        user.subscriptionId = order.orderId;
        user.planRenewsAt = monthsFromNow(1);
        user.cancelAtPeriodEnd = false;
        await user.save();
      }

      await order.save();
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (String(paymentStatus).toUpperCase().includes('FAILED')) {
      order.status = 'failed';
      await order.save();
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ignore other events
    await order.save();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('[CASHFREE_WEBHOOK_ERROR]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Ensure Next doesn’t parse body (we already read raw)
export const config = {
  api: {
    bodyParser: false,
  },
} as any;
