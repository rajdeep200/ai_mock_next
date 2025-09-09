// app/api/interview/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/crypto";
import { auth } from "@clerk/nextjs/server";

// db:
// username: grajdeep2000
// password: t32zawznDU5XW9EZ

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
const ENC_KEY = process.env.NEXT_PUBLIC_ENC_KEY!;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { messages, systemPrompt } = await decrypt(body, ENC_KEY);

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    console.log('systemPrompt -->> ', systemPrompt)
    console.log('messages -->> ', messages)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt }, // ✅ Inject dynamic prompt
        ...messages,
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    const encOut = await encrypt({ reply: response }, ENC_KEY);

    return NextResponse.json(encOut);
  } catch (error) {
    console.error("[Interview API] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
