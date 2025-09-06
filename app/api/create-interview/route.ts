import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { checkCanStartInterview, recordInterviewStart } from "@/lib/usage";
import { z } from "zod";

const createInterviewSchema = z
  .object({
    technology: z
      .string()
      .trim()
      .min(1, "Technology required")
      .max(30, "Technology is too long"),
    company: z
      .string()
      .trim()
      .max(80, "company is too long")
      .optional()
      .default(""),
    level: z.enum(["easy", "medium", "hard"], {
      required_error: "Level required",
      invalid_type_error: "level must be one of easy | medium | hard",
    }),
    duration: z.coerce
      .number()
      .int("duration must be an integer (minutes)")
      .min(5, "duration must be at least 5 minutes")
      .max(60, "duration cannot exceed 60 minutes")
      .refine((n) => n % 5 == 0, "duration must be in 5-minute increments"),
  })
  .strict();

export async function POST(req: NextRequest) {
  // 1. Ensure user is signed in
  const { userId } = await auth();
  console.log("userId :: ", userId);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // validate body
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLocaleLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Unsupported Media Type. Use application/json." },
      { status: 415 }
    );
  }

  let parsedBody: z.infer<typeof createInterviewSchema> | undefined;

  try {
    const jsonBody = await req.json();
    const parsed = createInterviewSchema.safeParse(jsonBody);
    if (!parsed.success) {
      const { fieldErrors, formErrors } = parsed.error.flatten();
      return NextResponse.json(
        {
          error: "Validation failed",
          details: { fieldErrors, formErrors },
        },
        { status: 400 }
      );
    }
    parsedBody = parsed.data;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Parse & validate body
  const { technology, company, level, duration } = parsedBody;

  try {
    // 3. Connect to DB
    await connectToDB();

    // 🔐 enforce plan limits
    const canStart = await checkCanStartInterview(userId, duration);
    if (!canStart.ok) {
      return NextResponse.json(
        { error: canStart.reason, code: canStart.code },
        { status: 402 }
      );
    }

    // 4. Create new session
    const session = await InterviewSession.create({
      userId,
      technology,
      company: company || "",
      level,
      duration,
      status: "active",
    });

    // 📈 record usage
    await recordInterviewStart(userId, duration);

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
