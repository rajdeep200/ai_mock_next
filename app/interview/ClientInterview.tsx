"use client";

import { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiX,
  FiMessageSquare,
  FiCode,
  FiLoader,
} from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { getPromptsForInterview, SUMMARY_PROMPT } from "@/lib/prompts";

// CHANGED: keep TTS helper, but we’ll also use it for proactive nudges
const speak = (text: string, onEnd?: () => void) => {
  const normalizedText = text.replace(/\bO\(([^)]+)\)/g, "Big O of $1");
  const utterance = new SpeechSynthesisUtterance(normalizedText);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.cancel(); // NEW: interrupt current speech before starting another
  window.speechSynthesis.speak(utterance);
};

// NEW: stage machine + timing constants
type Stage = "intro" | "clarify" | "coding" | "review" | "wrapup";

const NUDGE_THRESHOLDS_MS: Record<Stage, number> = {
  intro: 15000,     // 15s of silence → nudge intro
  clarify: 20000,   // 20s → nudge to ask constraints/IO/edges
  coding: 60000,    // 60s → “need a hint / progress check?”
  review: 20000,    // 20s → “let’s talk complexity/edges”
  wrapup: 15000,    // 15s → “any questions before we close?”
};

const NUDGE_COOLDOWN_MS = 30000;       // NEW: don’t spam nudges
const TIME_WARNINGS_S = [300, 120, 60]; // NEW: 5m, 2m, 1m remaining

