import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import InterviewSession from "@/models/InterviewSession";

const MONGODB_URI = process.env.MONGODB_URI!;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const { sessionId, rating, comment } = await req.json();

    if (!sessionId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const session = await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $set: {
          customerRating: Math.round(rating),
          customerFeedback: comment || "",
        },
      },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[FEEDBACK_POST_ERROR]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
