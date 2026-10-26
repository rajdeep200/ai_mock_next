"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { RENEW_WINDOW_DAYS } from "@/lib/plans";

type PlanInfo = { plan: { label: string }; renewsAt?: string | null };

const DISMISS_KEY = "mq-plan-banner-dismissed";
const RECHECK_MS = 60_000;
// The live interview fills the whole viewport, so nothing may be added above it.
const HIDDEN_ON = ["/interview"];

// Slim notice at the very top of every page when a paid pass is about to end. Passes don't renew by themselves.
export default function PlanBanner() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [info, setInfo] = useState<PlanInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const lastFetch = useRef(0);

  useEffect(() => {
    try { if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true); } catch { }
  }, []);

  // Check on load and when navigating (at most once a minute, but always after billing pages so a renewal shows up).
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setInfo(null); return; }
    const fresh = Date.now() - lastFetch.current < RECHECK_MS;
    if (fresh && !pathname.startsWith("/billing")) return;
    lastFetch.current = Date.now();
    (async () => {
      try {
        const res = await fetch("/api/plan", { cache: "no-store" });
        if (res.ok) setInfo(await res.json());
      } catch { /* no banner if we can't tell */ }
    })();
  }, [isLoaded, isSignedIn, pathname]);

  if (dismissed || !info?.renewsAt) return null;
  if (HIDDEN_ON.includes(pathname)) return null;

  const end = new Date(info.renewsAt);
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  if (daysLeft > RENEW_WINDOW_DAYS || daysLeft < 0) return null;

  const when = daysLeft <= 0 ? "ends today" : daysLeft === 1 ? "ends tomorrow" : `ends in ${daysLeft} days`;
  const date = end.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="mq-planbar" role="status">
      <p>
        <b>Your {info.plan.label} plan {when}</b> ({date}). It doesn&apos;t renew automatically, so renew to keep your longer sessions and higher limits.
      </p>
      <Link href="/pricing#plans" className="mq-planbar-cta">Renew</Link>
      <button
        type="button"
        className="mq-planbar-x"
        aria-label="Dismiss"
        onClick={() => {
          setDismissed(true);
          try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { }
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
