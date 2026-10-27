import { redirect } from "next/navigation";

// Old landing page; the payment status screen at /billing/return now handles every outcome.
export default async function Page({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  redirect(order_id ? `/billing/return?order_id=${encodeURIComponent(order_id)}` : "/billing/return");
}
