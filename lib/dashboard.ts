// lib/dashboard.ts
// Turns a user's completed interviews into the numbers the progress dashboard shows.
// Pure functions: no database, no network, so they are easy to test. Safe to import from client code.
import { DIMENSIONS, type DimensionKey } from "@/lib/dimensions";
import {
  ISSUE_FIX,
  ISSUE_TAGS,
  SKILL_FIX,
  STRENGTH_TAGS,
  TOPICS,
  type SessionInsights,
} from "@/lib/insights";

export const READY_PERCENT = 70; // the line the dashboard calls "interview-ready"
export const UNLOCK_AT = 3; // interviews needed before trends and habits are shown
const WINDOW = 8; // interviews used for habits and the trend line
const SKILL_WINDOW = 5; // interviews averaged for "now" on the skills radar

/** One finished, scored interview as loaded from the database. */
export type DashSession = {
  id: string;
  createdAt: string; // ISO
  startTime?: string | null;
  endTime?: string | null;
  duration: number; // scheduled minutes
  level: string;
  company: string;
  percent: number | null;
  dims: { key: DimensionKey; score: number | null }[] | null;
  insights: SessionInsights | null;
};

export type TrendPoint = {
  id: string;
  date: string; // ISO
  title: string;
  meta: string;
  score: number;
  weakest: string | null;
};

export type SkillItem = {
  key: DimensionKey;
  label: string;
  short: string;
  weight: number;
  now: number;
  before: number | null;
  delta: number | null;
  tag: "strongest" | "needs-work" | null;
  note: string;
};

export type HabitItem = {
  key: string;
  label: string;
  count: number;
  outOf: number;
  status: "consistent" | "growing" | "seen" | "recurring" | "new" | "fixed";
  strip: { on: boolean; date: string; title: string }[];
  quote: string;
  tip: string;
};

export type PlanStep = { title: string; body: string };

export type InterviewCard = {
  id: string;
  date: string; // ISO
  title: string;
  meta: string;
  minutes: number;
  score: number | null;
  best: string | null;
  fix: string | null;
  dims: { label: string; score: number }[];
  timeline: SessionInsights["timeline"];
  doNextTime: string;
  hintsGiven: number | null;
};

export type Gate = { unlocked: boolean; have: number; need: number };

