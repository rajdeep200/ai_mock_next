// lib/dashboard-data.ts
// Server-side loader for the progress dashboard: reads the user's finished interviews and builds the view data.
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { User } from "@/models/User";
import { getCurrentUsage, getUserPlan } from "@/lib/usage";
import { buildDashboard, type DashboardData, type DashSession } from "@/lib/dashboard";
import type { DimensionKey } from "@/lib/dimensions";
import type { SessionInsights } from "@/lib/insights";

type Row = {
  _id: { toString(): string };
  createdAt?: Date;
  startTime?: Date;
  endTime?: Date;
  duration: number;
  level: string;
  company?: string;
  modelPreparationPercent?: number | null;
  scoreBreakdown?: { dimensions?: { key: DimensionKey; score: number | null }[] } | null;
  insights?: SessionInsights | null;
};

export async function loadDashboard(userId: string): Promise<DashboardData> {
  await connectToDB();

  const [rows, user, plan, usage] = await Promise.all([
    InterviewSession.find(
      { userId, status: "completed", feedbackGenerated: true },
      { createdAt: 1, startTime: 1, endTime: 1, duration: 1, level: 1, company: 1, modelPreparationPercent: 1, scoreBreakdown: 1, insights: 1 }
    )
      .sort({ createdAt: 1 })
      .limit(300)
      .lean<Row[]>(),
    User.findOne({ clerkId: userId })
      .select("fullName plan planRenewsAt subscriptionId")
      .lean<{ fullName?: string; plan?: string; planRenewsAt?: Date | null; subscriptionId?: string | null }>(),
    getUserPlan(userId),
    getCurrentUsage(userId),
  ]);

  const sessions: DashSession[] = rows.map((r) => ({
    id: r._id.toString(),
    createdAt: new Date(r.createdAt ?? r.startTime ?? Date.now()).toISOString(),
    startTime: r.startTime ? new Date(r.startTime).toISOString() : null,
    endTime: r.endTime ? new Date(r.endTime).toISOString() : null,
    duration: r.duration,
    level: r.level,
    company: r.company ?? "",
    percent: typeof r.modelPreparationPercent === "number" ? r.modelPreparationPercent : null,
    dims: r.scoreBreakdown?.dimensions?.map((d) => ({ key: d.key, score: d.score })) ?? null,
    insights: r.insights ?? null,
  }));

  const firstName = (user?.fullName ?? "").trim().split(/\s+/)[0] || "there";
  // An invite trial is a paid plan with an end date but no payment behind it (redeeming never sets subscriptionId).
  let trial: DashboardData["trial"] = null;
  if (user?.plan && user.plan !== "free" && !user.subscriptionId && user.planRenewsAt) {
    const endsAt = new Date(user.planRenewsAt);
    const msLeft = endsAt.getTime() - Date.now();
    trial = {
      state: msLeft > 0 ? "active" : "ended",
      endsAt: endsAt.toISOString(),
      daysLeft: Math.max(0, Math.ceil(msLeft / 86_400_000)),
    };
  }

  return {
    ...buildDashboard(sessions, {
      firstName,
      monthUsed: usage?.interviewsCount ?? 0,
      monthCap: plan.plan.monthlyInterviewCap,
    }),
    trial,
  };
}
