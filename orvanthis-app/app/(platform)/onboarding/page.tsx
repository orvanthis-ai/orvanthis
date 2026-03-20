"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform-shell";
import {
  AssistantDefaultMode,
  BusinessStyle,
  MarketStyle,
  PersonalizationProfile,
  UserGoal,
  defaultPersonalizationProfile,
  labelAssistantMode,
  labelBusinessStyle,
  labelGoal,
  labelMarketStyle,
  loadPersonalizationProfile,
  savePersonalizationProfile,
  toggleStringInArray,
} from "@/lib/personalization";
import { saveWatchlists } from "@/app/lib/smart-watchlists";

const GOALS: UserGoal[] = [
  "find-opportunities",
  "trade-better",
  "build-business",
  "track-market",
  "execute-faster",
];

const MARKET_STYLES: MarketStyle[] = [
  "macro",
  "growth",
  "swing",
  "day-trading",
  "long-term",
];

const BUSINESS_STYLES: BusinessStyle[] = [
  "operator",
  "founder",
  "investor",
  "builder",
  "analyst",
];

const SECTOR_OPTIONS = [
  "AI Infrastructure",
  "Defense Software",
  "Energy Storage",
  "Compliance Tech",
  "Industrial Automation",
  "Crypto",
  "Semiconductors",
  "Software",
  "Fintech",
  "Macro",
];

const WATCHLIST_PRESETS = [
  "AI Leaders",
  "Macro Catalysts",
  "Execution Targets",
  "High Conviction Ideas",
  "Growth Names",
  "Risk Watch",
];

const ASSISTANT_MODES: AssistantDefaultMode[] = [
  "chat",
  "intelligence",
  "execution",
  "trader",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PersonalizationProfile>(
    defaultPersonalizationProfile
  );
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setProfile(loadPersonalizationProfile());
  }, []);

  function updateProfile<K extends keyof PersonalizationProfile>(
    key: K,
    value: PersonalizationProfile[K]
  ) {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSave() {
    const nextProfile: PersonalizationProfile = {
      ...profile,
      completed: true,
    };

    savePersonalizationProfile(nextProfile);

    const seededWatchlists = Array.from(
      new Set([
        ...nextProfile.watchlistPresets,
        ...nextProfile.preferredSectors,
        nextProfile.marketStyle,
        nextProfile.businessStyle,
      ])
    ).filter(Boolean);

    saveWatchlists(seededWatchlists);

    setProfile(nextProfile);
    setSavedMessage("Personalization saved and watchlists updated.");
  }

  return (
    <PlatformShell
      title="Onboarding"
      subtitle="Teach Orvanthis how you think, work, and prioritize"
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Goals
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
              What do you want Orvanthis to optimize for?
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {GOALS.map((goal) => {
                const active = profile.goals.includes(goal);

                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() =>
                      updateProfile(
                        "goals",
                        toggleStringInArray(profile.goals, goal) as UserGoal[]
                      )
                    }
                    className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                      active
                        ? "border-sky-500/20 bg-sky-500/[0.06] text-sky-200"
                        : "border-white/8 bg-[#0c0e12] text-zinc-300 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    {labelGoal(goal)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Market Style
              </p>
              <div className="mt-4 space-y-3">
                {MARKET_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateProfile("marketStyle", style)}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      profile.marketStyle === style
                        ? "border-violet-500/20 bg-violet-500/[0.06] text-violet-200"
                        : "border-white/8 bg-[#0c0e12] text-zinc-300"
                    }`}
                  >
                    {labelMarketStyle(style)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Business Style
              </p>
              <div className="mt-4 space-y-3">
                {BUSINESS_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => updateProfile("businessStyle", style)}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      profile.businessStyle === style
                        ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                        : "border-white/8 bg-[#0c0e12] text-zinc-300"
                    }`}
                  >
                    {labelBusinessStyle(style)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Preferred Sectors
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {SECTOR_OPTIONS.map((sector) => {
                const active = profile.preferredSectors.includes(sector);

                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() =>
                      updateProfile(
                        "preferredSectors",
                        toggleStringInArray(profile.preferredSectors, sector)
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
                        : "border-white/8 bg-[#0c0e12] text-zinc-300"
                    }`}
                  >
                    {sector}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Watchlist Presets
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {WATCHLIST_PRESETS.map((preset) => {
                const active = profile.watchlistPresets.includes(preset);

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      updateProfile(
                        "watchlistPresets",
                        toggleStringInArray(profile.watchlistPresets, preset)
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-sky-500/20 bg-sky-500/[0.06] text-sky-200"
                        : "border-white/8 bg-[#0c0e12] text-zinc-300"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Default Assistant Mode
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {ASSISTANT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateProfile("assistantDefaultMode", mode)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                    profile.assistantDefaultMode === mode
                      ? "border-violet-500/20 bg-violet-500/[0.06] text-violet-200"
                      : "border-white/8 bg-[#0c0e12] text-zinc-300"
                  }`}
                >
                  {labelAssistantMode(mode)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl border border-white/8 bg-white px-5 py-3 font-semibold text-black"
            >
              Save Personalization
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-3 font-medium text-zinc-300"
            >
              Go to Dashboard
            </button>
          </div>

          {savedMessage && (
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-200">
              {savedMessage}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Live Profile
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Goals
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  {profile.goals.length
                    ? profile.goals.map(labelGoal).join(", ")
                    : "None selected yet"}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Market Style
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  {labelMarketStyle(profile.marketStyle)}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Business Style
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  {labelBusinessStyle(profile.businessStyle)}
                </p>
              </div>

              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Default Assistant
                </p>
                <p className="mt-2 text-sm text-zinc-200">
                  {labelAssistantMode(profile.assistantDefaultMode)}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PlatformShell>
  );
}