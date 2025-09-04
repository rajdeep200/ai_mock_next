// app/sessions/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiCheck,
  FiPlayCircle,
} from "react-icons/fi";

interface SessionDetail {
  id: string;
  technology: string;
  company?: string;
  level: string;
  duration: number;
  status: "active" | "completed" | string;
  createdAt: string;
  summary?: string;
  feedback?: string;
}

export default function SessionDetailsPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"summary" | "feedback" | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { session: SessionDetail };
          setSession(data.session);
        } else {
          console.error("Failed to load session");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isSignedIn, getToken]);

  const goBack = () => router.push("/history");

  const copyText = async (text: string, which: "summary" | "feedback") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1200);
    } catch { }
  };

  const StatusBadge = ({ status }: { status: SessionDetail["status"] }) => {
    const completed = status === "completed";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium 
        border backdrop-blur
        ${completed
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"}`}
      >
        {completed ? <FiCheckCircle /> : <FiAlertCircle />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <>
      <SignedIn>
        <main className="relative min-h-screen overflow-hidden bg-black text-white">
          {/* Background */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_28%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,.055),transparent_45%)]" />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_80%)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
            <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)] animate-scan" />
          </div>

          {/* Top bar */}
          <div className="relative z-10 px-4 pt-6 sm:pt-8">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 backdrop-blur transition hover:border-emerald-500/70 hover:text-emerald-200"
            >
              <FiArrowLeft />
              Back to History
            </button>
          </div>

          {/* Content */}
          <section className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:py-14">
            {loading ? (
              <div className="space-y-6">
                {/* shimmer skeletons */}
                <div className="h-24 w-full animate-pulse rounded-3xl bg-gray-900/60" />
                <div className="h-40 w-full animate-pulse rounded-3xl bg-gray-900/60" />
                <div className="h-40 w-full animate-pulse rounded-3xl bg-gray-900/60" />
              </div>
            ) : session ? (
              <div className="space-y-8">
                {/* Header card */}
                <div className="rounded-3xl border border-emerald-700/40 bg-gradient-to-br from-gray-950/80 via-gray-900/60 to-black/80 p-6 sm:p-8 shadow-[0_0_60px_rgba(34,197,94,.15)] backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                        <span className="text-emerald-400">
                          {session.technology.toUpperCase()}
                        </span>{" "}
                        • {session.level}
                      </h1>
                      <p className="mt-1 text-sm text-gray-300">
                        {session.company ? `Company: ${session.company}` : "General practice"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={session.status} />
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-3 py-1 text-xs text-gray-300">
                        <FiClock className="text-emerald-300" />
                        {session.duration} min
                      </span>
                    </div>
                  </div>

                  {/* Meta chips */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Session ID</p>
                      <p className="mt-1 truncate text-sm text-gray-200">{session.id}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Started</p>
                      <p className="mt-1 text-sm text-gray-200">
                        {new Date(session.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Mode</p>
                      <p className="mt-1 text-sm text-gray-200">Voice + Chat</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {session.summary && (
                  <div className="rounded-3xl border border-emerald-700/40 bg-gray-900/60 p-6 sm:p-7 backdrop-blur hover:border-emerald-600/60 transition">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-emerald-300">Interview Summary</h2>
                      <button
                        onClick={() => copyText(session.summary || "", "summary")}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-black/40 px-3 py-1.5 text-xs text-gray-200 hover:border-emerald-600 hover:text-emerald-200"
                      >
                        {copied === "summary" ? <FiCheck /> : <FiCopy />} {copied === "summary" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="whitespace-pre-line text-gray-100 leading-relaxed">
                      {session.summary}
                    </p>
                  </div>
                )}

                {/* Feedback */}
                {session.feedback && (
                  <div className="rounded-3xl border border-emerald-700/40 bg-gray-900/60 p-6 sm:p-7 backdrop-blur hover:border-emerald-600/60 transition">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold text-emerald-300">AI Feedback</h2>
                      <button
                        onClick={() => copyText(session.feedback || "", "feedback")}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-black/40 px-3 py-1.5 text-xs text-gray-200 hover:border-emerald-600 hover:text-emerald-200"
                      >
                        {copied === "feedback" ? <FiCheck /> : <FiCopy />} {copied === "feedback" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="whitespace-pre-line text-gray-100 leading-relaxed">
                      {session.feedback}
                    </p>
                  </div>
                )}

                {/* CTA Row */}
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => router.push("/start-interview")}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-700/50 bg-emerald-600 px-5 py-3 font-semibold text-white shadow-[0_0_24px_rgba(34,197,94,.15)] transition hover:bg-emerald-500"
                  >
                    <FiPlayCircle />
                    Start New Interview
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-red-600/40 bg-red-500/10 p-6 text-center text-red-200">
                Session not found or you don’t have access.
              </div>
            )}
          </section>

          {/* Local animations */}
          <style jsx>{`
            @keyframes scan {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
            .animate-scan {
              animation: scan 12s linear infinite;
              background-size: auto 6px;
            }
          `}</style>
        </main>
      </SignedIn>

      <SignedOut>
        <div className="relative flex h-screen items-center justify-center bg-black text-white overflow-hidden">
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(34,197,94,.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,.08),transparent_50%)]" />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>
          </div>

          <div className="relative z-10 max-w-md rounded-2xl border border-emerald-700/40 bg-gray-900/70 px-6 py-8 text-center backdrop-blur shadow-xl">
            <p className="text-lg font-medium">Please sign in to view session details.</p>
            <div className="mt-5">
              <SignInButton>
                <button className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-emerald-500 hover:to-green-600">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
