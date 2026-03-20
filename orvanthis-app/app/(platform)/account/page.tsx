"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform-shell";
import {
  labelAssistantMode,
  labelBusinessStyle,
  labelGoal,
  labelMarketStyle,
  loadPersonalizationProfile,
  PersonalizationProfile,
} from "@/lib/personalization";

type UsageData = {
  assistantCalls: number;
  reportsGenerated: number;
};

type LimitsData = {
  assistantCalls: number;
  reportsGenerated: number;
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [limits, setLimits] = useState<LimitsData | null>(null);
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);

  const userName = session?.user?.name || "Unknown User";
  const userEmail = session?.user?.email || "No email available";
  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const formattedPlan =
    userPlan === "premium_plus"
      ? "Premium Plus"
      : userPlan === "premium"
      ? "Premium"
      : "Free";

  useEffect(() => {
    async function loadUsage() {
      try {
        const res = await fetch("/api/usage");
        const data = await res.json();

        if (res.ok) {
          setUsage(data.usage);
          setLimits(data.limits);
        }
      } catch (error) {
        console.error("Failed to load usage:", error);
      }
    }

    if (session?.user) {
      void loadUsage();
    }

    setProfile(loadPersonalizationProfile());
  }, [session]);

  return (
    <PlatformShell
      title="Account"
      subtitle="Profile, settings, and platform preferences"
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Profile
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
              User Information
            </h3>

            <div className="mt-5 rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
              {status === "loading" ? (
                <p className="text-sm text-zinc-400">Loading account details...</p>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="rounded-xl border border-white/8 bg-[#111318] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Name
                    </p>
                    <p className="mt-2 text-base font-medium text-zinc-100">
                      {userName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-[#111318] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Email
                    </p>
                    <p className="mt-2 break-all text-base font-medium text-zinc-100">
                      {userEmail}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-[#111318] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Plan
                    </p>
                    <p className="mt-2 text-base font-medium text-zinc-100">
                      {formattedPlan}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Usage
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
              Current monthly usage
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                  Assistant Calls
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {usage ? usage.assistantCalls : 0}
                  {limits ? ` / ${limits.assistantCalls}` : ""}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                  Reports Generated
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {usage ? usage.reportsGenerated : 0}
                  {limits ? ` / ${limits.reportsGenerated}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Personalization
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
                  Orvanthis profile
                </h3>
              </div>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm font-medium text-zinc-300"
              >
                Edit Profile
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Goals
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  {profile?.goals?.length
                    ? profile.goals.map(labelGoal).join(", ")
                    : "Not configured yet"}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Market Style
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  {profile ? labelMarketStyle(profile.marketStyle) : "Not configured yet"}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Business Style
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  {profile
                    ? labelBusinessStyle(profile.businessStyle)
                    : "Not configured yet"}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Default Assistant
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  {profile
                    ? labelAssistantMode(profile.assistantDefaultMode)
                    : "Not configured yet"}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-4 md:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Preferred Sectors
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  {profile?.preferredSectors?.length
                    ? profile.preferredSectors.join(", ")
                    : "Not configured yet"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Membership
            </p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-100">
              Current plan
            </h3>

            <div className="mt-4 rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-zinc-100">
                  {formattedPlan}
                </p>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                  Active
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {formattedPlan === "Free"
                  ? "You are currently on the Free plan with limited assistant and report usage."
                  : formattedPlan === "Premium"
                  ? "You are on Premium with expanded assistant usage, more reports, and enhanced tools."
                  : "You are on Premium Plus with full access to advanced intelligence workflows and higher limits."}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Personalization Status
            </p>

            <div className="mt-4 rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
              <p className="text-sm text-zinc-300">
                {profile?.completed
                  ? "Your personalization profile is active and ready."
                  : "Your personalization profile is not finished yet."}
              </p>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="mt-4 rounded-xl border border-white/8 bg-[#111318] px-4 py-2 text-sm font-medium text-zinc-300"
              >
                {profile?.completed ? "Update Personalization" : "Finish Setup"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </PlatformShell>
  );
}