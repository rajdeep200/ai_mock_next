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
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[260px] rounded-xl border border-gray-800 bg-black/40 text-gray-400">
      Loading editor…
    </div>
  ),
});

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

  // [TTS] audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

   const monacoEditorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);

  // [SYNC] small in-memory cache: text -> objectURL (to avoid re-fetch on re-renders)
  const ttsCache = useRef<Map<string, string>>(new Map());

  const { isSignedIn } = useAuth();
  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";
  const router = useRouter();

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const cancelTTS = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    } catch { }
  };

  // [SYNC][TTS] prepare TTS first (returns object URL) so UI and audio are in sync
  const prepareTTS = async (text: string): Promise<string | null> => {
    const normalized = text.replace(/\bO\(([^)]+)\)/g, "Big O of $1"); // keep your normalization
    if (ttsCache.current.has(normalized)) return ttsCache.current.get(normalized)!;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: normalized, voiceId: "Raveena", engine: "neural", rate: "medium" }),
      });
      if (!res.ok) return null;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      ttsCache.current.set(normalized, url);
      return url;
    } catch {
      return null;
    }
  };

  // [TTS] play a prepared URL
  const playTTS = async (url: string, onEnd?: () => void) => {
    cancelTTS();
    objectUrlRef.current = url;
    audioRef.current = new Audio(url);
    audioRef.current.onended = () => { onEnd?.(); };
    audioRef.current.onerror = () => { onEnd?.(); };
    try {
      await audioRef.current.play();
    } catch {
      onEnd?.(); // autoplay blocked; keep flow going
    }
  };

  const language = (() => {
    // very simple mapping based on your query param
    const tech = (technology || "").toLowerCase();
    if (tech.includes("python")) return "python";
    if (tech.includes("java")) return "java";
    if (tech.includes("c++") || tech.includes("cpp")) return "cpp";
    if (tech.includes("go")) return "go";
    if (tech.includes("ts")) return "typescript";
    return "javascript";
  })();

  const markActivity = () => {
    lastActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;
  };

  const handleEditorMount = (
    editor: import("monaco-editor").editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) => {
    monacoEditorRef.current = editor;

    // Theme is already dark by default, but you can force:
    // monaco.editor.setTheme("vs-dark");

    // Cmd/Ctrl + Enter => submit
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!ended) handleCodeSubmit();
    });
  };

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
    cancelTTS(); // [TTS] stop TTS when user speaks
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
      cancelTTS(); // [TTS]
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
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encPayload),
      });
      const encOut = await res.json();
      const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

      // [SYNC] prepare TTS BEFORE rendering text
      const preparedUrl = await prepareTTS(data.reply);

      const assistantMsg = { role: "assistant" as const, content: data.reply };
      setHistory([assistantMsg]);
      setAiReply(data.reply); // render after we have audio ready
      lastAgentActivityRef.current = Date.now();
      silenceTriggeredRef.current = false;
      setLoading(false);

      if (containsEndToken(data.reply)) {
        await handleEndInterview({ auto: true });
        return;
      }

      markActivity();
      setStage("intro");

      // [SYNC] play immediately on next frame so UI & audio feel simultaneous
      requestAnimationFrame(() => {
        if (preparedUrl) {
          void playTTS(preparedUrl, () => micOn && startListening());
        } else {
          if (micOn) startListening();
        }
      });
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
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encPayload),
    });
    const encOut = await res.json();
    const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

    // [SYNC] prepare audio before showing text
    const preparedUrl = await prepareTTS(data.reply);

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

    requestAnimationFrame(() => {
      if (preparedUrl) {
        void playTTS(preparedUrl, () => micOn && startListening());
      } else {
        if (micOn) startListening();
      }
    });
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
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encPayload),
      });
      const encOut = await res.json();
      const data = await decrypt<{ reply: string }>(encOut, ENC_KEY);

      // [SYNC] prepare audio before rendering text
      const preparedUrl = await prepareTTS(data.reply);

      const assistantMsg = { role: "assistant" as const, content: data.reply };
      setHistory([...newHistory, assistantMsg]);
      setAiReply(data.reply);

      // Mark AI activity + open mic again
      lastAgentActivityRef.current = Date.now();
      silenceTriggeredRef.current = true; // do not re-trigger until user/AI acts
      setLoading(false);

      requestAnimationFrame(() => {
        if (preparedUrl) {
          void playTTS(preparedUrl, () => micOn && startListening());
        } else {
          if (micOn) startListening();
        }
      });
    } catch (e) {
      console.error("[SILENCE_EVENT_ERROR]", e);
      setLoading(false);
    }
  };

  // [SYNC] make async so we can await TTS prep
  const assistantPush = async (text: string) => {
    const msg = { role: "assistant" as const, content: text };
    setHistory((h) => [...h, msg]);
    setAiReply(text);
    lastAgentActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;

    const url = await prepareTTS(text); // [SYNC]
    requestAnimationFrame(() => {
      if (url) {
        void playTTS(url, () => micOn && startListening());
      } else {
        if (micOn) startListening();
      }
    });
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
        void handleEndInterview({ auto: true });
        return;
      }

      // Time warnings (only while > 0)
      for (const warn of TIME_WARNINGS_S) {
        if (safeSecsLeft <= warn && !warnedAtSecondsRef.current.has(warn)) {
          warnedAtSecondsRef.current.add(warn);
          void assistantPush(
            warn >= 120
              ? `Time check: about ${Math.round(warn / 60)} minutes left.`
              : "About 1 minute left—try to finalize your approach."
          ); // [SYNC] now async, but we don't need to await
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
    cancelTTS(); // [TTS]
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

        let modelPrepPercent: number | undefined
        const m = feedback.match(/Preparation Percentage:\s*(\d{1,3})%/i)
        if (m) {
          const n = Math.min(100, Math.max(0, parseInt(m[1], 10)));
          if (!Number.isNaN(n)) modelPrepPercent = n;
        } else {
          const na = /Preparation Percentage:\s*N\/A/i.test(feedback);
          if (na) {
            modelPrepPercent = undefined; // store null/undefined in DB
          } else {
            // fallback: if header malformed, don't store a number
            modelPrepPercent = undefined;
          }
        }

        // Persist interview completion + feedback
        const encPayloadSummary = await encrypt({ sessionId, feedback, ...(typeof modelPrepPercent === 'number' ? { modelPreparationPercent: modelPrepPercent } : {}) }, ENC_KEY)
        await fetch("/api/update-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encPayloadSummary),
        });
      }
    } catch (e) {
      console.error("Error finalizing interview", e);
      // We still redirect even if saving fails.
    } finally {
      setEndLoading(false);
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

    // [SYNC] prepare audio first
    const preparedUrl = await prepareTTS(data.reply);

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

    // [SYNC] play then queue your follow-up nudge
    requestAnimationFrame(() => {
      if (preparedUrl) {
        void playTTS(preparedUrl, async () => {
          // setTimeout(() => {
          //   void assistantPush("Walk me through the time and space complexity, and any edge cases you tested.");
          // }, 1200);
          startListening();
        });
      } else {
        // setTimeout(() => {
        //   void assistantPush("Walk me through the time and space complexity, and any edge cases you tested.");
        // }, 1200);
        startListening();
      }
    });
  };

  return (
    <>
      <SignedIn>
        <main className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
          {/* ---- Ambient FX (particles + scanlines + grid) ---- */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* particles */}
            <div className="absolute inset-0">
              <div className="animate-float-slow absolute top-[-40px] left-[10%] h-72 w-72 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="animate-float-medium absolute bottom-[-60px] right-[5%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="animate-float-fast absolute top-[30%] right-[30%] h-40 w-40 rounded-full bg-green-300/10 blur-2xl" />
            </div>
            {/* scanlines */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[length:100%_3px]" />
            {/* grid */}
            <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(50%_70%_at_50%_60%,black,transparent)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,rgba(31,41,55,.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(31,41,55,.5)_1px,transparent_1px)] bg-[size:48px_48px]" />
            </div>
          </div>

          {/* ---- Header ---- */}
          <header className="relative z-10 w-full px-4 sm:px-6 py-3 border-b border-gray-800/70 backdrop-blur bg-black/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Title */}
              <div className="relative">
                <h1 className="text-base sm:text-lg font-semibold tracking-wide">
                  <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-200 bg-clip-text text-transparent">
                    Mock Interview
                  </span>
                </h1>
                <span className="absolute -bottom-1 left-0 h-[2px] w-20 bg-gradient-to-r from-emerald-500 to-transparent" />
              </div>

              {/* Controls: timer + end */}
              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                {/* Timer pill */}
                <span
                  className="whitespace-nowrap inline-flex items-center gap-2 text-[11px] sm:text-xs px-2.5 py-1 rounded-full
                   border border-emerald-500/40 bg-gray-900/70 ring-1 ring-emerald-500/20
                   shadow-[0_0_12px_rgba(16,185,129,.22)]"
                  title="Remaining time"
                >
                  <span className="hidden sm:block text-gray-300">Time</span>
                  <span className="block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {`⏱ ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
                </span>

                {/* End button */}
                <button
                  onClick={() => void handleEndInterview()}
                  disabled={endLoading || ended}
                  className={`cursor-pointer whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] sm:text-sm font-medium
                    transition shadow-[0_0_14px_rgba(239,68,68,.18)]
                    ${endLoading || ended
                      ? "cursor-not-allowed border border-gray-700/70 bg-gray-900/60 text-gray-400"
                      : "border border-red-500/30 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white"
                    }`}
                  aria-label="End Interview"
                >
                  {endLoading ? (
                    <FiLoader className="animate-spin" size={16} />
                  ) : (
                    <FiX size={16} />
                  )}
                  {/* Keep label hidden on very small screens to avoid wrapping */}
                  <span className="hidden xs:inline">
                    {endLoading ? "Ending…" : ended ? "Ended" : "End Interview"}
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* ---- Notices ---- */}
          <div className="relative z-10 px-4 sm:px-6 pt-3">
            {allowedMinutes === undefined ? (
              <div className="w-full max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-gray-300 flex items-center gap-2 backdrop-blur">
                <FiLoader className="animate-spin" /> Preparing your interview…
              </div>
            ) : wasClamped ? (
              <div className="w-full max-w-3xl mx-auto bg-yellow-900/35 border border-yellow-700/70 text-yellow-200 text-sm rounded-xl px-3 py-2 backdrop-blur">
                Requested duration was {requestedDuration}m, but your plan allows max {planMax}m.
                Adjusted to <b>{allowedMinutes}m</b>.{" "}
                <Link href="/pricing" className="underline text-yellow-300 hover:text-yellow-50">
                  Upgrade your plan
                </Link>{" "}
                for longer sessions.
              </div>
            ) : null}
          </div>

          {/* ---- Main ---- */}
          <section className="relative z-10 flex-1 px-4 sm:px-6 py-5">
            <div className="mx-auto grid w-full gap-6 lg:gap-7 lg:grid-cols-2">
              {/* LEFT: Camera + Controls + Transcript */}
              <div className="flex flex-col gap-4">
                {/* Holographic panel */}
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="hologram-border pointer-events-none absolute -inset-[1px] rounded-2xl" />
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-emerald-500/25 bg-gray-950/70 backdrop-blur shadow-[0_0_30px_rgba(16,185,129,.18)] ring-1 ring-emerald-500/10">
                    {cameraOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-900/70 flex items-center justify-center text-gray-400 flex-col gap-2">
                        <FiVideoOff size={42} />
                        <span>Camera Off</span>
                      </div>
                    )}
                    {/* subtle scan overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(16,185,129,.08)_50%,transparent_100%)] animate-scan" />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMic}
                    disabled={ended}
                    className={`h-12 w-12 rounded-xl grid place-items-center transition
                              border border-white/10 shadow-[0_0_20px_rgba(255,255,255,.06)]
                              ${micOn
                        ? "bg-red-600/90 hover:bg-red-600 ring-2 ring-red-400/30"
                        : "bg-emerald-600/90 hover:bg-emerald-600 ring-2 ring-emerald-400/30"
                      } disabled:opacity-50`}
                    title={micOn ? "Mute mic" : "Unmute mic"}
                  >
                    {micOn ? <FiMicOff size={20} /> : <FiMic size={20} />}
                  </button>

                  <button
                    onClick={() => {
                      if (!ended) {
                        setCameraOn(!cameraOn);
                        markActivity();
                      }
                    }}
                    disabled={ended}
                    className={`h-12 w-12 rounded-xl grid place-items-center transition
                              border border-white/10 shadow-[0_0_20px_rgba(255,255,255,.06)]
                              ${cameraOn
                        ? "bg-red-600/90 hover:bg-red-600 ring-2 ring-red-400/30"
                        : "bg-emerald-600/90 hover:bg-emerald-600 ring-2 ring-emerald-400/30"
                      } disabled:opacity-50`}
                    title={cameraOn ? "Turn camera off" : "Turn camera on"}
                  >
                    {cameraOn ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                  </button>

                  <div className="ml-auto inline-flex items-center gap-2 text-[11px] sm:text-xs px-2.5 py-1 rounded-full border border-gray-700 bg-gray-900/60 text-emerald-300">
                    <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </div>
                </div>

                {/* Transcript */}
                <div className="w-full bg-gray-900/60 border border-gray-800 p-3 rounded-xl text-[12px] text-emerald-300 font-mono mt-1 backdrop-blur">
                  <span className="opacity-70 mr-1">🎙️</span> {transcript || "…"}
                </div>
              </div>

              {/* RIGHT: Q/A + Editor */}
              <div className="flex flex-col rounded-2xl border border-emerald-500/25 bg-gray-950/70 backdrop-blur shadow-[0_0_28px_rgba(16,185,129,.15)] ring-1 ring-emerald-500/10 overflow-hidden">
                {/* Tabs w/ neon indicator */}
                <div className="relative flex border-b border-gray-800">
                  <button
                    onClick={() => {
                      setActiveView("question");
                      markActivity();
                    }}
                    className={`cursor-pointer flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all
                              ${activeView === "question"
                        ? "text-emerald-300"
                        : "text-gray-400 hover:text-gray-100"}`}
                  >
                    <span
                      className={`absolute inset-x-0 bottom-0 h-[3px] transition-all ${activeView === "question" ? "bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400" : "bg-transparent"
                        }`}
                    />
                    <FiMessageSquare /> Question
                  </button>
                  <button
                    onClick={() => {
                      setActiveView("editor");
                      if (stage === "clarify") setStage("coding");
                      markActivity();
                    }}
                    className={`cursor-pointer flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-all
                              ${activeView === "editor"
                        ? "text-emerald-300"
                        : "text-gray-400 hover:text-gray-100"}`}
                  >
                    <span
                      className={`absolute inset-x-0 bottom-0 h-[3px] transition-all ${activeView === "editor" ? "bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400" : "bg-transparent"
                        }`}
                    />
                    <FiCode /> Code Editor
                  </button>
                </div>

                {/* Panel */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                  {activeView === "question" && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      {loading ? (
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="relative">
                            <FiLoader className="animate-spin text-emerald-400" size={28} />
                            <span className="absolute inset-0 blur-sm opacity-40 text-emerald-400">
                              <FiLoader className="animate-spin" size={28} />
                            </span>
                          </div>
                          <span>AI is thinking…</span>
                        </div>
                      ) : (
                        <p className="text-lg sm:text-xl text-emerald-200/90 leading-relaxed max-w-3xl">
                          {aiReply}
                        </p>
                      )}
                    </div>
                  )}

                  {activeView === "editor" && (
                    <div className="flex flex-col h-full">
                      <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black/40">
                        <MonacoEditor
                          height="320px"                     // [MONACO] choose a stable height
                          language={language}                 // [MONACO] auto from `technology`
                          theme="vs-dark"
                          value={userCode}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontLigatures: true,
                            smoothScrolling: true,
                            scrollBeyondLastLine: false,
                            renderWhitespace: "selection",
                            automaticLayout: true,           // [MONACO] respond to container resize
                            lineNumbers: "on",
                            wordWrap: "on",
                            tabSize: 2,
                          }}
                          onMount={handleEditorMount}         // [MONACO] add Cmd/Ctrl+Enter
                          onChange={(val) => {
                            setUserCode(val ?? "");
                            markActivity();
                          }}
                        />
                      </div>
                      <button
                        onClick={handleCodeSubmit}
                        disabled={ended}
                        className="cursor-pointer mt-4 self-end inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                                 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500
                                 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-400
                                 font-semibold text-white transition disabled:opacity-50"
                      >
                        Submit Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
