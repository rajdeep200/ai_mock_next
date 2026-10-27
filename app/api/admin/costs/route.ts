// app/api/admin/costs/route.ts
// Average cost per interview, from the usage stored on each session. Admin bearer token only.
//   GET /api/admin/costs?days=30
import { NextResponse } from "next/server";
import { requireAdminToken } from "@/lib/authz";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { estimateCost, type SessionUsage } from "@/lib/cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

export async function GET(req: Request) {
  if (!requireAdminToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86_400_000);

  await connectToDB();
  const sessions = await InterviewSession.find(
    { createdAt: { $gte: since }, "usage.turnCalls": { $gt: 0 } },
    { duration: 1, status: 1, turnCount: 1, usage: 1 }
  ).lean<{ duration: number; status: string; turnCount?: number; usage?: SessionUsage }[]>();

  // Group by scheduled length: a 15-minute and a 60-minute interview cost very different amounts
  const groups = new Map<number, { n: number; turns: number; tts: number; scoring: number; total: number; max: number; aiTurns: number }>();
  for (const s of sessions) {
    const c = estimateCost(s.usage);
    const g = groups.get(s.duration) ?? { n: 0, turns: 0, tts: 0, scoring: 0, total: 0, max: 0, aiTurns: 0 };
    g.n += 1;
    g.turns += c.turns;
    g.tts += c.tts;
    g.scoring += c.scoring;
    g.total += c.total;
    g.max = Math.max(g.max, c.total);
    g.aiTurns += s.turnCount ?? 0;
    groups.set(s.duration, g);
  }

  const byDuration = [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minutes, g]) => ({
      minutes,
      interviews: g.n,
      avgAiTurns: round(g.aiTurns / g.n, 1),
      avgUsd: { turns: round(g.turns / g.n), tts: round(g.tts / g.n), scoring: round(g.scoring / g.n), total: round(g.total / g.n) },
      maxUsd: round(g.max),
    }));

  const total = sessions.reduce((n, s) => n + estimateCost(s.usage).total, 0);
  return NextResponse.json({ days, interviews: sessions.length, totalUsd: round(total, 2), byDuration });
}
