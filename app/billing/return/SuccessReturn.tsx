"use client";

// One screen for every outcome of a checkout: confirming, paid, failed, or still waiting on the bank.
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PASS_DAYS, PLANS, type PlanId } from "@/lib/plans";
import { Arrow } from "@/component/home/icons";

type VerifyResp = {
  ok?: boolean;
  orderId?: string;
  status?: string; // "paid" | "failed" | "pending" | "created" | "unknown" ...
  planId?: "starter" | "pro";
  planLabel?: string;
  amount?: number;
  currency?: string;
  paidAt?: string | null;
  details?: string;
};

type Outcome = "success" | "failed" | "waiting";
type Phase = "checking" | "success" | "failed" | "slow";

const POLL_MS = 3000;
const MAX_POLLS = 15; // about 45 seconds, then we say it is taking long

const outcomeOf = (status?: string): Outcome => {
  const s = (status || "").toLowerCase();
  if (["paid", "success", "completed", "captured"].some((k) => s.includes(k))) return "success";
  if (["failed", "cancelled", "canceled"].some((k) => s.includes(k))) return "failed";
  return "waiting";
};

const money = (amount?: number, currency?: string) => {
  if (amount == null) return "";
  const n = amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return !currency || currency === "INR" ? `₹${n}` : `${currency} ${n}`;
};

