// app/api/interview/abandon/route.ts
// Called with navigator.sendBeacon when the page is closed or refreshed mid-interview.
// Marks the session ended with a placeholder; real feedback (if any) comes from /summary afterwards.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { FEEDBACK_ABANDONED } from "@/lib/interview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse(null, { status: 401 });

  try {
    const body = await req.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!Types.ObjectId.isValid(sessionId)) return new NextResponse(null, { status: 400 });

    await connectToDB();
    // Only an active session: never touches one that already has its real feedback
    await InterviewSession.updateOne(
      { _id: sessionId, userId, status: "active" },
      { $set: { status: "completed", endTime: new Date(), feedback: FEEDBACK_ABANDONED } }
    );
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
