import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/app/models/InterviewSession";

export async function POST(req: NextRequest) {
  // 1. Ensure user is signed in
  const { userId } = await auth();
  console.log("userId :: ", userId)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse & validate body
  const { technology, company, level, duration } = await req.json();
  if (!technology || !level || typeof duration !== "number") {
    return NextResponse.json(
      { error: "Missing or invalid fields: technology, level, duration" },
      { status: 400 }
    );
  }

  try {
    // 3. Connect to DB
    await connectToDB();

    // 4. Create new session
    const session = await InterviewSession.create({
      userId,
      technology,
      company: company || "",
      level,
      duration,
      status: "active",
    });

    // 5. Return the session ID
    return NextResponse.json(
      { sessionId: session._id.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[CREATE_INTERVIEW_ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
