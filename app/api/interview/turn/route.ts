// app/api/interview/turn/route.ts
// One interviewer turn. The server owns the system prompt, the transcript and every limit:
// the browser only sends its next message.
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { User } from "@/models/User";
import { getPromptsForInterview } from "@/lib/prompts";
import {
  containsEndToken,
  GRACE_SECONDS,
  MAX_CONTEXT_CHARS,
  MAX_LIVE_CODE_CHARS,
  MAX_MESSAGE_CHARS,
  MAX_TURNS,
  MIN_TURN_GAP_MS,
  SILENCE_CHECKIN,
  WRAPUP_INSTRUCTION,
  type ApiErrorCode,
} from "@/lib/interview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const TURN_MODEL = "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = 25_000;

type Role = "user" | "assistant" | "system";
type Msg = { role: Role; content: string };

const bodySchema = z
  .object({
    sessionId: z.string().trim().refine((v) => Types.ObjectId.isValid(v), "invalid sessionId"),
    type: z.enum(["start", "message", "code", "silence", "wrapup"]),
    content: z.string().max(MAX_MESSAGE_CHARS).optional(),
    liveCode: z.string().max(MAX_LIVE_CODE_CHARS * 2).optional(),
  })
  .strict();

const fail = (status: number, error: string, code?: ApiErrorCode, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...(code ? { code } : {}), ...extra }, { status });

