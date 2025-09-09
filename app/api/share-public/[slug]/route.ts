// app/api/share-public/[slug]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import InterviewSession from "@/models/InterviewSession";
import { z } from "zod";
import type { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // avoid dev cache surprises

// If you want to be strict about slug shape, tweak this regex to your generator.
const paramsSchema = z.object({
  slug: z.string().min(8, "invalid slug").max(128, "invalid slug"),
});

type SharePublicDoc = {
  _id: Types.ObjectId;

  technology?: string;
  level?: string;
  duration?: number;
  company?: string;

  modelPreparationPercent?: number | null;

  updatedAt?: Date;

  // Optional extras if you added them to the schema
  shareDisplayName?: string | null;
  shareAvatarUrl?: string | null;
};

// NOTE: In App Router, params can be a Promise—await it.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug?: string }> }
) {
  try {
    const { slug = "" } = await ctx.params;
    console.log('slug -->> ', slug)

    const parsed = paramsSchema.safeParse({ slug });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, reason: "bad_request" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Only expose sessions that are explicitly share-enabled
    const doc = await InterviewSession.findOne(
      { shareSlug: slug, shareEnabled: true },
      {
        technology: 1,
        level: 1,
        duration: 1,
        company: 1,
        modelPreparationPercent: 1,
        updatedAt: 1,

        // Optional extras if you added them to the schema
        shareDisplayName: 1,
        shareAvatarUrl: 1,
      }
    ).lean<SharePublicDoc | null>();

    console.log("doc -->> ", doc);

    if (!doc) {
      return NextResponse.json(
        { ok: false, reason: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          technology: doc.technology ?? null,
          level: doc.level ?? null,
          duration: typeof doc.duration === "number" ? doc.duration : null,
          company: doc.company ?? null,
          modelPreparationPercent:
            typeof doc.modelPreparationPercent === "number"
              ? doc.modelPreparationPercent
              : null,
          updatedAt: doc.updatedAt
            ? new Date(doc.updatedAt).toISOString()
            : null,

          // Optional (only if present in your schema)
          displayName: (doc as any).shareDisplayName ?? null,
          avatarUrl: (doc as any).shareAvatarUrl ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[SHARE_PUBLIC_GET_ERROR]", err);
    return NextResponse.json(
      { ok: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
