// app/api/stt/route.ts
// Turns one spoken clip (16 kHz mono WAV, cut out by the browser's voice detector) into text.
// The browser sends audio only; the session is looked up by { _id, userId } and must still be active.
import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { MAX_STT_BYTES, MAX_STT_CALLS, type ApiErrorCode } from "@/lib/interview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const STT_MODEL = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";
const FALLBACK_MODEL = "whisper-1";
const STT_TIMEOUT_MS = 20_000;
const WAV_HEADER_BYTES = 44;
const WAV_BYTES_PER_SECOND = 32_000; // 16 kHz x 16-bit x mono

// No `prompt` is sent: on quiet or short clips the model echoes it back as if it were the speech.

// Speech models sometimes invent a stock phrase when a clip is mostly noise
const STOCK_HALLUCINATION = /^(thank you( very much)?|thanks for watching|you)[.!\s]*$/i;

// Output that is not a transcript of English speech: an echoed prompt ("context: ###", "terms that may appear"),
// or text in another script (we ask for English, so that is the model guessing on noise)
const PROMPT_ECHO = /context:\s*#{2,}|terms that may appear|coding interview about data structures/i;
const NON_LATIN = /[Ͱ-ϿЀ-ԯ֐-ۿऀ-෿฀-๿぀-ヿ㐀-鿿가-힯]/;

const num = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const fail = (status: number, error: string, code?: ApiErrorCode) =>
  NextResponse.json({ error, ...(code ? { code } : {}) }, { status });

async function transcribe(bytes: Buffer, model: string): Promise<string> {
  const file = await toFile(bytes, "speech.wav", { type: "audio/wav" });
  const r = await openai.audio.transcriptions.create(
    { file, model, language: "en" },
    { signal: AbortSignal.timeout(STT_TIMEOUT_MS) }
  );
  return (r.text ?? "").trim();
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const { userId } = await auth();
  if (!userId) return fail(401, "Unauthorized");
  const tAuth = Date.now();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Invalid form data");
  }

  const sessionId = String(form.get("sessionId") ?? "");
  const audio = form.get("audio");
  if (!Types.ObjectId.isValid(sessionId)) return fail(400, "Invalid sessionId");
  if (!(audio instanceof Blob)) return fail(400, "Missing audio");
  if (audio.size <= WAV_HEADER_BYTES || audio.size > MAX_STT_BYTES) return fail(400, "Audio size not allowed");

  const bytes = Buffer.from(await audio.arrayBuffer());
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") return fail(400, "Audio must be WAV");
  const seconds = (bytes.length - WAV_HEADER_BYTES) / WAV_BYTES_PER_SECOND;
  const tRead = Date.now();

  try {
    // Start the transcription right away: it does not depend on the database check below, so the two run side by side.
    // If the check refuses the clip, the transcript is simply thrown away. `speech` never rejects (no unhandled rejection).
    const speech = (async (): Promise<{ text: string; usedModel: string; ms: number } | null> => {
      const t = Date.now();
      try {
        return { text: await transcribe(bytes, STT_MODEL), usedModel: STT_MODEL, ms: Date.now() - t };
      } catch (e) {
        console.error("[STT_ERROR]", STT_MODEL, e);
        try {
          return { text: await transcribe(bytes, FALLBACK_MODEL), usedModel: FALLBACK_MODEL, ms: Date.now() - t };
        } catch (e2) {
          console.error("[STT_FALLBACK_ERROR]", e2);
          return null;
        }
      }
    })();

    // Count this clip against the session's cap (atomic) and make sure the interview is still live
    const dbStart = Date.now();
    await connectToDB();
    const counted = await InterviewSession.updateOne(
      { _id: sessionId, userId, status: "active", "usage.sttCalls": { $lt: MAX_STT_CALLS } },
      { $inc: { "usage.sttCalls": 1, "usage.sttSeconds": Math.round(seconds * 10) / 10 } }
    );
    const dbMs = Date.now() - dbStart;
    if (counted.matchedCount === 0) {
      const cur = await InterviewSession.findOne({ _id: sessionId, userId }, { status: 1 }).lean<{ status?: string }>();
      if (!cur) return fail(404, "Session not found");
      if (cur.status !== "active") return fail(409, "This interview has ended.", "NOT_ACTIVE");
      return fail(403, "This interview reached its speech limit.", "STT_CAP");
    }

    const result = await speech;
    if (!result) return fail(502, "Speech recognition is unavailable. Please try again.", "UPSTREAM");
    let text = result.text;
    const usedModel = result.usedModel;

    // Where the time goes. `warn` on purpose: production builds strip console.log/info, but keep warn and error, so this shows in Vercel logs.
    console.warn(`[STT_TIMING] auth=${tAuth - t0}ms read=${tRead - tAuth}ms db=${dbMs}ms openai=${result.ms}ms total=${Date.now() - t0}ms clip=${Math.round(bytes.length / 1024)}KB/${seconds.toFixed(1)}s model=${usedModel}`);

    const raw = text;
    let dropped: string | null = null;
    if (seconds < 1.5 && STOCK_HALLUCINATION.test(text)) dropped = "stock";
    else if (PROMPT_ECHO.test(text)) dropped = "prompt-echo";
    else if (NON_LATIN.test(text)) dropped = "non-latin";
    if (dropped) text = "";

    // Only warn (production builds strip other console levels) when something looks off, so bad transcripts can be traced
    const peak = num(form.get("peak"));
    if (dropped || usedModel !== STT_MODEL || (peak !== undefined && peak < 0.1)) {
      console.warn("[STT]", JSON.stringify({
        sessionId, model: usedModel, seconds: Math.round(seconds * 10) / 10,
        peak, rms: num(form.get("rms")), gain: num(form.get("gain")),
        dropped, raw: raw.slice(0, 120),
      }));
    }
    return NextResponse.json({ text });
  } catch (e) {
    console.error("[STT_ERROR]", e);
    return fail(500, "Something went wrong");
  }
}
