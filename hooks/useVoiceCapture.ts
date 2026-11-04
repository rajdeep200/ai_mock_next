"use client";
// hooks/useVoiceCapture.ts
// Speech-to-text for the interview, replacing the browser's built-in recognizer.
//   microphone -> small voice detector (finds where you start and stop speaking) -> 16 kHz WAV clip -> POST /api/stt -> text
// The microphone stays open for the whole interview, so there is no restart gap in which words get lost;
// `start()` / `stop()` only open and close the gate. The clip includes a short lead-in, so the first word isn't clipped.
import { useCallback, useEffect, useRef, useState } from "react";

// ---- Voice detector settings (loudness is RMS on a 0..1 scale) ----
const FRAME = 2048; // samples per analysis frame (~43 ms at 48 kHz)
const MIN_THRESHOLD = 0.012; // never treat anything quieter than this as speech
const FLOOR_MULT = 3.5; // speech must be this many times louder than the room's background noise
const START_FRAMES = 2; // loud frames in a row before we call it speech (ignores clicks and bumps)
const END_SILENCE_MS = 1500; // quiet this long = the clip ends and is sent for transcription (longer = fewer, bigger clips)
const PRE_ROLL_MS = 450; // audio kept from before the speech started, so the first word isn't cut
const TRAIL_KEEP_MS = 300; // quiet kept at the end of a clip
const MIN_SPEECH_MS = 250; // shorter than this is a cough or a bump, not speech
const MAX_SEGMENT_MS = 40_000; // very long monologues are split here
const QUIET_PEAK = 0.5; // a clip whose loudest point is below this gets boosted
const TARGET_PEAK = 0.7; // ...up to this loudest point
const MAX_GAIN = 8; // never boost more than this (it would only amplify noise)
const TARGET_RATE = 16_000;
const REQUEST_TIMEOUT_MS = 20_000;

const WORKLET = `
class MqCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(${FRAME}); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === ${FRAME}) { this.port.postMessage(this.buf.slice(0)); this.n = 0; }
      }
    }
    return true;
  }
}
registerProcessor("mq-capture", MqCapture);
`;

export type CaptureActivity = "idle" | "speaking" | "transcribing";

type Options = {
  sessionId: string;
  /** The person started talking (only fires while the gate is open). */
  onSpeechStart?: () => void;
  onError?: (kind: "mic" | "transcribe") => void;
};

/** Mono float samples at `inRate` -> 16 kHz 16-bit mono WAV. */
function encodeWav(frames: Float32Array[], inRate: number) {
  let total = 0;
  for (const f of frames) total += f.length;
  const ratio = inRate / TARGET_RATE;
  const outLen = Math.max(1, Math.floor(total / Math.max(ratio, 1)));
  const merged = new Float32Array(total);
  let o = 0;
  for (const f of frames) { merged.set(f, o); o += f.length; }

  const out = new Float32Array(outLen);
  let peak = 0;
  let sq = 0;
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.min(total, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = start; j < end; j++) sum += merged[j] ?? 0;
    const v = sum / (end - start);
    out[i] = v;
    peak = Math.max(peak, Math.abs(v));
    sq += v * v;
  }
  const rms = Math.sqrt(sq / outLen);

  // Quiet recordings make the speech model guess, so bring a weak clip up to a healthy level (never more than MAX_GAIN)
  const gain = peak > 0 && peak < QUIET_PEAK ? Math.min(MAX_GAIN, TARGET_PEAK / peak) : 1;

  const pcm = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const v = Math.max(-1, Math.min(1, out[i] * gain));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }

  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const dv = new DataView(buf);
  const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
  str(0, "RIFF"); dv.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVE");
  str(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, TARGET_RATE, true); dv.setUint32(28, TARGET_RATE * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, "data"); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return { blob: new Blob([buf], { type: "audio/wav" }), peak, rms, gain };
}

