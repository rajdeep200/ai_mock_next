// app/api/plan/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongodb";
import { PLANS, monthKey } from "@/lib/plans";
import { getUserPlan, getCurrentUsage } from "@/lib/usage";

export const runtime = "nodejs";        // ✅ Mongoose requires Node.js runtime
export const dynamic = "force-dynamic"; // ✅ don't pre-render; always run on server

export async function GET() {
  console.log("INSIDE PLAN API")
  const { userId } = await auth();

  // 1) Try to connect to Mongo first. If it fails, return Free defaults.
  try {
    await connectToDB();
  } catch {
    return NextResponse.json(
      {
        plan: { id: "free", ...PLANS.free },
        usage: { interviewsCount: 0, month: monthKey() },
        note: "DB unavailable; defaulting to Free.",
      },
      { status: 200 }
    );
  }

  // 2) If user not signed in, show Free plan (no 401—pricing page can still render)
  if (!userId) {
    return NextResponse.json(
      {
        plan: { id: "free", ...PLANS.free },
        usage: { interviewsCount: 0, month: monthKey() },
      },
      { status: 200 }
    );
  }

  // 3) Load user plan + usage; if anything throws, fall back to Free
  try {
    const { planId, plan } = await getUserPlan(userId);
    const usage = await getCurrentUsage(userId);

    return NextResponse.json({
      plan: { id: planId, ...plan },
      usage,
    });
  } catch {
    return NextResponse.json(
      {
        plan: { id: "free", ...PLANS.free },
        usage: { interviewsCount: 0, month: monthKey() },
        note: "Query failed; defaulting to Free.",
      },
      { status: 200 }
    );
  }
}
