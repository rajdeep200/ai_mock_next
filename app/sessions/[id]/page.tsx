// app/sessions/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

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

  // Back to history
  const goBack = () => router.push("/history");

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-black text-white p-6">
          <button
            onClick={goBack}
            className="flex items-center text-green-400 hover:text-green-300 mb-6"
          >
            <FiArrowLeft className="mr-2" /> Back to History
          </button>

          {loading ? (
            <p className="text-gray-400">Loading session…</p>
          ) : session ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Session Info */}
              <div className="bg-gray-900 border border-green-700 rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-green-300 mb-2">
                  {session.technology.toUpperCase()} &mdash; {session.level}
                </h2>
                <p className="text-gray-300 mb-1">
                  Company:{" "}
                  <span className="text-white">
                    {session.company || "General"}
                  </span>
                </p>
                <p className="text-gray-300 mb-1">
                  Duration:{" "}
                  <span className="text-white">{session.duration} min</span>
                </p>
                <p className="text-gray-300 mb-1">
                  Status:{" "}
                  <span
                    className={
                      session.status === "completed"
                        ? "text-green-400"
                        : "text-yellow-400"
                    }
                  >
                    {session.status.charAt(0).toUpperCase() +
                      session.status.slice(1)}
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Started at: {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Summary */}
              {session.summary && (
                <div className="bg-gray-900 border border-green-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-green-300 mb-2">
                    Interview Summary
                  </h3>
                  <p className="text-gray-200 whitespace-pre-line">
                    {session.summary}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {session.feedback && (
                <div className="bg-gray-900 border border-green-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-green-300 mb-2">
                    AI Feedback
                  </h3>
                  <p className="text-gray-200 whitespace-pre-line">
                    {session.feedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-500">
              Session not found or you don’t have access.
            </p>
          )}
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-black text-white">
          <div className="text-center space-y-4">
            <p>Please sign in to view session details.</p>
            <SignInButton>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
