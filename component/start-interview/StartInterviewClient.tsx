"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Arrow } from "@/component/home/icons";
import { FOCUS_TOPICS } from "@/lib/insights";

type PlanInfo = {
  plan: {
    id: "free" | "starter" | "pro";
    monthlyInterviewCap: number;
    maxMinutesPerInterview: number;
    label: string;
  };
  usage: { interviewsCount: number; month: string };
};

type Level = "easy" | "medium" | "hard";

const MIN = 5;
const MAX = 45;
const STEP = 5;
const DEFAULT_MINUTES = 30;

const SUGGESTIONS = ["Google", "Amazon", "Microsoft", "Flipkart", "OpenAI"];
const QUICK = [15, 30, 45];

const LEVELS: { value: Level; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "Warm up on the fundamentals" },
  { value: "medium", label: "Medium", hint: "The classic interview round" },
  { value: "hard", label: "Hard", hint: "Push for the top-tier bar" },
];

const LEVEL_LABEL: Record<Level, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));
const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

export default function StartInterviewClient() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [company, setCompany] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [focus, setFocus] = useState("");
  const [duration, setDuration] = useState(DEFAULT_MINUTES);
  const [touchedDuration, setTouchedDuration] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/plan");
        if (res.ok) setPlanInfo(await res.json());
      } catch {
        /* the page still works without plan info; the server enforces limits */
      }
    })();
  }, []);

  const maxMinutes = planInfo?.plan.maxMinutesPerInterview ?? MAX;
  const planLabel = planInfo?.plan.label ?? "";

  // Start inside the plan's limit instead of opening on a warning.
  useEffect(() => {
    if (planInfo && !touchedDuration) setDuration(Math.min(DEFAULT_MINUTES, planInfo.plan.maxMinutesPerInterview));
  }, [planInfo, touchedDuration]);

  const capReached = planInfo ? planInfo.usage.interviewsCount >= planInfo.plan.monthlyInterviewCap : false;
  const tooLong = planInfo ? duration > planInfo.plan.maxMinutesPerInterview : false;

  const trimmedCompany = company.trim();
  const noCompany = submitted && !trimmedCompany;
  const noLevel = submitted && !level;

  const setMinutes = (n: number) => {
    setTouchedDuration(true);
    setDuration(clamp(n));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capReached) {
      router.push("/pricing");
      return;
    }
    setSubmitted(true);
    setCreateError(null);
    if (!trimmedCompany || !level || tooLong) return;

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/create-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ technology: "dsa", company: trimmedCompany, level, duration, ...(focus ? { focus } : {}) }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setCreateError(body?.error || "We couldn't start your interview. Please try again.");
        setLoading(false);
        return;
      }

      const { sessionId } = await res.json();
      const params = new URLSearchParams({
        sessionId,
        technology: "dsa",
        company: trimmedCompany,
        level,
        duration: String(duration),
      });
      router.push(`/interview?${params.toString()}`);
    } catch {
      setCreateError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const used = planInfo?.usage.interviewsCount ?? 0;
  const cap = planInfo?.plan.monthlyInterviewCap ?? 0;

  const buttonLabel = capReached
    ? "Monthly limit reached — Upgrade"
    : tooLong
      ? `Max ${maxMinutes} min on ${planLabel}`
      : loading
        ? "Starting…"
        : "Start DSA Interview";

  return (
    <div className="wrap">
      <button type="button" className="back" onClick={() => router.push("/dashboard")}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        Back
      </button>

      <div className="head">
        <h1>
          <span><em><b>Set up your</b></em></span>
          <span><em>mock interview</em></span>
        </h1>
        <p className="lede">A few quick choices and your interviewer takes it from there.</p>
      </div>

      <div className="layout">
        <form className="setup" onSubmit={handleSubmit} noValidate>
          <section className="step" aria-labelledby="s1">
            <div className="step-h"><span className="num">1</span><h2 id="s1">Interview focus</h2></div>
            <div className="focus">
              <span className="ic">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></svg>
              </span>
              <div>
                <b>Data Structures &amp; Algorithms</b>
                <span>Arrays to dynamic programming, with voice and code</span>
              </div>
              <span className="lock">Fixed for now</span>
            </div>
          </section>

          <section className={`step field${noCompany ? " bad" : ""}`} aria-labelledby="s2">
            <div className="step-h"><span className="num">2</span><h2 id="s2">Target company</h2><span className="req">Required</span></div>
            <input
              className="input"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Flipkart, OpenAI"
              autoComplete="off"
              aria-invalid={noCompany}
              aria-describedby="companyErr"
            />
            <p className="err" id="companyErr">Tell us which company you&apos;re preparing for.</p>
            <div className="sugs" aria-label="Suggestions">
              <span className="lab">Popular:</span>
              {SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={trimmedCompany.toLowerCase() === s.toLowerCase() ? "on" : undefined}
                  onClick={() => setCompany(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className={`step field${noLevel ? " bad" : ""}`} aria-labelledby="s3">
            <div className="step-h"><span className="num">3</span><h2 id="s3">Difficulty</h2><span className="req">Required</span></div>
            <div className="levels" role="radiogroup" aria-labelledby="s3">
              {LEVELS.map((l) => (
                <label key={l.value} className={`lv ${l.value}`}>
                  <input
                    type="radio"
                    name="level"
                    value={l.value}
                    checked={level === l.value}
                    onChange={() => setLevel(l.value)}
                  />
                  <div className="tile">
                    <span className="bars"><i></i><i></i><i></i></span>
                    <div><b>{l.label}</b><small>{l.hint}</small></div>
                  </div>
                </label>
              ))}
            </div>
            <p className="err" style={{ marginTop: 12 }}>Pick a difficulty to continue.</p>
          </section>

          <section className="step" aria-labelledby="s3b">
            <div className="step-h"><span className="num">4</span><h2 id="s3b">Focus topic</h2><span className="req">Optional</span></div>
            <div className="sugs" role="radiogroup" aria-labelledby="s3b">
              <button type="button" role="radio" aria-checked={!focus} className={!focus ? "on" : undefined} onClick={() => setFocus("")}>
                Any topic
              </button>
              {FOCUS_TOPICS.map((t) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={focus === t.key}
                  key={t.key}
                  className={focus === t.key ? "on" : undefined}
                  onClick={() => setFocus(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section className="step" aria-labelledby="s4">
            <div className="step-h"><span className="num">5</span><h2 id="s4">Length</h2></div>
            <div className="dur-top">
              <div className="stepper" role="group" aria-label="Duration in minutes">
                <button type="button" aria-label="5 minutes less" onClick={() => setMinutes(duration - STEP)}>−</button>
                <div className="val"><span>{duration}</span><small>min</small></div>
                <button type="button" aria-label="5 minutes more" onClick={() => setMinutes(duration + STEP)}>+</button>
              </div>
              <div className="quick">
                {QUICK.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={[duration === m ? "on" : "", m > maxMinutes ? "locked" : ""].filter(Boolean).join(" ") || undefined}
                    onClick={() => setMinutes(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="rail"
              style={{
                ["--fill" as string]: `${pct(duration)}%`,
                ["--lock" as string]: maxMinutes >= MAX ? "0%" : `${100 - pct(maxMinutes)}%`,
              }}
            >
              <div className="track"><div className="fill" /><div className="lockzone" /></div>
              <input
                type="range"
                min={MIN}
                max={MAX}
                step={STEP}
                value={duration}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                aria-label="Duration slider"
              />
            </div>
            <div className="ticks" aria-hidden="true"><span>5</span><span>15</span><span>25</span><span>35</span><span>45</span></div>
            {planInfo && maxMinutes < MAX && (
              <p className="limit-note">
                <i></i>
                <span>Your {planLabel} plan allows up to <b>{maxMinutes}</b> min. <Link href="/pricing">Upgrade</Link> for longer sessions.</span>
              </p>
            )}
          </section>

          {capReached && (
            <div className="alert" role="alert">
              <span className="ai"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg></span>
              <strong>Monthly limit reached</strong>
              <p>You&apos;ve used all interviews on <b>{planLabel}</b> this month. Upgrade for more sessions.</p>
              <Link href="/pricing" className="btn dark">See plans</Link>
            </div>
          )}

          {tooLong && !capReached && (
            <div className="alert" role="alert">
              <span className="ai"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span>
              <strong>That&apos;s longer than your plan allows</strong>
              <p><b>{planLabel}</b> sessions run up to <b>{maxMinutes}</b> minutes. Shorten it or upgrade.</p>
              <button type="button" className="btn dark" onClick={() => setMinutes(maxMinutes)}>Set to {maxMinutes} min</button>
            </div>
          )}

          {createError && (
            <div className="alert error" role="alert">
              <span className="ai"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg></span>
              <strong>Couldn&apos;t start the interview</strong>
              <p>{createError}</p>
            </div>
          )}

          <div>
            <button
              className={`btn go${capReached ? " upgrade" : ""}${loading ? " loading" : ""}`}
              type="submit"
              disabled={loading || (tooLong && !capReached)}
            >
              <span className="spin" aria-hidden="true"></span>
              <span>{buttonLabel}</span>
              <Arrow />
            </button>
            <p className="fine">Allow microphone access when asked, so you can answer out loud.</p>
          </div>
        </form>

        <aside className="side" aria-label="Session summary">
          <div className="ticket">
            <span className="eyebrow"><i aria-hidden="true"></i>Your session</span>
            <h2>Ready when you are</h2>
            <dl>
              <div className="row"><dt>Focus</dt><dd>DSA</dd></div>
              <div className="row"><dt>Company</dt><dd className={trimmedCompany ? undefined : "empty"}>{trimmedCompany || "Not set yet"}</dd></div>
              <div className="row"><dt>Level</dt><dd className={level ? undefined : "empty"}>{level ? LEVEL_LABEL[level] : "Not set yet"}</dd></div>
              <div className="row"><dt>Topic</dt><dd>{FOCUS_TOPICS.find((t) => t.key === focus)?.label ?? "Any"}</dd></div>
            </dl>
            <div className="time"><b>{duration}</b><span>minutes, voice + code</span></div>
          </div>

          {planInfo && (
            <div className="usage">
              <span className="ring" style={{ ["--used" as string]: cap ? Math.min(100, (used / cap) * 100) : 0 }} aria-hidden="true">
                <i>{used}/{cap}</i>
              </span>
              <small>Plan · {planLabel}</small>
              <strong>{used} of {cap} interviews used</strong>
              <p>Up to <b>{maxMinutes}</b> min per session. <Link href="/pricing">Upgrade</Link></p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
