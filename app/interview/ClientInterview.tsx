"use client";

import { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./interview.css";
import { getPromptsForInterview, SUMMARY_PROMPT } from "@/lib/prompts";
import { decrypt, encrypt } from "@/lib/crypto";
import dynamic from "next/dynamic";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-load">Loading editor…</div>,
});

type Stage = "intro" | "clarify" | "coding" | "review" | "wrapup";
const TIME_WARNINGS_S = [300, 120, 60];

const END_TOKEN_REGEX = /(?:\[|<)?\s*END[\s_\-]*INTERVIEW\s*(?:\]|>|\/>)?/i;
const containsEndToken = (text: string) => !!text && END_TOKEN_REGEX.test(text);
type ChatRole = "user" | "assistant" | "system";
type Msg = { role: ChatRole; content: string };

// How long to wait after the last word before treating an answer as finished.
const BASE_SILENCE_MS = 3000;
const MAX_SILENCE_MS = 6000;
const HOLD_MAX_MS = 60_000;
// Endings that signal the sentence isn't finished yet.
const UNFINISHED_END = /(?:^|\s)(so|and|but|because|then|if|or|like|um+|uh+|uhm|hmm+|the|a|an|to|of|is|that|which|with|maybe|basically|actually|i think|let me|for example)[\s,.]*$/i;
const silenceWaitMs = (text: string) => {
  const t = text.trim();
  const words = t ? t.split(/\s+/).length : 0;
  let ms = BASE_SILENCE_MS;
  if (UNFINISHED_END.test(t)) ms += 2000; // mid-sentence
  if (words < 4) ms += 1000;              // people often pause after the first few words
  else if (words >= 25 && !UNFINISHED_END.test(t)) ms -= 500; // long answer that sounds done: don't drag
  return Math.min(ms, MAX_SILENCE_MS);
};

// The browser recognizer sometimes leaks sentence markers such as "</S>" into the text.
const cleanSpeech = (t: string) => t.replace(/<\/?s>/gi, " ").replace(/\s{2,}/g, " ").trim();

const TURN_TIMEOUT_MS = 30_000;
const SUMMARY_TIMEOUT_MS = 45_000;
// Saved as the feedback when the page is closed before a real summary could be generated.
const ABANDONED_FEEDBACK = "This interview ended early because the page was closed or refreshed, so no feedback was generated.";
const FEEDBACK_FAILED = "Feedback could not be generated for this session.";
const FEEDBACK_NO_ANSWERS = "No feedback was generated because the interview ended before any answers were recorded.";
// Canned time-check lines are pushed locally (not written by the model); keep them out of the summary input.
const CANNED_LINE_REGEX = /^(Time check: about \d+ minutes left\.|About 1 minute left—try to finalize your approach\.)$/;

const ENC_KEY = process.env.NEXT_PUBLIC_ENC_KEY!

