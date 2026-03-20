import { prisma } from "@/lib/prisma";
import { normalizePlan, PLAN_LIMITS, PlanType } from "@/lib/plans";

function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getOrCreateUsage(userId: string) {
  const month = getCurrentMonthKey();

  let usage = await prisma.usage.findUnique({
    where: {
      userId_month: {
        userId,
        month,
      },
    },
  });

  if (!usage) {
    usage = await prisma.usage.create({
      data: {
        userId,
        month,
      },
    });
  }

  return usage;
}

export function getPlanLimits(plan: string | null | undefined) {
  const normalized = normalizePlan(plan);
  return PLAN_LIMITS[normalized];
}

export function hasReachedLimit(args: {
  plan: string | null | undefined;
  usage: {
    assistantCalls: number;
    reportsGenerated: number;
  };
  type: "assistantCalls" | "reportsGenerated";
}) {
  const normalizedPlan: PlanType = normalizePlan(args.plan);
  const limits = PLAN_LIMITS[normalizedPlan];
  const currentValue = args.usage[args.type];
  const maxValue = limits[args.type];

  return {
    reached: currentValue >= maxValue,
    current: currentValue,
    limit: maxValue,
    plan: normalizedPlan,
  };
}

export async function incrementUsage(args: {
  userId: string;
  type: "assistantCalls" | "reportsGenerated";
}) {
  const usage = await getOrCreateUsage(args.userId);

  return prisma.usage.update({
    where: { id: usage.id },
    data: {
      [args.type]: {
        increment: 1,
      },
    },
  });
}