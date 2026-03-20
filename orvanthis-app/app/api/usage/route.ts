import { NextResponse } from "next/server";
import { getServerAccess } from "@/lib/server-access";

export async function GET() {
  const access = await getServerAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error: access.error,
        message: access.message,
      },
      { status: access.status }
    );
  }

  return NextResponse.json({
    plan: access.plan,
    usage: access.usage,
    limits: access.limits,
  });
}