export default function InterviewPage() {
  const [aiReply, setAiReply] = useState("");
  // Source of truth for the transcript. A ref (not state) so timers and async callbacks never read a stale copy.
  const historyRef = useRef<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [userCode, setUserCode] = useState("");
  const [ended, setEnded] = useState(false);
  const [speaking, setSpeaking] = useState(false); // true while the interviewer's TTS audio is playing
  const endedRef = useRef(false);

  const [stage, setStage] = useState<Stage>("intro");
  const [activeView, setActiveView] = useState<"question" | "editor">("question");

  const searchParams = useSearchParams();
  const requestedDuration = parseInt(searchParams.get("duration") ?? "15", 10);
  const sessionId = searchParams.get("sessionId") ?? "";
  const histKey = `iv:${sessionId}`;
  const endedFlagKey = `iv:${sessionId}:ended`;
  const [guardDone, setGuardDone] = useState(false); // true once we know this session is still live
  const [turnError, setTurnError] = useState(false);
  const retryRef = useRef<(() => void) | null>(null);
  const abandonBeaconRef = useRef<Blob | null>(null);
  const savedRef = useRef(false); // real feedback has been saved
  const busyRef = useRef(false); // a turn is in flight
  const queuedRef = useRef<Msg[]>([]); // messages said while a turn was in flight

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

  const micOnRef = useRef(true);
  micOnRef.current = micOn;

  const { isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const candidateName = user?.firstName ?? "";
  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";
  const router = useRouter();

  const { transcript: rawTranscript, resetTranscript, listening, isMicrophoneAvailable, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const transcript = cleanSpeech(rawTranscript);
  const [hold, setHold] = useState(false); // "Hold on": pause the auto-send while the user thinks
  const [sendWait, setSendWait] = useState<{ ms: number; id: number } | null>(null); // drives the "sending in…" bar
  const playingRef = useRef(false); // interviewer audio is loading/playing: keep the mic closed

  const cancelTTS = () => {
    playingRef.current = false;
    setSpeaking(false);
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

    try { SpeechRecognition.stopListening(); } catch {}
    playingRef.current = true;
    objectUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    // Ignore state updates from an audio element that has since been replaced or cancelled.
    const isCurrent = () => audioRef.current === audio;

    // When audio actually starts, make sure mic is off to avoid edge echoes
    audioRef.current.onplay = () => {
      if (isCurrent()) setSpeaking(true);
      try { SpeechRecognition.stopListening(); } catch { }
    };
    audioRef.current.onended = () => {
      if (isCurrent()) { playingRef.current = false; setSpeaking(false); }
      // Re-arm mic with a small delay (handled inside startListening)
      startListening();
      onEnd?.();
    };
    audioRef.current.onerror = () => {
      if (isCurrent()) { playingRef.current = false; setSpeaking(false); }
      // If audio fails, still arm the mic so user can speak
      startListening();
      onEnd?.();
    };
    try {
      await audioRef.current.play();
    } catch {
      if (isCurrent()) playingRef.current = false;
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
      if (endedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => { /* camera denied or missing: the interview works without it */ });
  }, [cameraOn]);

  // Voice → text capture
  // Send what the user said right now (used by the silence timer and the "Send now" button).
  const flushSpeech = () => {
    const spoken = transcript.trim();
    if (!spoken) return;
    resetTranscript();
    setHold(false);
    setSendWait(null);
    markActivity();
    void sendMessage(spoken);
  };

  useEffect(() => {
    if (!transcript.trim()) { setSendWait(null); return; }
    cancelTTS(); // [TTS] stop TTS when user speaks
    if (hold) { setSendWait(null); return; } // user asked for time to think: don't auto-send
    const ms = silenceWaitMs(transcript);
    setSendWait({ ms, id: Date.now() }); // restarts the progress bar every time new words arrive
    const timeout = setTimeout(flushSpeech, ms);
    return () => clearTimeout(timeout);
  }, [transcript, resetTranscript, hold]);

  // "Hold on" can't stall the interview: it releases by itself.
  useEffect(() => {
    if (!hold) return;
    const t = setTimeout(() => setHold(false), HOLD_MAX_MS);
    return () => clearTimeout(t);
  }, [hold]);

  // The browser's recognizer stops by itself after a long pause. Re-arm it (keeping the text captured so far)
  // unless the mic is muted, the AI is talking, or the interview is over.
  useEffect(() => {
    if (listening || speaking || ended || !micOn || !guardDone) return;
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) return;
    const t = setTimeout(() => {
      if (!playingRef.current) startListening();
    }, 500);
    return () => clearTimeout(t);
  }, [listening, speaking, ended, micOn, guardDone, isMicrophoneAvailable]);

  const MIC_ARM_DELAY_MS = 300; // small buffer so the engine is "ready"

  const startListening = () => {
    if (endedRef.current) return;
    if (!browserSupportsSpeechRecognition || !micOnRef.current) return;
    setTimeout(() => {
      SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: "en-US",
      });
    }, MIC_ARM_DELAY_MS);
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

  // Decide whether this page should run an interview at all:
  //  - a refresh was confirmed earlier (flag set on pagehide) -> finish that interview from the saved transcript
  //  - the session is already completed (stale URL) -> go to its detail page
  useEffect(() => {
    if (!isSignedIn) return;
    if (!sessionId) { setGuardDone(true); return; }
    let cancelled = false;

    (async () => {
      let refreshed = false;
      try { refreshed = sessionStorage.getItem(endedFlagKey) === "1"; } catch { }
      if (refreshed) {
        hasStartedRef.current = true; // never start a fresh interview for this session
        try {
          const raw = sessionStorage.getItem(histKey);
          if (raw) historyRef.current = JSON.parse(raw);
        } catch { }
        void handleEndInterview({ auto: true });
        return;
      }

      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.session?.status === "completed") {
            hasStartedRef.current = true;
            router.replace(`/sessions/${sessionId}`);
            return;
          }
        }
      } catch { /* can't tell: let the interview start */ }
      if (!cancelled) setGuardDone(true);
    })();

    return () => { cancelled = true; };
  }, [isSignedIn, sessionId]);

  // While the interview is live: warn on refresh/close, and if the page really goes away
  // mark the session ended (sendBeacon survives unload) and remember it so a reload can build the feedback.
  useEffect(() => {
    if (!isSignedIn || !sessionId || !guardDone) return;

    let cancelled = false;
    encrypt({ sessionId, feedback: ABANDONED_FEEDBACK }, ENC_KEY)
      .then((payload) => {
        if (!cancelled) abandonBeaconRef.current = new Blob([JSON.stringify(payload)], { type: "application/json" });
      })
      .catch(() => { });

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (endedRef.current) return;
      e.preventDefault();
      e.returnValue = ""; // the browser shows its own generic confirmation
    };
    const onPageHide = () => {
      if (savedRef.current) return;
      try { sessionStorage.setItem(endedFlagKey, "1"); } catch { }
      if (abandonBeaconRef.current) {
        try { navigator.sendBeacon("/api/update-interview", abandonBeaconRef.current); } catch { }
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [isSignedIn, sessionId, guardDone]);

  // Single place that changes the transcript (ref for logic, sessionStorage so a refresh can still be summarised).
  const persistHistory = (next: Msg[]) => {
    historyRef.current = next;
    try { sessionStorage.setItem(histKey, JSON.stringify(next)); } catch { }
  };

  // One AI turn: send the transcript (plus `add`), speak and show the reply, handle the end token.
  // Nothing is committed to the transcript until the reply arrives, so a failed turn can be retried safely.
  const runTurn = async (add: Msg[], opts?: { silence?: boolean }): Promise<void> => {
    if (endedRef.current) return;
    if (busyRef.current) { queuedRef.current.push(...add); return; } // sent right after the current turn
    busyRef.current = true;
    setLoading(true);
    setTurnError(false);
    retryRef.current = null;
    let failed = false;

    try {
      const pending = [...historyRef.current, ...add];
      const prompt = getPromptsForInterview(technology, allowedMinutes ?? requestedDuration, company, level, candidateName);
      const encPayload = await encrypt({ messages: pending, systemPrompt: prompt }, ENC_KEY);

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TURN_TIMEOUT_MS);
      let reply: string;
      try {
        const res = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encPayload),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`interview ${res.status}`);
        reply = (await decrypt<{ reply: string }>(await res.json(), ENC_KEY)).reply;
      } finally {
        clearTimeout(timer);
      }
      if (!reply) throw new Error("empty reply");

      // [SYNC] prepare audio before rendering text
      const preparedUrl = await prepareTTS(reply);
      if (endedRef.current) return; // ended while we were waiting (timer, End button)

      persistHistory([...pending, { role: "assistant", content: reply }]);
      setAiReply(reply);
      lastAgentActivityRef.current = Date.now();
      setActiveView("question");
      if (!opts?.silence) markActivity();
      silenceTriggeredRef.current = !!opts?.silence; // a check-in must not re-trigger until someone acts

      if (containsEndToken(reply)) {
        await handleEndInterview({ auto: true });
        return;
      }

      requestAnimationFrame(() => {
        if (preparedUrl) void playTTS(preparedUrl, () => startListening());
        else startListening();
      });
    } catch (e) {
      failed = true;
      if (endedRef.current || opts?.silence) return; // a missed check-in isn't worth interrupting the user
      console.error("[TURN_ERROR]", e);
      const all = [...add, ...queuedRef.current];
      queuedRef.current = [];
      retryRef.current = () => { void runTurn(all, opts); };
      setTurnError(true);
      startListening(); // keep the mic usable
    } finally {
      busyRef.current = false;
      setLoading(false);
      if (!failed && !endedRef.current && queuedRef.current.length) {
        const q = queuedRef.current;
        queuedRef.current = [];
        void runTurn(q);
      }
    }
  };

  // CHANGED: Start interview only after allowedMinutes is known (not null) and the session guard passed
  useEffect(() => {
    if (!isSignedIn || !guardDone || !userLoaded || hasStartedRef.current || !browserSupportsSpeechRecognition) return;
    if (allowedMinutes === undefined) return; // wait for plan check

    hasStartedRef.current = true;

    endAtRef.current = Date.now() + allowedMinutes * 60 * 1000;
    setTimeLeft(allowedMinutes * 60);
    setStage("intro");
    void runTurn([]);
  }, [isSignedIn, guardDone, userLoaded, browserSupportsSpeechRecognition, company, level, technology, allowedMinutes]);

  const sendMessage = async (userInput: string) => {
    if (endedRef.current) return;
    if (/start.*code|let.?s code|i'?ll start/i.test(userInput)) setStage("coding");
    else if (/complexity|big ?o/i.test(userInput)) setStage("review");
    await runTurn([{ role: "user", content: userInput }]);
  };

  const sendSilenceSystemEvent = async () => {
    if (endedRef.current || busyRef.current) return; // don't overlap
    await runTurn(
      [{
        role: "system",
        content:
          "The candidate has been silent for more than 2 minutes. Briefly check in (≤1 sentence) and ask if they need a hint or have any issue.",
      }],
      { silence: true }
    );
  };

  // Local assistant line (time checks): not produced by the model, so it doesn't go through runTurn.
  const assistantPush = async (text: string) => {
    if (endedRef.current) return;
    persistHistory([...historyRef.current, { role: "assistant", content: text }]);
    setAiReply(text);
    lastAgentActivityRef.current = Date.now();
    silenceTriggeredRef.current = false;

    const url = await prepareTTS(text);
    requestAnimationFrame(() => {
      if (url) void playTTS(url, () => startListening());
      else startListening();
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
  }, [stage, micOn, allowedMinutes]);

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

  const handleEndInterview = async (_opts?: { auto?: boolean }) => {
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

    try {
      if (sessionId) {
        // Only the real conversation goes to the summary: no hidden check-ins, no canned time checks.
        const transcriptMsgs = historyRef.current.filter(
          (m) => m.role !== "system" && !(m.role === "assistant" && CANNED_LINE_REGEX.test(m.content.trim()))
        );

        let feedback = "";
        if (transcriptMsgs.some((m) => m.role === "user")) {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), SUMMARY_TIMEOUT_MS);
          try {
            const encPayload = await encrypt({ messages: transcriptMsgs, systemPrompt: SUMMARY_PROMPT }, ENC_KEY);
            const resSummary = await fetch("/api/interview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(encPayload),
              signal: ctrl.signal,
            });
            if (resSummary.ok) {
              const { reply } = await decrypt<{ reply: string }>(await resSummary.json(), ENC_KEY);
              feedback = reply ?? "";
            }
          } catch (e) {
            console.error("Error generating feedback", e);
          } finally {
            clearTimeout(timer);
          }
          if (!feedback.trim()) feedback = FEEDBACK_FAILED;
        } else {
          feedback = FEEDBACK_NO_ANSWERS;
        }
        feedback = feedback.slice(0, 5000); // API limit

        let modelPrepPercent: number | undefined;
        const m = feedback.match(/Preparation Percentage:\s*(\d{1,3})%/i);
        if (m) {
          const n = Math.min(100, Math.max(0, parseInt(m[1], 10)));
          if (!Number.isNaN(n)) modelPrepPercent = n;
        } // "N/A" or a malformed header: no number is stored

        // Persist interview completion + feedback
        const encPayloadSummary = await encrypt({ sessionId, feedback, ...(typeof modelPrepPercent === 'number' ? { modelPreparationPercent: modelPrepPercent } : {}) }, ENC_KEY)
        const saveRes = await fetch("/api/update-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encPayloadSummary),
        });
        if (saveRes.ok) savedRef.current = true;
      }
    } catch (e) {
      console.error("Error finalizing interview", e);
      // We still redirect even if saving fails.
    } finally {
      try {
        sessionStorage.removeItem(histKey);
        sessionStorage.removeItem(endedFlagKey);
      } catch { }
      setEndLoading(false);
      router.replace(`/interview/feedback?sessionId=${encodeURIComponent(sessionId)}`);
    }
  };

  const handleCodeSubmit = async () => {
    if (endedRef.current) return;
    if (!userCode.trim()) return;
    setStage("review");
    await runTurn([{ role: "user", content: `Here is my code:\n${userCode.trim()}` }]);
  };

  // ---- Presentation only (no interview logic below this line) ----
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Friendly on-screen version of the 5 / 2 / 1 minute nudges.
  useEffect(() => {
    const msg =
      timeLeft === 300 ? "5 minutes left. Start wrapping up your solution."
        : timeLeft === 120 ? "2 minutes left. Finalize your approach."
          : timeLeft === 60 ? "1 minute left. Finish up."
            : null;
    if (!msg) return;
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 6000);
  }, [timeLeft]);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  useEffect(() => {
    if (!confirmEnd) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirmEnd(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmEnd]);

  const techLabel = technology.toLowerCase() === "dsa" ? "DSA" : technology;
  const levelLabel = level ? level.charAt(0).toUpperCase() + level.slice(1) : "";
  const levelKey = ["easy", "medium", "hard"].includes(level.toLowerCase()) ? level.toLowerCase() : "";

  const totalSecs = (allowedMinutes ?? requestedDuration) * 60;
  const ringLeft = totalSecs ? Math.min(100, (timeLeft / totalSecs) * 100) : 100;
  const warn = timeLeft > 0 && (timeLeft <= 60 || (timeLeft <= 300 && totalSecs > 300));
  const clock = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`;

  const ivState = loading ? "thinking" : speaking ? "speaking" : micOn ? "listening" : "muted";
  const stepIdx = stage === "intro" ? 0 : stage === "clarify" ? 1 : 2;
  const stepCls = (i: number) => (i < stepIdx ? "done" : i === stepIdx ? "on" : undefined);

  const LANG_LABEL: Record<string, string> = { javascript: "JavaScript", typescript: "TypeScript", python: "Python", java: "Java", cpp: "C++", go: "Go" };
  const LANG_EXT: Record<string, string> = { javascript: "js", typescript: "ts", python: "py", java: "java", cpp: "cpp", go: "go" };

  const goTo = (view: "question" | "editor") => {
    setActiveView(view);
    if (view === "editor" && stage === "clarify") setStage("coding");
    markActivity();
  };

  const ending = endLoading || ended;

  return (
    <div
      className={`mqi ${bricolage.variable} ${figtree.variable}`}
      data-iv={ivState}
      data-mic={micOn ? "on" : "off"}
      data-time={warn ? "warn" : "ok"}
    >
      <SignedIn>
        {/* ---- Top bar ---- */}
        <header className="bar">
          <Link href="/home" className="logo" aria-label="MockQube">
            <Image src="/mockqubelogo.png" alt="" width={24} height={28} priority />
            MockQube
          </Link>
          <div className="chips" aria-label="Session">
            <span className="chip">{techLabel}</span>
            {levelLabel && <span className={`chip${levelKey ? ` lv-${levelKey}` : ""}`}>{levelLabel}</span>}
            {company && <span className="chip">{company}</span>}
          </div>
          <div className="sp" />
          <span className="live"><i aria-hidden="true" /><span>{micOn ? "Recording answers" : "Mic muted"}</span></span>
          <div className="timer" role="timer" aria-label="Time remaining">
            <span className="ring" style={{ ["--left" as string]: ringLeft }} aria-hidden="true" />
            <b>{clock}</b><small>left</small>
          </div>
          <button
            type="button"
            className="btn end"
            onClick={() => setConfirmEnd(true)}
            disabled={ending}
            aria-label="End Interview"
          >
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            <span>{ending ? "Ending…" : "End interview"}</span>
          </button>
        </header>

        {/* ---- Notices ---- */}
        {allowedMinutes === undefined ? (
          <div className="notice n-prep" role="status">
            <span className="spn" aria-hidden="true" />Preparing your interview…
          </div>
        ) : wasClamped ? (
          <div className="notice n-clamp" role="status">
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <span>
              You asked for <b>{requestedDuration} min</b>, but your plan allows <b>{planMax}</b>. Adjusted to <b>{allowedMinutes} min</b>.{" "}
              <Link href="/pricing">Upgrade your plan</Link> for longer sessions.
            </span>
          </div>
        ) : null}

        {turnError && !ending && (
          <div className="notice n-err" role="alert">
            <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
            <span>We couldn&apos;t reach the interviewer. Your answer wasn&apos;t lost.</span>
            <button type="button" className="btn" onClick={() => retryRef.current?.()}>Try again</button>
          </div>
        )}

        <main className="stage">
          {/* LEFT: interviewer, you, live transcript */}
          <section className="col" aria-label="Interviewer and you">
            <div className="iv">
              <div className="orb" aria-hidden="true"><i /></div>
              <span className="who">AI interviewer</span>
              <div className="state" aria-live="polite">
                <span className="s-speaking">Speaking…</span>
                <span className="s-listening">Listening to you</span>
                <span className="s-thinking">Thinking…</span>
                <span className="s-muted">Your mic is muted</span>
              </div>
              <div className="wave" aria-hidden="true">
                {Array.from({ length: 24 }, (_, i) => <i key={i} />)}
              </div>
            </div>

            <div className="cam">
              {cameraOn ? (
                <video ref={videoRef} autoPlay muted playsInline />
              ) : (
                <div className="cam-off">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2m5 0h3a2 2 0 0 1 2 2v3l5-3v10M2 2l20 20" /></svg>
                  Camera is off
                </div>
              )}
              <span className="tag">You</span>
              <div className="dock" role="group" aria-label="Call controls">
                <button
                  type="button"
                  className={`rb${micOn ? "" : " is-off"}`}
                  onClick={toggleMic}
                  disabled={ended}
                  aria-pressed={!micOn}
                  aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                  title={micOn ? "Mute mic" : "Unmute mic"}
                >
                  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                  <span className="x" />
                </button>
                <button
                  type="button"
                  className={`rb${cameraOn ? "" : " is-off"}`}
                  onClick={() => {
                    if (!ended) {
                      setCameraOn(!cameraOn);
                      markActivity();
                    }
                  }}
                  disabled={ended}
                  aria-pressed={!cameraOn}
                  aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
                  title={cameraOn ? "Turn camera off" : "Turn camera on"}
                >
                  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                  <span className="x" />
                </button>
              </div>
            </div>

            <div className="say" aria-live="polite">
              <small><span>You&apos;re saying</span><span className="dots" aria-hidden="true"><i /><i /><i /></span></small>
              <p className={transcript ? undefined : "empty"}>{transcript || "…"}</p>
              {transcript.trim() && (
                <>
                  {sendWait && !hold && <span className="sendbar" key={sendWait.id} style={{ ["--wait" as string]: `${sendWait.ms}ms` }} aria-hidden="true" />}
                  <div className="sact">
                    <button type="button" className="btn" onClick={flushSpeech} disabled={ended}>Send now</button>
                    <button type="button" className={`btn ghost${hold ? " on" : ""}`} onClick={() => { setHold(!hold); markActivity(); }} disabled={ended} aria-pressed={hold}>
                      {hold ? "Resume" : "Hold on"}
                    </button>
                    <span className="shint">{hold ? "Take your time. Press Send now when you're done." : "Sends after a short pause."}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* RIGHT: question / editor */}
          <section className="work" aria-label="Workspace">
            <div className="work-h">
              <div className="tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === "question"}
                  className={`tab${activeView === "question" ? " on" : ""}`}
                  onClick={() => goTo("question")}
                >
                  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /></svg>Question
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeView === "editor"}
                  className={`tab${activeView === "editor" ? " on" : ""}`}
                  onClick={() => goTo("editor")}
                >
                  <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></svg>Code editor
                </button>
              </div>
              <div className="steps" aria-label="Interview progress">
                <span className={stepCls(0)}>Intro</span><em /><span className={stepCls(1)}>Clarify</span><em /><span className={stepCls(2)}>Code</span>
              </div>
            </div>

            {activeView === "question" && (
              <div className="pane pane-q" role="tabpanel">
                <span className="q-eyebrow"><i aria-hidden="true" />Interviewer</span>
                {loading ? (
                  <div className="q-think" aria-live="polite">
                    <span className="dots" aria-hidden="true"><i /><i /><i /></span>Interviewer is thinking…
                  </div>
                ) : aiReply ? (
                  <p className="q-text">{aiReply}</p>
                ) : (
                  <p className="q-empty">Your interviewer will start in a moment…</p>
                )}
                <div className="q-foot">
                  <p>Think out loud. Your answer is captured as you speak.</p>
                  <button type="button" className="btn ghost" onClick={() => goTo("editor")}>
                    Open the editor
                    <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
            )}

            {activeView === "editor" && (
              <div className="pane pane-e" role="tabpanel">
                <div className="ed-top">
                  <span className="chip">{LANG_LABEL[language] ?? language}</span>
                  <span className="chip">solution.{LANG_EXT[language] ?? "txt"}</span>
                  <span className="hint">Submit with <kbd>Ctrl</kbd> + <kbd>Enter</kbd></span>
                </div>
                <div className="editor">
                  <MonacoEditor
                    height="100%"                      // [MONACO] fills the rounded frame
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
                      padding: { top: 12 },
                    }}
                    onMount={handleEditorMount}         // [MONACO] add Cmd/Ctrl+Enter
                    onChange={(val) => {
                      setUserCode(val ?? "");
                      markActivity();
                    }}
                  />
                </div>
                <div className="ed-foot">
                  <p>The interviewer reads your code when you submit it.</p>
                  <button type="button" className="btn" onClick={handleCodeSubmit} disabled={ended}>
                    Submit code
                    <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* ---- Time warning toast ---- */}
        <div className={`toast${toast ? " show" : ""}`} role="status">
          <i aria-hidden="true" /><span>{toast ?? ""}</span>
        </div>

        {/* ---- End confirmation ---- */}
        {confirmEnd && !ending && (
          <div className="veil" role="dialog" aria-modal="true" aria-labelledby="end-title">
            <div className="sheet">
              <div className="ic"><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg></div>
              <h2 id="end-title">End the interview now?</h2>
              <p>We&apos;ll score what you&apos;ve covered so far and build your feedback. You can&apos;t resume this session.</p>
              <div className="acts">
                <button type="button" className="btn ghost" onClick={() => setConfirmEnd(false)}>Keep going</button>
                <button
                  type="button"
                  className="btn dark"
                  onClick={() => {
                    setConfirmEnd(false);
                    void handleEndInterview();
                  }}
                >
                  End &amp; get feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- Wrapping up (while the feedback summary is generated) ---- */}
        {ending && (
          <div className="veil v-ending" role="alertdialog" aria-live="assertive" aria-labelledby="wrap-title">
            <div className="wrap-up">
              <div className="orb" aria-hidden="true"><i /></div>
              <h2 id="wrap-title">Wrapping up <b>your session</b></h2>
              <p>Writing your feedback and preparation score…</p>
              <div className="prog" aria-hidden="true"><i /></div>
            </div>
          </div>
        )}
      </SignedIn>

      <SignedOut>
        <div className="gate">
          <div className="sheet">
            <div className="ic"><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></div>
            <h2>Sign in to start</h2>
            <p>You need to sign in to access the interview.</p>
            <div className="acts">
              <SignInButton>
                <button type="button" className="btn">Sign in</button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
