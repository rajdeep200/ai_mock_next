"use client";

import { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./interview.css";
import { containsEndToken, MAX_LIVE_CODE_CHARS, MAX_MESSAGE_CHARS, type TurnType } from "@/lib/interview";
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
const SUMMARY_TIMEOUT_MS = 65_000;

type TurnPayload = { type: TurnType; content?: string };
type ReplySpeaker = { push: (delta: string) => void; finish: () => void; abort: () => void };

// ---- Splitting a streamed reply into sentences so each can be voiced as soon as it is complete ----
const MIN_SENTENCE_CHARS = 24; // shorter pieces are joined to the next sentence instead of voiced alone
const ABBREVIATION_END = /(?:^|[\s(])(e\.g|i\.e|vs|etc|mr|mrs|ms|dr|approx|fig|st)\.$/i;

function takeSentences(text: string, final: boolean): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    let end = -1;
    if (c === "\n") {
      end = i;
    } else if (c === "." || c === "!" || c === "?") {
      let j = i;
      while (j + 1 < text.length && /[.!?"')\]]/.test(text[j + 1])) j++; // "?!", ".)" and the like
      if (j + 1 >= text.length) {
        if (!final) break; // can't tell yet whether the sentence ends here
        end = j;
      } else if (/\s/.test(text[j + 1]) && !(c === "." && ABBREVIATION_END.test(text.slice(start, j + 1)))) {
        end = j; // "1.5" or "arr.length" have no space after the dot, so they never end a sentence
      }
      if (end === -1) i = j;
    }
    if (end >= 0) {
      const s = text.slice(start, end + 1).trim();
      if (s) sentences.push(s);
      start = end + 1;
      i = end;
    }
  }
  return { sentences, rest: text.slice(start) };
}

class TurnError extends Error {
  code?: string;
  retryAfterMs?: number;
  constructor(message: string, code?: string, retryAfterMs?: number) {
    super(message);
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

export default function InterviewPage() {
  const [aiReply, setAiReply] = useState("");
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
  const endedFlagKey = `iv:${sessionId}:ended`;
  const [guardDone, setGuardDone] = useState(false); // true once we know this session is still live
  const [turnError, setTurnError] = useState(false);
  const retryRef = useRef<(() => void) | null>(null);
  const savedRef = useRef(false); // real feedback has been saved
  const busyRef = useRef(false); // a turn is in flight
  const inFlightRef = useRef<Promise<void> | null>(null); // resolves when the current turn is fully done
  const clockSyncedRef = useRef(false); // the server's remaining time has been applied
  const userCodeRef = useRef(""); // latest editor content, readable from async callbacks
  const queuedRef = useRef<TurnPayload[]>([]); // things said while a turn was in flight

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

   const monacoEditorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);

  // [SYNC] small in-memory cache: text -> objectURL (to avoid re-fetch on re-renders)
  const ttsCache = useRef<Map<string, string>>(new Map());

  const micOnRef = useRef(true);
  micOnRef.current = micOn;
  // Headphones mode: the mic stays open while the interviewer talks, so speaking over them interrupts.
  // Off by default because speakers would feed the interviewer's own voice back into the recognizer.
  const [headphones, setHeadphones] = useState(false);
  const headphonesRef = useRef(false);
  headphonesRef.current = headphones;
  useEffect(() => {
    try { if (localStorage.getItem("mq-headphones") === "1") setHeadphones(true); } catch { }
  }, []);
  const allowedMinutesRef = useRef<number | undefined>(undefined);
  allowedMinutesRef.current = allowedMinutes;

  const { isSignedIn } = useAuth();
  const technology = searchParams.get("technology") ?? "React";
  const company = searchParams.get("company") ?? "";
  const level = searchParams.get("level") ?? "Junior";
  const router = useRouter();

  const { transcript: rawTranscript, resetTranscript, listening, isMicrophoneAvailable, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const transcript = cleanSpeech(rawTranscript);
  const [hold, setHold] = useState(false); // "Hold on": pause the auto-send while the user thinks
  const [sendWait, setSendWait] = useState<{ ms: number; id: number } | null>(null); // drives the "sending in…" bar
  const playingRef = useRef(false); // interviewer audio is loading/playing: keep the mic closed

  // Bumped whenever speech is cancelled: a reply's audio pipeline only runs while its own token is current.
  const speechTokenRef = useRef(0);

  const cancelTTS = () => {
    speechTokenRef.current += 1;
    playingRef.current = false;
    setSpeaking(false);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
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
        body: JSON.stringify({ text: normalized, voiceId: "Raveena", engine: "neural", rate: "medium", sessionId }),
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

  // Play one audio clip. Resolves when it ends, fails to play, or is cancelled.
  const playClip = (url: string, token: number): Promise<void> =>
    new Promise((resolve) => {
      if (token !== speechTokenRef.current) return resolve();
      const audio = new Audio(url);
      audioRef.current = audio;
      playingRef.current = true;
      if (!headphonesRef.current) { try { SpeechRecognition.stopListening(); } catch { } }
      let settled = false;
      const done = () => { if (!settled) { settled = true; resolve(); } };
      audio.onplay = () => {
        if (token === speechTokenRef.current) setSpeaking(true);
        // keep the mic off while the interviewer talks, unless the user wears headphones
        if (!headphonesRef.current) { try { SpeechRecognition.stopListening(); } catch { } }
      };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done); // autoplay blocked: skip the audio but keep the flow going
    });

  // Shows and speaks one interviewer reply sentence by sentence while it is still being written:
  // each finished sentence is sent to TTS straight away, and the sentences are played in order.
  // The text for a sentence appears when its audio starts, so text and voice stay in step.
  const createReplySpeaker = (opts?: { silence?: boolean; local?: boolean }) => {
    cancelTTS(); // anything still speaking or queued is replaced
    const token = speechTokenRef.current;
    const alive = () => token === speechTokenRef.current;
    const queue: { text: string; url: Promise<string | null> }[] = [];
    let full = "";
    let consumed = 0;
    let carry = "";
    let shown = false;
    let pumping = false;
    let finished = false;
    let endSeen = false;

    const show = (text: string) => {
      if (!shown) {
        shown = true;
        setAiReply(text);
        setLoading(false);
        lastAgentActivityRef.current = Date.now();
        if (!opts?.local) setActiveView("question");
        if (!opts?.local && !opts?.silence) markActivity();
        silenceTriggeredRef.current = !!opts?.silence; // a check-in must not re-trigger until someone acts
      } else {
        setAiReply((prev) => `${prev} ${text}`);
      }
    };

    const complete = () => {
      playingRef.current = false;
      setSpeaking(false);
      startListening(); // re-arm the mic once the interviewer has finished
    };

    const pump = async () => {
      if (pumping) return;
      pumping = true;
      try {
        while (alive()) {
          const item = queue.shift();
          if (!item) break;
          const url = await item.url;
          if (!alive()) return;
          show(item.text);
          if (url) await playClip(url, token);
        }
      } finally {
        pumping = false;
      }
      if (alive() && finished && queue.length === 0) complete();
    };

    const emit = (s: string) => {
      queue.push({ text: s, url: prepareTTS(s) });
      void pump();
    };

    const flush = (final: boolean) => {
      const { sentences, rest } = takeSentences(full.slice(consumed), final);
      consumed = full.length - rest.length;
      for (const s of sentences) {
        const joined = carry ? `${carry} ${s}` : s;
        if (joined.length < MIN_SENTENCE_CHARS && !final) { carry = joined; continue; } // too short to voice alone
        carry = "";
        emit(joined);
      }
      if (final) {
        const tail = [carry, rest.trim()].filter(Boolean).join(" ").trim();
        carry = "";
        consumed = full.length;
        if (tail) emit(tail);
      }
    };

    return {
      push(delta: string) {
        if (!alive() || endSeen) return;
        full += delta;
        if (containsEndToken(full)) { endSeen = true; return; } // the interview is ending: don't voice anything more
        flush(false);
      },
      finish() {
        finished = true;
        if (alive() && !endSeen) flush(true);
        void pump();
      },
      abort() {
        if (alive()) cancelTTS();
      },
    };
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
    if (listening || (speaking && !headphones) || ended || !micOn || !guardDone) return;
    if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) return;
    const t = setTimeout(() => {
      if (!playingRef.current || headphonesRef.current) startListening();
    }, 500);
    return () => clearTimeout(t);
  }, [listening, speaking, ended, micOn, guardDone, isMicrophoneAvailable, headphones]);

  // Cut the interviewer off and open the mic right away (button, or Space while they're talking).
  const interrupt = () => {
    if (endedRef.current) return;
    cancelTTS();
    resetTranscript();
    startListening();
  };

  const toggleHeadphones = () => {
    const next = !headphones;
    setHeadphones(next);
    try { localStorage.setItem("mq-headphones", next ? "1" : "0"); } catch { }
    if (!playingRef.current) return;
    if (next) startListening();
    else { try { SpeechRecognition.stopListening(); } catch { } }
  };

  useEffect(() => {
    if (!speaking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName) || t.isContentEditable || t.closest?.(".monaco-editor"))) return;
      e.preventDefault();
      interrupt();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [speaking]);

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
  //  - a refresh was confirmed earlier (flag set on pagehide) -> finish that interview now (the server holds the transcript)
  //  - the session is already completed (stale URL) -> go to its detail page
  //  - otherwise start, or pick up where the server transcript left off
  useEffect(() => {
    if (!isSignedIn) return;
    if (!sessionId) { setGuardDone(true); return; }
    let cancelled = false;

    (async () => {
      let refreshed = false;
      try { refreshed = sessionStorage.getItem(endedFlagKey) === "1"; } catch { }
      if (refreshed) {
        hasStartedRef.current = true; // never start a fresh interview for this session
        void handleEndInterview();
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

    const beacon = new Blob([JSON.stringify({ sessionId })], { type: "application/json" });
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (endedRef.current) return;
      e.preventDefault();
      e.returnValue = ""; // the browser shows its own generic confirmation
    };
    const onPageHide = () => {
      if (savedRef.current) return;
      try { sessionStorage.setItem(endedFlagKey, "1"); } catch { }
      try { navigator.sendBeacon("/api/interview/abandon", beacon); } catch { }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [isSignedIn, sessionId, guardDone]);

  // Sync the timer to the server's clock, once (the server measures from when the session was created)
  const syncClock = (remainingSec: number) => {
    if (clockSyncedRef.current || !Number.isFinite(remainingSec)) return;
    clockSyncedRef.current = true;
    const cap = (allowedMinutesRef.current ?? requestedDuration) * 60;
    endAtRef.current = Date.now() + Math.min(remainingSec, cap) * 1000;
  };

  // One AI turn: send our next message, then show and speak the reply as it streams in.
  // The server commits the exchange only when the reply completes, so a failed turn can be retried safely.
  const runTurn = async (p: TurnPayload, opts?: { silence?: boolean }): Promise<void> => {
    if (endedRef.current) return;
    if (busyRef.current) { queuedRef.current.push(p); return; } // sent right after the current turn
    busyRef.current = true;
    setLoading(true);
    setTurnError(false);
    retryRef.current = null;
    let failed = false;
    let speaker: ReplySpeaker | null = null;
    let resolveFlight: () => void = () => { };
    inFlightRef.current = new Promise<void>((r) => { resolveFlight = r; });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TURN_TIMEOUT_MS);

    try {
      const code = userCodeRef.current.slice(0, MAX_LIVE_CODE_CHARS);
      const res = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...p, ...(code.trim() ? { liveCode: code } : {}) }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new TurnError(data?.error || `Request failed (${res.status})`, data?.code, data?.retryAfterMs);
      }

      let reply = "";
      let ended = false;

      if ((res.headers.get("content-type") ?? "").includes("application/json")) {
        // Whole reply at once (reopening an interview returns the last question this way)
        const data = await res.json();
        reply = data?.reply ?? "";
        ended = !!data?.ended;
        syncClock(data?.remainingSec);
        if (!reply) throw new TurnError("Empty reply");
        if (!ended) {
          speaker = createReplySpeaker(opts);
          speaker.push(reply);
          speaker.finish();
        }
      } else {
        // Streamed reply: newline-delimited JSON events
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let gotDone = false;

        const handle = (line: string) => {
          if (!line.trim()) return;
          const ev = JSON.parse(line);
          if (ev.t === "meta") syncClock(ev.remainingSec);
          else if (ev.t === "delta") (speaker ??= createReplySpeaker(opts)).push(ev.text);
          else if (ev.t === "done") {
            gotDone = true;
            reply = ev.reply;
            ended = !!ev.ended;
            syncClock(ev.remainingSec);
          } else if (ev.t === "error") throw new TurnError(ev.error || "The interviewer is unavailable.", ev.code);
        };

        for (; ;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handle);
        }
        handle(buffer);
        if (!gotDone) throw new TurnError("Connection lost"); // stream ended without the final event

        if (!ended) {
          speaker ??= createReplySpeaker(opts);
          speaker.finish();
        }
      }

      if (ended) {
        speaker?.abort();
        resolveFlight();
        await handleEndInterview();
        return;
      }
    } catch (e) {
      failed = true;
      speaker?.abort(); // drop whatever was still queued from a reply that didn't complete
      if (endedRef.current) return;
      const code = e instanceof TurnError ? e.code : undefined;
      if (code === "TIME_UP" || code === "TURN_CAP") {
        resolveFlight();
        void handleEndInterview(); // the server says this interview is over
        return;
      }
      if (code === "NOT_ACTIVE") {
        endedRef.current = true;
        router.replace(`/sessions/${sessionId}`);
        return;
      }
      retryRef.current = () => { void runTurn(p, opts); };
      if (code === "TOO_FAST") {
        setTimeout(() => retryRef.current?.(), 1300); // quietly try again just after the minimum gap
        return;
      }
      if (opts?.silence) return; // a missed check-in isn't worth interrupting the user
      console.error("[TURN_ERROR]", e);
      setTurnError(true);
      startListening(); // keep the mic usable
    } finally {
      clearTimeout(timer);
      resolveFlight();
      busyRef.current = false;
      setLoading(false);
      if (!failed && !endedRef.current && queuedRef.current.length) {
        // Said while we were busy: send as one message (spoken pieces are merged)
        const q = queuedRef.current;
        queuedRef.current = [];
        const first = q[0];
        if (first.type === "message") {
          const merged = q.filter((x) => x.type === "message").map((x) => x.content).join(" ");
          queuedRef.current = q.filter((x) => x.type !== "message");
          void runTurn({ type: "message", content: merged });
        } else {
          queuedRef.current = q.slice(1);
          void runTurn(first);
        }
      }
    }
  };

  // CHANGED: Start interview only after allowedMinutes is known (not null) and the session guard passed
  useEffect(() => {
    if (!isSignedIn || !guardDone || hasStartedRef.current || !browserSupportsSpeechRecognition) return;
    if (allowedMinutes === undefined) return; // wait for plan check
    if (!sessionId) { router.replace("/start-interview"); return; } // nothing to run without a session

    hasStartedRef.current = true;

    endAtRef.current = Date.now() + allowedMinutes * 60 * 1000; // provisional; replaced by the server's clock on the first reply
    setTimeLeft(allowedMinutes * 60);
    setStage("intro");
    void runTurn({ type: "start" });
  }, [isSignedIn, guardDone, browserSupportsSpeechRecognition, company, level, technology, allowedMinutes]);

  const sendMessage = async (userInput: string) => {
    if (endedRef.current) return;
    if (/start.*code|let.?s code|i'?ll start/i.test(userInput)) setStage("coding");
    else if (/complexity|big ?o/i.test(userInput)) setStage("review");
    await runTurn({ type: "message", content: userInput });
  };

  const sendSilenceSystemEvent = async () => {
    if (endedRef.current || busyRef.current) return; // don't overlap
    await runTurn({ type: "silence" }, { silence: true });
  };

  // Local assistant line (time checks): display and voice only. It never goes to the model or the transcript.
  const assistantPush = async (text: string) => {
    if (endedRef.current) return;
    const speaker = createReplySpeaker({ local: true });
    speaker.push(text);
    speaker.finish();
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
        void handleEndInterview();
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

  const handleEndInterview = async () => {
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
        // If a reply was still being written, give the server a moment to finish saving it first
        await Promise.race([inFlightRef.current ?? Promise.resolve(), new Promise<void>((r) => setTimeout(r, 4000))]);

        // The server builds the feedback and score from the transcript it stored, and completes the session.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), SUMMARY_TIMEOUT_MS);
        try {
          const res = await fetch("/api/interview/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
            signal: ctrl.signal,
          });
          if (res.ok) savedRef.current = true;
        } finally {
          clearTimeout(timer);
        }
      }
    } catch (e) {
      console.error("Error finalizing interview", e);
      // We still redirect even if this fails; the session page shows whatever was saved.
    } finally {
      try { sessionStorage.removeItem(endedFlagKey); } catch { }
      setEndLoading(false);
      router.replace(`/interview/feedback?sessionId=${encodeURIComponent(sessionId)}`);
    }
  };

  const handleCodeSubmit = async () => {
    if (endedRef.current) return;
    const code = userCode.trim();
    if (!code) return;
    setStage("review");
    await runTurn({ type: "code", content: code.slice(0, MAX_MESSAGE_CHARS) });
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
              <div className="ivact">
                {speaking && !ended && (
                  <button type="button" className="btn" onClick={interrupt}>
                    {headphones ? "Skip" : "Interrupt"} <kbd>Space</kbd>
                  </button>
                )}
                <button
                  type="button"
                  className={`btn ghost${headphones ? " on" : ""}`}
                  onClick={toggleHeadphones}
                  disabled={ended}
                  aria-pressed={headphones}
                  title="With headphones, you can talk over the interviewer to interrupt. Without them, your mic would pick up their voice."
                >
                  Headphones: {headphones ? "on" : "off"}
                </button>
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
                      userCodeRef.current = val ?? "";
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
