import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDB();
    const body = await req.json();
    const { sessionId, feedback } = body;

    if (!sessionId || !feedback) {
      return NextResponse.json(
        { error: "Missing sessionId or feedback" },
        { status: 400 }
      );
    }

    await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        feedback,
        endTime: new Date(),
        status: "completed",
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UPDATE_INTERVIEW] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
