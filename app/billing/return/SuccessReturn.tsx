// app/billing/return/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiArrowRight,
    FiRefreshCw,
    FiShield,
    FiCreditCard,
} from "react-icons/fi";

type VerifyResp = {
    ok?: boolean;
    orderId?: string;
    status?: string; // "paid" | "failed" | "pending" | "created" | etc.
    planId?: "starter" | "pro";
    planLabel?: string;
    amount?: number;
    currency?: string;
    details?: string;
};

const STATUS_COPY: Record<
    "success" | "failed" | "pending" | "unknown",
    { title: string; subtitle: string; icon: any }
> = {
    success: {
        title: "Payment Successful",
        subtitle:
            "Your subscription is active. You can start using your new plan right away.",
        icon: <FiCheckCircle className="text-emerald-400" size={28} />,
    },
    failed: {
        title: "Payment Failed",
        subtitle:
            "Looks like the payment didn’t go through. You can try again or use a different method.",
        icon: <FiXCircle className="text-red-400" size={28} />,
    },
    pending: {
        title: "Payment Pending",
        subtitle:
            "We’re still waiting for confirmation from the payment provider. This usually resolves in a few seconds.",
        icon: <FiClock className="text-yellow-400" size={28} />,
    },
    unknown: {
        title: "We’re Checking Your Payment",
        subtitle:
            "We couldn’t determine the final status yet. Please wait a moment or refresh.",
        icon: <FiShield className="text-gray-300" size={28} />,
    },
};

