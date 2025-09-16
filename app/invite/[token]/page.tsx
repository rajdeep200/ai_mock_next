// app/invite/[token]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    useAuth,
    useUser,
} from "@clerk/nextjs";
import { FiGift, FiLoader, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

type UiState =
    | { kind: "idle" }
    | { kind: "redeeming" }
    | { kind: "success"; planRenewsAt?: string; amount?: number }
    | { kind: "error"; code?: string; message: string };

export default function InvitePage() {
    const { token } = useParams<{ token: string }>(); // ← read the invite token from the URL
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { user } = useUser();

    const [ui, setUi] = useState<UiState>({ kind: "idle" });

    // 🔒 Basic client-side token guard (still validated securely on server)
    const trimmedToken = useMemo(() => (typeof token === "string" ? token.trim() : ""), [token]);
    const tokenLooksOk = trimmedToken.length >= 10;

    // 👉 Call server to redeem the invite for the CURRENT signed-in user.
    const redeem = async () => {
        if (!tokenLooksOk) {
            setUi({ kind: "error", message: "Invalid invite link." });
            return;
        }
        try {
            setUi({ kind: "redeeming" });
            const res = await fetch("/api/invites/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: trimmedToken }), // ← server uses the new Invite schema’s findUsableByToken
                cache: "no-store",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                // Normalize server error shape
                const message =
                    data?.message ||
                    (data?.error === "INVALID_INVITE"
                        ? "Invite not found or expired."
                        : data?.error === "ALREADY_REDEEMED"
                            ? "This invite has no remaining redemptions."
                            : data?.error === "NOT_ELIGIBLE"
                                ? "This invite is for new users only."
                                : "Could not redeem this invite.");
                setUi({ kind: "error", code: data?.error, message });
                return;
            }

            // ✅ Success shape from the handler you implemented
            setUi({
                kind: "success",
                planRenewsAt: data?.applied?.planRenewsAt,
                amount: data?.applied?.benefit?.amount,
            });

            // Optional: small delay then send them to home or start page
            setTimeout(() => {
                router.replace("/home");
            }, 1200);
        } catch (e) {
            setUi({
                kind: "error",
                message: "Network error while redeeming invite. Please try again.",
            });
        }
    };

    // 🧭 If user opens invite while signed out, show sign-in that bounces back here.
    //     No auto-redeem on mount. Require an explicit “Redeem” click for clarity.
    //     (If you prefer auto-redeem on mount when signed in, call redeem() in a useEffect.)

    return (
        <main className="relative min-h-screen bg-black text-white">
            {/* Subtle background like other pages */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,.05),transparent_45%)]" />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]">
                    <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
            </div>

            <section className="relative z-10 mx-auto max-w-xl px-6 pt-20 pb-10">
                {/* Back to home (internal linking) */}
                <Link
                    href="/"
                    className="text-sm text-emerald-300 hover:text-emerald-200 underline"
                >
                    ← Back to homepage
                </Link>

                <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur">
                    <div className="flex items-center gap-2 text-emerald-300">
                        <FiGift />
                        <h1 className="text-xl font-semibold">
                            Redeem your MockQube invite
                        </h1>
                    </div>

                    {/* Token preview (client-side only) */}
                    <p className="mt-2 text-sm text-gray-400">
                        Invite token:{" "}
                        <span className="font-mono text-gray-300">
                            {tokenLooksOk ? trimmedToken : "—"}
                        </span>
                    </p>

                    <div className="mt-6">
                        <SignedOut>
                            <div className="rounded-xl border border-gray-800 bg-black/50 p-4 text-gray-300">
                                <p className="text-sm">Please sign in to apply this invite to your account.</p>
                                <div className="mt-3">
                                    {/* ✅ Use afterSignInUrl / afterSignUpUrl (or forceRedirectUrl) */}
                                    <SignInButton
                                        mode="redirect"
                                        // ✅ these are the props your types accept
                                        forceRedirectUrl={`/invite/${encodeURIComponent(trimmedToken)}`}
                                        fallbackRedirectUrl={`/invite/${encodeURIComponent(trimmedToken)}`}
                                    >
                                        <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/15 px-4 py-2 text-emerald-200 hover:border-emerald-500/60 transition">
                                            Sign in to continue
                                        </button>
                                    </SignInButton>
                                </div>
                            </div>
                        </SignedOut>

                        <SignedIn>
                            {/* 2) Signed in → allow redeem */}
                            <div className="rounded-xl border border-emerald-700/30 bg-emerald-700/10 p-4 text-emerald-100">
                                <p className="text-sm">
                                    Signed in as{" "}
                                    <span className="font-medium text-emerald-300">
                                        {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
                                    </span>
                                </p>

                                {ui.kind === "error" && (
                                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-700/40 bg-rose-900/30 p-3 text-rose-100">
                                        <FiAlertTriangle className="mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {ui.message}
                                            </p>
                                            {ui.code && (
                                                <p className="mt-1 text-xs opacity-75">Error code: {ui.code}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {ui.kind === "success" && (
                                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-700/40 bg-emerald-900/30 p-3 text-emerald-100">
                                        <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-300" />
                                        <div>
                                            <p className="text-sm font-semibold">Invite applied!</p>
                                            <p className="mt-1 text-xs opacity-80">
                                                {ui.amount
                                                    ? `+${ui.amount} days of Pro added.`
                                                    : `Your plan has been updated.`}
                                                {ui.planRenewsAt ? ` New renewal: ${new Date(ui.planRenewsAt).toLocaleString()}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={redeem}
                                        disabled={!tokenLooksOk || ui.kind === "redeeming"}
                                        className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/20 px-4 py-2 font-medium text-white hover:border-emerald-500/60 hover:bg-emerald-600/25 transition disabled:opacity-60"
                                    >
                                        {ui.kind === "redeeming" ? (
                                            <>
                                                <FiLoader className="animate-spin" />
                                                Applying…
                                            </>
                                        ) : (
                                            <>
                                                <FiGift />
                                                Redeem invite
                                            </>
                                        )}
                                    </button>

                                    <Link
                                        href="/pricing"
                                        className="text-sm text-gray-300 underline hover:text-gray-100"
                                    >
                                        View plans
                                    </Link>
                                </div>
                            </div>
                        </SignedIn>
                    </div>

                    {/* Small print */}
                    <p className="mt-6 text-xs text-gray-500">
                        By redeeming, you agree to our{" "}
                        <Link href="/terms-of-service" className="underline hover:text-gray-300">
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline hover:text-gray-300">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </section>
        </main>
    );
}
