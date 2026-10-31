// app/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import { Arrow } from "@/component/home/icons";

type Errors = { name?: boolean; email?: boolean; msg?: boolean };

export default function ContactForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [sending, setSending] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const next: Errors = {
            name: !name.trim(),
            email: !/^\S+@\S+\.\S+$/.test(email.trim()),
            msg: !msg.trim(),
        };
        setErrors(next);
        if (next.name || next.email || next.msg) return;

        setSending(true);

        // mailto fallback; replace with /api/contact if you later wire a backend
        const mailto = `mailto:support@mockqube.com?subject=${encodeURIComponent(
            `Support request from ${name}`
        )}&body=${encodeURIComponent(`Email: ${email}\n\nMessage:\n${msg}`)}`;

        window.location.href = mailto;
        setTimeout(() => setSending(false), 1500);
    };

    return (
        <form onSubmit={onSubmit} className="formcard reveal d2" noValidate>
            <div className={`field${errors.name ? " bad" : ""}`}>
                <label htmlFor="name">Name</label>
                <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    autoComplete="name"
                    aria-invalid={errors.name || undefined}
                />
                <div className="err">Please enter your name.</div>
            </div>

            <div className={`field${errors.email ? " bad" : ""}`}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={errors.email || undefined}
                />
                <div className="err">Please enter a valid email address.</div>
            </div>

            <div className={`field${errors.msg ? " bad" : ""}`}>
                <label htmlFor="message">Message</label>
                <textarea
                    id="message"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Tell us how we can help…"
                    aria-invalid={errors.msg || undefined}
                />
                <div className="err">Please write a message.</div>
            </div>

            <div className="foot">
                <button type="submit" disabled={sending} className="btn">
                    {sending ? "Opening your mail app…" : <>Send message <Arrow /></>}
                </button>
                <span className="hint">This opens your email app with the message ready to send.</span>
            </div>
        </form>
    );
}
