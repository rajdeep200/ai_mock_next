// app/sessions/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./session.css";
import "@/app/interview/feedback/feedback.css"; // styles for ShareCard
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import ShareCard from "@/component/feedback/ShareCard";
import { Arrow } from "@/component/home/icons";
import { READY_PERCENT } from "@/lib/dashboard";
import { parseFeedback } from "@/lib/feedback";
import { FEEDBACK_FAILED, FEEDBACK_NO_ANSWERS } from "@/lib/interview";
import { ISSUE_TAGS, STRENGTH_TAGS, type SessionInsights } from "@/lib/insights";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

interface SessionDetail {
  id: string;
  technology: string;
  company?: string;
  level: string;
  duration: number;
  status: "active" | "completed" | string;
  createdAt: string;
  summary?: string | null;
  feedback?: string | null;
  shareEnabled?: boolean;
  shareUrl?: string | null;
  percent: number | null;
  breakdown: { key: string; label: string; weight: number; score: number | null; evidence: string }[] | null;
  insights: SessionInsights | null;
  feedbackGenerated: boolean;
  endedEarly: boolean;
}

const scoreClass = (p: number) => (p >= READY_PERCENT ? "ready" : p >= 50 ? "mid" : "low");
const scoreNote = (p: number) => (p >= READY_PERCENT ? "Interview-ready" : p >= 50 ? "Getting there" : "Needs practice");
const barClass = (s: number) => (s >= 7 ? "hi" : s <= 4 ? "lo" : "");

// Title with its last words in bold, like the other redesigned headings
function Title({ text }: { text: string }) {
  const words = text.split(/\s+/);
  const cut = words.length > 3 ? words.length - 2 : words.length > 1 ? words.length - 1 : 0;
  return (
    <>
      {words.slice(0, cut).join(" ")}{cut > 0 ? " " : ""}<b>{words.slice(cut).join(" ")}</b>
    </>
  );
}

const strengthLabel = (k: string) => STRENGTH_TAGS.find((t) => t.key === k)?.label ?? k;
const issueLabel = (k: string) => ISSUE_TAGS.find((t) => t.key === k)?.label ?? k;

function Note({ title, body, icon }: { title: string; body: string; icon: "info" | "clock" }) {
  return (
    <div className="note">
      <span className="ico">
        {icon === "clock" ? (
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        ) : (
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
        )}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="acts">
        <Link href="/start-interview" className="btn">Start Interview <Arrow /></Link>
      </div>
    </div>
  );
}

