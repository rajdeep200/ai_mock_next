// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PollyClient,
  SynthesizeSpeechCommand,
  type VoiceId,      // ✅ ADDED
  type Engine,       // ✅ ADDED
} from "@aws-sdk/client-polly";
import { auth } from "@clerk/nextjs/server";
import { Readable } from "node:stream";

export const runtime = "nodejs";

// Reuse client across invocations
const polly = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1"
});

type Body = {
  text?: string;      // plain text input
  ssml?: string;      // optional SSML (mutually exclusive with text)
  voiceId?: string;   // e.g., "Raveena", "Joanna", "Matthew"
  engine?: "neural" | "standard";
  rate?: "slow" | "medium" | "fast";
  langHint?: "en-IN" | "en-US"; // optional, helps pick a fallback
};

const MAX_CHARS = 2800;

function toSSML({ text, ssml, rate }: { text?: string; ssml?: string; rate?: Body["rate"] }) {
  if (ssml) return ssml.trim();
  const safe = (text || "").trim();
  if (!safe) return "";
  const r = rate || "medium";
  const escaped = safe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<speak><prosody rate="${r}">${escaped}</prosody></speak>`;
}

const ALLOWED_VOICES = new Set<VoiceId>([
  "Matthew", "Joanna", "Justin", "Ivy", "Salli", "Kendra", "Kimberly", // en-US
  "Raveena", "Aditi", "Kajal",                                        // en-IN
]);

function pickVoiceId(raw: string | undefined, langHint?: string): VoiceId {
  const fallback = langHint === "en-IN" ? "Raveena" : "Matthew";
  const candidate = (raw || process.env.POLLY_DEFAULT_VOICE || fallback) as VoiceId;
  return ALLOWED_VOICES.has(candidate) ? candidate : fallback as VoiceId;
}

function pickEngine(raw: Body["engine"] | undefined): Engine {
  const e = (raw || process.env.POLLY_ENGINE || "neural") as Engine;
  return e === "neural" || e === "standard" ? e : "neural";
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ssml = toSSML({ text: body.text, ssml: body.ssml, rate: body.rate });
  if (!ssml) return NextResponse.json({ error: "No text provided" }, { status: 400 });
  if (ssml.length > MAX_CHARS) {
    return NextResponse.json({ error: `Text too long (>${MAX_CHARS} chars)` }, { status: 413 });
  }

  const voiceId = pickVoiceId(body.voiceId, body.langHint);  // <<-- VoiceId
  const engine = 'standard';                   // <<-- Engine

  const cmd = new SynthesizeSpeechCommand({
    Text: ssml,
    TextType: "ssml",
    VoiceId: voiceId,
    Engine: engine,
    OutputFormat: "mp3",
  });

  try {
    const out = await polly.send(cmd);
    if (!out.AudioStream) {
      return NextResponse.json({ error: "No audio stream" }, { status: 502 });
    }

    const nodeReadable = out.AudioStream as unknown as Readable;
    const webStream = Readable.toWeb(nodeReadable) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    // If you ever see AccessDenied again, it's IAM/region—not API code.
    console.error("[POLLY] TTS error:", err || err?.name || err?.message);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
