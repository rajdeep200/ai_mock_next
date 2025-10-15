// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { auth } from "@clerk/nextjs/server";
import { Readable } from "node:stream";

export const runtime = "nodejs";

// Reuse client across invocations
const polly = new PollyClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

type Body = {
  text?: string;      // plain text input
  ssml?: string;      // optional SSML (mutually exclusive with text)
  voiceId?: string;   // e.g., "Raveena", "Joanna", "Matthew"
  engine?: "neural" | "standard";
  rate?: "slow" | "medium" | "fast";
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

  const voiceId = body.voiceId || process.env.POLLY_DEFAULT_VOICE || "Raveena";
  const engine = body.engine || "neural";

  const cmd = new SynthesizeSpeechCommand({
    Text: ssml,
    TextType: "ssml",
    VoiceId: "Matthew",
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
        "Cache-Control": "no-store"
      },
    });
  } catch (err: any) {
    console.error("[POLLY] TTS error:", err?.name || err?.message || err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
