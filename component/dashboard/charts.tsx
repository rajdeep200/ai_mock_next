"use client";

// Recharts pieces for the dashboard: the score line and the skills radar.
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SkillItem, TrendPoint } from "@/lib/dashboard";
import { READY_PERCENT } from "@/lib/dashboard";

const COBALT = "#2B3AF0";
const SUN = "#FFB43A";
const OK = "#1F8F5F";
const LINE = "#E3DDD3";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

type TrendDatum = TrendPoint & { label: string; diff: number | null };

function TrendTip({ active, payload }: { active?: boolean; payload?: { payload: TrendDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="ttip static">
      <b>{d.title}</b>
      <span className="v">{d.score}%</span>
      <p>{[shortDate(d.date), d.meta].filter(Boolean).join(" · ")}</p>
      {d.weakest && <p>Weakest: {d.weakest}</p>}
      {d.diff === null ? (
        <span className="pill">Your first interview</span>
      ) : (
        <span className={`pill ${d.diff >= 0 ? "up" : "down"}`}>
          {d.diff >= 0 ? "+" : "−"}
          {Math.abs(d.diff)} vs previous
        </span>
      )}
    </div>
  );
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const data: TrendDatum[] = points.map((p, i) => ({
    ...p,
    label: shortDate(p.date),
    diff: i > 0 ? p.score - points[i - 1].score : null,
  }));
  const summary = `Line chart of your last ${points.length} interview scores, from ${points[0]?.score}% to ${points[points.length - 1]?.score}%.`;
  return (
    <div className="chart trendbox" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 28, right: 24, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="mqd-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COBALT} stopOpacity={0.22} />
              <stop offset="1" stopColor={COBALT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={LINE} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval="preserveStartEnd" padding={{ left: 20, right: 20 }} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} width={34} />
          <ReferenceLine
            y={READY_PERCENT}
            stroke={OK}
            strokeDasharray="5 5"
            ifOverflow="visible"
            label={{ value: `Interview-ready: ${READY_PERCENT}%`, position: "insideTopLeft", className: "ready-label", fontSize: 12.5, dy: -18 }}
          />
          <Tooltip content={<TrendTip />} cursor={{ stroke: "#16150F", strokeOpacity: 0.28, strokeDasharray: "3 4" }} isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={COBALT}
            strokeWidth={3.5}
            fill="url(#mqd-area)"
            dot={{ r: 6, fill: "#fff", stroke: COBALT, strokeWidth: 3 }}
            activeDot={{ r: 9, fill: "#fff", stroke: COBALT, strokeWidth: 3 }}
            animationDuration={1600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type RadarDatum = { key: string; skill: string; now: number; before: number | null; item: SkillItem };

function SkillTip({
  active,
  payload,
  onHot,
}: {
  active?: boolean;
  payload?: { payload: RadarDatum }[];
  onHot: (key: string | null) => void;
}) {
  const key = active && payload?.length ? payload[0].payload.key : null;
  useEffect(() => {
    onHot(key);
    return () => onHot(null);
  }, [key, onHot]);
  if (!key) return null;
  const s = payload![0].payload.item;
  return (
    <div className="ttip static">
      <b>{s.label}</b>
      <span className="v">{s.now.toFixed(1)} / 10</span>
      <p>Counts for {s.weight}% of your score</p>
      <p>{s.note}</p>
      {s.delta !== null && (
        <span className={`pill ${s.delta >= 0 ? "up" : "down"}`}>
          {s.delta >= 0 ? "+" : "−"}
          {Math.abs(s.delta).toFixed(1)} since your first interviews
        </span>
      )}
    </div>
  );
}

export function SkillRadar({ items, showBefore, onHot }: { items: SkillItem[]; showBefore: boolean; onHot: (key: string | null) => void }) {
  const data: RadarDatum[] = items.map((s) => ({ key: s.key, skill: s.short, now: s.now, before: s.before, item: s }));
  const summary = `Radar chart of six skills out of 10: ${items.map((s) => `${s.short} ${s.now}`).join(", ")}.`;
  return (
    <div className="chart radarbox" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%" margin={{ top: 22, right: 70, bottom: 22, left: 70 }}>
          <PolarGrid stroke={LINE} />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} tickCount={4} />
          {showBefore && (
            <Radar
              dataKey="before"
              stroke={SUN}
              strokeWidth={2}
              strokeDasharray="5 4"
              fill={SUN}
              fillOpacity={0.18}
              animationBegin={100}
              animationDuration={1100}
              isAnimationActive
            />
          )}
          <Radar
            dataKey="now"
            stroke={COBALT}
            strokeWidth={2.5}
            fill={COBALT}
            fillOpacity={0.16}
            dot={{ r: 4, fill: COBALT, fillOpacity: 1 }}
            animationBegin={showBefore ? 450 : 100}
            animationDuration={1100}
            isAnimationActive
          />
          <Tooltip content={<SkillTip onHot={onHot} />} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
