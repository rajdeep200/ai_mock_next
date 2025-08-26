// lib/cashfree.ts
export const CASHFREE_BASE_URL =
  (process.env.CASHFREE_ENV || 'sandbox') === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export function cashfreeHeaders() {
  const id = process.env.CASHFREE_APP_ID!;
  const secret = process.env.CASHFREE_SECRET_KEY!;
  return {
    'Content-Type': 'application/json',
    'x-client-id': id,
    'x-client-secret': secret,
    // Cashfree PG API version header; adjust if your account/SDK differs
    'x-api-version': '2022-09-01',
  } as Record<string, string>;
}

export function monthsFromNow(n = 1) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}
