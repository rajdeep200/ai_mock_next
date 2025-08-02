// app/api/sessions/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/app/models/InterviewSession";
import { Types } from "mongoose";

interface SessionDoc {
  _id: Types.ObjectId;
  technology: string;
  company: string;
  level: string;
  duration: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
  feedback?: string;
}

export async function GET(
  req: NextRequest,
  context: any
) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { params } = context;
  const id: string = params.id;
  
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  try {
    // 2. Connect to MongoDB
    await connectToDB();

    // 3. Find the session for this user
    const session = await InterviewSession.findOne({
      _id: id,
      userId,
    }).lean<SessionDoc>();

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 4. Serialize and return
    return NextResponse.json(
      {
        session: {
          id: session._id.toString(),
          technology: session.technology,
          company: session.company,
          level: session.level,
          duration: session.duration,
          status: session.status,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          // these fields should be set when ending the interview
          summary: session.summary ?? null,
          feedback: session.feedback ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[SESSION_DETAIL_ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
