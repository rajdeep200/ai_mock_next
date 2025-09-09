"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLoader, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { ShareInterview } from "@/component/ShareInterview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FeedbackPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-black text-white grid place-items-center p-6">
                    <div className="flex items-center gap-3 text-gray-300">
                        <FiLoader className="animate-spin text-emerald-400" />
                        <span>Loading feedback…</span>
                    </div>
                </main>
            }
        >
            <FeedbackInner />
        </Suspense>
    );
}

function StarRating({
    value,
    onChange,
}: {
    value: number;
    onChange: (n: number) => void;
}) {
    const stars = useMemo(() => [1, 2, 3, 4, 5], []);
    const [hover, setHover] = useState<number | null>(null);

    return (
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating">
            {stars.map((n) => {
                const active = (hover ?? value) >= n;
                return (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={value === n}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => onChange(n)}
                        className={`text-3xl leading-none transition-transform duration-150
              ${active
                                ? "text-yellow-400 scale-105 drop-shadow-[0_0_8px_rgba(250,204,21,.35)]"
                                : "text-gray-600 hover:text-gray-400"}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded`}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}

function FeedbackInner() {
    const router = useRouter();
    const sp = useSearchParams();
    const sessionId = sp.get("sessionId") ?? "";

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const missingSession = !sessionId;

    const submit = async () => {
        if (missingSession) return;
        setSubmitting(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, rating, comment }),
            });
            if (!res.ok) throw new Error(await res.text());
            setDone(true);
            setTimeout(() => router.replace("/history"), 900);
        } catch {
            alert("Failed to submit feedback");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="relative min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden">
            {/* Ambient FX */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0">
                    <div className="animate-[float_10s_ease-in-out_infinite] absolute -top-16 left-[8%] h-72 w-72 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="animate-[float_12s_ease-in-out_infinite] absolute -bottom-20 right-[10%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
                </div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[length:100%_3px]" />
                <div className="absolute inset-0 opacity-30 [mask-image:radial-gradient(55%_70%_at_50%_60%,black,transparent)]">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
            </div>

            <div className="relative w-full max-w-xl">
                {/* Card */}
                <div className="rounded-2xl border border-emerald-600/30 bg-gray-950/70 backdrop-blur shadow-[0_0_30px_rgba(16,185,129,.18)] ring-1 ring-emerald-500/10 p-6 sm:p-8">
                    {/* Back */}
                    <div className="flex items-center justify-between mb-5">
                        <Link
                            href="/history"
                            className="inline-flex items-center gap-2 text-emerald-400/90 hover:text-emerald-300 transition"
                        >
                            <FiArrowLeft /> Back to History
                        </Link>
                        {sessionId && (
                            <span className="text-[11px] sm:text-xs px-2 py-1 rounded-full border border-emerald-500/30 text-emerald-300/90 bg-black/40">
                                Session: {sessionId.slice(0, 8)}…
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-200 bg-clip-text text-transparent">
                            We value your feedback
                        </span>
                    </h1>
                    <p className="mt-2 text-gray-300">
                        Help us improve your mock interview experience.
                    </p>

                    {/* Rating */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-emerald-300 mb-2">
                            Your rating
                        </label>
                        <StarRating value={rating} onChange={setRating} />
                        <p className="mt-2 text-xs text-gray-400">
                            {rating === 0
                                ? "Select a rating to continue."
                                : rating <= 2
                                    ? "We’re sorry it wasn’t great — tell us what we can do better."
                                    : rating === 3
                                        ? "Thanks! Tell us how we can make it even better."
                                        : "Awesome! What did you like the most?"}
                        </p>
                    </div>

                    {/* Comment */}
                    <div className="mt-5">
                        <label className="block text-sm font-medium text-emerald-300 mb-2">
                            Comments (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Any thoughts about the interview experience?"
                            rows={4}
                            className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-sm text-gray-200
                         focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                        />
                    </div>

                    {missingSession && (
                        <div className="mt-4 text-yellow-300/90 text-sm border border-yellow-700/60 bg-yellow-900/20 rounded-lg px-3 py-2">
                            Couldn’t find a session to attach your feedback. You can still leave feedback,
                            but it won’t be linked. Return to{" "}
                            <Link href="/" className="underline hover:text-yellow-100">
                                home
                            </Link>{" "}
                            to start a new session.
                        </div>
                    )}

                    <button
                        onClick={submit}
                        disabled={submitting || rating === 0}
                        className={`mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold
                       transition shadow-[0_0_18px_rgba(16,185,129,.18)]
                       ${submitting || rating === 0
                                ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-400 text-white"
                            }`}
                    >
                        {submitting ? (
                            <>
                                <FiLoader className="animate-spin" /> Submitting…
                            </>
                        ) : done ? (
                            "Thanks! Redirecting…"
                        ) : (
                            "Submit Feedback"
                        )}
                    </button>
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                    Your feedback helps improve question quality, pacing, and hints.
                </p>

                {sessionId && (
                    <div className="mt-6">
                        <ShareInterview sessionId={sessionId} />
                    </div>
                )}
            </div>
        </main>
    );
}
