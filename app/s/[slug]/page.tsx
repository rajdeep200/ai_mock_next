// app/s/[slug]/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { bricolage, figtree } from "@/lib/fonts";
import "./share.css";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import HomeFooter from "@/component/home/HomeFooter";
import CopyLink from "@/component/share/CopyLink";
import { Arrow } from "@/component/home/icons";
import { READY_PERCENT } from "@/lib/dashboard";
import { DIMENSIONS } from "@/lib/dimensions";
import { parseFeedback } from "@/lib/feedback";
import type { Types } from "mongoose";

type Props = { params: Promise<{ slug: string }> };

type PublicSession = {
    _id: Types.ObjectId;
    technology: string;
    level: string;
    company?: string;
    duration: number;
    status: "active" | "completed";
    updatedAt: Date;
    modelPreparationPercent?: number | null;
    feedback?: string | null;
    scoreBreakdown?: { dimensions?: { key: string; score: number | null }[] } | null;
};

const techLabel = (t: string) => (t.toLowerCase() === "dsa" ? "DSA" : t);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    await connectToDB();
    const doc = await InterviewSession.findOne({ shareSlug: slug, shareEnabled: true }).lean<PublicSession | null>();
    if (!doc) {
        return { title: "MockQube — Not Found" };
    }
    const title = `I completed a mock interview in ${techLabel(doc.technology)} • MockQube`;
    const desc = doc.modelPreparationPercent != null
        ? `Preparation: ${doc.modelPreparationPercent}% • Level: ${doc.level}`
        : `Level: ${doc.level} • Completed on ${new Date(doc.updatedAt).toDateString()}`;

    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/session/${slug}`;

    return {
        title,
        description: desc,
        openGraph: {
            title,
            description: desc,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`,
            images: [{ url: ogImageUrl, width: 1200, height: 630 }],
            siteName: "MockQube",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: desc,
            images: [ogImageUrl],
        },
    };
}

function PublicHeader() {
    return (
        <header className="top">
            <div className="wrap">
                <Link href="/" className="logo" aria-label="MockQube home">
                    <Image src="/mockqubelogo.png" alt="" width={26} height={30} priority />
                    MockQube
                </Link>
                <nav className="main" aria-label="Main">
                    <Link href="/#how">How it works</Link>
                    <Link href="/pricing">Pricing</Link>
                    <Link href="/start-interview" className="btn">Try it free</Link>
                </nav>
            </div>
        </header>
    );
}

const scoreClass = (p: number) => (p >= READY_PERCENT ? "ready" : p >= 50 ? "mid" : "low");
const scoreNote = (p: number) => (p >= READY_PERCENT ? "Interview-ready" : p >= 50 ? "Getting there" : "Needs practice");
const barClass = (s: number) => (s >= 7 ? "hi" : s <= 4 ? "lo" : "");

