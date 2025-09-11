import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

type LeanUserType = {
  clerkId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
};

function normalizePhone(input?: string) {
  return (input || "").replace(/[^\d]/g, "");
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDB();
  const user = (await User.findOne({
    clerkId: userId,
  }).lean<LeanUserType>()) as LeanUserType | null;
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      name: user.name || user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
    },
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
  };

  const update: Record<string, any> = {};
  if (typeof body.name === "string") {
    update.name = body.name.trim();
    update.fullName = update.name;
  }

  if (typeof body.phone === "string") {
    const phone = normalizePhone(body.phone);
    if (phone && !/^\d{6,15}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    update.phone = phone || "";
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  console.log('update -->> ', update)

  await connectToDB();
  const updated = (await User.findOneAndUpdate(
    {
      clerkId: userId,
    },
    {
      $set: update,
    },
    {
      new: true,
    }
  ).lean<LeanUserType>()) as LeanUserType | null;

  console.log('updated -->> ', updated)

  if (!updated)
    return NextResponse.json(
      {
        error: "Failed to update user profile",
      },
      {
        status: 400,
      }
    );

  return NextResponse.json({
    ok: true,
    user: {
      name: updated.name || updated.fullName || "",
      email: updated.email || "",
      phone: updated.phone || "",
    },
  });
}
