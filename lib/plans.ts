// lib/plans.ts
export type PlanId = 'free' | 'starter' | 'pro';

export const PLANS: Record<PlanId, {
  label: string;
  monthlyInterviewCap: number;
  maxMinutesPerInterview: number;
  features: {
    companyPatterns: boolean;
    premiumTTS: boolean;
    export: boolean;
    fullHistory: boolean;
  };
}> = {
  free: {
    label: 'Free',
    monthlyInterviewCap: 2,
    maxMinutesPerInterview: 15,
    features: { companyPatterns: false, premiumTTS: false, export: false, fullHistory: false },
  },
  starter: {
    label: 'Starter',
    monthlyInterviewCap: 20,
    maxMinutesPerInterview: 30,
    features: { companyPatterns: true, premiumTTS: false, export: false, fullHistory: false },
  },
  pro: {
    label: 'Pro',
    monthlyInterviewCap: 60,
    maxMinutesPerInterview: 60,
    features: { companyPatterns: true, premiumTTS: true, export: true, fullHistory: true },
  },
};

export const monthKey = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

// ---- Paid passes: each purchase buys PASS_DAYS of access; nothing renews automatically ----
export const PASS_DAYS = 30;
// A plan can be bought again (extended) only when this few days or fewer remain.
export const RENEW_WINDOW_DAYS = 7;

export const PLAN_RANK: Record<PlanId, number> = { free: 0, starter: 1, pro: 2 };

/**
 * The plan a user actually has right now. A paid plan whose end date has passed counts as Free.
 * (A paid plan with no end date, e.g. granted by hand, doesn't expire.)
 */
export function effectivePlanId(
  user: { plan?: string | null; planRenewsAt?: Date | string | null } | null | undefined,
  now: Date = new Date()
): PlanId {
  const id = user?.plan && user.plan in PLANS ? (user.plan as PlanId) : 'free';
  if (id !== 'free' && user?.planRenewsAt && new Date(user.planRenewsAt).getTime() <= now.getTime()) return 'free';
  return id;
}
