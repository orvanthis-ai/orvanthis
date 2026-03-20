"use client";

import { useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";

type BillingCycle = "monthly" | "annual";
type PlanType = "free" | "premium" | "premium_plus";

export default function BillingPage() {
  const { data: session, update } = useSession();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [upgradingPlan, setUpgradingPlan] = useState<PlanType | null>(null);

  const userPlan =
    ((session?.user as { plan?: string } | undefined)?.plan as PlanType) ||
    "free";

  const formattedPlan =
    userPlan === "premium_plus"
      ? "Premium Plus"
      : userPlan === "premium"
      ? "Premium"
      : "Free";

  const pricing = useMemo(() => {
    const premiumMonthly = 25;
    const premiumPlusMonthly = 50;

    const premiumAnnualMonthlyEquivalent = 20;
    const premiumPlusAnnualMonthlyEquivalent = 40;

    return {
      premium:
        billingCycle === "monthly"
          ? {
              price: premiumMonthly,
              suffix: "/month",
              subtext: "Billed monthly",
              savings: null,
            }
          : {
              price: premiumAnnualMonthlyEquivalent,
              suffix: "/month",
              subtext: `$${premiumAnnualMonthlyEquivalent * 12}/year billed annually`,
              savings: "Save 20%",
            },

      premiumPlus:
        billingCycle === "monthly"
          ? {
              price: premiumPlusMonthly,
              suffix: "/month",
              subtext: "Billed monthly",
              savings: null,
            }
          : {
              price: premiumPlusAnnualMonthlyEquivalent,
              suffix: "/month",
              subtext: `$${premiumPlusAnnualMonthlyEquivalent * 12}/year billed annually`,
              savings: "Save 20%",
            },
    };
  }, [billingCycle]);

  async function changePlan(targetPlan: PlanType) {
    try {
      setUpgradingPlan(targetPlan);

      const res = await fetch("/api/dev/set-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: targetPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to update plan.");
        return;
      }

      await update();

      alert(
        `Dev mode: your plan has been updated to ${
          targetPlan === "premium_plus"
            ? "Premium Plus"
            : targetPlan === "premium"
            ? "Premium"
            : "Free"
        }.`
      );

      window.location.reload();
    } catch (error) {
      console.error("Plan update error:", error);
      alert("Failed to update plan.");
    } finally {
      setUpgradingPlan(null);
    }
  }

  const comparisonRows = [
    ["Assistant usage", "Limited", "Expanded", "Highest"],
    ["Reports per month", "Limited", "More", "Highest"],
    ["Signals access", "Basic", "Enhanced", "Full"],
    ["Advanced workflows", "—", "Included", "Full access"],
    ["Future premium agents", "—", "Limited", "Included"],
  ];

  return (
    <PlatformShell
      title="Billing"
      subtitle="Manage plans, upgrades, and platform access"
    >
      <div className="space-y-6">
        <section className="rounded-[30px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Current Membership
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-zinc-100">
                {formattedPlan}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Your current subscription tier and available platform access.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-sky-200">
                Active Membership
              </div>

              <div className="inline-flex rounded-2xl border border-white/8 bg-[#0c0e12] p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    billingCycle === "monthly"
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    billingCycle === "annual"
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[30px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Free
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-semibold text-zinc-100">$0</span>
                  <span className="pb-1 text-sm text-zinc-500">/month</span>
                </div>
              </div>

              {userPlan === "free" && (
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                  Current
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              A lightweight entry tier for trying the platform and exploring the
              core workflow.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Basic dashboard access",
                "Limited assistant usage",
                "Limited reports per month",
                "Core research workflow access",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300"
                >
                  • {feature}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => changePlan("free")}
              disabled={userPlan === "free" || upgradingPlan !== null}
              className="mt-6 w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-3.5 font-medium text-zinc-200 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {upgradingPlan === "free"
                ? "Switching..."
                : userPlan === "free"
                ? "Current Plan"
                : "Switch to Free"}
            </button>
          </div>

          <div className="relative rounded-[30px] border border-sky-500/25 bg-[linear-gradient(180deg,rgba(14,24,35,0.98),rgba(8,14,22,0.98))] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.28)]">
            <div className="absolute right-5 top-5 flex max-w-[60%] flex-wrap items-center justify-end gap-2">
              <span className="rounded-full border border-sky-500/20 bg-sky-500/[0.10] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-sky-200">
                Most Popular
              </span>
              {pricing.premium.savings && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.10] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                  {pricing.premium.savings}
                </span>
              )}
              {userPlan === "premium" && (
                <span className="rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-sky-200">
                  Current
                </span>
              )}
            </div>

            <div className="pr-28">
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200/80">
                Premium
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">
                  ${pricing.premium.price}
                </span>
                <span className="pb-1 text-sm text-zinc-400">
                  {pricing.premium.suffix}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {pricing.premium.subtext}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Built for active users who want more assistant power, more reports,
              and deeper strategic analysis.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Expanded assistant limits",
                "More reports per month",
                "Deeper market and signal access",
                "Enhanced research workflows",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-xl border border-sky-500/15 bg-sky-500/[0.05] px-4 py-3 text-sm text-zinc-200"
                >
                  • {feature}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => changePlan("premium")}
              disabled={userPlan === "premium" || upgradingPlan !== null}
              className="mt-6 w-full rounded-2xl border border-white/8 bg-white px-5 py-3.5 font-semibold text-black transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {upgradingPlan === "premium"
                ? "Switching..."
                : userPlan === "premium"
                ? "Current Plan"
                : "Upgrade to Premium"}
            </button>
          </div>

          <div className="relative rounded-[30px] border border-violet-500/25 bg-[linear-gradient(180deg,rgba(22,14,38,0.98),rgba(12,9,24,0.98))] p-6 shadow-[0_14px_50px_rgba(0,0,0,0.28)]">
            <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
              <span className="rounded-full border border-violet-500/20 bg-violet-500/[0.10] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-violet-200">
                Full Access
              </span>
              {pricing.premiumPlus.savings && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.10] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                  {pricing.premiumPlus.savings}
                </span>
              )}
              {userPlan === "premium_plus" && (
                <span className="rounded-full border border-violet-500/20 bg-violet-500/[0.10] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-violet-200">
                  Current
                </span>
              )}
            </div>

            <div className="pr-28">
              <p className="text-[11px] uppercase tracking-[0.18em] text-violet-200/85">
                Premium Plus
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold text-white">
                  ${pricing.premiumPlus.price}
                </span>
                <span className="pb-1 text-sm text-zinc-400">
                  {pricing.premiumPlus.suffix}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {pricing.premiumPlus.subtext}
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Full-access tier for power users who want the highest limits,
              premium workflows, and future advanced agents.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Highest usage limits",
                "Advanced assistant access",
                "Future premium agents",
                "Full strategic workflow access",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-4 py-3 text-sm text-zinc-200"
                >
                  • {feature}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => changePlan("premium_plus")}
              disabled={userPlan === "premium_plus" || upgradingPlan !== null}
              className="mt-6 w-full rounded-2xl border border-white/8 bg-white px-5 py-3.5 font-semibold text-black transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {upgradingPlan === "premium_plus"
                ? "Switching..."
                : userPlan === "premium_plus"
                ? "Current Plan"
                : "Upgrade to Premium Plus"}
            </button>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Plan Comparison
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
              Compare access across tiers
            </h3>
          </div>

          <div className="space-y-4 md:hidden">
            {comparisonRows.map((row) => (
              <div
                key={row[0]}
                className="rounded-2xl border border-white/8 bg-[#0c0e12] p-4"
              >
                <p className="text-sm font-semibold text-zinc-100">{row[0]}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/8 bg-[#111318] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      Free
                    </p>
                    <p className="mt-2 text-sm text-zinc-200">{row[1]}</p>
                  </div>

                  <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.05] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-sky-200/80">
                      Premium
                    </p>
                    <p className="mt-2 text-sm text-zinc-100">{row[2]}</p>
                  </div>

                  <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-violet-200/80">
                      Premium Plus
                    </p>
                    <p className="mt-2 text-sm text-zinc-100">{row[3]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/8 md:block">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-4 bg-[#0c0e12] text-sm font-medium text-zinc-300">
                <div className="border-r border-white/8 px-4 py-4 text-zinc-500">
                  Feature
                </div>
                <div className="border-r border-white/8 px-4 py-4 text-center">
                  Free
                </div>
                <div className="border-r border-white/8 px-4 py-4 text-center">
                  Premium
                </div>
                <div className="px-4 py-4 text-center">Premium Plus</div>
              </div>

              {comparisonRows.map((row) => (
                <div
                  key={row[0]}
                  className="grid grid-cols-4 border-t border-white/8 bg-[#111318] text-sm text-zinc-300"
                >
                  <div className="border-r border-white/8 px-4 py-4 text-zinc-400">
                    {row[0]}
                  </div>
                  <div className="border-r border-white/8 px-4 py-4 text-center">
                    {row[1]}
                  </div>
                  <div className="border-r border-white/8 px-4 py-4 text-center">
                    {row[2]}
                  </div>
                  <div className="px-4 py-4 text-center">{row[3]}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}