export type DashboardData = {
  firstName: string;
  lede: string;
  stats: {
    done: number;
    minutes: number;
    avgMinutes: number;
    monthUsed: number;
    monthCap: number;
    dates: string[]; // ISO date of every finished interview (the browser works out streaks in the user's time zone)
    latest: number | null;
    sinceFirst: number | null;
  };
  trend: Gate & { points: TrendPoint[]; insight: string };
  skills: Gate & { items: SkillItem[]; showBefore: boolean; insight: string };
  habits: Gate & { strengths: HabitItem[]; issues: HabitItem[] };
  plan: PlanStep[];
  interviews: InterviewCard[];
  /** Set by loadDashboard for users on an invite trial (a paid plan with no payment behind it). */
  trial?: { state: "active" | "ended"; endsAt: string; daysLeft: number } | null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
const dimLabel = (k: string) => DIMENSIONS.find((d) => d.key === k)?.short ?? k;

const SKILL_NOTES: Record<DimensionKey, { hi: string; mid: string; lo: string }> = {
  understanding: { hi: "You restate the problem and ask about constraints.", mid: "You sometimes check the problem details before solving.", lo: "You often start solving before checking the details." },
  approach: { hi: "You usually find a sound approach and explain why it works.", mid: "You find workable approaches, sometimes after a hint.", lo: "Finding an efficient approach is costing you points." },
  complexity: { hi: "You state complexity correctly and justify it.", mid: "You know complexity but don't always state it.", lo: "You often skip time and space complexity unless asked." },
  code: { hi: "Your code works and is easy to read.", mid: "Your code mostly works but needs polish.", lo: "Turning your plan into working code is costing you points." },
  edge_cases: { hi: "You test odd and empty inputs before finishing.", mid: "You sometimes test unusual inputs.", lo: "You rarely test empty or unusual inputs." },
  communication: { hi: "You think out loud and explain clearly.", mid: "Your explanations are decent but could be tighter.", lo: "The interviewer struggles to follow your reasoning." },
};
const noteFor = (k: DimensionKey, v: number) => (v >= 7 ? SKILL_NOTES[k].hi : v >= 5 ? SKILL_NOTES[k].mid : SKILL_NOTES[k].lo);

const sessionTitle = (s: DashSession) => s.insights?.problem.title || "Mock interview";
const sessionMeta = (s: DashSession) => [titleCase(s.level), s.company].filter(Boolean).join(" · ");

function weakestSkill(s: DashSession): string | null {
  const scored = (s.dims ?? []).filter((d): d is { key: DimensionKey; score: number } => d.score != null);
  if (!scored.length) return null;
  return dimLabel(scored.reduce((lo, d) => (d.score < lo.score ? d : lo)).key);
}

const labelOfStrength = (k: string) => STRENGTH_TAGS.find((t) => t.key === k)?.label ?? k;
const labelOfIssue = (k: string) =>
  k === "many_hints" ? "Needed many hints" : k === "went_quiet" ? "Went quiet while thinking" : ISSUE_TAGS.find((t) => t.key === k)?.label ?? k;

/** Issue keys for one interview, including the two that are measured rather than tagged. */
function issueKeys(i: SessionInsights): { key: string; quote: string }[] {
  const out: { key: string; quote: string }[] = i.issues.map((x) => ({ key: x.tag as string, quote: x.quote }));
  if (i.hintsGiven >= 3) out.push({ key: "many_hints", quote: "" });
  if (i.silenceCheckins >= 1) out.push({ key: "went_quiet", quote: "" });
  return out;
}

// ---------- streaks (run in the browser so "a day" means the user's own day) ----------
export function computeStreaks(isoDates: string[], now = new Date()) {
  const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const days = [...new Set(isoDates.map((x) => dayKey(new Date(x))))].sort((a, b) => a - b);
  if (!days.length) return { current: 0, best: 0 };
  const asDate = (k: number) => new Date(Math.floor(k / 10000), Math.floor((k % 10000) / 100) - 1, k % 100);
  const gap = (a: number, b: number) => Math.round((asDate(b).getTime() - asDate(a).getTime()) / 86_400_000);

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = gap(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  // current streak: counts if the last practice day is today or yesterday
  const last = days[days.length - 1];
  const sinceLast = gap(last, dayKey(now));
  let current = 0;
  if (sinceLast <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0 && gap(days[i - 1], days[i]) === 1; i--) current++;
  }
  return { current, best };
}

// ---------- main ----------
export function buildDashboard(
  all: DashSession[],
  ctx: { firstName: string; monthUsed: number; monthCap: number }
): DashboardData {
  const sessions = [...all].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const scored = sessions.filter((s) => s.percent != null) as (DashSession & { percent: number })[];

  // ----- stats -----
  const minutesOf = (s: DashSession) => {
    if (s.startTime && s.endTime) {
      const m = Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60_000);
      if (m > 0) return Math.min(m, s.duration + 2);
    }
    return s.duration;
  };
  const totalMinutes = sessions.reduce((n, s) => n + minutesOf(s), 0);
  const latest = scored.length ? scored[scored.length - 1].percent : null;
  const sinceFirst = scored.length >= 2 ? scored[scored.length - 1].percent - scored[0].percent : null;

  // ----- trend -----
  const trendSessions = scored.slice(-WINDOW);
  const points: TrendPoint[] = trendSessions.map((s) => ({
    id: s.id,
    date: s.createdAt,
    title: sessionTitle(s),
    meta: sessionMeta(s),
    score: s.percent,
    weakest: weakestSkill(s),
  }));
  let trendInsight = "";
  if (scored.length >= UNLOCK_AT && latest != null) {
    const first3 = avg(scored.slice(0, 3).map((s) => s.percent));
    const last3 = avg(scored.slice(-3).map((s) => s.percent));
    if (latest >= READY_PERCENT) {
      trendInsight = `You're above the ${READY_PERCENT}% interview-ready mark. Keep practicing so it stays that way.`;
    } else {
      const gap = READY_PERCENT - latest;
      trendInsight = `You're ${gap} point${gap === 1 ? "" : "s"} from interview-ready. `;
      if (scored.length >= 5 && last3 > first3) {
        trendInsight += `Your last three scores averaged ${Math.round(last3)}%, up from ${Math.round(first3)}% in your first three.`;
        const perInterview = (scored[scored.length - 1].percent - scored[0].percent) / (scored.length - 1);
        if (perInterview > 0.5) trendInsight += ` At this pace you'll cross ${READY_PERCENT}% in about ${Math.max(1, Math.ceil(gap / perInterview))} more interview${Math.ceil(gap / perInterview) === 1 ? "" : "s"}.`;
      } else if (scored.length >= 5) {
        trendInsight += "Your scores have been flat lately, so the plan below targets what's holding them back.";
      } else {
        trendInsight += "Keep going and the trend will get clearer with every interview.";
      }
    }
  }

  // ----- skills -----
  const withDims = scored.filter((s) => s.dims && s.dims.some((d) => d.score != null));
  const skillsUnlocked = withDims.length >= UNLOCK_AT;
  const averageFor = (group: DashSession[], key: DimensionKey) => {
    const vals = group.flatMap((s) => (s.dims ?? []).filter((d) => d.key === key && d.score != null).map((d) => d.score as number));
    return vals.length ? avg(vals) : null;
  };
  const recent = withDims.slice(-SKILL_WINDOW);
  const baseline = withDims.slice(0, 3);
  const showBefore = withDims.length >= SKILL_WINDOW; // enough history that "first" and "now" don't overlap
  let skillItems: SkillItem[] = [];
  if (skillsUnlocked) {
    skillItems = DIMENSIONS.map((d) => {
      const now = averageFor(recent, d.key);
      const before = showBefore ? averageFor(baseline, d.key) : null;
      return {
        key: d.key,
        label: d.label,
        short: d.short,
        weight: d.weight,
        now: round1(now ?? 0),
        before: before == null ? null : round1(before),
        delta: before == null || now == null ? null : round1(now - before),
        tag: null as SkillItem["tag"],
        note: noteFor(d.key, now ?? 0),
      };
    });
    const strongest = skillItems.reduce((a, b) => (b.now > a.now ? b : a));
    // "Needs work" = the two lowest-scoring skills (under 6/10)
    [...skillItems]
      .filter((s) => s.now < 6 && s.key !== strongest.key)
      .sort((a, b) => a.now - b.now)
      .slice(0, 2)
      .forEach((s) => { s.tag = "needs-work"; });
    strongest.tag = "strongest";
  }
  let skillInsight = "";
  if (skillItems.length) {
    const strongest = skillItems.find((s) => s.tag === "strongest")!;
    const gaps = skillItems.filter((s) => s.tag === "needs-work");
    if (gaps.length) {
      const share = gaps.reduce((n, s) => n + s.weight, 0);
      skillInsight = `${strongest.short} is your strongest skill (${strongest.now}/10). ${gaps.map((g) => `${g.short} (${g.now})`).join(" and ")} ${gaps.length > 1 ? "are" : "is"} where you can gain the most: together they carry ${share}% of the score.`;
    } else {
      skillInsight = `${strongest.short} is your strongest skill (${strongest.now}/10), and none of your skills is far behind the others. Keep your balance as the questions get harder.`;
    }
  }

  // ----- habits (from tags) -----
  const tagged = scored.filter((s) => s.insights).slice(-WINDOW);
  const habitsUnlocked = tagged.length >= UNLOCK_AT;
  const stripOf = (has: (s: DashSession) => boolean) =>
    tagged.map((s) => ({ on: has(s), date: s.createdAt, title: sessionTitle(s) }));
  const quoteOf = (find: (s: DashSession) => string) => {
    for (let i = tagged.length - 1; i >= 0; i--) {
      const q = find(tagged[i]);
      if (q) return q;
    }
    return "";
  };

  let strengths: HabitItem[] = [];
  let issues: HabitItem[] = [];
  if (habitsUnlocked) {
    const n = tagged.length;
    const half = Math.floor(n / 2);
    strengths = STRENGTH_TAGS.map((t) => {
      const strip = stripOf((s) => !!s.insights!.strengths.some((x) => x.tag === t.key));
      const count = strip.filter((x) => x.on).length;
      const recentHalf = strip.slice(half).filter((x) => x.on).length;
      const earlyHalf = strip.slice(0, half).filter((x) => x.on).length;
      const status: HabitItem["status"] = count / n >= 0.6 ? "consistent" : count >= 2 && recentHalf > earlyHalf ? "growing" : "seen";
      return {
        key: t.key,
        label: t.label,
        count,
        outOf: n,
        status,
        strip,
        quote: quoteOf((s) => s.insights!.strengths.find((x) => x.tag === t.key)?.quote ?? ""),
        tip: "",
      };
    })
      .filter((h) => h.count >= 1)
      .sort((a, b) => b.count - a.count)
      .filter((h, i) => h.count >= 2 || i < 2)
      .slice(0, 4);

    const issueSet = [...ISSUE_TAGS.map((t) => t.key as string), "many_hints", "went_quiet"];
    issues = issueSet
      .map((key): HabitItem | null => {
        const strip = stripOf((s) => issueKeys(s.insights!).some((x) => x.key === key));
        const count = strip.filter((x) => x.on).length;
        const inLast3 = strip.slice(-3).some((x) => x.on);
        const onlyLast2 = count > 0 && strip.slice(0, -2).every((x) => !x.on);
        let status: HabitItem["status"] | null = null;
        if (count >= 2 && inLast3) status = "recurring";
        else if (count >= 1 && onlyLast2 && count <= 2) status = "new";
        else if (count >= 2 && !inLast3 && n >= 5) status = "fixed";
        if (!status) return null;
        return {
          key,
          label: labelOfIssue(key),
          count,
          outOf: n,
          status,
          strip,
          quote: quoteOf((s) => issueKeys(s.insights!).find((x) => x.key === key)?.quote ?? ""),
          tip: ISSUE_FIX[key as keyof typeof ISSUE_FIX]?.tip ?? "",
        };
      })
      .filter((h): h is HabitItem => h !== null);
    const order = { recurring: 0, new: 1, fixed: 2 } as Record<string, number>;
    issues.sort((a, b) => order[a.status] - order[b.status] || b.count - a.count);
    const open = issues.filter((h) => h.status !== "fixed").slice(0, 4);
    const fixed = issues.filter((h) => h.status === "fixed").slice(0, 1);
    issues = [...open, ...fixed];
  }

  // ----- plan -----
  const plan: PlanStep[] = [];
  const open = issues.filter((h) => h.status === "recurring" || h.status === "new");
  if (open.length) {
    for (const h of open.slice(0, 2)) {
      const fix = ISSUE_FIX[h.key as keyof typeof ISSUE_FIX];
      if (fix) plan.push({ title: fix.title, body: fix.tip });
    }
  } else if (skillItems.length) {
    for (const s of skillItems.filter((x) => x.tag === "needs-work").slice(0, 2)) {
      const fix = SKILL_FIX[s.key];
      if (fix) plan.push({ title: fix.title, body: fix.tip });
    }
  }
  const levels = scored.slice(-3).map((s) => s.level.toLowerCase());
  if (scored.length >= UNLOCK_AT && latest != null && latest >= 60 && levels.length && levels.every((l) => l === "easy")) {
    plan.push({ title: "Step up to Medium", body: "Your recent scores are strong on Easy problems. A Medium interview will show how you handle a harder idea." });
  } else if (scored.length >= UNLOCK_AT && latest != null && latest >= 65 && levels.length && levels.every((l) => l === "medium")) {
    plan.push({ title: "Try a Hard interview", body: "You're scoring well on Medium problems. A Hard one will stretch your approach and complexity analysis." });
  }

  // ----- interview cards -----
  const interviews: InterviewCard[] = [...sessions]
    .reverse()
    .slice(0, 8)
    .map((s) => {
      const i = s.insights;
      return {
        id: s.id,
        date: s.createdAt,
        title: sessionTitle(s),
        meta: sessionMeta(s),
        minutes: minutesOf(s),
        score: s.percent,
        best: i?.strengths[0] ? labelOfStrength(i.strengths[0].tag) : null,
        fix: i ? (issueKeys(i)[0] ? labelOfIssue(issueKeys(i)[0].key) : null) : null,
        dims: (s.dims ?? []).filter((d) => d.score != null).map((d) => ({ label: dimLabel(d.key), score: d.score as number })),
        timeline: i?.timeline ?? [],
        doNextTime: i?.doNextTime ?? "",
        hintsGiven: i ? i.hintsGiven : null,
      };
    });

  // ----- headline -----
  let lede = "After each interview we score your skills, point out what you did well and what to fix, and track how you improve.";
  if (sessions.length > 0 && sessions.length < UNLOCK_AT) {
    lede = `Nice start. Complete ${UNLOCK_AT} interviews and we'll show your trends, strengths and weak spots.`;
  } else if (skillItems.length) {
    const strongest = skillItems.find((s) => s.tag === "strongest")!;
    const gaps = skillItems.filter((s) => s.tag === "needs-work");
    lede = gaps.length
      ? `You're strongest at ${strongest.short.toLowerCase()}. ${gaps.map((g) => g.short).join(" and ")} ${gaps.length > 1 ? "are" : "is"} what's holding your score back.`
      : `You're strongest at ${strongest.short.toLowerCase()}, and your skills are well balanced.`;
  } else if (sessions.length >= UNLOCK_AT) {
    lede = "Your progress is building up. Detailed skill scores appear as you complete more interviews.";
  }

  return {
    firstName: ctx.firstName,
    lede,
    stats: {
      done: sessions.length,
      minutes: totalMinutes,
      avgMinutes: sessions.length ? Math.round(totalMinutes / sessions.length) : 0,
      monthUsed: ctx.monthUsed,
      monthCap: ctx.monthCap,
      dates: sessions.map((s) => s.createdAt),
      latest,
      sinceFirst,
    },
    trend: { unlocked: scored.length >= UNLOCK_AT, have: scored.length, need: UNLOCK_AT, points, insight: trendInsight },
    skills: { unlocked: skillsUnlocked, have: withDims.length, need: UNLOCK_AT, items: skillItems, showBefore, insight: skillInsight },
    habits: { unlocked: habitsUnlocked, have: tagged.length, need: UNLOCK_AT, strengths, issues },
    plan,
    interviews,
  };
}

export const topicLabel = (key: string) => TOPICS.find((t) => t.key === key)?.label ?? key;
