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
          // already sorted on the server, but you can resort here if needed
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
        <main className="min-h-screen bg-black text-white p-6">
          <h1 className="text-3xl font-semibold text-green-400 mb-6">
            Your Interview History
          </h1>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <FiLoader className="animate-spin text-green-500" size={28} />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500">
              No past interviews found.{" "}
              <a
                className="text-green-400 underline"
                onClick={() => router.push("/start-interview")}
              >
                Start your first DSA mock interview.
              </a>
            </p>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </main>
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-black text-white">
          <div className="text-center space-y-4">
            <p>Please sign in to view your interview history.</p>
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
