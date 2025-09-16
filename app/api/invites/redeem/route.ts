// app/api/invites/redeem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { connectToDB } from "@/lib/mongodb"; // <-- your existing DB connector (keep as is)
import Invite from "@/models/Invite"; // <-- your Invite schema (the one you pasted)
import { User } from "@/models/User";  // <-- your existing User model

// --- tiny helpers ---
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * POST /api/invites/redeem
 * Body: { token: string }
 *
 * Behavior:
 * - Requires Clerk auth (user must be signed in).
 * - Only allows redemption for users on "free" with no active subscription (i.e., "new users" policy).
 * - Looks up invite via Invite.findUsableByToken(token).
 * - Applies benefit (pro_days) => sets plan='pro' and extends planRenewsAt by N days.
 * - Atomically increments invite.redemptions and flips status if max reached.
 * - Sets redeemedByUserId (first redeemer) if available.
 */
export async function POST(req: NextRequest) {
  try {
    // 1) Auth guard (Clerk)
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Parse input
    const { token } = await req.json().catch(() => ({} as any));
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
    }

    // 3) DB
    await connectToDB();

    // 4) Load user
    const user = await User.findOne({ clerkId });
    if (!user) {
      // In your app you create the User on first sign-in; just a safety check.
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // 5) Enforce "new user only" policy (minimal coupling):
    // - Must be on free plan
    // - Must not have an active/paid subscription
    if (user.plan !== "free" || !!user.subscriptionId) {
      return NextResponse.json(
        {
          error: "Invite is only for new/free users",
          code: "NOT_ELIGIBLE",
          details: {
            plan: user.plan,
            hasSubscription: !!user.subscriptionId,
          },
        },
        { status: 403 }
      );
    }

    // 6) Find a usable invite by token (uses your schema static)
    const invite = await Invite.findUsableByToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or not usable", code: "INVITE_INVALID" },
        { status: 404 }
      );
    }

    // 6.1) OPTIONAL: If you later add InviteRedemption, you can prevent same-user repeat here:
    // const alreadyRedeemed = await InviteRedemption.findOne({ inviteId: invite._id, clerkId });
    // if (alreadyRedeemed) return NextResponse.json({ error: "Already redeemed" }, { status: 409 });

    // 7) Start a transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 7.1) Re-fetch inside the txn with "for update" semantics (by _id) to avoid races
      const freshInvite = await Invite.findById(invite._id).session(session).exec();
      if (!freshInvite) {
        throw new Error("Invite vanished during transaction");
      }

      // Check again inside txn (still usable?)
      const now = Date.now();
      const expired = !!freshInvite.expiresAt && freshInvite.expiresAt.getTime() <= now;
      const statusOk = ["created", "sent"].includes(freshInvite.status);
      const capacityOk = freshInvite.redemptions < freshInvite.maxRedemptions;

      if (!statusOk || expired || !capacityOk) {
        throw new Error("Invite no longer usable");
      }

      // 8) Apply benefit
      if (freshInvite.benefit?.type !== "pro_days") {
        throw new Error("Unsupported benefit type");
      }

      const days = Number(freshInvite.benefit.amount || 0);
      if (!Number.isFinite(days) || days <= 0) {
        throw new Error("Invalid benefit amount");
      }

      // Upgrade user to pro and extend planRenewsAt
      const nowDate = new Date();
      const base = user.planRenewsAt && user.planRenewsAt > nowDate ? user.planRenewsAt : nowDate;
      const newRenewsAt = addDays(base, days);

      user.plan = "pro";
      user.planRenewsAt = newRenewsAt;
      // Keep subscriptionProvider/subscriptionId untouched since this is a promo
      await user.save({ session });

      // 9) Update invite counters & status
      freshInvite.redemptions += 1;

      // For single-use invites, remember the redeemer
      if (!freshInvite.redeemedByUserId && freshInvite.maxRedemptions === 1) {
        freshInvite.redeemedByUserId = clerkId;
      }

      if (freshInvite.redemptions >= freshInvite.maxRedemptions) {
        freshInvite.status = "redeemed";
      }

      await freshInvite.save({ session });

      // 9.1) OPTIONAL: If/when you add InviteRedemption, create a record here.
      // await InviteRedemption.create([{ inviteId: freshInvite._id, clerkId }], { session });

      // 10) Commit txn
      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({
        ok: true,
        applied: {
          benefit: freshInvite.benefit,
          plan: user.plan,
          planRenewsAt: user.planRenewsAt,
        },
        invite: {
          id: freshInvite.id,
          status: freshInvite.status,
          redemptions: freshInvite.redemptions,
          maxRedemptions: freshInvite.maxRedemptions,
        },
      });
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { error: err?.message || "Redemption failed" },
        { status: 400 }
      );
    }
  } catch (e: any) {
    console.error("[INVITE_REDEEM_ERROR]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
