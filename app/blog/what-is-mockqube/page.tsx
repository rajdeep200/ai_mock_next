// app/blog/what-is-mockqube/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "What is MockQube? | AI-Powered Mock Interviews for DSA",
    description:
        "MockQube is an AI-powered mock interview platform for developers. Practice DSA with voice + code, get real-time feedback, and track your progress to land offers faster.",
    keywords: [
        "What is MockQube",
        "MockQube",
        "AI mock interview",
        "DSA interview practice",
        "coding interview prep",
        "mock interview platform",
    ],
    alternates: {
        canonical: "https://mockqube.com/blog/what-is-mockqube",
    },
    openGraph: {
        title: "What is MockQube? | AI-Powered Mock Interviews for DSA",
        description:
            "An AI interviewer that helps you practice DSA with realistic prompts, low-latency voice, code feedback, and progress tracking.",
        url: "https://mockqube.com/blog/what-is-mockqube",
        siteName: "MockQube",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "MockQube" }],
        type: "article",
    },
    twitter: {
        card: "summary_large_image",
        title: "What is MockQube? | AI-Powered Mock Interviews for DSA",
        description:
            "Practice coding interviews with an AI that sounds like a real interviewer. Voice + code + feedback.",
        images: ["/og.png"],
    },
};

export default function WhatIsMockQubePage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-black text-white">
            {/* === Background (matches site style) === */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,.05),transparent_45%)]" />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.6)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
                <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)]" />
            </div>

            {/* === Hero === */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-10 sm:pt-28">
                <nav className="mb-4 text-xs text-gray-400">
                    <a href="/" className="hover:text-green-300">Home</a>
                    <span className="mx-2 opacity-60">/</span>
                    <a href="/blog" className="hover:text-green-300">Blog</a>
                    <span className="mx-2 opacity-60">/</span>
                    <span className="text-green-300">What is MockQube?</span>
                </nav>

                <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur">
                    Brand & Product
                </span>
                <h1 className="mt-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-6xl">
                    What is <span className="text-green-400">MockQube</span>?
                </h1>
                <p className="mt-4 max-w-3xl text-lg text-gray-300 sm:text-xl">
                    MockQube is an AI-powered mock interview platform for developers. It simulates
                    realistic <strong>DSA interviews</strong> with voice and code, gives instant,
                    actionable feedback on your approach and complexity, and helps you track progress—so
                    you walk into real interviews with confidence.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <a
                        href="/start-interview"
                        className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                    >
                        Start a Free Mock
                    </a>
                    <a
                        href="/pricing"
                        className="inline-flex items-center justify-center rounded-full border border-green-700/50 bg-green-500/10 px-6 py-3 text-sm font-semibold text-green-200 hover:border-green-500/70"
                    >
                        See Plans
                    </a>
                    <a
                        href="/about"
                        className="inline-flex items-center justify-center rounded-full border border-gray-800 bg-gray-900/60 px-6 py-3 text-sm font-semibold text-gray-200 hover:border-green-700/60"
                    >
                        Learn About MockQube
                    </a>
                </div>
            </section>

            {/* === Intro / Definition === */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 pb-8">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-6">
                        <h3 className="text-green-300 text-lg font-semibold">Clear definition</h3>
                        <p className="mt-2 text-sm text-gray-300">
                            MockQube is a <strong>24/7 AI interviewer</strong> for DSA. You speak, code,
                            and get feedback—just like in a real interview.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-6">
                        <h3 className="text-green-300 text-lg font-semibold">Who it’s for</h3>
                        <p className="mt-2 text-sm text-gray-300">
                            Final-year CS students, recent grads, and junior engineers preparing for
                            product-based companies and FAANG-style rounds.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/60 to-black/60 p-6">
                        <h3 className="text-green-300 text-lg font-semibold">Why it works</h3>
                        <p className="mt-2 text-sm text-gray-300">
                            Realistic prompts, low-latency voice, in-browser code editor, and
                            <em> explanations of the “why,”</em> not just correctness.
                        </p>
                    </div>
                </div>
            </section>

            {/* === Features (scan-friendly bullets) === */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
                <h2 className="text-2xl sm:text-3xl font-bold">
                    Key features of <span className="text-green-400">MockQube</span>
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {[
                        {
                            t: "Voice + Code together",
                            d: "Discuss your approach out loud and write code in a minimal editor. The AI interviewer responds in real-time.",
                        },
                        {
                            t: "Ambiguous, realistic prompts",
                            d: "Mirror onsite energy—clarifying questions, edge cases, and follow-ups on time/space complexity.",
                        },
                        {
                            t: "Actionable feedback",
                            d: "Structured notes on reasoning, Big-O, test coverage, and communication—so you know exactly what to fix.",
                        },
                        {
                            t: "Progress tracking",
                            d: "A dashboard with history and trends helps identify weak topics and plan your next reps.",
                        },
                        {
                            t: "Question library",
                            d: "From Arrays to DP and Graphs, with difficulty tiers and company-style patterns.",
                        },
                        {
                            t: "Privacy-first",
                            d: "Encrypted transport and mindful data handling. Your practice stays yours.",
                        },
                    ].map((f) => (
                        <div
                            key={f.t}
                            className="group rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur transition hover:border-green-700/70"
                        >
                            <h3 className="text-green-300 text-lg font-semibold">{f.t}</h3>
                            <p className="mt-2 text-sm text-gray-300">{f.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* === Why this page (for users & SEO) === */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 pb-10">
                <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
                    <h2 className="text-2xl sm:text-3xl font-bold">Why this page matters</h2>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-300">
                        <li><strong>Branded keyword clarity:</strong> Confirms “MockQube” is a real product.</li>
                        <li><strong>Entity definition:</strong> Links MockQube with AI interviews & DSA.</li>
                        <li><strong>User intent:</strong> Answers “what is it?” before sign-up.</li>
                        <li><strong>Internal linking hub:</strong> Guides to Pricing, Start Interview, and About.</li>
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <a
                            href="/start-interview"
                            className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500"
                        >
                            Get Started
                        </a>
                        <a
                            href="/pricing"
                            className="rounded-full border border-green-700/50 bg-green-500/10 px-5 py-2 text-sm font-semibold text-green-200 hover:border-green-500/70"
                        >
                            See Pricing
                        </a>
                        <a
                            href="/about"
                            className="rounded-full border border-gray-800 bg-gray-900/60 px-5 py-2 text-sm font-semibold text-gray-200 hover:border-green-700/60"
                        >
                            Read About Us
                        </a>
                    </div>
                </div>
            </section>

            {/* === FAQ (SEO) === */}
            <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
                <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
                <div className="mt-6 grid gap-4">
                    {[
                        {
                            q: "Is MockQube only for DSA interviews?",
                            a: "DSA is the core focus today because it’s universal in tech interviews. We’re expanding to more domains as we grow.",
                        },
                        {
                            q: "How realistic is the interview experience?",
                            a: "Prompts are intentionally ambiguous, with clarifying follow-ups on complexity and edge cases—like a real onsite.",
                        },
                        {
                            q: "Will my data be safe?",
                            a: "We encrypt transport and avoid collecting unnecessary personal data.",
                        },
                    ].map((f) => (
                        <details key={f.q} className="group rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                            <summary className="cursor-pointer list-none text-green-300 font-medium">
                                {f.q}
                            </summary>
                            <p className="mt-2 text-sm text-gray-300">{f.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* === JSON-LD: Article + Breadcrumb === */}
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD for SEO
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "BreadcrumbList",
                                "itemListElement": [
                                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mockqube.com/" },
                                    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://mockqube.com/blog" },
                                    { "@type": "ListItem", "position": 3, "name": "What is MockQube?", "item": "https://mockqube.com/blog/what-is-mockqube" }
                                ]
                            },
                            {
                                "@type": "Article",
                                "headline": "What is MockQube?",
                                "description":
                                    "MockQube is an AI-powered mock interview platform for developers to practice DSA with voice, code, and real-time feedback.",
                                "mainEntityOfPage": "https://mockqube.com/blog/what-is-mockqube",
                                "image": "https://mockqube.com/og.png",
                                "author": { "@type": "Organization", "name": "MockQube" },
                                "publisher": {
                                    "@type": "Organization",
                                    "name": "MockQube",
                                    "logo": { "@type": "ImageObject", "url": "https://mockqube.com/mockqubelogo.png" }
                                }
                            }
                        ],
                    }),
                }}
            />
        </main>
    );
}
