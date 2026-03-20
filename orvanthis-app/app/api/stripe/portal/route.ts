import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "billing_disabled",
      message: "Stripe customer portal is not enabled yet.",
    },
    { status: 503 }
  );
}