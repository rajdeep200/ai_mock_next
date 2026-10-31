// app/invite/[token]/InviteClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";

type UiState =
  | { kind: "idle" }
  | { kind: "redeeming" }
  | { kind: "success"; planRenewsAt?: string; amount?: number }
  | { kind: "error"; code?: string; message: string; hint: string };

const ERRORS: Record<string, { message: string; hint: string }> = {
  INVITE_INVALID: {
    message: "This invite link is invalid or has expired.",
    hint: "Ask whoever shared it for a fresh link.",
  },
  ALREADY_REDEEMED: {
    message: "You have already redeemed this invite.",
    hint: "Your trial is already on your account, so there is nothing more to claim.",
  },
  NOT_ELIGIBLE: {
    message: "This invite is for new users only.",
    hint: "It works on free accounts that have never had a paid plan.",
  },
};

const REDIRECT_MS = 3500;

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PERKS = [
  "Up to 25 interviews a month",
  "Sessions up to 45 minutes",
  "Scored feedback with a prep percentage",
  "Progress dashboard and skill trends",
];

export default function InviteClient() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [uiState, setUi] = useState<UiState>({ kind: "idle" });
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The signed-in user's current plan, so we can say up front that the invite isn't for them.
  const [plan, setPlan] = useState<{ id: string; label?: string } | null>(null);

  // Basic client-side token guard (still validated securely on the server)
  const trimmedToken = useMemo(() => (typeof token === "string" ? token.trim() : ""), [token]);
  const tokenLooksOk = trimmedToken.length >= 10;
  const backHere = `/invite/${encodeURIComponent(trimmedToken)}`;

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    fetch("/api/plan", { cache: "no-store" })
      .then((r) => r.json())
      // If the lookup fails, let the server decide when they click Claim.
      .then((d) => !cancelled && setPlan({ id: d?.plan?.id ?? "free", label: d?.plan?.label }))
      .catch(() => !cancelled && setPlan({ id: "free" }));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const redeem = async () => {
    if (!tokenLooksOk) {
      setUi({ kind: "error", code: "INVITE_INVALID", ...ERRORS.INVITE_INVALID });
      return;
    }
    try {
      setUi({ kind: "redeeming" });
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: trimmedToken }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        const known = ERRORS[data?.code];
        setUi({
          kind: "error",
          code: data?.code,
          message: known?.message || data?.error || "Could not redeem this invite.",
          hint: known?.hint || "Please try again in a moment.",
        });
        return;
      }

      setUi({
        kind: "success",
        planRenewsAt: data?.applied?.planRenewsAt,
        amount: data?.applied?.benefit?.amount,
      });
      redirectTimer.current = setTimeout(() => router.replace("/dashboard"), REDIRECT_MS);
    } catch {
      setUi({
        kind: "error",
        message: "Network error while redeeming. Please try again.",
        hint: "Check your connection, then try again.",
      });
    }
  };

  // Already on a paid plan: show the "new users only" state straight away instead of after a click.
  const ineligible = isSignedIn && plan !== null && plan.id !== "free" && uiState.kind === "idle";
  const ui: UiState = ineligible
    ? {
        kind: "error",
        code: "NOT_ELIGIBLE",
        message: `You're on the ${plan?.label ?? "paid"} plan, and this invite is for new free users only.`,
        hint: ERRORS.NOT_ELIGIBLE.hint,
      }
    : uiState;
  const checkingPlan = isSignedIn && plan === null && ui.kind === "idle";

  const email = user?.primaryEmailAddress?.emailAddress || user?.username || "your account";
  const showOffer = ui.kind !== "error";
  const showPerks = ui.kind === "idle" || ui.kind === "redeeming";

  // Heading block per state
  let badge: "gift" | "ok" | "bad" = "gift";
  let eyebrow = "You've been invited";
  let eyebrowCls = "";
  let title: React.ReactNode = <>Your free <b>Pro trial</b> is waiting</>;
  let lede = "Practice realistic voice interviews with an AI interviewer and get a scored report after every one.";

  if (ui.kind === "success") {
    badge = "ok";
    eyebrow = "Trial activated";
    eyebrowCls = "ok";
    title = ui.amount ? <>You're on <b>Pro</b> for {ui.amount} days</> : <>You're on <b>Pro</b></>;
    lede = ui.planRenewsAt
      ? `Your new limits are live until ${new Date(ui.planRenewsAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}. Try a 45-minute interview while you have them.`
      : "Your new limits are live. Try a 45-minute interview while you have them.";
  } else if (ui.kind === "error") {
    badge = "bad";
    eyebrow = "Couldn't redeem";
    eyebrowCls = "bad";
    title = <>This invite <b>didn't work</b></>;
    lede = ui.hint;
  }

  return (
    <div className="iv iv-page">
      <article className="iv-card" aria-live="polite">
        <div className="iv-top">
          <div className={`iv-badge ${badge}`} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              {badge === "ok" ? (
                <path className="iv-draw" d="M5 12.5l5 5L20 7" />
              ) : badge === "bad" ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
                </>
              )}
            </svg>
          </div>
          <div className={`iv-eyebrow ${eyebrowCls}`}><i />{eyebrow}</div>
          <h1>{title}</h1>
          <p className="iv-lede">{lede}</p>
        </div>

        {showOffer && (
          <div className="iv-offer">
            <div>
              <div className="iv-big">Pro<small>free trial</small></div>
              <div className="iv-what">No card needed.</div>
            </div>
            <span className="iv-pill">Invite · DSA students</span>
          </div>
        )}

        {showPerks && (
          <div className="iv-block">
            <h2>What's included</h2>
            <ul className="iv-perks">
              {PERKS.map((p) => (
                <li key={p}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoaded && isSignedIn && ui.kind !== "success" && (
          <div className="iv-who">
            <span className="av" aria-hidden="true">{email.charAt(0)}</span>
            <span className="em">Signed in as <b>{email}</b></span>
            <SignOutButton redirectUrl={backHere}>
              <button type="button">Not you?</button>
            </SignOutButton>
          </div>
        )}

        {isLoaded && !isSignedIn && (
          <div className="iv-note info">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
            <span>Create a free account or sign in, and you'll come straight back here to claim your trial.</span>
          </div>
        )}

        {ui.kind === "error" && (
          <div className="iv-note warn" role="alert">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2L12 3zM12 10v4M12 17.5v.01" /></svg>
            <span>{ui.message}</span>
          </div>
        )}

        <div className="iv-actions">
          {!isLoaded || checkingPlan ? null : ui.kind === "success" ? (
            <>
              <Link href="/start-interview" className="btn">Start an interview<Arrow /></Link>
              <Link href="/dashboard" className="btn ghost">Go to dashboard</Link>
            </>
          ) : ui.kind === "error" ? (
            <>
              <Link href="/dashboard" className="btn">Go to dashboard</Link>
              <Link href="/pricing" className="btn ghost">View plans</Link>
            </>
          ) : !isSignedIn ? (
            <>
              <SignInButton mode="redirect" forceRedirectUrl={backHere} fallbackRedirectUrl={backHere}>
                <button type="button" className="btn">Sign in to claim<Arrow /></button>
              </SignInButton>
              <SignUpButton mode="redirect" forceRedirectUrl={backHere} fallbackRedirectUrl={backHere}>
                <button type="button" className="btn ghost">Create account</button>
              </SignUpButton>
            </>
          ) : ui.kind === "redeeming" ? (
            <button type="button" className="btn" disabled>
              <span className="iv-spin" aria-hidden="true" />Applying your trial…
            </button>
          ) : (
            <>
              <button type="button" className="btn" onClick={redeem} disabled={!tokenLooksOk}>
                Claim my trial<Arrow />
              </button>
              <Link href="/pricing" className="btn ghost">View plans</Link>
            </>
          )}
        </div>

        {ui.kind === "success" ? (
          <p className="iv-redirect">Taking you to your dashboard…</p>
        ) : ui.kind !== "error" ? (
          <p className="iv-fine">
            By claiming, you agree to our <Link href="/terms">Terms</Link> and{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        ) : null}
      </article>
    </div>
  );
}
