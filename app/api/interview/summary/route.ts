// app/api/interview/summary/route.ts
// Builds the feedback and score from the transcript the server stored, then completes the session.
// The browser can no longer write its own feedback or score.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { evaluateInterview } from "@/lib/scoring";
import { FEEDBACK_FAILED } from "@/lib/interview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z
  .object({ sessionId: z.string().trim().refine((v) => Types.ObjectId.isValid(v), "invalid sessionId") })
  .strict();

const LOCK_MS = 90_000;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sessionId: string;
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    sessionId = parsed.data.sessionId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await connectToDB();

    const existing = await InterviewSession.findOne({ _id: sessionId, userId }).lean<{
      feedbackGenerated?: boolean;
      feedback?: string;
      modelPreparationPercent?: number | null;
    }>();
    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Already done (page reloaded, timer + refresh racing...): return what we have
    if (existing.feedbackGenerated) {
      return NextResponse.json({
        feedback: existing.feedback ?? "",
        percent: existing.modelPreparationPercent ?? null,
        already: true,
      });
    }

    // One summary at a time per session
    const now = new Date();
    const locked = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId,
        feedbackGenerated: { $ne: true },
        $or: [{ summaryLockAt: null }, { summaryLockAt: { $exists: false } }, { summaryLockAt: { $lt: new Date(now.getTime() - LOCK_MS) } }],
      },
      { $set: { summaryLockAt: now } },
      { new: true, projection: { transcript: 1, endTime: 1 } }
    ).lean<{ transcript?: { role: "user" | "assistant" | "system"; content: string; at?: Date }[]; endTime?: Date }>();
    if (!locked) {
      return NextResponse.json({ error: "Feedback is already being generated.", code: "IN_PROGRESS" }, { status: 409 });
    }

    const result = await evaluateInterview(locked.transcript ?? []);
    // A failed evaluation completes the session but leaves feedbackGenerated false, so it can be retried later
    const generated = result.feedback !== FEEDBACK_FAILED;

    await InterviewSession.updateOne(
      { _id: sessionId, userId },
      {
        $set: {
          status: "completed",
          endTime: locked.endTime ?? new Date(),
          feedback: result.feedback,
          modelPreparationPercent: result.percent,
          scoreBreakdown: result.breakdown,
          insights: result.insights,
          feedbackGenerated: generated,
          summaryLockAt: null,
          ...(result.usage ? { "usage.scoreModel": result.usage.model } : {}),
        },
        ...(result.usage
          ? { $inc: { "usage.scoreInTokens": result.usage.inTokens, "usage.scoreOutTokens": result.usage.outTokens } }
          : {}),
      }
    );

    return NextResponse.json({ feedback: result.feedback, percent: result.percent });
  } catch (e) {
    console.error("[INTERVIEW_SUMMARY_ERROR]", e);
    await InterviewSession.updateOne({ _id: sessionId, userId }, { $set: { summaryLockAt: null } }).catch(() => { });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
