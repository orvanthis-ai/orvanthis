import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "billing_disabled",
      message: "Stripe checkout is not enabled yet.",
    },
    { status: 503 }
  );
}