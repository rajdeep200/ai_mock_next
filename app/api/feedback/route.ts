// app/api/feedback/route.ts (or your current file)
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import InterviewSession from "@/models/InterviewSession";
import { z } from "zod";

const MONGODB_URI = process.env.MONGODB_URI!;

// --- Helpers ---
const isValidObjectId = (v: string) => mongoose.Types.ObjectId.isValid(v);

// --- Validation schema ---
const feedbackSchema = z
  .object({
    sessionId: z
      .string()
      .trim()
      .min(1, "sessionId is required")
      .refine(isValidObjectId, "sessionId must be a valid Mongo ObjectId"),
    rating: z
      .coerce.number()
      .int("rating must be an integer")
      .min(1, "rating must be between 1 and 5")
      .max(5, "rating must be between 1 and 5"),
    comment: z
      .string()
      .trim()
      .max(2000, "comment is too long")
      .optional()
      .default(""),
  })
  .strict(); // disallow extra fields (e.g., userId injected from client)

export async function POST(req: Request) {
  try {
    // 1) Auth (token already verified by Clerk)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Require JSON content type
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Unsupported Media Type. Use application/json." },
        { status: 415 }
      );
    }

    // 3) Parse & validate body
    let body: z.infer<typeof feedbackSchema>;
    try {
      const json = await req.json();
      const parsed = feedbackSchema.safeParse(json);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        return NextResponse.json(
          { error: "Validation failed", details: { fieldErrors, formErrors } },
          { status: 400 }
        );
      }
      body = parsed.data;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { sessionId, rating, comment } = body;

    // 4) DB connect
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    // 5) Update feedback, scoped to authenticated user
    const session = await InterviewSession.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $set: {
          customerRating: rating, // already int by schema
          customerFeedback: comment || "",
        },
      },
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 6) OK
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[FEEDBACK_POST_ERROR]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
