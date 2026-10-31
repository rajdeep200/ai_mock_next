"use client";

import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard";
import { Arrow } from "@/component/home/icons";

// Set NEXT_PUBLIC_FEEDBACK_URL to a form link to collect feedback there; otherwise it opens an email.
const FEEDBACK_HREF =
  process.env.NEXT_PUBLIC_FEEDBACK_URL ||
  "mailto:support@mockqube.com?subject=" + encodeURIComponent("MockQube trial feedback");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long" });

/** Shown to users on an invite trial: days left, an upgrade prompt and a way to send feedback. */
export default function TrialBanner({ trial }: { trial: NonNullable<DashboardData["trial"]> }) {
  const ended = trial.state === "ended";
  const urgent = !ended && trial.daysLeft <= 2;
  const days = trial.daysLeft === 1 ? "1 day" : `${trial.daysLeft} days`;

  return (
    <section className={`trialbar${ended ? " ended" : urgent ? " urgent" : ""}`} aria-label="Pro trial">
      <div className="tb-text">
        <span className="tb-chip">{ended ? "Trial ended" : `Pro trial · ${days} left`}</span>
        <p>
          {ended
            ? "Your Pro trial has ended and you're back on the Free plan (2 interviews a month, 15 minutes each). Upgrade to keep going."
            : `You have Pro until ${fmtDate(trial.endsAt)}: up to 25 interviews a month, 45 minutes each. How is it going? We'd love to hear what to fix.`}
        </p>
      </div>
      <div className="tb-actions">
        <a className="btn ghost" href={FEEDBACK_HREF} target="_blank" rel="noopener noreferrer">
          Share feedback
        </a>
        <Link href="/pricing" className="btn">
          {ended ? "See plans" : "Keep Pro"} <Arrow />
        </Link>
      </div>
    </section>
  );
}
