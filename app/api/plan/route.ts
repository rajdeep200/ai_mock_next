import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan, getCurrentUsage } from "@/lib/usage";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, plan } = await getUserPlan(userId);
  const usage = await getCurrentUsage(userId);

  return NextResponse.json({
    plan: { id: planId, ...plan },
    usage,
  });
}