type Clip = ReturnType<typeof encodeWav>;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useVoiceCapture(options: Options) {
  const [supported, setSupported] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [listening, setListening] = useState(false);
  const [activity, setActivity] = useState<CaptureActivity>("idle");
  const [transcript, setTranscript] = useState("");

  const optsRef = useRef(options);
  optsRef.current = options;

  const enabledRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initRef = useRef<Promise<boolean> | null>(null);
  const lastVoiceAtRef = useRef(0); // when the last loud frame was heard

  const vad = useRef({
    inSpeech: false,
    voicedRun: 0,
    silentRun: 0,
    speechFrames: 0,
    floor: 0.005,
    seg: [] as Float32Array[],
    pre: [] as Float32Array[],
  });

  // Results can come back out of order: they are put back in the order they were spoken
  const seqRef = useRef(0);
  const nextEmitRef = useRef(0);
  const resultsRef = useRef(new Map<number, string>());
  const partsRef = useRef<string[]>([]);
  const pendingRef = useRef(0);

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof AudioContext !== "undefined" &&
        typeof AudioWorkletNode !== "undefined"
    );
  }, []);

  const refreshActivity = () =>
    setActivity(vad.current.inSpeech ? "speaking" : pendingRef.current > 0 ? "transcribing" : "idle");

  const drain = () => {
    let changed = false;
    while (resultsRef.current.has(nextEmitRef.current)) {
      const t = resultsRef.current.get(nextEmitRef.current)!;
      resultsRef.current.delete(nextEmitRef.current);
      nextEmitRef.current += 1;
      if (t) { partsRef.current.push(t); changed = true; }
    }
    if (changed) setTranscript(partsRef.current.join(" "));
  };

  const transcribe = (clip: Clip) => {
    const seq = seqRef.current++;
    pendingRef.current += 1;
    console.log(`[mic] clip #${seq} peak=${clip.peak.toFixed(3)} rms=${clip.rms.toFixed(4)} gain=${clip.gain.toFixed(1)}x`);

    const attemptOnce = async (): Promise<string> => {
      const form = new FormData();
      form.append("audio", clip.blob, "speech.wav");
      form.append("sessionId", optsRef.current.sessionId);
      // For diagnosing bad transcripts (logged by the server, not trusted for anything)
      form.append("peak", clip.peak.toFixed(3));
      form.append("rms", clip.rms.toFixed(4));
      form.append("gain", clip.gain.toFixed(1));
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch("/api/stt", { method: "POST", body: form, signal: ctrl.signal });
        if (!res.ok) throw Object.assign(new Error(`stt ${res.status}`), { status: res.status });
        const data = await res.json();
        return typeof data?.text === "string" ? data.text.trim() : "";
      } finally {
        clearTimeout(timer);
      }
    };

    (async () => {
      let text = "";
      try {
        try {
          text = await attemptOnce();
        } catch (e) {
          const status = (e as { status?: number }).status;
          if (status && status < 500 && status !== 429) throw e; // a refusal won't improve on retry
          await sleep(500);
          text = await attemptOnce();
        }
      } catch {
        optsRef.current.onError?.("transcribe");
      }
      resultsRef.current.set(seq, text);
      pendingRef.current -= 1;
      drain();
      refreshActivity();
    })();
  };

  const finalize = () => {
    const v = vad.current;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const frameMs = (FRAME / ctx.sampleRate) * 1000;
    const keepTrail = Math.ceil(TRAIL_KEEP_MS / frameMs);
    const cut = Math.max(0, v.silentRun - keepTrail);
    const frames = cut > 0 ? v.seg.slice(0, v.seg.length - cut) : v.seg;
    const speechMs = v.speechFrames * frameMs;

    v.inSpeech = false;
    v.voicedRun = 0;
    v.silentRun = 0;
    v.speechFrames = 0;
    v.seg = [];
    v.pre = [];

    if (speechMs >= MIN_SPEECH_MS && frames.length) transcribe(encodeWav(frames, ctx.sampleRate));
    refreshActivity();
  };

  // Called for every ~43 ms of microphone audio. Only touches refs, so it never goes stale.
  const onFrameRef = useRef<(frame: Float32Array) => void>(() => { });
  onFrameRef.current = (frame) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const v = vad.current;

    if (!enabledRef.current) { v.pre = []; return; } // gate closed: the interviewer is talking, or the mic is muted

    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    const frameMs = (FRAME / ctx.sampleRate) * 1000;
    const threshold = Math.max(MIN_THRESHOLD, v.floor * FLOOR_MULT);
    const voiced = rms > (v.inSpeech ? threshold * 0.6 : threshold);

    if (!v.inSpeech) {
      v.pre.push(frame);
      const maxPre = Math.ceil(PRE_ROLL_MS / frameMs);
      if (v.pre.length > maxPre) v.pre.shift();
      if (voiced) {
        v.voicedRun += 1;
        if (v.voicedRun >= START_FRAMES) {
          v.inSpeech = true;
          v.seg = [...v.pre];
          v.speechFrames = v.voicedRun;
          v.silentRun = 0;
          lastVoiceAtRef.current = Date.now();
          refreshActivity();
          optsRef.current.onSpeechStart?.();
        }
      } else {
        v.voicedRun = 0;
        v.floor = Math.min(0.05, v.floor * 0.98 + rms * 0.02); // follows the room's background level
      }
      return;
    }

    v.seg.push(frame);
    if (voiced) {
      v.silentRun = 0;
      v.speechFrames += 1;
      lastVoiceAtRef.current = Date.now();
    } else {
      v.silentRun += 1;
    }
    if (v.silentRun * frameMs >= END_SILENCE_MS || v.seg.length * frameMs >= MAX_SEGMENT_MS) finalize();
  };

  const init = useCallback((): Promise<boolean> => {
    if (initRef.current) return initRef.current;
    initRef.current = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        });
        const ctx = new AudioContext();
        await ctx.resume().catch(() => { });
        const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
        try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
        const source = ctx.createMediaStreamSource(stream);
        const node = new AudioWorkletNode(ctx, "mq-capture", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
        node.port.onmessage = (e) => onFrameRef.current(e.data as Float32Array);
        const mute = ctx.createGain();
        mute.gain.value = 0; // some browsers only run the worklet when it is connected to the output
        source.connect(node);
        node.connect(mute);
        mute.connect(ctx.destination);
        streamRef.current = stream;
        ctxRef.current = ctx;
        setMicAvailable(true);
        return true;
      } catch {
        initRef.current = null;
        setMicAvailable(false);
        optsRef.current.onError?.("mic");
        return false;
      }
    })();
    return initRef.current;
  }, []);

  /** Open the gate: speech from now on is captured. Asks for the microphone the first time. */
  const start = useCallback(() => {
    enabledRef.current = true;
    void init().then(async (ok) => {
      if (!ok) return;
      await ctxRef.current?.resume().catch(() => { });
      if (enabledRef.current) setListening(true);
    });
  }, [init]);

  /** Close the gate (interviewer talking, mic muted). Speech already under way is sent first. */
  const stop = useCallback(() => {
    enabledRef.current = false;
    setListening(false);
    if (vad.current.inSpeech) finalize();
  }, []);

  /** Forget the text collected so far (it has been sent). Clips still being transcribed are kept. */
  const reset = useCallback(() => {
    partsRef.current = [];
    setTranscript("");
  }, []);

  /** Close the gate and give the microphone back to the browser (the "mic in use" light goes off). */
  const release = useCallback(() => {
    enabledRef.current = false;
    setListening(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => { });
    ctxRef.current = null;
    initRef.current = null;
    vad.current.inSpeech = false;
    vad.current.seg = [];
    vad.current.pre = [];
  }, []);

  useEffect(() => {
    // Browsers keep audio paused until the person interacts with the page
    const resume = () => { void ctxRef.current?.resume().catch(() => { }); };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      release();
    };
  }, [release]);

  return { supported, micAvailable, listening, activity, transcript, lastVoiceAtRef, start, stop, release, reset };
}
