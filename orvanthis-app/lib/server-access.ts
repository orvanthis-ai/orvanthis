import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AppPlan = "free" | "premium" | "premium_plus";

export type UsageState = {
  assistantCalls: number;
  reportsGenerated: number;
};

export type UsageLimits = {
  assistantCalls: number;
  reportsGenerated: number;
};

function normalizePlan(plan: string | null | undefined): AppPlan {
  if (plan === "premium") return "premium";
  if (plan === "premium_plus") return "premium_plus";
  return "free";
}

export function getLimitsForPlan(plan: AppPlan): UsageLimits {
  if (plan === "premium_plus") {
    return {
      assistantCalls: 500,
      reportsGenerated: 250,
    };
  }

  if (plan === "premium") {
    return {
      assistantCalls: 200,
      reportsGenerated: 100,
    };
  }

  return {
    assistantCalls: 25,
    reportsGenerated: 10,
  };
}

export function canUseMode(plan: AppPlan, mode: string | null | undefined) {
  if (!mode || mode === "chat" || mode === "intelligence") return true;
  if (mode === "execution" || mode === "trader") {
    return plan === "premium" || plan === "premium_plus";
  }
  return false;
}

export async function getServerAccess() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false as const,
      status: 401,
      error: "unauthorized",
      message: "You must be logged in to use this API.",
    };
  }

  const rawUser = session.user as {
    email?: string | null;
    plan?: string | null;
    assistantCallsUsed?: number | null;
    reportsGeneratedUsed?: number | null;
  };

  const plan = normalizePlan(rawUser.plan);
  const usage: UsageState = {
    assistantCalls: Number(rawUser.assistantCallsUsed ?? 0),
    reportsGenerated: Number(rawUser.reportsGeneratedUsed ?? 0),
  };

  const limits = getLimitsForPlan(plan);

  return {
    ok: true as const,
    session,
    user: rawUser,
    plan,
    usage,
    limits,
  };
}