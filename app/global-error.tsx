// app/global-error.tsx
"use client";

import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className="relative min-h-screen bg-black text-gray-200">
                {/* Neon underglow + grid */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(900px_260px_at_50%_120%,rgba(34,197,94,.12),transparent_70%)]" />
                    <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)] opacity-40">
                        <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:42px_42px]" />
                    </div>
                </div>

                <main className="relative mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6 text-center">
                    <section>
                        <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-gray-900/60 px-3 py-1 text-xs font-medium text-emerald-300/90 shadow-[0_0_16px_rgba(16,185,129,.18)] ring-1 ring-emerald-500/20">
                            500 — Unexpected error
                        </span>
                        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                            Something broke on our end.
                        </h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400 sm:text-base">
                            Please try again. If the issue persists, reach out and share the error
                            ID below so we can investigate.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => reset()}
                                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/15 hover:text-emerald-200"
                            >
                                ↻ Reload App
                            </button>
                            <Link
                                href="/"
                                className="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-900"
                            >
                                ← Back to Home
                            </Link>
                        </div>

                        {error?.digest && (
                            <p className="mt-4 text-xs text-gray-500">
                                Error ID: <span className="font-mono">{error.digest}</span>
                            </p>
                        )}
                    </section>
                </main>
            </body>
        </html>
    );
}