export default function InterviewPage() {
  const [aiReply, setAiReply] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [userCode, setUserCode] = useState("");

  // NEW: stage + time tracking
  const [stage, setStage] = useState<Stage>("intro");
  const [activeView, setActiveView] = useState<"question" | "editor">("question");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const endAtRef = useRef<number | null>(null);        // NEW
  const lastActivityRef = useRef<number>(Date.now());  // NEW
  const lastNudgeRef = useRef<number>(0);              // NEW
  const warnedAtSecondsRef = useRef<Set<number>>(new Set()); // NEW: which warnings have fired

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef(false);

  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();

  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";
  const duration = parseInt(searchParams.get("duration") ?? "15", 10); // minutes
  const router = useRouter();

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // NEW: helper to mark user activity (typing, speaking, clicks)
  const markActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Camera lifecycle
  useEffect(() => {
    if (!cameraOn) {
      if (videoRef.current) videoRef.current.srcObject = null;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, [cameraOn]);

  // Voice → text capture loop
  useEffect(() => {
    if (!transcript.trim()) return;
    window.speechSynthesis.cancel(); // stop TTS if the user talks
    const timeout = setTimeout(() => {
      const spoken = transcript.trim();
      resetTranscript();
      markActivity();                         // NEW
      sendMessage(spoken);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [transcript, resetTranscript]);

  const startListening = () => {
    if (browserSupportsSpeechRecognition && micOn) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  };

  // Clean up on unload
  useEffect(() => {
    const cleanUp = () => {
      window.speechSynthesis.cancel();
      SpeechRecognition.stopListening();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
    window.addEventListener("beforeunload", cleanUp);
    return () => {
      window.removeEventListener("beforeunload", cleanUp);
      cleanUp();
    };
  }, []);

  // Start of interview (first AI turn), set timers
  useEffect(() => {
    if (!isSignedIn || hasStartedRef.current || !browserSupportsSpeechRecognition) return;
    hasStartedRef.current = true;

    // NEW: initialize timer window for the whole interview
    endAtRef.current = Date.now() + duration * 60 * 1000;
    setTimeLeft(duration * 60);

    const startInterview = async () => {
      setLoading(true);
      const prompt = getPromptsForInterview(technology, duration, company, level);
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], systemPrompt: prompt }),
      });
      const data = await res.json();

      const assistantMsg = { role: "assistant" as const, content: data.reply };
      setHistory([assistantMsg]);
      setAiReply(data.reply);
      setLoading(false);

      markActivity(); // NEW
      setStage("intro"); // NEW
      setTimeout(() => speak(data.reply, () => micOn && startListening()), 400);
    };
    startInterview();
  }, [isSignedIn, browserSupportsSpeechRecognition, company, duration, level, technology, micOn]);

  // CHANGED: Standard message send
  const sendMessage = async (userInput: string) => {
    setLoading(true);
    // NEW: stage heuristics from user text (very lightweight, optional)
    if (/start.*code|let.?s code|i'?ll start/i.test(userInput)) {
      setStage("coding");
    } else if (/complexity|big ?o/i.test(userInput)) {
      setStage("review");
    }

    const userMsg = { role: "user" as const, content: userInput };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);

    const prompt = getPromptsForInterview(technology, duration, company, level);
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newHistory, systemPrompt: prompt }),
    });
    const data = await res.json();

    const assistantMsg = { role: "assistant" as const, content: data.reply };
    setHistory([...newHistory, assistantMsg]);
    setAiReply(data.reply);
    setLoading(false);
    setActiveView("question");

    markActivity(); // NEW
    speak(data.reply, () => micOn && startListening());
  };

  // NEW: assistant push (no LLM call) for short nudges/time checks
  const assistantPush = (text: string) => {
    const msg = { role: "assistant" as const, content: text };
    setHistory((h) => [...h, msg]);
    setAiReply(text);
    speak(text, () => micOn && startListening());
  };

  // NEW: choose a short, human nudge based on stage
  const makeNudge = (st: Stage): string => {
    switch (st) {
      case "intro":
        return "Ready when you are—give me a brief intro and we’ll jump into code.";
      case "clarify":
        return "Feel free to ask specifics—input format, constraints, or tricky edge cases.";
      case "coding":
        return "How’s it going? Want a hint, a quick test case, or to discuss complexity?";
      case "review":
        return "Let’s cover complexity and edge cases next. Ready?";
      case "wrapup":
        return "Any last questions before we wrap?";
      default:
        return "All good on your side?";
    }
  };

  // NEW: proactive nudging loop (silence → nudge)
  useEffect(() => {
    const tick = setInterval(() => {
      if (!endAtRef.current) return;

      // update countdown
      const secsLeft = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(secsLeft);

      // time warnings
      for (const warn of TIME_WARNINGS_S) {
        if (secsLeft <= warn && !warnedAtSecondsRef.current.has(warn)) {
          warnedAtSecondsRef.current.add(warn);
          assistantPush(
            warn >= 120 ? `Time check: about ${Math.round(warn / 60)} minutes left.` : "About 1 minute left—try to finalize your approach."
          );
        }
      }

      // near the end, move to wrapup if not already
      if (secsLeft <= 30 && stage !== "wrapup") {
        setStage("wrapup");
      }

      // idle → nudge
      const idleFor = Date.now() - lastActivityRef.current;
      const threshold = NUDGE_THRESHOLDS_MS[stage];
      const sinceLastNudge = Date.now() - lastNudgeRef.current;

      if (idleFor >= threshold && sinceLastNudge >= NUDGE_COOLDOWN_MS) {
        lastNudgeRef.current = Date.now();
        assistantPush(makeNudge(stage));
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [stage]);

  // NEW: switch to coding stage when editor is opened
  useEffect(() => {
    if (activeView === "editor" && stage === "clarify") {
      setStage("coding");
    }
    if (activeView === "editor") markActivity();
  }, [activeView, stage]);

  // NEW: track typing as activity
  useEffect(() => {
    if (userCode) markActivity();
  }, [userCode]);

  // mic toggle
  const toggleMic = () => {
    const newMicState = !micOn;
    setMicOn(newMicState);
    if (newMicState) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    } else {
      SpeechRecognition.stopListening();
    }
    markActivity(); // NEW
  };

  // End interview
  const handleEndInterview = async () => {
    setEndLoading(true);
    setCameraOn(false);
    window.speechSynthesis.cancel();
    SpeechRecognition.stopListening();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const sessionId = searchParams.get("sessionId");
    if (sessionId) {
      try {
        const resSummary = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: SUMMARY_PROMPT,
            messages: history,
          }),
        });
        const { reply: feedback } = await resSummary.json();

        await fetch("/api/update-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, feedback }),
        });
      } catch (e) {
        console.error("Error sending final feedback", e);
      } finally {
        setEndLoading(false);
      }
    }
    router.push("/start-interview");
  };

  // Code submit → move to review and ask follow-ups
  const handleCodeSubmit = async () => {
    if (!userCode.trim()) return;

    setLoading(true);
    setStage("review"); // NEW
    const userMsg = { role: "user" as const, content: `Here is my code:\n${userCode.trim()}` };
    const newHistory = [...history, userMsg];

    const prompt = getPromptsForInterview(technology, duration, company, level);
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newHistory, systemPrompt: prompt }),
    });
    const data = await res.json();

    const assistantMsg = { role: "assistant" as const, content: data.reply };
    setHistory([...newHistory, assistantMsg]);
    setAiReply(data.reply);
    setLoading(false);
    setActiveView("question");

    markActivity(); // NEW
    speak(data.reply, () => {
      // NEW: after initial feedback, proactively follow up like a real interviewer
      setTimeout(() => {
        assistantPush("Walk me through the time and space complexity, and any edge cases you tested.");
      }, 1200);
      startListening();
    });
  };

  return (
    <>
      <SignedIn>
        <main className="min-h-screen bg-black text-white flex flex-col p-4 gap-4">
          <header className="flex justify-between items-center w-full">
            <h1 className="text-lg sm:text-xl font-semibold text-green-400">Mock Interview</h1>
            <div className="flex items-center gap-4">
              {/* NEW: tiny time-left badge */}
              <span className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700">
                ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
              <button
                onClick={handleEndInterview}
                disabled={endLoading}
                className={`flex items-center gap-2 text-sm font-medium transition-colors
                  ${endLoading ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:text-red-400 cursor-pointer"}`}
              >
                {endLoading ? <FiLoader className="animate-spin" size={18} /> : <FiX size={18} />}
                {endLoading ? " Ending…" : " End Interview"}
              </button>
            </div>
          </header>

          {/* Video Feed and Controls */}
          <section className="flex flex-col items-center justify-center gap-3">
            <div className="w-full max-w-xl aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 shadow-lg relative">
              {cameraOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 flex-col gap-2">
                  <FiVideoOff size={40} />
                  <span>Camera Off</span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? "bg-red-600" : "bg-green-600"} hover:opacity-90 transition`}>
                {micOn ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>
              <button onClick={() => { setCameraOn(!cameraOn); markActivity(); }} className={`p-3 rounded-full ${cameraOn ? "bg-red-600" : "bg-green-600"} hover:opacity-90 transition`}>
                {cameraOn ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
              </button>
            </div>
            <div className="w-full max-w-xl bg-gray-900/50 border border-gray-800 p-2.5 rounded-lg text-xs text-green-300 font-mono mt-1">
              🎙️ {transcript || "..."}
            </div>
          </section>

          {/* Main Workspace Area */}
          <section className="flex-1 flex flex-col bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => { setActiveView("question"); markActivity(); }}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  activeView === "question" ? "bg-green-900/50 text-green-300 border-b-2 border-green-400" : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <FiMessageSquare /> Question
              </button>
              <button
                onClick={() => { setActiveView("editor"); if (stage === "clarify") setStage("coding"); markActivity(); }}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  activeView === "editor" ? "bg-green-900/50 text-green-300 border-b-2 border-green-400" : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <FiCode /> Code Editor
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {activeView === "question" && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FiLoader className="animate-spin" size={24} />
                      <span>AI is thinking...</span>
                    </div>
                  ) : (
                    <p className="text-lg sm:text-xl text-green-200 leading-relaxed max-w-3xl">{aiReply}</p>
                  )}
                </div>
              )}
              {activeView === "editor" && (
                <div className="flex flex-col h-full">
                  <textarea
                    placeholder="// Your code goes here..."
                    className="flex-1 w-full bg-black/50 border border-gray-700 rounded-md p-4 font-mono text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none transition"
                    style={{ minHeight: "250px" }}
                    value={userCode}
                    onChange={(e) => { setUserCode(e.target.value); markActivity(); }}
                  />
                  <button onClick={handleCodeSubmit} className="mt-4 self-end bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Submit Code
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-black text-white flex-col gap-4">
          <p>You need to sign in to access the interview.</p>
          <SignInButton />
        </div>
      </SignedOut>
    </>
  );
}
