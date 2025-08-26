// lib/usage.ts
import { monthKey, PLANS } from "./plans";
import { Usage } from "@/models/Usage";
import { User } from "@/models/User";

export async function getUserPlan(userId: string) {
  const user = await User.findOne({ clerkId: userId }).lean();
  const plan = (user?.plan ?? "free") as keyof typeof PLANS;
  return { planId: plan, plan: PLANS[plan] };
}

export async function getOrCreateUsage(userId: string, month = monthKey()) {
  let usage = await Usage.findOne({ userId, month });
  if (!usage) {
    usage = await Usage.create({
      userId,
      month,
      interviewsCount: 0,
      minutesUsed: 0,
    });
  }
  return usage;
}

export async function checkCanStartInterview(
  userId: string,
  requestedMinutes: number
) {
  const { planId, plan } = await getUserPlan(userId);
  if (requestedMinutes > plan.maxMinutesPerInterview) {
    return {
      ok: false,
      reason: `Your plan (${PLANS[planId].label}) allows up to ${plan.maxMinutesPerInterview} minutes per interview.`,
      code: "MAX_MINUTES",
    };
  }

  const usage = await getOrCreateUsage(userId);
  if (usage.interviewsCount >= plan.monthlyInterviewCap) {
    return {
      ok: false,
      reason: `You reached your monthly cap (${plan.monthlyInterviewCap} interviews) on ${PLANS[planId].label}.`,
      code: "MONTHLY_CAP",
    };
  }

  return { ok: true as const, planId };
}

export async function recordInterviewStart(userId: string, minutes: number) {
  const usage = await getOrCreateUsage(userId);
  usage.interviewsCount += 1;
  usage.minutesUsed += Math.max(0, minutes || 0);
  await usage.save();
}

export async function getCurrentUsage(userId: string) {
  const usage = await getOrCreateUsage(userId);
  return {
    interviewsCount: usage.interviewsCount,
    minutesUsed: usage.minutesUsed,
    month: usage.month,
  };
}
