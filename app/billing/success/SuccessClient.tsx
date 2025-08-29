"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiHome, FiCreditCard } from "react-icons/fi";

export default function SuccessClient() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order_id");
    const [msg, setMsg] = useState("Finalizing your purchase…");

    useEffect(() => {
        if (orderId) {
            setMsg(`Payment successful. Order: ${orderId}`);
        } else {
            setMsg("Payment completed. Redirected without order id.");
        }
    }, [orderId]);

    return (
        <div className="space-y-4 max-w-[90%]">
            <h2 className="text-xl font-semibold text-green-400">Thanks!</h2>
            <p className="text-gray-200 w-full text-wrap overflow-x-hidden">{msg}</p>

            <div className="flex flex-wrap gap-3 pt-2">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 text-white transition"
                >
                    <FiHome size={18} />
                    Back to Home
                </Link>

                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                >
                    <FiCreditCard size={18} />
                    Go to Pricing
                </Link>
            </div>
        </div>
    );
}
