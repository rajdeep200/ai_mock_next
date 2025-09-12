// app/pricing/page.tsx (or wherever your PricingPage lives)
"use client";

import { useEffect, useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { FiLoader, FiZap, FiCheck, FiStar, FiPhone } from "react-icons/fi";

type Plan = {
  id: "free" | "starter" | "pro";
  label: string;
  monthlyInterviewCap: number;
  maxMinutesPerInterview: number;
};
type PlanResp = {
  plan: Plan & { features: any };
  usage: { interviewsCount: number; month: string };
};

type UserLite = {
  name?: string;
  phone?: string;
}

export default function PricingPage() {
  const [info, setInfo] = useState<PlanResp | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<null | "starter" | "pro">(null);
  const [busy, setBusy] = useState(false);

  const [user, setUser] = useState<UserLite | null>(null)
  const [loadingUser, setLoadingUser] = useState<boolean>(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const isValidPhone = (p?: string) => !!p && /^\d{6,15}$/.test(p);
  const phoneMissing = !isValidPhone(user?.phone);

  const loadPlan = async () => {
    try {
      setBusy(true);
      const res = await fetch("/api/plan", { cache: "no-store" });
      const response = await res.json();
      if (res.ok) setInfo(response);
    } finally {
      setBusy(false);
    }
  };

  const loadUser = async () => {
    setLoadingUser(true)
    try {
      const res = await fetch('/api/user', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUser({ name: data?.user?.name, phone: data?.user?.phone })
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    loadPlan();
    loadUser();
  }, []);

  const handleUpgrade = async (planId: "starter" | "pro") => {
    try {
      setLoadingPlan(planId);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to start checkout");
        setLoadingPlan(null);
        return;
      }
      const paymentSessionId: string | undefined = data?.paymentSessionId;
      if (!paymentSessionId) {
        alert("Missing payment session id from server.");
        setLoadingPlan(null);
        return;
      }
      const mode =
        process.env.NEXT_PUBLIC_CASHFREE_MODE === "PROD" ? "production" : "sandbox";
      const cashfree = await load({ mode });
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });
    } catch {
      alert("Something went wrong starting checkout.");
      setLoadingPlan(null);
    }
  };

  const current = info?.plan.id || "free";

  const validatePhone = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (!/^\d{6,15}$/.test(digits)) {
      return { ok: false, value: digits, error: "Enter 6–15 digits only." };
    }
    return { ok: true, value: digits, error: null };
  };

  const savePhone = async () => {
    setPhoneError(null);
    const v = validatePhone(phoneInput);
    if (!v.ok) {
      setPhoneError(v.error);
      return;
    }
    try {
      setPhoneSaving(true);
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: v.value }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setPhoneError(msg || "Failed to save phone.");
        return;
      }
      await loadUser();
      setShowPhoneModal(false);
    } catch {
      setPhoneError("Network error. Please try again.");
    } finally {
      setPhoneSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Futuristic background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_28%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,.055),transparent_45%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_80%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
        <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)] animate-scan" />
      </div>

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-14 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-green-400 tracking-tight">
          Flexible Pricing, Same 🔥 AI
        </h1>
        <p className="mt-3 text-gray-300">
          Choose a plan that fits your interview prep — upgrade anytime.
        </p>
      </div>

      {!loadingUser && phoneMissing && (
        <div className="relative z-10 mx-auto max-w-3xl px-4 mt-6">
          <div className="rounded-2xl border border-yellow-600/40 bg-yellow-500/10 backdrop-blur p-4 sm:p-5">
            <p className="text-sm text-yellow-200">
              <span className="font-semibold">Action needed:</span> Please add your phone number
              before upgrading. It’s required to complete payment.
            </p>
            <div className="mt-3">
              <button
                onClick={() => setShowPhoneModal(true)}
                className="cursor-pointer mt-2 inline-flex items-center gap-2 rounded-lg border border-yellow-500/40 px-3 py-1.5 text-yellow-100 hover:bg-yellow-500/10"
              >
                <FiPhone /> Add Number
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage banner */}
      {info && (
        <div className="relative z-10 mx-auto max-w-3xl px-4 mt-8">
          <div className="rounded-2xl border border-emerald-700/40 bg-gray-900/60 backdrop-blur p-4 sm:p-5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-gray-400">
                Current Plan:{" "}
                <span className="text-emerald-300 font-medium">{info.plan.label}</span>
              </p>
              <p className="text-sm text-gray-400">
                Usage ({info.usage.month}):{" "}
                <span className="text-gray-100 font-semibold">
                  {info.usage.interviewsCount}/{info.plan.monthlyInterviewCap}
                </span>{" "}
                interviews
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-emerald-300">
              <FiZap />
              <span className="text-sm">Level up for longer sessions</span>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {!info || busy ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                className="h-64 rounded-2xl border border-gray-800 bg-gray-900/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Free */}
            <PlanCard
              title="Free"
              price="₹0"
              per="mo"
              highlight={current === "free"}
              badge={current === "free" ? "Current" : undefined}
              features={[
                `Up to ${info.plan.monthlyInterviewCap} interviews/mo (Free: 2)`,
                "Max 15 min / interview",
                "Basic question set",
              ]}
              ctaLabel={current === "free" ? "Current Plan" : "Downgrade"}
              disabled
            />

            {/* Starter */}
            <PlanCard
              title="Starter"
              price="₹599"
              per="mo"
              highlight={current === "starter"}
              badge={current === "starter" ? "Current" : "Popular"}
              features={[
                "Up to 20 interviews/mo",
                "Max 30 min / interview",
                "Company-style questions",
              ]}
              ctaLabel={
                phoneMissing
                  ? "Add phone in Profile"
                  : current === "starter"
                    ? "Current Plan"
                    : loadingPlan === "starter"
                      ? "Redirecting…"
                      : "Upgrade to Starter"
              }
              onClick={() => !phoneMissing && handleUpgrade("starter")}
              disabled={current === "starter" || loadingPlan !== null || phoneMissing}
              glow
            />

            {/* Pro */}
            <PlanCard
              title="Pro"
              price="₹999"
              per="mo"
              highlight={current === "pro"}
              badge={current === "pro" ? "Current" : "Most Popular"}
              features={[
                "Up to 60 interviews/mo",
                "Max 60 min / interview",
                "Company-style + premium TTS + export",
              ]}
              ctaLabel={
                phoneMissing
                  ? "Add phone in Profile"
                  : current === "pro"
                    ? "Current Plan"
                    : loadingPlan === "pro"
                      ? "Redirecting…"
                      : "Upgrade to Pro"
              }
              onClick={() => !phoneMissing && handleUpgrade("pro")}
              disabled={current === "pro" || loadingPlan !== null || phoneMissing}
              glow
              featured
            />
          </div>
        )}
      </section>

      {/* NEW: Phone modal */}
      {showPhoneModal && (
        <>
          <button
            aria-hidden
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setShowPhoneModal(false)}
          />
          <div className="fixed inset-0 z-50 grid place-items-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-emerald-700/40 bg-gray-900/80 backdrop-blur p-5 shadow-[0_0_40px_rgba(34,197,94,.18)]">
              <h3 className="text-xl font-semibold text-emerald-300 flex items-center gap-2">
                <FiPhone /> Add Phone Number
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                We use your number for payment verification. Digits only (6–15).
              </p>

              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 9876543210"
                  className="w-full rounded-lg border border-gray-700 bg-black/50 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {phoneError && (
                  <p className="mt-2 text-xs text-red-400">{phoneError}</p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="cursor-pointer rounded-lg border border-gray-700 px-4 py-2 text-gray-200 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={savePhone}
                  disabled={phoneSaving}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {phoneSaving ? (
                    <>
                      <FiLoader className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <FiCheck /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* local animations */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 12s linear infinite;
          background-size: auto 6px;
        }
      `}</style>
    </main>
  );
}

function PlanCard({
  title,
  price,
  per,
  features,
  ctaLabel,
  onClick,
  disabled,
  highlight,
  badge,
  glow,
  featured,
}: {
  title: string;
  price: string;
  per?: string;
  features: string[];
  ctaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  badge?: "Current" | "Popular" | "Most Popular";
  glow?: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-6 sm:p-7 border backdrop-blur bg-gray-900/60
      ${highlight ? "border-emerald-500/50" : "border-gray-800"}
      ${glow ? "shadow-[0_0_40px_rgba(34,197,94,.12)]" : ""}
      ${featured ? "ring-1 ring-emerald-500/30" : ""}`}
    >
      {/* Badge/Ribbon */}
      {badge && (
        <div
          className={`absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium
          border backdrop-blur-[20px]
          ${badge === "Current"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
            }`}
        >
          {badge.includes("Popular") ? <FiStar /> : <FiCheck />}
          {badge}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      <p className="text-4xl font-extrabold text-green-400 mb-4 tracking-tight">
        {price}
        {per && <span className="text-base text-gray-400 font-medium">/{per}</span>}
      </p>

      <ul className="text-sm text-gray-300 space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2.5 rounded-xl font-semibold transition cursor-pointer
        ${disabled
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-500 hover:to-green-600 text-white shadow-[0_0_24px_rgba(34,197,94,.15)]"
          }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
