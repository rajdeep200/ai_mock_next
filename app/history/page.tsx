// app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FiLoader } from "react-icons/fi";
import SessionCard from "@/component/SessionCard";

interface Session {
  id: string;
  technology: string;
  company?: string;
  level: string;
  duration: number;
  status: "active" | "completed" | string;
  createdAt: string;
}

export default function HistoryPage() {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { sessions: Session[] };
          setSessions(data.sessions);
        } else {
          console.error("Failed to load sessions");
        }
      } catch (err) {
        console.error("Could not load sessions", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  return (
    <>
      <SignedIn>
        <main className="relative min-h-screen bg-black text-white overflow-hidden">
          {/* Background: neon glow grid */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,.08),transparent_45%),radial-gradient(circle_at_80%_25%,rgba(34,197,94,.06),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,.055),transparent_45%)]" />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_80%)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.55)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.55)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,.7))]" />
            <div className="absolute inset-0 opacity-[.12] mix-blend-soft-light bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,.06)_3px,rgba(255,255,255,.06)_3px)] animate-scan" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 py-16">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-green-400 mb-10 tracking-tight text-center">
              📜 Your Interview History
            </h1>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <FiLoader className="animate-spin text-green-500" size={32} />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-gray-400 text-center">
                No past interviews found.{" "}
                <button
                  onClick={() => router.push("/start-interview")}
                  className="text-green-400 underline hover:text-green-300"
                >
                  Start your first DSA mock interview.
                </button>
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-green-700/40 bg-gray-900/60 p-4 backdrop-blur shadow-lg hover:border-green-500/70 hover:shadow-green-500/20 transition"
                  >
                    <SessionCard session={session} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local animations */}
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
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-black text-white relative overflow-hidden">
          {/* Futuristic background */}
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(34,197,94,.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,.08),transparent_50%)]" />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>
          </div>

          <div className="relative z-10 text-center space-y-6 max-w-md px-4 py-8 rounded-2xl bg-gray-900/70 border border-green-700/40 backdrop-blur shadow-xl">
            <p className="text-lg font-medium">
              Please sign in to view your interview history.
            </p>
            <SignInButton>
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-500 hover:to-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/20 transition">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
