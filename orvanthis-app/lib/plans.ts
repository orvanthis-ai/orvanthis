export type PlanType = "free" | "premium" | "premium_plus";

export const PLAN_LIMITS = {
  free: {
    assistantCalls: 20,
    reportsGenerated: 10,
  },
  premium: {
    assistantCalls: 250,
    reportsGenerated: 100,
  },
  premium_plus: {
    assistantCalls: 2000,
    reportsGenerated: 1000,
  },
} as const;

export function normalizePlan(plan: string | null | undefined): PlanType {
  if (plan === "premium") return "premium";
  if (plan === "premium_plus") return "premium_plus";
  return "free";
}

export function getPlanLabel(plan: string | null | undefined) {
  const normalized = normalizePlan(plan);

  if (normalized === "premium_plus") return "Premium Plus";
  if (normalized === "premium") return "Premium";
  return "Free";
}