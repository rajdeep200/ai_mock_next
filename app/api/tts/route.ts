// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { auth } from "@clerk/nextjs/server";
import { Readable } from "node:stream";

export const runtime = "nodejs"; // ✅ Polly needs Node runtime (not edge)

// Reuse client across invocations
const polly = new PollyClient({
  region: process.env.AWS_REGION || "ap-south-1",
  // creds are read from env on Vercel: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
});

type Body = {
  text?: string;      // plain text input
  ssml?: string;      // optional SSML (mutually exclusive with text)
  voiceId?: string;   // e.g., "Raveena", "Joanna", "Matthew"
  engine?: "neural" | "standard";
  rate?: "slow" | "medium" | "fast"; // only used when we wrap text into SSML
};

const MAX_CHARS = 2800; // keep below Polly’s ~3000 char limit (safe margin)

// Tiny helper: wrap plain text into SSML with optional prosody
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

export async function POST(req: NextRequest) {
  // 🔐 Gate behind auth (optional—remove if you want public TTS)
  const { userId } = await auth(); // Clerk is sync here
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

  const voiceId = body.voiceId || process.env.POLLY_DEFAULT_VOICE || "Raveena";
  const engine = body.engine || "neural"; // better quality if available

  const cmd = new SynthesizeSpeechCommand({
    Text: ssml,
    TextType: "ssml",      // ✅ we always send SSML now (even when user gave plain text)
    VoiceId: "Matthew",
    Engine: engine,
    OutputFormat: "mp3",
  });

  try {
    const out = await polly.send(cmd);
    if (!out.AudioStream) {
      return NextResponse.json({ error: "No audio stream" }, { status: 502 });
    }

    // Polly v3 returns a Node Readable (Buffer stream). Convert → Web stream for NextResponse
    // Node 18+: Readable.toWeb is available.
    const nodeReadable = out.AudioStream as unknown as Readable;
    const webStream = Readable.toWeb(nodeReadable) as unknown as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store", // or "public, max-age=600" if you want client cache
      },
    });
  } catch (err: any) {
    // Log minimal info (avoid leaking text)
    console.error("[POLLY] TTS error:", err?.name || err?.message || err);
    // Fallback: you could return a tiny error beep mp3 here
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
