'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuccessPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const orderId = sp.get('order_id');

    useEffect(() => {
        // Optionally re-fetch /api/plan after a short delay
    }, []);

    return (
        <main className="min-h-screen bg-black text-white p-6">
            <h1 className="text-3xl font-semibold text-green-400 mb-4">Payment Initiated</h1>
            <p className="text-gray-300 mb-6">
                Thanks! Your order <span className="text-green-400 font-mono">{orderId}</span> is being processed.
                Once we receive confirmation from Cashfree (a few seconds), your plan will be upgraded.
            </p>
            <button onClick={() => router.push('/pricing')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
                Back to Pricing
            </button>
        </main>
    );
}
