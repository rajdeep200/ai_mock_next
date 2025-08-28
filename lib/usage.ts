// lib/usage.ts
import { monthKey, PLANS } from "./plans";
import { Usage } from "@/models/Usage";
import { User } from "@/models/User";

type PlanKey = keyof typeof PLANS;

// Narrow the shape we read from User when using lean()
type UserLean = { plan?: string } | null;

export async function getUserPlan(userId: string) {
  // Only fetch the plan field and type the lean() result
  const user = await User.findOne({ clerkId: userId })
    .select("plan")
    .lean<UserLean>();

  // Normalize to a valid plan id; default to "free"
  const planId: PlanKey =
    user?.plan && (user.plan in PLANS)
      ? (user.plan as PlanKey)
      : "free";

  return { planId, plan: PLANS[planId] };
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
    } as const;
  }

  const usage = await getOrCreateUsage(userId);
  if (usage.interviewsCount >= plan.monthlyInterviewCap) {
    return {
      ok: false,
      reason: `You reached your monthly cap (${plan.monthlyInterviewCap} interviews) on ${PLANS[planId].label}.`,
      code: "MONTHLY_CAP",
    } as const;
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
