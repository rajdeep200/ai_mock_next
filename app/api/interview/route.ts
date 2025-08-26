// app/api/interview/route.ts
import OpenAI from 'openai';
import { REACT_DEV_PROMPT } from '@/lib/prompts';
import { NextRequest, NextResponse } from 'next/server';

// db:
// username: grajdeep2000
// password: t32zawznDU5XW9EZ

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, systemPrompt } = body;

        if (!Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        console.log("messages ::", messages)

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt }, // ✅ Inject dynamic prompt
                ...messages,
            ],
            temperature: 0.7,
        });

        return NextResponse.json({ reply: completion.choices[0].message.content });
    } catch (error) {
        console.error('[Interview API] Error:', error);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
