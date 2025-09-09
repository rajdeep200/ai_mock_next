// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About MockQube | AI-Powered DSA Mock Interviews",
    description:
        "MockQube is a futuristic interview practice platform for developers. Run realistic DSA mock interviews, get adaptive AI prompts, instant voice interaction, and actionable feedback.",
    keywords: [
        "mock interview",
        "DSA interview prep",
        "coding interviews",
        "technical interview practice",
        "AI interview",
        "developer interview",
    ],
    openGraph: {
        title: "About MockQube | AI-Powered DSA Mock Interviews",
        description:
            "Run realistic DSA mock interviews with adaptive AI, voice responses, and clear feedback. Built for devs who want serious prep.",
        url: "https://your-domain.com/about",
        siteName: "MockQube",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "MockQube" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "About MockQube | AI-Powered DSA Mock Interviews",
        description:
            "Realistic DSA mock interviews with adaptive AI, instant voice, and actionable feedback.",
        images: ["/og.png"],
    },
};

export default function AboutPage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-black text-white">
            {/* Background layers (grid + glow orbs + scanlines) */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,.05),transparent_45%)]" />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.6)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.6))]" />
                <div className="absolute inset-0 opacity-[.10] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)]" />
            </div>

            {/* Hero */}
            <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pt-14 sm:pt-24 pb-10">
                <div className="max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur">
                        About MockQube
                    </span>
                    <h1 className="mt-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-5xl">
                        Futuristic <span className="text-green-400">AI</span> mock interviews
                        for serious DSA prep
                    </h1>
                    <p className="mt-4 text-gray-300 text-lg">
                        MockQube is a focused practice space for developers to sharpen
                        problem-solving under realistic interview pressure—clarify requirements,
                        reason about trade-offs, and code efficiently while an AI interviewer
                        adapts to your level.
                    </p>
                </div>
            </section>

            {/* Mission / Value */}
            <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pb-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {[
                        {
                            title: "Realistic Flow",
                            body:
                                "Every session mirrors real loops—ambiguous prompts, clarifying questions, and follow-ups on complexity, edge cases, and trade-offs.",
                        },
                        {
                            title: "Code + Voice",
                            body:
                                "Talk through your approach and submit code. Get tight feedback on correctness, Big-O, and potential improvements—fast.",
                        },
                        {
                            title: "Actionable Summaries",
                            body:
                                "End with concise summaries outlining strengths, gaps, and a practice plan you can act on immediately.",
                        },
                    ].map((f) => (
                        <div
                            key={f.title}
                            className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-6 backdrop-blur hover:border-green-700/60 transition"
                        >
                            <h3 className="text-xl font-semibold text-green-300">{f.title}</h3>
                            <p className="mt-2 text-sm text-gray-300">{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 py-10">
                <h2 className="text-2xl sm:text-3xl font-bold">
                    How MockQube <span className="text-green-400">works</span>
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {[
                        {
                            step: "01",
                            title: "Choose your focus",
                            desc:
                                "Pick company targets, difficulty, and duration. The AI tunes prompts to your goals and experience level.",
                        },
                        {
                            step: "02",
                            title: "Speak & solve",
                            desc:
                                "Discuss requirements, explore approaches, and write code in a streamlined editor with real-time voice interaction.",
                        },
                        {
                            step: "03",
                            title: "Get coached",
                            desc:
                                "Receive immediate feedback on structure, complexity, edge cases, and clarity—like a sharp human interviewer.",
                        },
                        {
                            step: "04",
                            title: "Review & improve",
                            desc:
                                "Read the end-of-session summary and follow a targeted practice plan. Track progress in your session history.",
                        },
                    ].map((s) => (
                        <div
                            key={s.step}
                            className="relative rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur"
                        >
                            <span className="absolute -top-3 left-5 inline-flex items-center justify-center rounded-full border border-green-700/50 bg-black px-3 py-1 text-xs text-green-300">
                                {s.step}
                            </span>
                            <h3 className="mt-2 text-lg font-semibold text-green-300">
                                {s.title}
                            </h3>
                            <p className="mt-2 text-gray-300 text-sm">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why devs choose us */}
            <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 py-10">
                <div className="grid gap-6 lg:grid-cols-3">
                    {[
                        {
                            k: "Adaptive prompts",
                            v: "Questions scale to your level, stack, and target companies.",
                        },
                        {
                            k: "Low-latency voice",
                            v: "Fast, conversational flow for natural practice.",
                        },
                        {
                            k: "Private by design",
                            v: "Encrypted traffic and mindful data handling.",
                        },
                    ].map((item) => (
                        <div
                            key={item.k}
                            className="rounded-2xl border border-gray-800 bg-black/50 p-6"
                        >
                            <h4 className="text-green-300 font-semibold">{item.k}</h4>
                            <p className="mt-2 text-gray-300 text-sm">{item.v}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ (SEO) */}
            <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 py-12">
                <h2 className="text-2xl sm:text-3xl font-bold">
                    Frequently asked <span className="text-green-400">questions</span>
                </h2>
                <div className="mt-6 grid gap-4">
                    {[
                        {
                            q: "Is this only for DSA interviews?",
                            a: "DSA is the core focus today because it’s universal in tech interviews. We’re expanding to more domains as we grow.",
                        },
                        {
                            q: "How realistic is the interview?",
                            a: "Prompts are intentionally ambiguous, with clarifying follow-ups and complexity questions—like a real onsite.",
                        },
                        {
                            q: "Will my data be safe?",
                            a: "We encrypt network payloads and avoid collecting unnecessary personal data. Your practice stays yours.",
                        },
                        {
                            q: "Can I see previous sessions?",
                            a: "Yes. Your interview history shows summaries and feedback so you can track improvement over time.",
                        },
                    ].map((f) => (
                        <details
                            key={f.q}
                            className="group rounded-xl border border-gray-800 bg-gray-900/50 p-4"
                        >
                            <summary className="cursor-pointer list-none text-green-300 font-medium">
                                {f.q}
                            </summary>
                            <p className="mt-2 text-sm text-gray-300">{f.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 px-5 sm:px-8 pb-20">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-green-700/40 bg-gradient-to-br from-green-700/30 via-green-700/10 to-black p-8 text-center shadow-[0_0_60px_rgba(34,197,94,.18)] sm:p-12">
                    <h2 className="text-3xl font-bold sm:text-4xl">
                        Ready to <span className="text-green-400">level up</span> your interview prep?
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-gray-100/90">
                        Join developers who practice with MockQube to build clarity, speed, and confidence.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                        <a
                            href="/home"
                            className="relative inline-flex items-center gap-2 rounded-full bg-green-600 px-7 py-3 text-lg font-semibold text-white transition hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                        >
                            <span className="absolute inset-0 -z-10 rounded-full bg-green-500/30 blur-lg" />
                            Start Practicing
                        </a>
                        <a
                            href="/pricing"
                            className="inline-flex items-center gap-2 rounded-full border border-green-700/50 bg-green-500/10 px-7 py-3 text-lg font-semibold text-green-200 hover:border-green-500/70"
                        >
                            See Plans
                        </a>
                    </div>
                </div>
            </section>

            {/* JSON-LD: FAQ + Org */}
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Intentional JSON-LD for SEO
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "Organization",
                                "name": "MockQube",
                                "url": "https://your-domain.com",
                                "logo": "https://your-domain.com/mockqubelogo.png",
                                "sameAs": [],
                            },
                            {
                                "@type": "FAQPage",
                                "mainEntity": [
                                    {
                                        "@type": "Question",
                                        "name": "Is this only for DSA interviews?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "DSA is the core focus today because it’s universal in tech interviews. We’re expanding to more domains as we grow.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "How realistic is the interview?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "Prompts are intentionally ambiguous, with clarifying follow-ups and complexity questions—like a real onsite.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "Will my data be safe?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "We encrypt network payloads and avoid collecting unnecessary personal data. Your practice stays yours.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "Can I see previous sessions?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "Yes. Your interview history shows summaries and feedback so you can track improvement over time.",
                                        },
                                    },
                                ],
                            },
                        ],
                    }),
                }}
            />
        </main>
    );
}
