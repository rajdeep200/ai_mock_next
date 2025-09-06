// app/api/sessions/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { Types } from "mongoose";
import { z } from "zod";

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

// Helpers
const isValidObjectId = (v: string) => Types.ObjectId.isValid(v);

const paramsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "session id is required")
    .refine(isValidObjectId, "invalid session id"),
});

// Note: params is a Promise now — await it.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id?: string }> }
) {
  // 1) Auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Await params, then validate
  const { id: rawId = "" } = await ctx.params;
  const parsed = paramsSchema.safeParse({ id: rawId });
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return NextResponse.json(
      { error: "Validation failed", details: { fieldErrors, formErrors } },
      { status: 400 }
    );
  }
  const { id } = parsed.data;

  try {
    // 3) DB connect
    await connectToDB();

    // 4) Find session scoped to user
    const session = await InterviewSession.findOne({
      _id: id,
      userId,
    }).lean<SessionDoc>();

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 5) Serialize
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
