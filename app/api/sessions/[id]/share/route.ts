// app/api/sessions/[id]/share/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { Types } from "mongoose";
import { z } from "zod";
import crypto from "crypto";

const isOid = (v: string) => Types.ObjectId.isValid(v);

const schema = z
  .object({
    enable: z.boolean(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!isOid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Use application/json" },
      { status: 415 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { enable } = parsed.data;

  await connectToDB();

  const session = await InterviewSession.findOne({ _id: id, userId });
  if (!session)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.status !== "completed") {
    return NextResponse.json(
      { error: "Only completed sessions can be shared" },
      { status: 400 }
    );
  }

  if (enable) {
    if (!session.shareSlug) {
      session.shareSlug = crypto.randomBytes(16).toString("base64url"); // URL-safe
    }
    session.shareEnabled = true;
    session.sharedAt = new Date();
  } else {
    session.shareEnabled = false;
  }

  await session.save();

  return NextResponse.json({
    ok: true,
    shareUrl: session.shareEnabled
      ? `${process.env.NEXT_PUBLIC_APP_URL}/s/${session.shareSlug}`
      : null,
  });
}
