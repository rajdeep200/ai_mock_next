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