const when = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export default function PaymentStatus() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id") || sp.get("orderId") || "";

  const [resp, setResp] = useState<VerifyResp | null>(null);
  const [phase, setPhase] = useState<Phase>("checking");
  const [problem, setProblem] = useState<string | null>(null);
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const verify = useCallback(async () => {
    if (!orderId) {
      setProblem("We couldn't find an order number in this link.");
      setPhase("slow");
      return;
    }
    let outcome: Outcome = "waiting";
    try {
      const res = await fetch(`/api/billing/verify?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const data = (await res.json()) as VerifyResp & { error?: string };
      if (!res.ok) throw new Error(data?.details || data?.error || "Verification failed");
      setResp(data);
      setProblem(null);
      outcome = outcomeOf(data.status);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "We couldn't reach the server.");
    }

    if (outcome === "success") return setPhase("success");
    if (outcome === "failed") return setPhase("failed");

    // Still waiting: poll for a while (the webhook may arrive any second), then say it is taking long
    if (polls.current >= MAX_POLLS) return setPhase("slow");
    polls.current += 1;
    timer.current = setTimeout(verify, POLL_MS);
  }, [orderId]);

  useEffect(() => {
    polls.current = 0;
    verify();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [verify]);

  const checkAgain = () => {
    if (timer.current) clearTimeout(timer.current);
    polls.current = 0;
    setPhase("checking");
    verify();
  };

  const planId = (resp?.planId ?? "pro") as PlanId;
  const plan = PLANS[planId] ?? PLANS.pro;
  const planName = resp?.planLabel || plan.label;
  const shownOrder = resp?.orderId || orderId || "";
  const amount = money(resp?.amount, resp?.currency);
  const paidAt = when(resp?.paidAt);

  const Receipt = ({ status }: { status: React.ReactNode }) => (
    <dl className="receipt">
      <div className="row"><dt>Plan</dt><dd>{planName} · {PASS_DAYS} days</dd></div>
      {shownOrder && <div className="row"><dt>Order ID</dt><dd className="mono">{shownOrder}</dd></div>}
      {phase === "success" && paidAt && <div className="row"><dt>Paid on</dt><dd>{paidAt}</dd></div>}
      <div className="row"><dt>Status</dt><dd>{status}</dd></div>
      {amount && <div className="row total"><dt>Amount</dt><dd>{amount}</dd></div>}
    </dl>
  );

  const perks = [
    `${plan.monthlyInterviewCap} interviews every month`,
    `Sessions up to ${plan.maxMinutesPerInterview} minutes`,
    ...(plan.features.companyPatterns ? ["Company-specific questions"] : []),
    `Active for ${PASS_DAYS} days`,
  ];

  return (
    <main className="page" data-s={phase}>
      <div className="disc" aria-hidden="true"></div>
      <div className="wrap">
        <div className="card" aria-live="polite">
          {/* CHECKING */}
          <section className="state st-checking">
            <div className="top-sec">
              <div className="badge spin"><div className="spinner"></div></div>
              <span className="eyebrow"><i></i>Securing your plan</span>
              <h1><b>Confirming</b> your payment</h1>
              <p className="lede">This takes a few seconds. We are checking with your bank so your plan switches on the moment it clears.</p>
            </div>
            <ul className="steps">
              <li className="done"><span className="dot"></span>Payment sent to Cashfree</li>
              <li className="now"><span className="dot"></span>Waiting for your bank to confirm</li>
              <li><span className="dot"></span>Switching on your plan</li>
            </ul>
            <div className="bar"><i></i></div>
            <p className="keep">Please keep this page open. You don&apos;t need to do anything.</p>
          </section>

          {/* SUCCESS */}
          {phase === "success" && (
            <section className="state st-success">
              <div className="top-sec">
                <div className="badge ok"><svg viewBox="0 0 48 48" aria-hidden="true"><path className="draw" d="M12 25l9 9 16-19" /></svg></div>
                <span className="eyebrow ok"><i></i>Payment successful</span>
                <h1>You&apos;re on <b>{planName}</b></h1>
                <p className="lede">Your plan is active right now. Pick up where you left off, or start a fresh interview.</p>
              </div>
              <Receipt status={<span className="paid"><Check />Paid via Cashfree</span>} />
              <div className="block">
                <h3>What you just unlocked</h3>
                <ul className="perks">
                  {perks.map((p) => (
                    <li key={p}><Check />{p}</li>
                  ))}
                </ul>
              </div>
              <div className="actions">
                <Link href="/start-interview" className="btn">Start an interview <Arrow /></Link>
                <Link href="/dashboard" className="btn ghost">Go to dashboard</Link>
              </div>
            </section>
          )}

          {/* FAILED */}
          {phase === "failed" && (
            <section className="state st-failed">
              <div className="top-sec">
                <div className="badge bad">
                  <svg viewBox="0 0 48 48" aria-hidden="true"><path className="draw" d="M14 14l20 20" /><path className="draw2" d="M34 14L14 34" /></svg>
                </div>
                <span className="eyebrow bad"><i></i>Payment failed</span>
                <h1>That payment <b>didn&apos;t go through</b></h1>
                <p className="lede">Nothing changed on your account, and you can try again whenever you like.</p>
              </div>
              <Receipt status={<span className="failed-tag">Not completed</span>} />
              <div className="note safe">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
                <span><b>You haven&apos;t been given a plan for this order.</b> If your bank shows a debit, it is usually reversed automatically within 5 to 7 working days.</span>
              </div>
              <div className="block">
                <h3>Common reasons</h3>
                <ul className="reasons">
                  <li><i>1</i><div><b>Your bank declined it</b><span>Check the card limit, or try UPI or a different card.</span></div></li>
                  <li><i>2</i><div><b>The session timed out</b><span>Entering the OTP too late cancels the payment.</span></div></li>
                  <li><i>3</i><div><b>You cancelled on the payment page</b><span>No problem, just start again from pricing.</span></div></li>
                </ul>
              </div>
              <div className="actions">
                <Link href="/pricing" className="btn">Try again <Arrow /></Link>
                <a href={`mailto:support@mockqube.com?subject=Payment%20help${shownOrder ? `%20-%20${encodeURIComponent(shownOrder)}` : ""}`} className="btn ghost">Contact support</a>
              </div>
            </section>
          )}

          {/* STILL WAITING */}
          {phase === "slow" && (
            <section className="state st-slow">
              <div className="top-sec">
                <div className="badge wait"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" /><path d="M24 15v10l6 4" /></svg></div>
                <span className="eyebrow wait"><i></i>Still confirming</span>
                <h1>This is taking <b>longer than usual</b></h1>
                <p className="lede">
                  {problem && !resp
                    ? problem
                    : "Your bank hasn't confirmed yet. Don't pay again. Check back in a minute and your plan switches on as soon as it clears."}
                </p>
              </div>
              {(shownOrder || amount) && <Receipt status={<span style={{ color: "#B36F00" }}>Waiting for the bank</span>} />}
              <div className="note warn">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
                <span><b>If money was debited,</b> it is safe. Keep the order ID above and write to us if your plan isn&apos;t active within an hour.</span>
              </div>
              <div className="actions">
                <button type="button" className="btn" onClick={checkAgain}>
                  Check again
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
                </button>
                <a href={`mailto:support@mockqube.com?subject=Payment%20help${shownOrder ? `%20-%20${encodeURIComponent(shownOrder)}` : ""}`} className="btn ghost">Contact support</a>
              </div>
            </section>
          )}
        </div>
        <p className="help">
          Need help with a payment? Write to <a href="mailto:support@mockqube.com">support@mockqube.com</a> with your order ID.
        </p>
      </div>
    </main>
  );
}
