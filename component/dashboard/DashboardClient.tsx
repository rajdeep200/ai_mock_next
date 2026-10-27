"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeStreaks,
  type DashboardData,
  type Gate,
  type HabitItem,
  type InterviewCard,
} from "@/lib/dashboard";
import { Arrow } from "@/component/home/icons";
import { SkillRadar, TrendChart } from "./charts";

// ---------- helpers ----------
const fmtDate = (iso: string, long = false) =>
  new Date(iso).toLocaleDateString(undefined, long ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });

const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

/** True once the element has scrolled into view (and stays true). */
function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(
      (es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts the numbers in `text` up from zero once `play` turns true. */
function CountUp({ text, play }: { text: string; play: boolean }) {
  const [shown, setShown] = useState(() => text.replace(/\d+/g, "0"));
  useEffect(() => {
    if (!play) { setShown(text.replace(/\d+/g, "0")); return; }
    if (reducedMotion()) { setShown(text); return; }
    const parts = text.split(/(\d+)/);
    let raf = 0;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const k = Math.min(1, (ts - t0) / 1100);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(parts.map((s, i) => (i % 2 ? String(Math.round(Number(s) * e)) : s)).join(""));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, play]);
  return <>{shown}</>;
}

/** A section that plays its entrance animations when it scrolls into view. */
function Reveal({ className, children, as: Tag = "div" }: { className?: string; children: (inView: boolean) => React.ReactNode; as?: "div" | "section" }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={`${className ?? ""} anim${seen ? " in" : ""}`}>
      {children(seen)}
    </Tag>
  );
}

function stagger(i: number): React.CSSProperties {
  return { ["--d" as string]: `${i * 0.09}s` };
}

const LockIcon = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
const Chevron = () => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

function Locked({ gate, title, text }: { gate: Gate; title: string; text: string }) {
  return (
    <div className="lockmsg" style={{ display: "block" }}>
      <div className="lk"><LockIcon /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="pbar"><i style={{ width: `${Math.min(100, (gate.have / gate.need) * 100)}%` }} /></div>
    </div>
  );
}

// ---------- pieces ----------
function Strip({ item, good }: { item: HabitItem; good: boolean }) {
  return (
    <div className={`mini${good ? " good" : ""}`} style={stagger(0)}>
      {item.strip.map((s, i) => (
        <i key={i} className={s.on ? "on" : undefined} style={stagger(i)} tabIndex={0}>
          <span className="bub" role="tooltip">
            <b>{fmtDate(s.date)}</b>
            <small>{s.title}</small>
            <span className={`pill ${s.on ? (good ? "up" : "down") : ""}`}>
              {s.on ? (good ? "You did this" : "This happened") : good ? "Didn’t come up" : "Didn’t happen"}
            </span>
          </span>
        </i>
      ))}
    </div>
  );
}

const STATUS_CHIP: Record<HabitItem["status"], { cls: string; text: string }> = {
  consistent: { cls: "keep", text: "Consistent" },
  growing: { cls: "keep", text: "Growing" },
  seen: { cls: "keep", text: "Seen" },
  recurring: { cls: "rec", text: "Keeps happening" },
  new: { cls: "new", text: "New" },
  fixed: { cls: "fix", text: "Fixed" },
};

function HabitList({ items, good }: { items: HabitItem[]; good: boolean }) {
  if (!items.length) {
    return <p className="nodetail">{good ? "We haven't spotted a repeating strength yet. It shows up as you do more interviews." : "No repeating mistakes right now. Nice."}</p>;
  }
  return (
    <ul className="pl">
      {items.map((h, idx) => (
        <li key={h.key} className={h.status === "fixed" ? "done" : undefined} style={stagger(idx)}>
          <div className="t">
            <h3>{h.label}</h3>
            <span className={`chip ${STATUS_CHIP[h.status].cls}`}>{STATUS_CHIP[h.status].text}</span>
          </div>
          <p className="cnt">
            {h.status === "fixed"
              ? `Happened in ${h.count} earlier interviews, not in your last 3. Nice work.`
              : `Seen in ${h.count} of your last ${h.outOf} interviews`}
          </p>
          {h.status !== "fixed" && <Strip item={h} good={good} />}
          {h.quote && <blockquote>&ldquo;{h.quote}&rdquo;</blockquote>}
          {h.tip && h.status !== "fixed" && (
            <p className="tip"><b>Instead:</b> {h.tip}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ScoreRing({ card }: { card: InterviewCard }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div
      ref={ref}
      className="badge"
      style={{ ["--p" as string]: seen ? card.score ?? 0 : 0 }}
      aria-label={card.score == null ? "No score" : `Score ${card.score}%`}
    >
      <span>{card.score == null ? "N/A" : `${card.score}%`}</span>
      <span className="bub" role="tooltip">
        <b>{card.title}</b>
        <small>{fmtDate(card.date)}{card.meta ? ` · ${card.meta}` : ""}</small>
      </span>
    </div>
  );
}

function InterviewRow({ card, open }: { card: InterviewCard; open: boolean }) {
  const hasDetail = card.timeline.length > 0 || card.dims.length > 0 || !!card.doNextTime;
  return (
    <details className="rep" open={open}>
      <summary>
        <ScoreRing card={card} />
        <div className="ti">
          <b>{card.title}</b>
          <small>{[card.meta, `${card.minutes} min`, fmtDate(card.date)].filter(Boolean).join(" · ")}</small>
        </div>
        <div className="wins">
          {card.best && <><b>Best:</b> {card.best}<br /></>}
          {card.fix && <><b>Fix:</b> {card.fix}</>}
        </div>
        <span className="chev"><Chevron /></span>
      </summary>
      <div className="rbody">
        <div>
          <h4>How it went</h4>
          {card.timeline.length ? (
            <ul className="tl">
              {card.timeline.map((t, i) => (
                <li key={i} className={t.kind === "bad" ? "bad" : undefined}>
                  <small>{t.fromMin === t.toMin ? `${t.fromMin} min` : `${t.fromMin} to ${t.toMin} min`}</small>
                  {t.summary}
                </li>
              ))}
            </ul>
          ) : (
            <p className="nodetail">{hasDetail ? "No timeline for this interview." : "A detailed breakdown isn't available for this interview."}</p>
          )}
        </div>
        <div>
          {card.dims.length > 0 && (
            <>
              <h4>Score by skill</h4>
              <ul className="dims">
                {card.dims.map((d, i) => (
                  <li key={d.label} style={stagger(i)}>
                    <span>{d.label}</span>
                    <div className="tr"><i className={d.score < 5 ? "lo" : undefined} style={{ width: `${d.score * 10}%` }} /></div>
                    <span>{d.score}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {card.doNextTime && <p className="donext"><b>Do next time:</b> {card.doNextTime}</p>}
          <div className="more row">
            <Link href={`/interview/feedback?sessionId=${card.id}`} className="btn ghost sm">
              Read the full feedback <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </details>
  );
}

// ---------- page ----------
export default function DashboardClient({ data }: { data: DashboardData }) {
  const { stats, trend, skills, habits, plan, interviews } = data;
  const [streak, setStreak] = useState<{ current: number; best: number } | null>(null);
  const [hotSkill, setHotSkill] = useState<string | null>(null);
  const onHot = useCallback((k: string | null) => setHotSkill(k), []);

  useEffect(() => { setStreak(computeStreaks(stats.dates)); }, [stats.dates]);

  if (stats.done === 0) {
    return (
      <div className="wrap">
        <div className="head">
          <div><h1>Your <b>progress</b>, {data.firstName}</h1></div>
        </div>
        <div className="card empty" style={{ display: "block" }}>
          <div className="big" aria-hidden="true" />
          <h2>Your first interview starts your <b>progress</b></h2>
          <p>After each interview we score your skills, point out what you did well and what to fix, and track how you improve over time.</p>
          <Link href="/start-interview" className="btn">Start my first interview <Arrow /></Link>
        </div>
      </div>
    );
  }

  const sinceFirst = stats.sinceFirst;
  const latestText = stats.latest == null ? "N/A" : `${stats.latest}%`;
  const latestSub =
    sinceFirst == null
      ? "Complete 3 to see your trend"
      : sinceFirst > 0
        ? `+${sinceFirst} points since your first interview`
        : sinceFirst < 0
          ? `${sinceFirst} points since your first interview`
          : "Same as your first interview";

  return (
    <div className="wrap">
      <div className="head">
        <div>
          <h1>Your <b>progress</b>, {data.firstName}</h1>
          <p>{data.lede}</p>
        </div>
        <Link href="/start-interview" className="btn">Start an interview <Arrow /></Link>
      </div>

      {/* 1. at a glance */}
      <Reveal as="section" className="stats">
        {(seen) => (
          <>
            <div className="stat">
              <small>Interviews done</small>
              <strong><CountUp text={String(stats.done)} play={seen} /></strong>
              <em>{stats.monthCap ? `${stats.monthUsed} of ${stats.monthCap} used this month` : `${stats.monthUsed} this month`}</em>
              {stats.monthCap > 0 && <div className="pbar"><i style={{ width: `${Math.min(100, (stats.monthUsed / stats.monthCap) * 100)}%` }} /></div>}
            </div>
            <div className="stat">
              <small>Practice time</small>
              <strong><CountUp text={fmtMinutes(stats.minutes)} play={seen} /></strong>
              <em>Avg {stats.avgMinutes} min per interview</em>
            </div>
            <div className="stat">
              <small>Practice streak</small>
              <strong>{streak ? <CountUp text={`${streak.current} ${streak.current === 1 ? "day" : "days"}`} play={seen} /> : "–"}</strong>
              <em>{!streak ? " " : streak.current === 0 ? "Practice today to start a streak" : streak.best > streak.current ? `Best so far: ${streak.best} ${streak.best === 1 ? "day" : "days"}` : "Your best so far"}</em>
            </div>
            <div className="stat dark">
              <small>Latest score</small>
              <strong><CountUp text={latestText} play={seen} /></strong>
              <em className={sinceFirst != null && sinceFirst > 0 ? "up" : undefined}>{latestSub}</em>
            </div>
          </>
        )}
      </Reveal>

      {/* 2. score over time */}
      <section className="blk">
        <Reveal className="card gated">
          {(seen) => (
            <>
              <div className="card-h"><span className="num">1</span><h2>Your score over time</h2><span className="sub">Last {trend.points.length} interviews</span></div>
              {trend.unlocked ? (
                <>
                  {seen ? <TrendChart points={trend.points} /> : <div className="chart trendbox ph" />}
                  {trend.insight && <p className="insight">{trend.insight}</p>}
                </>
              ) : (
                <Locked gate={trend} title={`Trends unlock after ${trend.need} interviews`} text="We need a few to show a real pattern, not a single lucky or unlucky day." />
              )}
            </>
          )}
        </Reveal>
      </section>

      {/* 3. skills */}
      <section className="blk">
        <Reveal className="card gated">
          {(seen) => (
            <>
              <div className="card-h"><span className="num">2</span><h2>Your skills</h2><span className="sub">Average of your last 5 interviews, out of 10</span></div>
              {skills.unlocked ? (
                <>
                  <div className="skills">
                    <div>
                      {seen ? <SkillRadar items={skills.items} showBefore={skills.showBefore} onHot={onHot} /> : <div className="chart radarbox ph" />}
                      <div className="legend">
                        <span><i></i>Now</span>
                        {skills.showBefore && <span><i className="b"></i>Your first interviews</span>}
                      </div>
                    </div>
                    <ul className="sk">
                      {[...skills.items]
                        .sort((a, b) => b.now - a.now)
                        .map((s, idx) => (
                          <li key={s.key} className={`${s.tag === "needs-work" ? "weak" : s.tag === "strongest" ? "top" : ""}${hotSkill === s.key ? " hot" : ""}${hotSkill && hotSkill !== s.key ? " dim" : ""}`} style={stagger(idx)}>
                            <b>
                              {s.label}
                              {s.tag === "strongest" && <span className="tag">Strongest</span>}
                              {s.tag === "needs-work" && <span className="tag">Needs work</span>}
                            </b>
                            <span className="sc">
                              {s.now.toFixed(1)}
                              {s.delta !== null && <small>{s.delta >= 0 ? "+" : "−"}{Math.abs(s.delta).toFixed(1)}</small>}
                            </span>
                            <div className="tr"><i style={{ width: `${s.now * 10}%` }} /></div>
                          </li>
                        ))}
                    </ul>
                  </div>
                  {skills.insight && <p className="insight">{skills.insight}</p>}
                </>
              ) : (
                <Locked gate={skills} title={`Your skill map unlocks after ${skills.need} interviews`} text="We'll show your strongest and weakest skills and how they move over time." />
              )}
            </>
          )}
        </Reveal>
      </section>

      {/* 4. strengths and weaknesses */}
      <section className="blk two">
        <Reveal className="card gated">
          {() => (
            <>
              <div className="card-h"><span className="num" style={{ background: "var(--ok)" }}>+</span><h2>Keep doing this</h2></div>
              {habits.unlocked ? (
                <HabitList items={habits.strengths} good />
              ) : (
                <Locked gate={habits} title={`Strengths unlock after ${habits.need} detailed interviews`} text={`We look for habits that show up again and again (${habits.have} so far). Interviews from before this feature don't count.`} />
              )}
            </>
          )}
        </Reveal>
        <Reveal className="card gated">
          {() => (
            <>
              <div className="card-h"><span className="num" style={{ background: "var(--err)" }}>!</span><h2>Fix this next</h2></div>
              {habits.unlocked ? (
                <HabitList items={habits.issues} good={false} />
              ) : (
                <Locked gate={habits} title={`Weak spots unlock after ${habits.need} detailed interviews`} text="We look for mistakes that repeat, so one bad day doesn't mislead you." />
              )}
            </>
          )}
        </Reveal>
      </section>

      {/* 5. next steps */}
      {plan.length > 0 && (
        <section className="blk">
          <Reveal className="card next">
            {() => (
              <>
                <span className="eyebrow"><i></i>Built from your last {Math.min(stats.done, 8)} interviews</span>
                <h2>Your plan for the next {plan.length === 1 ? "interview" : `${plan.length} interviews`}</h2>
                <div className="steps">
                  {plan.map((p, i) => (
                    <div className="step" key={p.title} style={stagger(i)}>
                      <span className="n">{i + 1}</span>
                      <h3>{p.title}</h3>
                      <p>{p.body}</p>
                      <Link href="/start-interview" className="btn sun sm">Start an interview <Arrow /></Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Reveal>
        </section>
      )}

      {/* 6. interviews */}
      <section className="blk">
        <Reveal className="card">
          {() => (
            <>
              <div className="card-h"><span className="num">3</span><h2>Your interviews</h2><span className="sub">{stats.done} completed</span></div>
              <div className="reps">
                {interviews.map((c, i) => <InterviewRow key={c.id} card={c} open={i === 0} />)}
              </div>
              <div className="more"><Link href="/history" className="btn ghost sm">See all interviews</Link></div>
            </>
          )}
        </Reveal>
      </section>
    </div>
  );
}
