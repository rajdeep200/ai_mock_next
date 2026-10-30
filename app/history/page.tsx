// app/history/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { bricolage, figtree } from "@/lib/fonts";
import "./history.css";
import AppHeader from "@/component/home/AppHeader";
import HomeFooter from "@/component/home/HomeFooter";
import { Arrow } from "@/component/home/icons";
import { READY_PERCENT } from "@/lib/dashboard";

interface Session {
  id: string;
  technology: string;
  company?: string;
  level: string;
  duration: number;
  status: "active" | "completed" | string;
  createdAt: string;
  percent: number | null;
  title: string;
  endedEarly: boolean;
}

type Filter = "all" | "done" | "early";

const isEarly = (s: Session) => s.status === "completed" && s.endedEarly;
const isDone = (s: Session) => s.status === "completed" && !s.endedEarly;

const scoreClass = (p: number) => (p >= READY_PERCENT ? "ready" : p >= 50 ? "mid" : "low");
const scoreNote = (p: number) => (p >= READY_PERCENT ? "Interview-ready" : p >= 50 ? "Getting there" : "Needs practice");

const monthLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function HistoryPage() {
  const { isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { sessions: Session[] };
          setSessions(data.sessions);
        } else {
          setFailed(true);
        }
      } catch (err) {
        console.error("Could not load sessions", err);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn]);

  const counts = useMemo(
    () => ({ all: sessions.length, done: sessions.filter(isDone).length, early: sessions.filter(isEarly).length }),
    [sessions]
  );

  const summary = useMemo(() => {
    const done = sessions.filter(isDone);
    const minutes = done.reduce((n, s) => n + (s.duration || 0), 0);
    const scores = done.map((s) => s.percent).filter((p): p is number => typeof p === "number");
    return { done: done.length, minutes, best: scores.length ? Math.max(...scores) : null };
  }, [sessions]);

  const visible = useMemo(
    () => sessions.filter((s) => (filter === "all" ? true : filter === "done" ? isDone(s) : isEarly(s))),
    [sessions, filter]
  );

  // Sessions arrive newest first, so groups come out in order too
  const groups = useMemo(() => {
    const out: { label: string; items: Session[] }[] = [];
    for (const s of visible) {
      const label = monthLabel(s.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(s);
      else out.push({ label, items: [s] });
    }
    return out;
  }, [visible]);

  const hours = Math.floor(summary.minutes / 60);
  const mins = summary.minutes % 60;

  return (
    <div className={`mqh ${bricolage.variable} ${figtree.variable}`}>
      <SignedIn>
        <AppHeader active="history" />
        <main className="page">
          <div className="disc" aria-hidden="true"></div>
          <div className="wrap">
            {loading ? (
              <div aria-busy="true" aria-label="Loading your interviews">
                <div className="head"><div><h1>Your interview <b>history</b></h1></div></div>
                <div className="sk"></div><div className="sk"></div><div className="sk"></div><div className="sk"></div>
              </div>
            ) : sessions.length === 0 && !failed ? (
              <div className="empty">
                <div className="big" aria-hidden="true"></div>
                <h2>No interviews <b>yet</b></h2>
                <p>Run your first DSA mock interview. Your sessions, scores and feedback will collect here.</p>
                <Link href="/start-interview" className="btn">Start your first interview <Arrow /></Link>
              </div>
            ) : (
              <>
                <div className="head">
                  <div>
                    <h1>Your interview <b>history</b></h1>
                    <p>Every session you&apos;ve run, newest first. Open one to read the full feedback or share it.</p>
                  </div>
                  <Link href="/start-interview" className="btn">Start Interview <Arrow /></Link>
                </div>

                {failed && <div className="err" role="alert">We couldn&apos;t load your interviews. Please refresh the page.</div>}

                {sessions.length > 0 && (
                  <>
                    <div className="sum">
                      <div><small>Interviews completed</small><strong>{summary.done}</strong></div>
                      <div>
                        <small>Practice time</small>
                        <strong>
                          {hours > 0 && <>{hours}<em> h </em></>}
                          {mins}<em> min</em>
                        </strong>
                      </div>
                      <div>
                        <small>Best score</small>
                        <strong>{summary.best === null ? "–" : <>{summary.best}<em>%</em></>}</strong>
                      </div>
                    </div>

                    <div className="bar">
                      <div className="tabs" role="group" aria-label="Filter interviews">
                        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All<small>{counts.all}</small></button>
                        <button type="button" aria-pressed={filter === "done"} onClick={() => setFilter("done")}>Completed<small>{counts.done}</small></button>
                        <button type="button" aria-pressed={filter === "early"} onClick={() => setFilter("early")}>Ended early<small>{counts.early}</small></button>
                      </div>
                      <span className="count">Showing {visible.length} {visible.length === 1 ? "interview" : "interviews"}</span>
                    </div>

                    {groups.map((g) => (
                      <section key={g.label}>
                        <div className="month">{g.label}</div>
                        <div className="list">
                          {g.items.map((s, i) => {
                            const d = new Date(s.createdAt);
                            const level = (s.level || "").toLowerCase();
                            const title = s.title || (s.technology.toLowerCase() === "dsa" ? "DSA mock interview" : `${s.technology} mock interview`);
                            return (
                              <Link
                                key={s.id}
                                href={`/sessions/${s.id}`}
                                className="row"
                                style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}
                              >
                                <div className="date">
                                  <div><b>{d.getDate()}</b><span>{d.toLocaleDateString("en-US", { month: "short" })}</span></div>
                                </div>
                                <div className="what">
                                  <h3>{title}</h3>
                                  <p>
                                    {s.company || "General"}
                                    <i></i>
                                    {s.duration} min
                                    <i></i>
                                    <span className={`chip${["easy", "medium", "hard"].includes(level) ? ` ${level}` : ""}`}>
                                      {level ? level.charAt(0).toUpperCase() + level.slice(1) : "Level"}
                                    </span>
                                  </p>
                                </div>
                                <div className="score">
                                  {s.status === "completed" && s.percent !== null ? (
                                    <>
                                      <div className={`ring ${scoreClass(s.percent)}`} style={{ ["--p" as string]: s.percent }}><b>{s.percent}</b></div>
                                      <small>{scoreNote(s.percent)}</small>
                                    </>
                                  ) : (
                                    <span className="dash">Not scored</span>
                                  )}
                                </div>
                                {s.status === "active" ? (
                                  <span className="chip live status">In progress</span>
                                ) : s.endedEarly ? (
                                  <span className="chip early status">Ended early</span>
                                ) : (
                                  <span></span>
                                )}
                                <svg className="i go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </main>
        <HomeFooter />
      </SignedIn>

      <SignedOut>
        <main className="page">
          <div className="disc" aria-hidden="true"></div>
          <div className="wrap">
            <div className="empty">
              <h2>Sign in to see your <b>history</b></h2>
              <p>Your past interviews and feedback are saved to your account.</p>
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
