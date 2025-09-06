// app/not-found.tsx
"use client"
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
            {/* Neon underglow + grid (same style family as Footer) */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(900px_260px_at_50%_120%,rgba(34,197,94,.12),transparent_70%)]" />
                <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)] opacity-40">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:42px_42px]" />
                </div>
            </div>

            <section className="relative mx-auto w-full max-w-2xl px-6 text-center text-gray-200">
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-gray-900/60 px-3 py-1 text-xs font-medium text-emerald-300/90 shadow-[0_0_16px_rgba(16,185,129,.18)] ring-1 ring-emerald-500/20">
                    404 — Page not found
                </span>

                <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Oops, nothing to see here.
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400 sm:text-base">
                    The page you’re looking for doesn’t exist or moved. Try going back home,
                    explore pricing, or contact us if you think this is a mistake.
                </p>

                {/* Actions */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="group inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/15 hover:text-emerald-200"
                    >
                        ← Back to Home
                    </Link>
                    <Link
                        href="/pricing"
                        className="group inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-900"
                    >
                        View Pricing
                    </Link>
                    <Link
                        href="/contact"
                        className="group inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-900"
                    >
                        Contact Us
                    </Link>
                </div>

                {/* Helpful links */}
                <div className="mt-6 text-xs text-gray-500">
                    or check:{" "}
                    <Link href="/terms-of-service" className="text-primary underline-offset-4 hover:underline">
                        Terms
                    </Link>{" "}
                    •{" "}
                    <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
                        Privacy
                    </Link>{" "}
                    •{" "}
                    <Link href="/refund-policy" className="text-primary underline-offset-4 hover:underline">
                        Refunds
                    </Link>
                </div>
            </section>
        </main>
    );
}