// Keep the newest messages within the budget (always keeping the opening message).
function fitToBudget(msgs: Msg[], budget: number): Msg[] {
  let total = msgs.reduce((n, m) => n + m.content.length, 0);
  if (total <= budget) return msgs;
  const [first, ...rest] = msgs;
  while (rest.length > 1 && total > budget) {
    total -= rest.shift()!.content.length;
  }
  return [first, ...rest];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return fail(401, "Unauthorized");

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return fail(400, "Invalid request");
    body = parsed.data;
  } catch {
    return fail(400, "Invalid JSON body");
  }
  const { sessionId, type } = body;
  const content = (body.content ?? "").trim();
  if ((type === "message" || type === "code") && !content) return fail(400, "Message is empty");

  try {
    await connectToDB();

    const session = await InterviewSession.findOne({ _id: sessionId, userId }).lean<{
      status: string;
      technology: string;
      company?: string;
      focus?: string;
      level: string;
      duration: number;
      startTime: Date;
      transcript?: Msg[];
    }>();
    if (!session) return fail(404, "Session not found");
    if (session.status !== "active") return fail(409, "This interview has ended.", "NOT_ACTIVE");

    // Time: the schedule is measured from when the session was created
    const remainingSec = session.duration * 60 - (Date.now() - new Date(session.startTime).getTime()) / 1000;
    if (remainingSec < -GRACE_SECONDS) return fail(403, "The interview time is over.", "TIME_UP");

    const transcript: Msg[] = (session.transcript ?? []).map((m) => ({ role: m.role, content: m.content }));

    // Opening again (e.g. page reopened): hand back the last interviewer message instead of starting over
    if (type === "start" && transcript.length > 0) {
      const last = [...transcript].reverse().find((m) => m.role === "assistant");
      if (last) {
        return NextResponse.json({
          reply: last.content,
          ended: containsEndToken(last.content),
          remainingSec: Math.round(remainingSec),
        });
      }
    }
    if (type !== "start" && transcript.length === 0) return fail(409, "The interview hasn't started.", "NOT_STARTED");

    // Claim a turn: enforces the turn cap and the minimum gap atomically
    const now = new Date();
    const claimed = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId,
        status: "active",
        turnCount: { $lt: MAX_TURNS },
        $or: [
          { lastTurnAt: null },
          { lastTurnAt: { $exists: false } },
          { lastTurnAt: { $lte: new Date(now.getTime() - MIN_TURN_GAP_MS) } },
        ],
      },
      { $set: { lastTurnAt: now }, $inc: { turnCount: 1 } },
      { new: false, projection: { lastTurnAt: 1, turnCount: 1 } }
    ).lean<{ lastTurnAt?: Date | null; turnCount?: number }>();

    if (!claimed) {
      const cur = await InterviewSession.findOne({ _id: sessionId, userId }, { turnCount: 1, status: 1 }).lean<{
        turnCount?: number;
        status?: string;
      }>();
      if (cur?.status !== "active") return fail(409, "This interview has ended.", "NOT_ACTIVE");
      if ((cur?.turnCount ?? 0) >= MAX_TURNS) return fail(403, "This interview reached its turn limit.", "TURN_CAP");
      return fail(429, "Too many requests. Please wait a moment.", "TOO_FAST", { retryAfterMs: MIN_TURN_GAP_MS });
    }

    // What the model sees: server prompt (+clock), stored transcript, this turn's new message
    const added: Msg[] =
      type === "message"
        ? [{ role: "user", content }]
        : type === "code"
          ? [{ role: "user", content: `Here is my code:\n${content}` }]
          : type === "silence"
            ? [{ role: "system", content: SILENCE_CHECKIN }]
            : type === "wrapup"
              ? [{ role: "system", content: WRAPUP_INSTRUCTION }]
              : [];
    // The closing instruction is for the model only: saving it would count as a silence check-in when scoring
    const persisted = type === "wrapup" ? [] : added;

    const dbUser = await User.findOne({ clerkId: userId }).select("fullName").lean<{ fullName?: string }>();
    const candidateName = (dbUser?.fullName ?? "").trim().split(/\s+/)[0] ?? "";

    const minutesLeft = Math.max(0, Math.ceil(remainingSec / 60));
    const clockNote =
      `\n\n# Clock\nAbout ${minutesLeft} minute(s) of the ${session.duration}-minute interview remain. ` +
      `Pace the session accordingly and begin wrapping up when 3 minutes or less remain. ` +
      `Do not announce the exact time unless asked.`;
    const systemPrompt =
      getPromptsForInterview(session.technology.toLowerCase(), session.duration, session.company || undefined, session.level, candidateName, session.focus || undefined) +
      clockNote;

    const history = fitToBudget([...transcript, ...added], MAX_CONTEXT_CHARS);
    const liveCode = (body.liveCode ?? "").slice(0, MAX_LIVE_CODE_CHARS).trim();
    const messages: Msg[] = [
      { role: "system", content: systemPrompt },
      ...history,
      ...(liveCode && type !== "start"
        ? [{
            role: "system" as const,
            content: `CURRENT_CODE (the candidate's editor right now; work in progress, not submitted):\n\`\`\`\n${liveCode}\n\`\`\``,
          }]
        : []),
    ];

    // Give the turn back (turn count and gap) when it fails, so a retry isn't penalised
    const giveBackTurn = () =>
      InterviewSession.updateOne(
        { _id: sessionId, userId, turnCount: { $gt: 0 } },
        { $inc: { turnCount: -1 }, $set: { lastTurnAt: claimed.lastTurnAt ?? null } }
      ).catch(() => { });

    // Start the model stream. Failures here can still be reported as a normal HTTP error.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), OPENAI_TIMEOUT_MS);
    let completion;
    try {
      completion = await openai.chat.completions.create(
        { model: TURN_MODEL, messages, temperature: 0.7, max_completion_tokens: 450, stream: true, stream_options: { include_usage: true } },
        { signal: ctrl.signal }
      );
    } catch (e) {
      clearTimeout(timer);
      console.error("[INTERVIEW_TURN_ERROR]", e);
      await giveBackTurn();
      return fail(502, "The interviewer is unavailable. Please try again.", "UPSTREAM");
    }

    // Stream the reply as newline-delimited JSON events:
    //   {t:"meta",remainingSec}  {t:"delta",text}  {t:"done",reply,ended,remainingSec}  {t:"error",error,code}
    // The exchange is saved only once the reply is complete, so a failed or dropped turn leaves nothing half-written.
    const encoder = new TextEncoder();
    const remaining = Math.round(remainingSec);
    let cancelled = false;
    let tokensIn = 0;
    let tokensOut = 0;
    // What this call cost, recorded even when the turn fails or is dropped (the tokens were spent)
    const recordUsage = () =>
      InterviewSession.updateOne(
        { _id: sessionId, userId },
        { $inc: { "usage.turnCalls": 1, "usage.turnInTokens": tokensIn, "usage.turnOutTokens": tokensOut } }
      ).catch(() => { });
    const eventStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (o: Record<string, unknown>) => {
          if (!cancelled) controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
        };
        try {
          send({ t: "meta", remainingSec: remaining });
          let full = "";
          for await (const chunk of completion) {
            if (chunk.usage) { tokensIn = chunk.usage.prompt_tokens; tokensOut = chunk.usage.completion_tokens; }
            const d = chunk.choices[0]?.delta?.content;
            if (d) {
              full += d;
              send({ t: "delta", text: d });
            }
          }
          const reply = full.trim();
          if (!reply) throw new Error("empty reply");

          const stamped = [...persisted, { role: "assistant" as const, content: reply }].map((m) => ({ ...m, at: new Date() }));
          const saved = await InterviewSession.updateOne(
            { _id: sessionId, userId, status: "active" },
            { $push: { transcript: { $each: stamped } } }
          );
          if (saved.matchedCount === 0) {
            send({ t: "error", error: "This interview has ended.", code: "NOT_ACTIVE" });
          } else {
            send({ t: "done", reply, ended: containsEndToken(reply), remainingSec: remaining });
          }
        } catch (e) {
          if (!cancelled) {
            console.error("[INTERVIEW_TURN_STREAM_ERROR]", e);
            await giveBackTurn();
            send({ t: "error", error: "The interviewer is unavailable. Please try again.", code: "UPSTREAM" });
          }
        } finally {
          clearTimeout(timer);
          await recordUsage();
          try { controller.close(); } catch { /* already closed */ }
        }
      },
      async cancel() {
        // The browser went away: stop the model and give the turn back
        cancelled = true;
        ctrl.abort();
        clearTimeout(timer);
        await giveBackTurn();
      },
    });

    return new Response(eventStream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("[INTERVIEW_TURN_ERROR]", e);
    return fail(500, "Something went wrong");
  }
}
