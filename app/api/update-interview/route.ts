// app/api/update-interview/route.ts (or your current path)
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { Types } from "mongoose";
import { z } from "zod";

const isValidObjectId = (v: string) => Types.ObjectId.isValid(v);

// --- Validation schema ---
const updateInterviewSchema = z
  .object({
    sessionId: z
      .string()
      .trim()
      .min(1, "sessionId is required")
      .refine(isValidObjectId, "sessionId must be a valid Mongo ObjectId"),
    feedback: z
      .string({ required_error: "feedback is required" })
      .trim()
      .min(1, "feedback cannot be empty")
      .max(5000, "feedback is too long"),
  })
  .strict(); // disallow extra fields (e.g., userId)

export async function POST(req: NextRequest) {
  try {
    // 1) Auth
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2) Require JSON
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported Media Type. Use application/json." },
        { status: 415 }
      );
    }

    // 3) Parse & validate
    let payload: z.infer<typeof updateInterviewSchema>;
    try {
      const json = await req.json();
      const parsed = updateInterviewSchema.safeParse(json);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        return NextResponse.json(
          { error: "Validation failed", details: { fieldErrors, formErrors } },
          { status: 400 }
        );
      }
      payload = parsed.data;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { sessionId, feedback } = payload;

    // 4) DB connect
    await connectToDB();

    // 5) Update (scoped to authenticated user)
    const updated = await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $set: {
          feedback,
          endTime: new Date(),
          status: "completed",
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 6) OK
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[UPDATE_INTERVIEW] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