function StatusBadge({ status }: { status: "success" | "failed" | "pending" | "unknown" }) {
    const color =
        status === "success"
            ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
            : status === "failed"
                ? "text-red-300 border-red-500/40 bg-red-500/10"
                : status === "pending"
                    ? "text-yellow-200 border-yellow-500/40 bg-yellow-500/10"
                    : "text-gray-300 border-gray-500/40 bg-gray-700/20";

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${color}`}
        >
            <span className="block h-2 w-2 rounded-full bg-current opacity-80" />
            {status.toUpperCase()}
        </span>
    );
}

export default function BillingReturnPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const orderId = sp.get("order_id") || sp.get("orderId") || "";

    const [loading, setLoading] = useState(true);
    const [resp, setResp] = useState<VerifyResp | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Poll for up to ~45s if we're pending/unknown to allow webhook to arrive
    const pollingRef = useRef<number>(0);

    const canonical: "success" | "failed" | "pending" | "unknown" = useMemo(() => {
        const s = (resp?.status || "").toLowerCase();
        if (["paid", "success", "completed", "captured"].some((k) => s.includes(k))) return "success";
        if (["failed", "cancelled", "canceled"].some((k) => s.includes(k))) return "failed";
        if (["created", "pending", "authorized", "initiated"].some((k) => s.includes(k))) return "pending";
        return resp ? "unknown" : "pending";
    }, [resp]);

    const fetchVerify = async () => {
        if (!orderId) {
            setError("No order id found in URL.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // You’ll implement this endpoint to read Cashfree/DB:
            // GET /api/billing/verify?orderId=...
            const res = await fetch(`/api/billing/verify?orderId=${encodeURIComponent(orderId)}`, {
                cache: "no-store",
            });
            const data = (await res.json()) as VerifyResp;
            if (!res.ok) throw new Error(data?.details || "Verification failed");
            setResp(data);
        } catch (e: any) {
            setError(e?.message || "Something went wrong verifying your payment.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerify();
    }, [orderId]);

    useEffect(() => {
        if (!loading && (canonical === "pending" || canonical === "unknown")) {
            if (pollingRef.current >= 15) return; // ~15 polls * 3s = 45s
            const t = setTimeout(() => {
                pollingRef.current += 1;
                fetchVerify();
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [loading, canonical]);

    const statusCopy = STATUS_COPY[canonical];

    return (
        <main className="relative min-h-screen bg-black text-white">
            {/* Ambient background */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,.05),transparent_45%)]" />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
            </div>

            <section className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-14 sm:py-20">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 grid place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                            <FiCreditCard className="text-emerald-300" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold">
                                <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-200 bg-clip-text text-transparent">
                                    Billing Status
                                </span>
                            </h1>
                            <p className="text-xs text-gray-400">Secure checkout verification</p>
                        </div>
                    </div>
                    <StatusBadge status={canonical} />
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-emerald-500/25 bg-gray-950/70 backdrop-blur ring-1 ring-emerald-500/10 shadow-[0_0_28px_rgba(16,185,129,.15)]">
                    <div className="border-b border-gray-800 p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">{statusCopy.icon}</div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">{statusCopy.title}</h2>
                                <p className="mt-1 text-sm text-gray-300">{statusCopy.subtitle}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {/* Loading / Error */}
                        {loading ? (
                            <div className="flex items-center gap-3 text-gray-300">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                                Checking payment status…
                            </div>
                        ) : error ? (
                            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                                {error}
                            </div>
                        ) : (
                            <>
                                {/* Order snapshot */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Order ID</p>
                                        <p className="mt-1 font-mono text-sm text-emerald-300 break-all">
                                            {resp?.orderId || orderId || "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Plan</p>
                                        <p className="mt-1 text-sm text-gray-200">
                                            {resp?.planLabel
                                                ? resp.planLabel
                                                : resp?.planId
                                                    ? resp.planId.toUpperCase()
                                                    : "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Amount</p>
                                        <p className="mt-1 text-sm text-gray-200">
                                            {resp?.amount != null && resp?.currency
                                                ? `${resp.currency} ${resp.amount}`
                                                : "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-800 bg-black/40 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-400">Provider</p>
                                        <p className="mt-1 text-sm text-gray-200">Cashfree</p>
                                    </div>
                                </div>

                                {/* CTA row */}
                                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    {canonical === "success" && (
                                        <>
                                            <Link href="/home" className="group w-full sm:w-auto">
                                                <button className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500">
                                                    Go to App
                                                    <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
                                                </button>
                                            </Link>
                                            <Link href="/history" className="w-full sm:w-auto">
                                                <button className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-5 py-2.5 text-gray-200 transition hover:border-emerald-600/60 hover:bg-gray-900/60">
                                                    View History
                                                </button>
                                            </Link>
                                        </>
                                    )}

                                    {canonical === "failed" && (
                                        <>
                                            <Link href="/pricing" className="group w-full sm:w-auto">
                                                <button className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-500">
                                                    Try Again
                                                    <FiRefreshCw className="transition-transform group-hover:rotate-12" />
                                                </button>
                                            </Link>
                                            <a
                                                href="mailto:support@mockqube.com?subject=Payment%20help"
                                                className="w-full sm:w-auto"
                                            >
                                                <button className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-5 py-2.5 text-gray-200 transition hover:border-emerald-600/60 hover:bg-gray-900/60">
                                                    Contact Support
                                                </button>
                                            </a>
                                        </>
                                    )}

                                    {canonical === "pending" || canonical === "unknown" ? (
                                        <>
                                            <button
                                                onClick={() => fetchVerify()}
                                                className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 font-semibold text-emerald-200 transition hover:bg-emerald-500/20 sm:w-auto"
                                            >
                                                Refresh Status
                                                <FiRefreshCw />
                                            </button>
                                            <Link href="/pricing" className="w-full sm:w-auto">
                                                <button className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-5 py-2.5 text-gray-200 transition hover:border-emerald-600/60 hover:bg-gray-900/60">
                                                    Back to Pricing
                                                </button>
                                            </Link>
                                        </>
                                    ) : null}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Help note */}
                <p className="mt-6 text-center text-xs text-gray-400">
                    If your status doesn’t update after a minute, reach us at{" "}
                    <a className="text-emerald-300 underline" href="mailto:support@mockqube.com">
                        support@mockqube.com
                    </a>
                    .
                </p>
            </section>
        </main>
    );
}
