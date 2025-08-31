"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={`text-3xl ${n <= value ? "text-yellow-400" : "text-gray-600"}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

export default function FeedbackPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const sessionId = sp.get("sessionId") ?? "";
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, rating, comment }),
            });
            if (!res.ok) throw new Error(await res.text());
            router.replace("/"); // go home after feedback
        } catch (err) {
            alert("Failed to submit feedback");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h1 className="text-xl font-semibold text-green-400 mb-4">We value your feedback!</h1>
                <StarRating value={rating} onChange={setRating} />
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any thoughts about the interview experience?"
                    className="mt-4 w-full bg-black/50 border border-gray-700 rounded-md p-3 text-sm text-gray-200"
                    rows={4}
                />
                <button
                    onClick={submit}
                    disabled={submitting || rating === 0}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-2 rounded-lg font-semibold"
                >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
            </div>
        </main>
    );
}
