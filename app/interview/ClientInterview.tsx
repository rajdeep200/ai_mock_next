"use client";

import { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiX, FiMessageSquare, FiCode, FiLoader,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getPromptsForInterview, SUMMARY_PROMPT } from "@/lib/prompts";
import { decrypt, encrypt } from "@/lib/crypto";

const speak = (text: string, onEnd?: () => void) => {
  const normalizedText = text.replace(/\bO\(([^)]+)\)/g, "Big O of $1");
  const utterance = new SpeechSynthesisUtterance(normalizedText);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

type Stage = "intro" | "clarify" | "coding" | "review" | "wrapup";
const TIME_WARNINGS_S = [300, 120, 60];

const END_TOKEN_REGEX = /(?:\[|<)?\s*END[\s_\-]*INTERVIEW\s*(?:\]|>|\/>)?/i;
const containsEndToken = (text: string) => !!text && END_TOKEN_REGEX.test(text);
type ChatRole = "user" | "assistant" | "system";

const ENC_KEY = process.env.NEXT_PUBLIC_ENC_KEY!

export default function InterviewPage() {
  const [aiReply, setAiReply] = useState("");
  const [history, setHistory] = useState<{ role: ChatRole; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [userCode, setUserCode] = useState("");
  const [ended, setEnded] = useState(false);
  const endedRef = useRef(false);

  const [stage, setStage] = useState<Stage>("intro");
  const [activeView, setActiveView] = useState<"question" | "editor">("question");

  const searchParams = useSearchParams();
  const requestedDuration = parseInt(searchParams.get("duration") ?? "15", 10);

  // CHANGED: start as null so we **wait** for plan fetch before starting
  const [allowedMinutes, setAllowedMinutes] = useState<number | undefined>(undefined); // NEW
  const [planMax, setPlanMax] = useState<number | null>(null);
  const [wasClamped, setWasClamped] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);

  const endAtRef = useRef<number | undefined>(undefined);
  const lastActivityRef = useRef<number>(Date.now());
  const lastNudgeRef = useRef<number>(0);
  const warnedAtSecondsRef = useRef<Set<number>>(new Set());

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef(false);

  const lastAgentActivityRef = useRef<number>(Date.now());   // when AI last spoke
  const silenceTriggeredRef = useRef<boolean>(false);        // avoid spamming


  const { isSignedIn } = useAuth();
  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";
  const router = useRouter();

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const markActivity = () => {
    lastActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;
  };

  // const endIfToken = async (reply: string) => {
  //   if (containsEndToken(reply) && !endedRef.current) {
  //     await handleEndInterview({ auto: true });
  //     return true;
  //   }
  //   return false;
  // };

  // NEW: fetch plan and clamp duration BEFORE starting
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/plan", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setAllowedMinutes(requestedDuration); // fallback
            setPlanMax(null);
            setWasClamped(false);
          }
          return;
        }
        const data = await res.json();
        const max = Number(data?.plan?.maxMinutesPerInterview ?? requestedDuration);
        const clamped = Math.min(requestedDuration, max);
        if (!cancelled) {
          setPlanMax(max);
          setAllowedMinutes(clamped);
          setWasClamped(clamped !== requestedDuration);
        }
      } catch {
        if (!cancelled) {
          setAllowedMinutes(requestedDuration); // fallback on error
          setPlanMax(null);
          setWasClamped(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [isSignedIn, requestedDuration]);

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

  // Voice → text capture
  useEffect(() => {
    if (!transcript.trim()) return;
    window.speechSynthesis.cancel();
    const timeout = setTimeout(() => {
      const spoken = transcript.trim();
      resetTranscript();
      markActivity();
      sendMessage(spoken);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [transcript, resetTranscript]);

  const startListening = () => {
    if (endedRef.current) return;
    if (browserSupportsSpeechRecognition && micOn) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  };

  // Clean up
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
    return () => { window.removeEventListener("beforeunload", cleanUp); cleanUp(); };
  }, []);

  // CHANGED: Start interview only after allowedMinutes is known (not null)
  useEffect(() => {
    if (!isSignedIn || hasStartedRef.current || !browserSupportsSpeechRecognition) return;
    if (allowedMinutes === undefined) return; // NEW: wait for plan check

    hasStartedRef.current = true;

    endAtRef.current = Date.now() + allowedMinutes * 60 * 1000; // CHANGED
    setTimeLeft(allowedMinutes * 60);                            // CHANGED

    const startInterview = async () => {
      setLoading(true);
      const prompt = getPromptsForInterview(technology, allowedMinutes, company, level); // CHANGED
      const encPayload = await encrypt({ messages: [], systemPrompt: prompt }, ENC_KEY)
      // console.log('encPayload :: ', encPayload)
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encPayload),
      });
      const encOut = await res.json();
      const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

      const assistantMsg = { role: "assistant" as const, content: data.reply };
      setHistory([assistantMsg]);
      setAiReply(data.reply);
      lastAgentActivityRef.current = Date.now();
      silenceTriggeredRef.current = false;
      setLoading(false);

      if (containsEndToken(data.reply)) {
        await handleEndInterview({ auto: true });
        return;
      }

      markActivity();
      setStage("intro");
      setTimeout(() => speak(data.reply, () => micOn && startListening()), 400);
    };
    startInterview();
  }, [isSignedIn, browserSupportsSpeechRecognition, company, level, technology, micOn, allowedMinutes]);

  const sendMessage = async (userInput: string) => {
    if (endedRef.current) return;
    setLoading(true);
    if (/start.*code|let.?s code|i'?ll start/i.test(userInput)) setStage("coding");
    else if (/complexity|big ?o/i.test(userInput)) setStage("review");

    const userMsg = { role: "user" as const, content: userInput };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);

    const prompt = getPromptsForInterview(technology, allowedMinutes ?? requestedDuration, company, level); // CHANGED (safety)
    const encPayload = await encrypt({ messages: newHistory, systemPrompt: prompt }, ENC_KEY)
    console.log('encPayload :: ', encPayload)
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encPayload),
    });
    const encOut = await res.json();
    const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

    const assistantMsg = { role: "assistant" as const, content: data.reply };
    setHistory([...newHistory, assistantMsg]);
    setAiReply(data.reply);
    lastAgentActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;
    setLoading(false);
    setActiveView("question");

    markActivity();

    if (containsEndToken(data.reply)) {
      await handleEndInterview({ auto: true });
      return;
    }

    speak(data.reply, () => micOn && startListening());
  };

  const sendSilenceSystemEvent = async () => {
    if (endedRef.current || loading) return; // don't overlap
    try {
      const sys: { role: ChatRole; content: string } = {
        role: "system",
        content:
          "The candidate has been silent for more than 2 minutes. Briefly check in (≤1 sentence) and ask if they need a hint or have any issue."
      };

      const newHistory = [...history, sys];
      setHistory(newHistory);

      setLoading(true);
      const prompt = getPromptsForInterview(technology, allowedMinutes, company, level);
      const encPayload = await encrypt({ messages: newHistory, systemPrompt: prompt }, ENC_KEY)
      console.log('encPayload :: ', encPayload)
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encPayload),
      });
      const encOut = await res.json();
      const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

      const assistantMsg = { role: "assistant" as const, content: data.reply };
      setHistory([...newHistory, assistantMsg]);
      setAiReply(data.reply);

      // Mark AI activity + open mic again
      lastAgentActivityRef.current = Date.now();
      silenceTriggeredRef.current = true; // do not re-trigger until user/AI acts
      setLoading(false);
      speak(data.reply, () => micOn && startListening());
    } catch (e) {
      console.error("[SILENCE_EVENT_ERROR]", e);
      setLoading(false);
    }
  };


  const assistantPush = (text: string) => {
    const msg = { role: "assistant" as const, content: text };
    setHistory((h) => [...h, msg]);
    setAiReply(text);
    lastAgentActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;
    speak(text, () => micOn && startListening());
  };

  // Proactive loop + HARD STOP at 0s
  useEffect(() => {
    const tick = setInterval(() => {
      // If we haven't started, bail.
      if (endAtRef.current === undefined) return;

      const secsLeft = Math.ceil((endAtRef.current - Date.now()) / 1000);
      const safeSecsLeft = Math.max(0, secsLeft); // never negative in UI
      setTimeLeft(safeSecsLeft);

      // Single, bullet-proof stop condition
      if (secsLeft <= 0 && !endedRef.current) {
        // endedRef.current = true;              // gate re-entry immediately
        // setEnded(true);
        // No TTS here; just end + redirect
        void handleEndInterview({ auto: true });
        return;
      }

      // Time warnings (only while > 0)
      for (const warn of TIME_WARNINGS_S) {
        if (safeSecsLeft <= warn && !warnedAtSecondsRef.current.has(warn)) {
          warnedAtSecondsRef.current.add(warn);
          assistantPush(
            warn >= 120
              ? `Time check: about ${Math.round(warn / 60)} minutes left.`
              : "About 1 minute left—try to finalize your approach."
          );
        }
      }

      if (safeSecsLeft <= 30 && stage !== "wrapup") setStage("wrapup");

      // Silence detector (unchanged)
      const now = Date.now();
      const userIdle = now - lastActivityRef.current;
      const aiIdle = now - lastAgentActivityRef.current;

      if (
        userIdle >= 120_000 &&
        aiIdle >= 120_000 &&
        !silenceTriggeredRef.current &&
        !endedRef.current
      ) {
        silenceTriggeredRef.current = true;
        void sendSilenceSystemEvent();
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [stage, micOn]);


  // const makeNudge = (st: Stage): string => {
  //   switch (st) {
  //     case "intro": return "Ready when you are—give me a brief intro and we’ll jump into code.";
  //     case "clarify": return "Feel free to ask specifics—input format, constraints, or tricky edge cases.";
  //     case "coding": return "How’s it going? Want a hint, a quick test case, or to discuss complexity?";
  //     case "review": return "Let’s cover complexity and edge cases next. Ready?";
  //     case "wrapup": return "Any last questions before we wrap?";
  //     default: return "All good on your side?";
  //   }
  // };

  useEffect(() => {
    if (activeView === "editor" && stage === "clarify") setStage("coding");
    if (activeView === "editor") markActivity();
  }, [activeView, stage]);

  useEffect(() => { if (userCode) markActivity(); }, [userCode]);

  const toggleMic = () => {
    const newMicState = !micOn;
    setMicOn(newMicState);
    if (newMicState) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    } else {
      SpeechRecognition.stopListening();
    }
    markActivity();
  };

  const handleEndInterview = async (opts?: { auto?: boolean }) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);

    setEndLoading(true);
    setCameraOn(false);
    endAtRef.current = undefined;

    // Stop all audio/video immediately
    try { window.speechSynthesis.cancel(); } catch { }
    try { SpeechRecognition.stopListening(); } catch { }

    if (videoRef.current) videoRef.current.srcObject = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const sessionId = searchParams.get("sessionId");

    try {
      if (sessionId) {
        // Generate feedback
        const encPayload = await encrypt({ messages: history, systemPrompt: SUMMARY_PROMPT }, ENC_KEY)
        const resSummary = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encPayload),
        });

        let feedback = "";
        if (resSummary.ok) {
          const response = await resSummary.json();
          const { reply } = await decrypt(response, ENC_KEY);
          feedback = reply ?? "";
        }

        // Persist interview completion + feedback
        await fetch("/api/update-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, feedback }),
        });
      }
    } catch (e) {
      console.error("Error finalizing interview", e);
      // We still redirect even if saving fails.
    } finally {
      setEndLoading(false);
      // ⬇️ Redirect to HOME (change "/" if your home route differs)
      const sessionId = searchParams.get("sessionId") ?? "";
      router.replace(`/interview/feedback?sessionId=${encodeURIComponent(sessionId)}`);
    }
  };


  const handleCodeSubmit = async () => {
    if (endedRef.current) return;
    if (!userCode.trim()) return;

    setLoading(true);
    setStage("review");
    const userMsg = { role: "user" as const, content: `Here is my code:\n${userCode.trim()}` };
    const newHistory = [...history, userMsg];

    const prompt = getPromptsForInterview(technology, allowedMinutes ?? requestedDuration, company, level); // CHANGED
    const encPayload = await encrypt({ messages: newHistory, systemPrompt: prompt }, ENC_KEY)
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encPayload),
    });
    const encOut = await res.json();
    const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

    const assistantMsg = { role: "assistant" as const, content: data.reply };
    setHistory([...newHistory, assistantMsg]);
    setAiReply(data.reply);
    lastAgentActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;
    setLoading(false);
    setActiveView("question");

    markActivity();

    if (containsEndToken(data.reply)) {
      await handleEndInterview({ auto: true });
      return;
    }

    speak(data.reply, () => {
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
              <span className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700">
                ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
              <button
                onClick={() => void handleEndInterview()}
                disabled={endLoading || ended}
                className={`flex items-center gap-2 text-sm font-medium transition-colors
                  ${endLoading || ended ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:text-red-400 cursor-pointer"}`}
              >
                {endLoading ? <FiLoader className="animate-spin" size={18} /> : <FiX size={18} />}
                {endLoading ? " Ending…" : ended ? "Ended" : " End Interview"}
              </button>
            </div>
          </header>

          {/* NEW: block UI until plan check done */}
          {allowedMinutes === undefined ? (
            <div className="w-full max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-md p-4 text-gray-300 flex items-center gap-2">
              <FiLoader className="animate-spin" /> Preparing your interview…
            </div>
          ) : wasClamped ? (
            <div className="w-full max-w-3xl mx-auto bg-yellow-900/40 border border-yellow-700 text-yellow-200 text-sm rounded-md px-3 py-2">
              Requested duration was {requestedDuration} min, but your plan allows max {planMax} min. Adjusted to <b>{allowedMinutes} min</b>.{" "}
              <Link href="/pricing" className="underline text-yellow-300 hover:text-yellow-200">Upgrade your plan</Link> for longer sessions.
            </div>
          ) : null}

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
              <button onClick={toggleMic} disabled={ended} className={`p-3 rounded-full ${micOn ? "bg-red-600" : "bg-green-600"} hover:opacity-90 transition disabled:opacity-50`}>
                {micOn ? <FiMicOff size={20} /> : <FiMic size={20} />}
              </button>
              <button
                onClick={() => { if (!ended) { setCameraOn(!cameraOn); markActivity(); } }}
                disabled={ended}
                className={`p-3 rounded-full ${cameraOn ? "bg-red-600" : "bg-green-600"} hover:opacity-90 transition disabled:opacity-50`}
              >
                {cameraOn ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
              </button>
            </div>
            <div className="w-full max-w-xl bg-gray-900/50 border border-gray-800 p-2.5 rounded-lg text-xs text-green-300 font-mono mt-1">
              🎙️ {transcript || "..."}
            </div>
          </section>

          {/* Main Area */}
          <section className="flex-1 flex flex-col bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => { setActiveView("question"); markActivity(); }}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeView === "question" ? "bg-green-900/50 text-green-300 border-b-2 border-green-400" : "text-gray-400 hover:bg-gray-800"
                  }`}
              >
                <FiMessageSquare /> Question
              </button>
              <button
                onClick={() => { setActiveView("editor"); if (stage === "clarify") setStage("coding"); markActivity(); }}
                className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeView === "editor" ? "bg-green-900/50 text-green-300 border-b-2 border-green-400" : "text-gray-400 hover:bg-gray-800"
                  }`}
              >
                <FiCode /> Code Editor
              </button>
            </div>

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
                  <button onClick={handleCodeSubmit} disabled={ended} className="mt-4 self-end bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
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
