"use client";

import { useEffect, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { load } from "@cashfreepayments/cashfree-js";
import { PLANS, PLAN_RANK, RENEW_WINDOW_DAYS, type PlanId } from "@/lib/plans";
import { Arrow } from "@/component/home/icons";
import PlanCard, { type PlanFeature } from "./PlanCard";
import PhoneModal from "./PhoneModal";

type PlanResp = {
  plan: { id: PlanId; label: string; monthlyInterviewCap: number; maxMinutesPerInterview: number };
  usage: { interviewsCount: number; month: string };
  renewsAt?: string | null; // when the current paid pass ends
};

type UserLite = { name?: string; phone?: string };

type Paid = "starter" | "pro";

const isValidPhone = (p?: string) => !!p && /^\d{6,15}$/.test(p);

const cap = (id: PlanId) => `${PLANS[id].monthlyInterviewCap} interviews per month`;
const mins = (id: PlanId) => `Up to ${PLANS[id].maxMinutesPerInterview} min per interview`;

const FEATURES: Record<PlanId, PlanFeature[]> = {
  free: [
    { text: cap("free"), on: true },
    { text: mins("free"), on: true },
    { text: "Basic question set", on: true },
    { text: "Company-style questions", on: PLANS.free.features.companyPatterns },
  ],
  starter: [
    { text: cap("starter"), on: true },
    { text: mins("starter"), on: true },
    { text: "Company-style questions", on: PLANS.starter.features.companyPatterns },
    { text: "Premium voice & export", on: PLANS.starter.features.premiumTTS },
  ],
  pro: [
    { text: cap("pro"), on: true },
    { text: mins("pro"), on: true },
    { text: "Company-style questions", on: PLANS.pro.features.companyPatterns },
    { text: "Premium voice, export & full history", on: PLANS.pro.features.premiumTTS },
  ],
};

export default function PricingClient() {
  const { isLoaded, isSignedIn } = useAuth();

  const [info, setInfo] = useState<PlanResp | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<Paid | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [user, setUser] = useState<UserLite | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const signedIn = !!isSignedIn;
  const phoneMissing = !isValidPhone(user?.phone);

  const loadPlan = async () => {
    try {
      const res = await fetch("/api/plan", { cache: "no-store" });
      if (res.ok) setInfo(await res.json());
    } catch {
      /* fall through: cards render with Free defaults */
    } finally {
      setPlanLoaded(true);
    }
  };

  const loadUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch("/api/user", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser({ name: data?.user?.name, phone: data?.user?.phone });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) loadUser();
    else setLoadingUser(false);
  }, [isLoaded, isSignedIn]);

  const handleUpgrade = async (planId: Paid) => {
    setCheckoutError(null);
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
        setCheckoutError(data?.error || "Failed to start checkout.");
        setLoadingPlan(null);
        return;
      }
      const paymentSessionId: string | undefined = data?.paymentSessionId;
      if (!paymentSessionId) {
        setCheckoutError("Missing payment session id from server.");
        setLoadingPlan(null);
        return;
      }
      const mode = process.env.NEXT_PUBLIC_CASHFREE_MODE === "PROD" ? "production" : "sandbox";
      const cashfree = await load({ mode });
      await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
    } catch {
      setCheckoutError("Something went wrong starting checkout.");
      setLoadingPlan(null);
    }
  };

  const savePhone = async () => {
    setPhoneError(null);
    const digits = phoneInput.replace(/[^\d]/g, "");
    if (!/^\d{6,15}$/.test(digits)) {
      setPhoneError("Enter 6–15 digits only.");
      return;
    }
    try {
      setPhoneSaving(true);
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      if (!res.ok) {
        setPhoneError((await res.text()) || "Failed to save phone.");
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

  // Signed-out visitors have no current plan; /api/plan reports Free for them.
  const current: PlanId | null = signedIn ? info?.plan.id ?? "free" : null;
  const showNotice = signedIn && !loadingUser && phoneMissing;
  const showUsage = signedIn && !!info;
  const used = info ? info.usage.interviewsCount : 0;
  const limit = info ? info.plan.monthlyInterviewCap : 0;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const endsOn = info?.renewsAt
    ? new Date(info.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const daysLeft = info?.renewsAt ? Math.ceil((new Date(info.renewsAt).getTime() - Date.now()) / 86_400_000) : null;
  const canRenew = daysLeft !== null && daysLeft <= RENEW_WINDOW_DAYS;

  const upgradeCta = (id: Paid, label: string) => {
    if (!signedIn) {
      return (
        <SignInButton forceRedirectUrl="/pricing">
          <button className="btn" type="button">Sign in to upgrade<Arrow /></button>
        </SignInButton>
      );
    }
    // A pass can be renewed in its last few days; a lower plan can't be bought while a higher one is active.
    if (current === id && !canRenew) return <button className="btn" disabled>{endsOn ? `Active until ${endsOn}` : "Current plan"}</button>;
    if (current && PLAN_RANK[id] < PLAN_RANK[current]) return <button className="btn" disabled>Included in your plan</button>;
    if (phoneMissing) {
      return <button className="btn" type="button" onClick={() => setShowPhoneModal(true)}>Add phone to upgrade<Arrow /></button>;
    }
    return (
      <button className="btn" type="button" disabled={loadingPlan !== null} onClick={() => handleUpgrade(id)}>
        {loadingPlan === id ? "Redirecting…" : <>{current === id ? `Renew ${PLANS[id].label}` : label}<Arrow /></>}
      </button>
    );
  };

  const freeCta = !signedIn ? (
    <SignInButton forceRedirectUrl="/dashboard">
      <button className="btn ghost" type="button">Start free</button>
    </SignInButton>
  ) : (
    <button className="btn" disabled>{current === "free" ? "Current plan" : "Included"}</button>
  );

  return (
    <>
      {(showUsage || showNotice || checkoutError) && (
        <div className="wrap status-wrap">
          {(showUsage || showNotice) && (
            <div className={`status${showUsage && showNotice ? "" : " one"}`}>
              {showUsage && info && (
                <div className="usage">
                  <span className="ring" style={{ ["--used" as string]: pct }} aria-hidden="true">
                    <i>{used}/{limit}</i>
                  </span>
                  <small>Current plan · {info.plan.label}{endsOn ? ` · until ${endsOn}` : ""}</small>
                  <strong>{used} of {limit} interviews used</strong>
                  <p>Usage for <b>{info.usage.month}</b>. Level up for longer sessions.</p>
                </div>
              )}
              {showNotice && (
                <div className="notice">
                  <div>
                    <strong>One quick thing</strong>
                    <p>Add your phone number before upgrading. It&apos;s required to complete payment.</p>
                  </div>
                  <button className="btn dark" type="button" onClick={() => setShowPhoneModal(true)}>Add number</button>
                </div>
              )}
            </div>
          )}
          {checkoutError && <p className="alert" role="alert">{checkoutError}</p>}
        </div>
      )}

      <section className="plans sec" id="plans">
        <div className="wrap">
          <div className="grid">
            {!planLoaded || !isLoaded ? (
              <>
                <div className="skel" />
                <div className="skel" />
                <div className="skel" />
              </>
            ) : (
              <>
                <PlanCard
                  variant="free"
                  name="Free"
                  blurb="Try the full loop, risk-free."
                  price="₹0"
                  features={FEATURES.free}
                  current={current === "free"}
                  badge={current === "free" ? { kind: "current", label: "Current" } : undefined}
                  cta={freeCta}
                />
                <PlanCard
                  variant="starter"
                  name="Starter"
                  blurb="For steady weekly practice."
                  price="₹599"
                  features={FEATURES.starter}
                  current={current === "starter"}
                  badge={current === "starter" ? { kind: "current", label: "Current" } : { kind: "popular", label: "Popular" }}
                  cta={upgradeCta("starter", "Upgrade to Starter")}
                />
                <PlanCard
                  variant="pro"
                  name="Pro"
                  blurb="Everything, for serious interview season."
                  price="₹999"
                  features={FEATURES.pro}
                  current={current === "pro"}
                  badge={current === "pro" ? { kind: "current", label: "Current" } : { kind: "hot", label: "Most popular" }}
                  cta={upgradeCta("pro", "Upgrade to Pro")}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {showPhoneModal && (
        <PhoneModal
          value={phoneInput}
          onChange={setPhoneInput}
          error={phoneError}
          saving={phoneSaving}
          onSave={savePhone}
          onClose={() => setShowPhoneModal(false)}
        />
      )}
    </>
  );
}
