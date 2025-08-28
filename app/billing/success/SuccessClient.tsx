"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessClient() {
    const searchParams = useSearchParams();              // ✅ allowed in client
    const orderId = searchParams.get("order_id");
    const [msg, setMsg] = useState("Finalizing your purchase…");

    useEffect(() => {
        // optionally, you could poll/confirm status here if needed
        if (orderId) {
            setMsg(`Payment successful. Order: ${orderId}`);
        } else {
            setMsg("Payment completed. Redirected without order id.");
        }
    }, [orderId]);

    return (
        <div className="space-y-2">
            <h2 className="text-xl font-semibold text-green-400">Thanks!</h2>
            <p className="text-gray-200">{msg}</p>
        </div>
    );
}
