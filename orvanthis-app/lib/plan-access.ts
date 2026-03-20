export type AppPlan = "free" | "premium" | "premium_plus";

function getDevPlanOverride(): AppPlan | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("orvanthis:devPlanOverride");
  if (raw === "premium") return "premium";
  if (raw === "premium_plus") return "premium_plus";
  if (raw === "free") return "free";
  return null;
}

export function normalizeAppPlan(plan: string | null | undefined): AppPlan {
  const override = getDevPlanOverride();
  if (override) return override;

  if (plan === "premium") return "premium";
  if (plan === "premium_plus") return "premium_plus";
  return "free";
}

export function hasPremium(plan: string | null | undefined) {
  const normalized = normalizeAppPlan(plan);
  return normalized === "premium" || normalized === "premium_plus";
}

export function hasPremiumPlus(plan: string | null | undefined) {
  return normalizeAppPlan(plan) === "premium_plus";
}

export function getPlanLabel(plan: string | null | undefined) {
  const normalized = normalizeAppPlan(plan);

  if (normalized === "premium_plus") return "Premium Plus";
  if (normalized === "premium") return "Premium";
  return "Free";
}

export function canUseExecutionMode(plan: string | null | undefined) {
  return hasPremium(plan);
}

export function canUseTraderMode(plan: string | null | undefined) {
  return hasPremium(plan);
}

export function canUseCalendarAi(plan: string | null | undefined) {
  return hasPremium(plan);
}

export function canUsePremiumPlusAgent(plan: string | null | undefined) {
  return hasPremiumPlus(plan);
}