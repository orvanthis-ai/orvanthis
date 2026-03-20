import { NextResponse } from "next/server";
import {
  getAgentChecks,
  getEnvHealthChecks,
  getStaticProductChecks,
  summarizeHealth,
} from "@/lib/app-health";
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

  const envChecks = getEnvHealthChecks();
  const productChecks = getStaticProductChecks();
  const agentChecks = getAgentChecks();

  const allChecks = [...envChecks, ...productChecks, ...agentChecks];
  const summary = summarizeHealth(allChecks);

  return NextResponse.json({
    summary,
    envChecks,
    productChecks,
    agentChecks,
    currentPlan: access.plan,
  });
}