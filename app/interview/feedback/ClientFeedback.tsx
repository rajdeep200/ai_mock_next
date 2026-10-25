"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./feedback.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import ShareCard from "@/component/feedback/ShareCard";
import { Arrow } from "@/component/home/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type SessionLite = {
  technology: string;
  company: string;
  level: string;
  duration: number;
  feedback: string | null;
  shareEnabled: boolean;
  shareUrl: string | null;
};

const STAR_PATH = "M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6 6.2 20.7l1.1-6.5L2.6 9.6l6.5-.9z";

// The end-of-interview summary starts with "Preparation Percentage: NN%" (or N/A).
function parseScore(feedback: string | null): number | null {
  const m = feedback?.match(/Preparation Percentage:\s*(\d{1,3})\s*%/i);
  return m ? Math.min(100, parseInt(m[1], 10)) : null;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className={`mqf ${bricolage.variable} ${figtree.variable}`}>
          <div className="loading">Loading feedback…</div>
        </div>
      }
    >
      <FeedbackInner />
    </Suspense>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const [popped, setPopped] = useState<number | null>(null);

  return (
    <div className="stars" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`star${(hover ?? value) >= n ? " on" : ""}${popped === n ? " pop" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => {
            onChange(n);
            setPopped(null);
            requestAnimationFrame(() => setPopped(n));
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR_PATH} /></svg>
        </button>
      ))}
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
  const [submitError, setSubmitError] = useState(false);

  const [session, setSession] = useState<SessionLite | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); }, []);

  const missingSession = !sessionId;

  // Session details power the summary card and the share card's starting state.
  useEffect(() => {
    if (!sessionId) {
      setSessionLoaded(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } catch {
        /* the page still works without session details */
      } finally {
        setSessionLoaded(true);
      }
    })();
  }, [sessionId]);

  const submit = async () => {
    if (missingSession) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, comment }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      redirectTimer.current = setTimeout(() => router.replace("/history"), 900);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const mood = rating === 0 ? "none" : rating <= 2 ? "low" : rating === 3 ? "mid" : "high";
  const moodText =
    rating === 0
      ? "Select a rating to continue."
      : rating <= 2
        ? "We’re sorry it wasn’t great. Tell us what we can do better."
        : rating === 3
          ? "Thanks! Tell us how we can make it even better."
          : "Awesome! What did you like the most?";

  const state = done ? "done" : submitting ? "busy" : submitError ? "error" : "idle";
  const score = parseScore(session?.feedback ?? null);
  const techLabel = session ? (session.technology.toLowerCase() === "dsa" ? "DSA" : session.technology) : "";

  return (
    <div className={`mqf ${bricolage.variable} ${figtree.variable}`}>
      <AppHeader active="history" />

      <main className="page" data-mood={mood} data-state={state} data-session={missingSession ? "missing" : "ok"}>
        <div className="disc" aria-hidden="true" />
        <div className="wrap">
          <div className="toprow">
            <Link href="/history" className="back">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Back to History
            </Link>
            {sessionId && <span className="sess">Session {sessionId.slice(0, 8)}…</span>}
          </div>

          <div className="head">
            <h1>
              <span><em><b>How did your</b></em></span>
              <span><em>interview go?</em></span>
            </h1>
            <p className="lede">Two quick taps help us improve question quality, pacing and hints.</p>
          </div>

          <div className="layout">
            {/* LEFT: rating + comment */}
            <div className="col">
              <section className="card" aria-labelledby="rating-title">
                <div className="formbits">
                  <div className="card-h"><span className="num">1</span><h2 id="rating-title">Your rating</h2></div>
                  <StarRating value={rating} onChange={setRating} />
                  <div className="mood" aria-live="polite"><i aria-hidden="true" /><span>{moodText}</span></div>

                  <div className="card-h" style={{ marginTop: 30 }}>
                    <span className="num">2</span><h2>Comments</h2><span className="opt">Optional</span>
                  </div>
                  <div className="area">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={2000}
                      placeholder="Any thoughts about the interview experience?"
                      aria-label="Comments"
                    />
                    <span className={`count${comment.length > 1800 ? " near" : ""}`}>{comment.length} / 2000</span>
                  </div>

                  <div className="note miss" role="alert">
                    <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                    <span>
                      We couldn’t find a session to attach your feedback. You can still leave it, but it won’t be linked.{" "}
                      <Link href="/start-interview">Start a new session</Link>
                    </span>
                  </div>
                  <div className="note fail" role="alert">
                    <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                    <span>We couldn’t send your feedback. Please try again.</span>
                  </div>

                  <button
                    type="button"
                    className="btn go"
                    onClick={submit}
                    disabled={submitting || rating === 0}
                  >
                    <span className="spn" aria-hidden="true" />
                    <span>{submitting ? "Submitting…" : "Submit feedback"}</span>
                    <Arrow />
                  </button>
                  {rating === 0 && <p className="fine">Pick a star rating to enable the button.</p>}
                </div>

                <div className="thanks" role="status" aria-live="polite">
                  <div className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg></div>
                  <h2>Thank you, <b>that helps</b></h2>
                  <p>Taking you back to your history…</p>
                  <div className="bar" aria-hidden="true"><i /></div>
                </div>
              </section>
            </div>

            {/* RIGHT: session summary + share */}
            <div className="col">
              {sessionId && !sessionLoaded && <div className="skel" aria-hidden="true" />}

              {session && (
                <section className="card ticket" aria-label="Session summary">
                  <span className="eyebrow"><i aria-hidden="true" />Session complete</span>
                  <h2>Nice work out there</h2>
                  <div className="tchips">
                    <span className="tchip">{techLabel}</span>
                    {session.level && <span className="tchip">{cap(session.level)}</span>}
                    {session.company && <span className="tchip">{session.company}</span>}
                    <span className="tchip">{session.duration} min</span>
                  </div>
                  {score !== null && (
                    <div className="score">
                      <span className="ring" style={{ ["--p" as string]: score }} aria-hidden="true"><i>{score}%</i></span>
                      <p><b>Preparation score</b>based on approach, correctness and complexity</p>
                    </div>
                  )}
                  <Link href={`/sessions/${sessionId}`} className="btn">
                    Read your full AI feedback<Arrow />
                  </Link>
                </section>
              )}

              {sessionId && sessionLoaded && (
                <ShareCard
                  sessionId={sessionId}
                  initialEnabled={session?.shareEnabled}
                  initialUrl={session?.shareUrl}
                  score={score}
                />
              )}
            </div>
          </div>

          <p className="foot">Your feedback helps improve question quality, pacing and hints.</p>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
