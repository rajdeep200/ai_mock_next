// app/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [sending, setSending] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !msg) return;

        setSending(true);

        // mailto fallback; replace with /api/contact if you later wire a backend
        const mailto = `mailto:support@mockqube.com?subject=${encodeURIComponent(
            `Support request from ${name}`
        )}&body=${encodeURIComponent(`Email: ${email}\n\nMessage:\n${msg}`)}`;

        window.location.href = mailto;
        setSending(false);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className="block text-sm text-gray-300 mb-1">
                    Name
                </label>
                <input
                    id="name"
                    className="w-full rounded-md bg-black/60 border border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    className="w-full rounded-md bg-black/60 border border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-sm text-gray-300 mb-1">
                    Message
                </label>
                <textarea
                    id="message"
                    className="min-h-[140px] w-full rounded-md bg-black/60 border border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Tell us how we can help…"
                    required
                />
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={sending}
                    className={`px-5 py-2 rounded-lg font-semibold transition
            ${sending
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                >
                    {sending ? "Opening Mail…" : "Send"}
                </button>

                <Link
                    href="/"
                    className="px-5 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
                >
                    Back to Home
                </Link>
            </div>
        </form>
    );
}
