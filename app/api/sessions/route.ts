// app/api/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/app/models/InterviewSession";
import type { Types } from 'mongoose';

interface SessionDoc {
  _id: Types.ObjectId;
  technology: string;
  company: string;
  level: string;
  duration: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Connect to MongoDB
    await connectToDB();

    // 3. Query sessions for this user
    const sessions = await InterviewSession.find({ userId })
      .sort({ createdAt: -1 })
      .lean<SessionDoc[]>();

    // 4. Serialize _id and dates for JSON
    const payload = sessions.map((s) => ({
      id: s._id.toString(),
      technology: s.technology,
      company: s.company,
      level: s.level,
      duration: s.duration,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ sessions: payload }, { status: 200 });
  } catch (error) {
    console.error("[SESSIONS_API_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}
