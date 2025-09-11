// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About MockQube | Your 24/7 AI Coding Interviewer",
    description:
        "MockQube helps students and junior engineers ace DSA coding interviews with realistic AI mock interviews, instant feedback on code and communication, and a clear plan to improve.",
    keywords: [
        "AI mock interview",
        "DSA mock interviews",
        "coding interview practice",
        "technical interview preparation",
        "time complexity feedback",
        "data structures and algorithms",
        "junior developer interview prep",
        "FAANG interview prep"
    ],
    openGraph: {
        title: "About MockQube | Your 24/7 AI Coding Interviewer",
        description:
            "Practice like it’s the real thing. MockQube simulates a human interviewer, evaluates your code and clarity, and turns every session into a growth plan.",
        url: "https://www.mockqube.com/about",
        siteName: "MockQube",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "MockQube" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "About MockQube | Your 24/7 AI Coding Interviewer",
        description:
            "Realistic AI mock interviews for DSA — voice + code + instant, actionable feedback.",
        images: ["/og.png"],
    },
};

export default function AboutPage() {
    const OUR_MISSION = [
        {
            title: "Real interview flow",
            body:
                "Ambiguous prompts, clarification, edge cases, and trade-offs — the same rhythm you’ll face onsite, not just a judge that checks correctness.",
        },
        {
            title: "Speak + code together",
            body:
                "Think aloud with low-latency voice, then implement in the browser editor. Get feedback on structure, Big-O, and clarity — quickly.",
        },
        {
            title: "Feedback that sticks",
            body:
                "Each session ends with strengths, gaps, and a targeted practice plan so you know exactly what to do next.",
        },
    ]

    const HOW_IT_WORKS = [
        {
            step: "01",
            title: "Choose your focus",
            desc:
                "Pick topics (Arrays → DP), difficulty, and target companies. The AI adapts to your level and goals.",
        },
        {
            step: "02",
            title: "Speak & solve",
            desc:
                "Clarify requirements, compare approaches, and code in a streamlined editor with real-time voice interaction.",
        },
        {
            step: "03",
            title: "Get coached",
            desc:
                "Receive instant feedback on approach, correctness, complexity, edge cases, and communication — like a sharp human interviewer.",
        },
        {
            step: "04",
            title: "Review & improve",
            desc:
                "Finish with an actionable summary and a targeted practice plan. Track progress across sessions in your dashboard.",
        },
    ]

    const WHY_DEV_CHOOSES = [
        {
            k: "Nuanced feedback",
            v: "Not just pass/fail — understand the why behind mistakes and how to fix them.",
        },
        {
            k: "Progress you can see",
            v: "Session history, topic coverage, and trend lines keep you focused on outcomes.",
        },
        {
            k: "Privacy-first",
            v: "Mindful data handling and encrypted traffic. Your practice stays yours.",
        },
    ]

    const FAQ_LIST = [
        {
            q: "Is this only for DSA interviews?",
            a: "DSA is the core today because it’s universal in tech interviews. We’ll add system design and role-specific rounds as we grow.",
        },
        {
            q: "How realistic is the interview?",
            a: "Expect ambiguity, follow-ups, and complexity questions. The flow mirrors human interviews so you build confidence, not just solutions.",
        },
        {
            q: "Will my data be safe?",
            a: "We encrypt network payloads and avoid collecting unnecessary personal data. You control your practice history.",
        },
        {
            q: "Can I see previous sessions?",
            a: "Yes. Your dashboard shows session summaries, trends, and weak areas so you can plan the next week of practice.",
        },
        {
            q: "Do I need a mentor or peer to use it?",
            a: "No. MockQube acts as your interviewer and coach 24/7 — practice whenever you want without scheduling hassles.",
        },
    ]

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
                        Our story & mission
                    </span>
                    <h1 className="mt-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-5xl">
                        The most accessible, realistic&nbsp;<span className="text-green-400">AI</span> mock interviews for DSA
                    </h1>
                    <p className="mt-4 text-gray-300 text-lg">
                        MockQube exists to fix interview prep for students and junior engineers. No more juggling
                        problem lists, YouTube tips, and peer mocks. You practice with an AI interviewer that listens,
                        asks follow-ups, evaluates your code and communication, and turns every session into a clear next-step plan.
                    </p>
                </div>
            </section>

            {/* Mission / Value */}
            <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pb-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    {OUR_MISSION.map((f) => (
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
                    {HOW_IT_WORKS.map((s) => (
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
                    {WHY_DEV_CHOOSES.map((item) => (
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
                    {FAQ_LIST.map((f) => (
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
                        Practice like it's the <span className="text-green-400">real interview</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-gray-100/90">
                        Start a session, get coached, and leave with a plan. Join students and junior engineers who
                        use MockQube to build clarity, speed, and confidence.
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
                                "url": "https://www.mockqube.com",
                                "logo": "https://www.mockqube.com/mockqubelogo.png",
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
                                                "DSA is the core today because it's universal in tech interviews. We'll add system design and role-specific rounds as we grow.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "How realistic is the interview?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "Expect ambiguity, follow-ups, and complexity questions. The flow mirrors human interviews so you build confidence, not just solutions.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "Will my data be safe?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "We encrypt network payloads and avoid collecting unnecessary personal data. You control your practice history.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        "name": "Can I see previous sessions?",
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text":
                                                "Yes. Your dashboard shows session summaries, trends, and weak areas so you can plan the next week of practice.",
                                        },
                                    },
                                    {
                                        "@type": "Question",
                                        name: "Do I need a mentor or peer to use it?",
                                        acceptedAnswer: {
                                            "@type": "Answer",
                                            text:
                                                "No. MockQube acts as your interviewer and coach 24/7 — practice whenever you want without scheduling hassles.",
                                        },
                                    }
                                ],
                            },
                        ],
                    }),
                }}
            />
        </main>
    );
}
