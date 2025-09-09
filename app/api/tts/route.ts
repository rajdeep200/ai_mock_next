// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { auth } from "@clerk/nextjs/server";

const polly = new PollyClient({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { text, voiceId = "Matthew" } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const cmd = new SynthesizeSpeechCommand({
    Text: text,
    VoiceId: voiceId,
    OutputFormat: "mp3",
    TextType: "text",
  });

  try {
    const { AudioStream } = await polly.send(cmd);
    // AudioStream is a ReadableStream in Node—NextResponse can stream it directly:
    return new NextResponse(AudioStream as any, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Polly error", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
