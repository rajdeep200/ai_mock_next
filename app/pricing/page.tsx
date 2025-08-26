'use client';

import { useEffect, useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js'; // ⬅️ NEW

type Plan = {
  id: 'free' | 'starter' | 'pro';
  label: string;
  monthlyInterviewCap: number;
  maxMinutesPerInterview: number;
};
type PlanResp = {
  plan: Plan & { features: any };
  usage: { interviewsCount: number; month: string };
};

export default function PricingPage() {
  const [info, setInfo] = useState<PlanResp | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<null | 'starter' | 'pro'>(null); // ⬅️ CHANGED

  const loadPlan = async () => {
    const res = await fetch('/api/plan', { cache: 'no-store' });
    const response = await res.json()
    console.log('response :: ', response)
    if (res.ok) setInfo(response);
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleUpgrade = async (planId: 'starter' | 'pro') => {
    try {
      setLoadingPlan(planId);

      // 1) Create order on your server -> returns paymentSessionId
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      console.log('checkout data :: ', data)

      if (!res.ok) {
        console.error('Checkout error:', data);
        alert(data?.error || 'Failed to start checkout');
        setLoadingPlan(null);
        return;
      }

      const paymentSessionId: string | undefined = data?.paymentSessionId;
      if (!paymentSessionId) {
        alert('Missing payment session id from server.');
        setLoadingPlan(null);
        return;
      }

      // 2) Load Cashfree + open Drop-in
      const mode =
        process.env.NEXT_PUBLIC_CASHFREE_MODE === 'PROD' ? 'production' : 'sandbox';

      const cashfree = await load({ mode });
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_self', // stay in same tab; Cashfree will redirect to your return_url
      });

      // Note: control usually moves away on redirect; this code may not execute.
    } catch (e) {
      console.error(e);
      alert('Something went wrong starting checkout.');
      setLoadingPlan(null);
    }
  };

  const current = info?.plan.id || 'free';

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-semibold text-green-400 mb-8">Pricing</h1>

      {!info ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free */}
          <PlanCard
            title="Free"
            price="₹0"
            highlight={current === 'free'}
            features={[
              `Up to ${info.plan.monthlyInterviewCap} interviews/mo (on Free: 2)`,
              'Max 15 min / interview',
              'Basic question set',
            ]}
            ctaLabel={current === 'free' ? 'Current Plan' : 'Downgrade'}
            disabled
          />

          {/* Starter */}
          <PlanCard
            title="Starter"
            price="₹499"
            highlight={current === 'starter'}
            features={[
              'Up to 20 interviews/mo',
              'Max 30 min / interview',
              'Company-style questions',
            ]}
            ctaLabel={
              current === 'starter'
                ? 'Current Plan'
                : loadingPlan === 'starter'
                ? 'Redirecting…'
                : 'Upgrade to Starter'
            }
            onClick={() => handleUpgrade('starter')}
            disabled={current === 'starter' || loadingPlan !== null}
          />

          {/* Pro */}
          <PlanCard
            title="Pro"
            price="₹999"
            highlight={current === 'pro'}
            features={[
              'Up to 60 interviews/mo',
              'Max 60 min / interview',
              'Company-style + premium TTS + export',
            ]}
            ctaLabel={
              current === 'pro'
                ? 'Current Plan'
                : loadingPlan === 'pro'
                ? 'Redirecting…'
                : 'Upgrade to Pro'
            }
            onClick={() => handleUpgrade('pro')}
            disabled={current === 'pro' || loadingPlan !== null}
          />
        </div>
      )}
    </main>
  );
}

function PlanCard({
  title,
  price,
  features,
  ctaLabel,
  onClick,
  disabled,
  highlight,
}: {
  title: string;
  price: string;
  features: string[];
  ctaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-xl p-6 ${
        highlight ? 'border-green-500' : 'border-gray-800'
      } bg-gray-900`}
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-3xl font-bold text-green-400 mb-4">
        {price}
        <span className="text-base text-gray-400">/mo</span>
      </p>
      <ul className="text-sm text-gray-300 space-y-2 mb-6">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 rounded-lg font-semibold transition
          ${
            disabled
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
