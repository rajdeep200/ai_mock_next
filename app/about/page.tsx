// app/about/page.tsx
import { META_KEYWORDS } from "@/lib/constant";
import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/component/site/SiteShell";
import { Arrow } from "@/component/home/icons";
const CANONICAL = "https://www.mockqube.com/about";

export const metadata: Metadata = {
    title: "About MockQube | Your 24/7 AI Coding Interviewer",
    description:
        "MockQube's mission: make DSA interview practice accessible with AI—timed rounds, hints, and instant feedback.",
    keywords: META_KEYWORDS,
    alternates: { canonical: CANONICAL },
    openGraph: {
        url: CANONICAL,
        title: "Why MockQube",
        description:
            "MockQube's mission: make DSA interview practice accessible with AI—timed rounds, hints, and instant feedback.",
        images: [{ url: "/mockqubelogo.png" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Why MockQube",
        description:
            "AI-powered mock interviews that feel like the real thing.",
        images: ["/mockqubelogo.png"],
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
        <SiteShell active="about">
            {/* Hero */}
            <section className="hero">
                <span className="eyebrow reveal"><i></i>Our story &amp; mission</span>
                <h1 className="reveal d1">The most accessible, realistic <b>AI mock interviews</b> for DSA</h1>
                <p className="reveal d2">
                    MockQube exists to fix interview prep for students and junior engineers. No more juggling
                    problem lists, YouTube tips, and peer mocks. You practice with an AI interviewer that listens,
                    asks follow-ups, evaluates your code and communication, and turns every session into a clear next-step plan.
                </p>
                <div className="acts reveal d3">
                    <Link href="/dashboard" className="btn">Start Practicing <Arrow /></Link>
                    <Link href="/pricing" className="btn ghost">See Plans</Link>
                </div>
            </section>

            {/* Mission / Value */}
            <section className="sect" style={{ paddingTop: "clamp(24px,4vw,48px)" }}>
                <div className="three">
                    {OUR_MISSION.map((f, i) => (
                        <div key={f.title} className="pillar">
                            <div className="n">{i + 1}</div>
                            <h3>{f.title}</h3>
                            <p>{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="sect">
                <div className="sect-h">
                    <h2>How MockQube <b>works</b></h2>
                </div>
                <div className="steps">
                    {HOW_IT_WORKS.map((s) => (
                        <div key={s.step} className="step">
                            <b>{s.step}</b>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why devs choose us */}
            <section className="sect" style={{ paddingTop: 0 }}>
                <div className="band">
                    <h2>Why developers <b>choose us</b></h2>
                    <div className="three">
                        {WHY_DEV_CHOOSES.map((item) => (
                            <div key={item.k} className="why">
                                <b>{item.k}</b>
                                <p>{item.v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ (SEO) */}
            <section className="sect" style={{ paddingTop: 0 }}>
                <div className="sect-h">
                    <h2>Frequently asked <b>questions</b></h2>
                </div>
                <div className="faq">
                    {FAQ_LIST.map((f, i) => (
                        <details key={f.q} open={i === 0}>
                            <summary>{f.q}</summary>
                            <p>{f.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <h2>Practice like it&apos;s the <b>real interview</b></h2>
                <p>
                    Start a session, get coached, and leave with a plan. Join students and junior engineers who
                    use MockQube to build clarity, speed, and confidence.
                </p>
                <div className="acts">
                    <Link href="/dashboard" className="btn">Start Practicing <Arrow /></Link>
                    <Link href="/pricing" className="btn ghost">See Plans</Link>
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
        </SiteShell>
    );
}