export default async function SharePage({ params }: Props) {
    const { slug } = await params
    await connectToDB();
    const doc = await InterviewSession.findOne(
        { shareSlug: slug, shareEnabled: true },
        { technology: 1, level: 1, company: 1, duration: 1, status: 1, updatedAt: 1, modelPreparationPercent: 1, feedback: 1, scoreBreakdown: 1 }
    ).lean<PublicSession | null>();

    const shell = (children: React.ReactNode) => (
        <div className={`mqp ${bricolage.variable} ${figtree.variable}`}>
            <PublicHeader />
            <main className="page">
                <div className="disc" aria-hidden="true"></div>
                <div className="wrap">{children}</div>
            </main>
            <HomeFooter />
        </div>
    );

    if (!doc) {
        return shell(
            <div className="gone">
                <div className="big" aria-hidden="true"></div>
                <h1>This share link isn&apos;t <b>available</b></h1>
                <p>The owner may have turned off sharing, or the link is wrong. You can still practise your own interview for free.</p>
                <Link href="/start-interview" className="btn">Try MockQube <Arrow /></Link>
            </div>
        );
    }

    const percent = typeof doc.modelPreparationPercent === "number" ? doc.modelPreparationPercent : null;
    const level = (doc.level || "").toLowerCase();
    // The candidate's own words (evidence quotes, tags) are not shown here: only scores and the interviewer's summary
    const summary = parseFeedback(doc.feedback).summary;
    const skills: { short: string; score: number }[] = [];
    if (percent !== null) {
        for (const d of DIMENSIONS) {
            const score = doc.scoreBreakdown?.dimensions?.find((x) => x.key === d.key)?.score;
            if (typeof score === "number") skills.push({ short: d.short, score });
        }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const pageUrl = `${appUrl}/s/${slug}`;
    const completed = new Date(doc.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    return shell(
        <>
            <section className="hero">
                <div>
                    <span className="eyebrow"><i></i>Practised on MockQube</span>
                    <div className="tags">
                        <span className={`chip${["easy", "medium", "hard"].includes(level) ? ` ${level}` : " plain"}`}>
                            {level ? level.charAt(0).toUpperCase() + level.slice(1) : "Level"}
                        </span>
                        {doc.company && <span className="chip plain">{doc.company}</span>}
                        <span className="chip plain">{doc.duration} min</span>
                    </div>
                    <h1>Completed a {techLabel(doc.technology)} <b>mock interview</b></h1>
                    <p className="lede">
                        {percent !== null
                            ? `A ${doc.duration}-minute voice interview with an AI interviewer, scored on how the candidate thought, coded and communicated.`
                            : "A voice interview with an AI interviewer, practising problem solving out loud."}
                    </p>
                    <div className="meta">Completed {completed}</div>
                </div>
                {percent !== null && (
                    <div className={`big-ring ${scoreClass(percent)}`} style={{ ["--p" as string]: percent }} role="img" aria-label={`Preparation score ${percent} percent, ${scoreNote(percent)}`}>
                        <div><b>{percent}<em>%</em></b><span>{scoreNote(percent)}</span></div>
                    </div>
                )}
            </section>

            <div className="stack">
                {skills.length > 0 && (
                    <section className="card">
                        <div className="card-h"><h2>Skill snapshot</h2><span className="sub">Scored out of 10</span></div>
                        <div className="skills">
                            {skills.map((x) => (
                                <div className="sk-row" key={x.short}>
                                    <b>{x.short}</b>
                                    <div className="sc">{x.score}<small>/10</small></div>
                                    <div className="bar"><i className={barClass(x.score)} style={{ width: `${x.score * 10}%` }}></i></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {percent !== null && summary && (
                    <section className="card">
                        <div className="card-h"><h2>What the AI interviewer said</h2></div>
                        <div className="quote">
                            <p>{summary}</p>
                            <small>Summary written by the AI interviewer</small>
                        </div>
                    </section>
                )}

                <section className="card">
                    <div className="card-h"><h2>Share this result</h2></div>
                    <div className="share">
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn in sm"
                        >
                            Share on LinkedIn
                        </a>
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                `I just completed a ${doc.level} mock interview in ${techLabel(doc.technology)} on @MockQube!`
                            )}&url=${encodeURIComponent(pageUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn ghost sm"
                        >
                            Share on X
                        </a>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(pageUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn ghost sm"
                        >
                            WhatsApp
                        </a>
                        <CopyLink url={pageUrl} />
                    </div>
                </section>

                <section className="card cta">
                    <div>
                        <span className="eyebrow"><i></i>Free to start</span>
                        <h2>Practise your own <b>DSA interview</b> out loud.</h2>
                        <p>Talk to an AI interviewer, write code live, and get a scored report with what to fix next. Your first two interviews each month are free.</p>
                    </div>
                    <div><Link href="/start-interview" className="btn sun">Start free <Arrow /></Link></div>
                </section>
            </div>
        </>
    );
}
