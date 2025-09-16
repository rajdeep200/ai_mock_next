import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { requireAdminToken } from "@/lib/authz";
import { connectToDB } from "@/lib/mongodb";
import Invite from "@/models/Invite";

const BodySchema = z.object({
  benefit: z.object({
    type: z.literal("pro_days"),
    amount: z.number().int().positive(),
  }),
  maxRedemptions: z.number().int().positive().default(1),
  expiresInDays: z.number().int().positive().max(365).default(30),
  campaign: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

function base64url(bytes: Uint8Array) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getBaseUrl(req: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0];
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  if (!requireAdminToken(req)) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { benefit, maxRedemptions, expiresInDays, campaign, notes } =
      BodySchema.parse(body);
    
    await connectToDB()
    const rawToken = base64url(crypto.randomBytes(24))
    const tokenHash = Invite.hashToken(rawToken)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const doc = await Invite.create({
      tokenHash,
      benefit,
      maxRedemptions,
      expiresAt,
      issuedByUserId: "admin:token",
    });

    const base = getBaseUrl(req);
    const inviteUrl = `${base}/invite/${rawToken}`;

    return NextResponse.json(
      {
        invite: {
          id: String(doc._id),
          benefit: doc.benefit,
          maxRedemptions: doc.maxRedemptions,
          redemptions: doc.redemptions,
          campaign: doc.campaign || null,
          notes: doc.notes || null,
          expiresAt: doc.expiresAt?.toISOString() || null,
          issuedByUserId: doc.issuedByUserId || null,
          createdAt: doc.createdAt?.toISOString() || null,
          updatedAt: doc.updatedAt?.toISOString() || null,
        },
        token: rawToken,
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.issues) {
      // zod validation error
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 422 });
    }
    console.error("[INVITES_CREATE_ERROR]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