export default function SessionDetailsPage() {
  const { isSignedIn } = useAuth();
  const { id } = useParams() as { id: string };

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { session: SessionDetail };
          setSession(data.session);
        }
      } catch (err) {
        console.error("Could not load session", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isSignedIn]);

  const parsed = useMemo(() => parseFeedback(session?.feedback), [session?.feedback]);

  const copyFeedback = async () => {
    if (!session?.feedback) return;
    try {
      await navigator.clipboard.writeText(session.feedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked: nothing to do */ }
  };

  const renderBody = (s: SessionDetail) => {
    const level = (s.level || "").toLowerCase();
    const title = s.insights?.problem?.title || (s.technology.toLowerCase() === "dsa" ? "Mock interview" : `${s.technology} mock interview`);
    const d = new Date(s.createdAt);
    const when = `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const scored = s.status === "completed" && s.percent !== null;

    const chips = (
      <div className="tags">
        {s.status === "active" ? <span className="chip live">In progress</span> : s.endedEarly ? <span className="chip early">Ended early</span> : <span className="chip ok">Completed</span>}
        <span className={`chip${["easy", "medium", "hard"].includes(level) ? ` ${level}` : " plain"}`}>{level ? level.charAt(0).toUpperCase() + level.slice(1) : "Level"}</span>
        {s.company && <span className="chip plain">{s.company}</span>}
      </div>
    );
    const meta = (
      <div className="meta">{when}<i></i>{s.duration} min<i></i>{s.technology.toUpperCase()}</div>
    );

    // No report to show: explain why
    if (!scored) {
      const note =
        s.status === "active"
          ? { icon: "clock" as const, title: "This interview hasn't finished", body: "Its time has run out, but it was never closed. Start a new one to get a scored report." }
          : s.endedEarly
            ? { icon: "info" as const, title: "This interview ended early", body: "The page was closed or refreshed before the interview finished, so there's no feedback for this one." }
            : s.feedback === FEEDBACK_FAILED
              ? { icon: "info" as const, title: "We couldn't generate feedback", body: "Something went wrong while scoring this interview. Your next one will be scored normally." }
              : { icon: "info" as const, title: "There wasn't enough to score", body: s.feedback === FEEDBACK_NO_ANSWERS ? "The interview ended before any answers were recorded, so no preparation percentage was given." : "The conversation didn't reach enough technical answers for a fair score. A session with a coding attempt is enough to get one." };
      return (
        <>
          <section className="hero">
            <div>
              {chips}
              <h1><Title text={title} /></h1>
              {meta}
            </div>
            <div className="big-ring none"><div><b>Not scored</b></div></div>
          </section>
          <Note {...note} />
        </>
      );
    }

    const percent = s.percent as number;
    const ins = s.insights;
    const hasBreakdown = !!s.breakdown?.some((x) => x.score !== null);
    const hasLists = parsed.strengths.length > 0 || parsed.improvements.length > 0;
    const doNext = ins?.doNextTime || parsed.next;
    let n = 0;

    return (
      <>
        <section className="hero">
          <div>
            {chips}
            <h1><Title text={title} /></h1>
            {meta}
            <div className="acts">
              <Link href="/start-interview" className="btn">Start Interview <Arrow /></Link>
              {s.feedback && <button type="button" className="btn ghost" onClick={copyFeedback}>{copied ? "Copied" : "Copy feedback"}</button>}
            </div>
          </div>
          <div className={`big-ring ${scoreClass(percent)}`} style={{ ["--p" as string]: percent }} role="img" aria-label={`Score ${percent} percent, ${scoreNote(percent)}`}>
            <div><b>{percent}<em>%</em></b><span>{scoreNote(percent)}</span></div>
          </div>
        </section>

        <div className="stack">
          {parsed.summary && (
            <section className="card">
              <div className="card-h"><span className="num">{++n}</span><h2>Summary</h2></div>
              <p className="summary">{parsed.summary}</p>
            </section>
          )}

          {hasBreakdown && (
            <section className="card">
              <div className="card-h"><span className="num">{++n}</span><h2>Score breakdown</h2><span className="sub">Weighted across six skills</span></div>
              <div className="dims">
                {s.breakdown!.map((x) => (
                  <div className="dim" key={x.key}>
                    <b>{x.label.split(" & ")[0]}</b>
                    <div className="bar"><i className={x.score === null ? undefined : barClass(x.score)} style={{ width: `${(x.score ?? 0) * 10}%` }}></i></div>
                    {x.score === null ? <div className="sc"><span className="na">n/a</span></div> : <div className="sc">{x.score}<small>/10</small></div>}
                    {x.evidence && <q>{x.evidence}</q>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasLists && (
            <div className="two">
              <section className="card">
                <div className="card-h"><span className="num">{++n}</span><h2>What went well</h2></div>
                <ul className="list good">
                  {parsed.strengths.map((t, i) => <li key={i}><span aria-hidden="true">✓</span><div>{t}</div></li>)}
                </ul>
                {ins && ins.strengths.length > 0 && (
                  <div className="tagrow">{ins.strengths.map((x) => <span key={x.tag} className="chip g">{strengthLabel(x.tag)}</span>)}</div>
                )}
              </section>
              <section className="card">
                <div className="card-h"><span className="num">{++n}</span><h2>Work on next</h2></div>
                <ul className="list fix">
                  {parsed.improvements.map((t, i) => <li key={i}><span aria-hidden="true">!</span><div>{t}</div></li>)}
                </ul>
                {ins && ins.issues.length > 0 && (
                  <div className="tagrow">{ins.issues.map((x) => <span key={x.tag} className="chip w">{issueLabel(x.tag)}</span>)}</div>
                )}
              </section>
            </div>
          )}

          {!hasLists && !parsed.summary && s.feedback && (
            <section className="card">
              <div className="card-h"><span className="num">{++n}</span><h2>Feedback</h2></div>
              <p className="summary">{s.feedback}</p>
            </section>
          )}

          {doNext && (
            <section className="card next">
              <div>
                <span className="eyebrow"><i></i>Do this next time</span>
                <h2>{doNext}</h2>
              </div>
              <Link href="/start-interview" className="btn sun">Practice again <Arrow /></Link>
            </section>
          )}

          {ins && ins.timeline.length > 0 && (
            <section className="card">
              <div className="card-h">
                <span className="num">{++n}</span><h2>How the interview went</h2>
                {ins.hintsGiven > 0 && <span className="sub">{ins.hintsGiven} {ins.hintsGiven === 1 ? "hint" : "hints"} given</span>}
              </div>
              <ol className="tl">
                {ins.timeline.map((t, i) => (
                  <li key={i} className={t.kind === "neutral" ? undefined : t.kind}>
                    <time>{t.fromMin}–{t.toMin} min</time>
                    <span className="dot"><i></i></span>
                    <p>{t.summary}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="share-wrap mqf">
            <ShareCard sessionId={s.id} initialEnabled={!!s.shareEnabled} initialUrl={s.shareUrl ?? null} score={percent} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`mqs ${bricolage.variable} ${figtree.variable}`}>
      <SignedIn>
        <AppHeader active="history" />
        <main className="page">
          <div className="disc" aria-hidden="true"></div>
          <div className="wrap">
            <Link href="/history" className="back"><Arrow />All interviews</Link>

            {loading ? (
              <div aria-busy="true" aria-label="Loading interview">
                <div className="sk" style={{ height: 260, borderRadius: 36 }}></div>
                <div className="sk"></div>
                <div className="sk"></div>
              </div>
            ) : session ? (
              renderBody(session)
            ) : (
              <div className="missing">
                <div className="big" aria-hidden="true"></div>
                <h2>We couldn&apos;t find that <b>interview</b></h2>
                <p>It may have been removed, or it belongs to a different account.</p>
                <Link href="/history" className="btn">Back to history <Arrow /></Link>
              </div>
            )}
          </div>
        </main>
        <HomeFooter />
      </SignedIn>

      <SignedOut>
        <main className="page">
          <div className="disc" aria-hidden="true"></div>
          <div className="wrap">
            <div className="missing">
              <h2>Sign in to see this <b>interview</b></h2>
              <p>Your interviews and feedback are saved to your account.</p>
              <SignInButton>
                <button type="button" className="btn">Sign in <Arrow /></button>
              </SignInButton>
            </div>
          </div>
        </main>
      </SignedOut>
    </div>
  );
}
