"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";
import { buildWatchlistAlerts } from "@/app/lib/watchlist-alerts";
import {
  canUseExecutionMode,
  canUseTraderMode,
  getPlanLabel,
  hasPremium,
} from "@/lib/plan-access";
import {
  labelGoal,
  labelMarketStyle,
  loadPersonalizationProfile,
  PersonalizationProfile,
} from "@/lib/personalization";
import {
  addWatchlistItem,
  loadWatchlists,
  removeWatchlistItem,
  seedWatchlistsFromPersonalization,
} from "@/app/lib/smart-watchlists";

type SavedReport = {
  id: string;
  query: string;
  result: string;
  timestamp: number;
};

type OpportunityFeedItem = {
  id: string;
  title: string;
  query: string;
  category: string;
  score: number;
  stage: string;
  signal: string;
};

type LiveMarketItem = {
  id: string;
  symbol: string;
  label: string;
  price: number | null;
  changePercent: number | null;
  bias: string;
  conviction: "high" | "moderate" | "low";
  signalType: string;
  read: string;
  sourceStatus?: "live" | "partial" | "fallback";
};

type MarketPulse = {
  bias: string;
  text: string;
  tone: "bullish" | "bearish" | "neutral";
};

const SAVED_REPORTS_KEY = "orvanthis:savedReports";
const RECENT_SEARCHES_KEY = "orvanthis:recentSearches";
const LAST_GOOD_MARKET_KEY = "orvanthis:lastGoodMarketState";
const TRACKED_OPPORTUNITIES_KEY = "orvanthis:trackedOpportunities";
const MARKET_REFRESH_MS = 90_000;

function loadSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is SavedReport =>
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.query === "string" &&
          typeof item.result === "string" &&
          typeof item.timestamp === "number"
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(0, 8);
  } catch {
    return [];
  }
}

function loadTrackedOpportunities(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRACKED_OPPORTUNITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function loadLastGoodMarketState(): LiveMarketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LAST_GOOD_MARKET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LiveMarketItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.symbol === "string" &&
        typeof item.label === "string"
    );
  } catch {
    return [];
  }
}

function persistLastGoodMarketState(items: LiveMarketItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_GOOD_MARKET_KEY, JSON.stringify(items));
  } catch {}
}

function getBias(changePercent: number | null): string {
  if (changePercent === null) return "Awaiting Data";
  if (changePercent >= 1.25) return "Bullish";
  if (changePercent >= 0.25) return "Mild Bullish";
  if (changePercent <= -1.25) return "Bearish";
  if (changePercent <= -0.25) return "Mild Bearish";
  return "Neutral";
}

function getConviction(
  changePercent: number | null
): "high" | "moderate" | "low" {
  if (changePercent === null) return "low";
  const abs = Math.abs(changePercent);
  if (abs >= 1.25) return "high";
  if (abs >= 0.25) return "moderate";
  return "low";
}

function getRead(label: string, changePercent: number | null): string {
  const bias = getBias(changePercent);

  if (changePercent === null) return `${label} is waiting on a usable live market reading.`;
  if (bias === "Bullish" || bias === "Mild Bullish") {
    return `${label} is showing positive short-term momentum.`;
  }
  if (bias === "Bearish" || bias === "Mild Bearish") {
    return `${label} is trading under pressure.`;
  }
  return `${label} is relatively balanced right now.`;
}

function mergeWithLastGood(
  fresh: LiveMarketItem[],
  lastGood: LiveMarketItem[]
): LiveMarketItem[] {
  const map = new Map(lastGood.map((item) => [item.symbol, item]));

  return fresh.map((item) => {
    const prior = map.get(item.symbol);
    if (!prior) {
      return {
        ...item,
        bias: getBias(item.changePercent),
        conviction: getConviction(item.changePercent),
        read: getRead(item.label, item.changePercent),
        sourceStatus:
          item.price !== null && item.changePercent !== null
            ? "live"
            : item.price !== null || item.changePercent !== null
            ? "partial"
            : "fallback",
      };
    }

    const mergedPrice = item.price ?? prior.price;
    const mergedChange = item.changePercent ?? prior.changePercent;

    const sourceStatus =
      item.price !== null && item.changePercent !== null
        ? "live"
        : item.price !== null || item.changePercent !== null
        ? "partial"
        : "fallback";

    return {
      ...item,
      price: mergedPrice,
      changePercent: mergedChange,
      bias: getBias(mergedChange),
      conviction: getConviction(mergedChange),
      read: getRead(item.label, mergedChange),
      sourceStatus,
    };
  });
}

function formatPrice(value: number | null) {
  if (value === null) return "N/A";
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getConvictionStyles(conviction: "high" | "moderate" | "low") {
  if (conviction === "high") {
    return {
      card: "border-emerald-500/25 bg-emerald-500/[0.08]",
      label: "text-emerald-200/85",
      pill: "border border-emerald-500/25 bg-emerald-500/15 text-emerald-200",
    };
  }
  if (conviction === "moderate") {
    return {
      card: "border-amber-500/25 bg-amber-500/[0.08]",
      label: "text-amber-200/85",
      pill: "border border-amber-500/25 bg-amber-500/15 text-amber-200",
    };
  }
  return {
    card: "border-red-500/25 bg-red-500/[0.08]",
    label: "text-red-200/85",
    pill: "border border-red-500/25 bg-red-500/15 text-red-200",
  };
}

function getStableMarketPulse(marketData: LiveMarketItem[]): MarketPulse {
  if (marketData.length === 0) {
    return {
      bias: "Awaiting Market Data",
      text: "Live market data has not loaded yet.",
      tone: "neutral",
    };
  }

  const spy =
    marketData.find((item) => item.symbol === "SPY")?.changePercent ?? null;
  const qqq =
    marketData.find((item) => item.symbol === "QQQ")?.changePercent ?? null;

  const aiLeaders = marketData
    .filter((item) => ["NVDA", "AMD", "MSFT"].includes(item.symbol))
    .map((item) => item.changePercent)
    .filter((value): value is number => value !== null);

  const aiAverage =
    aiLeaders.length > 0
      ? aiLeaders.reduce((sum, value) => sum + value, 0) / aiLeaders.length
      : null;

  const weightedScore =
    (spy ?? 0) * 0.4 + (qqq ?? 0) * 0.4 + (aiAverage ?? 0) * 0.2;

  if (weightedScore >= 0.6) {
    return {
      bias: "Bullish Bias",
      text: "Broad market and growth leadership are aligned enough to support a constructive risk read.",
      tone: "bullish",
    };
  }

  if (weightedScore <= -0.6) {
    return {
      bias: "Cautious Bias",
      text: "Broad weakness is strong enough to justify a more defensive short-term posture.",
      tone: "bearish",
    };
  }

  return {
    bias: "Neutral Bias",
    text: "The market read is balanced right now, so conviction stays neutral until stronger confirmation appears.",
    tone: "neutral",
  };
}

function getPremiumInsightText(
  pulse: MarketPulse,
  trackedCount: number,
  watchlists: string[],
  profile: PersonalizationProfile | null
) {
  const topGoal = profile?.goals?.[0] ? labelGoal(profile.goals[0]) : null;
  const topSector = profile?.preferredSectors?.[0] ?? null;

  if (pulse.tone === "bullish") {
    return `Momentum is supportive right now. With ${trackedCount} tracked opportunities and ${watchlists.length} watchlists, this is a strong window to rank your best ideas${
      topSector ? ` in ${topSector}` : ""
    } and push the top one toward execution${topGoal ? ` in support of your goal to ${topGoal.toLowerCase()}` : ""}.`;
  }

  if (pulse.tone === "bearish") {
    return `Markets are risk-off right now. Focus less on broad expansion and more on defensive positioning, timing discipline, and identifying which tracked ideas${
      topSector ? ` in ${topSector}` : ""
    } still hold up under pressure.`;
  }

  return `The market is balanced, which makes this a useful environment for planning, validating priorities, and preparing execution before stronger momentum appears${
    topSector ? ` across ${topSector}` : ""
  }.`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [watchlists, setWatchlists] = useState<string[]>([]);
  const [trackedOpportunities, setTrackedOpportunities] = useState<string[]>([]);
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [newWatchlist, setNewWatchlist] = useState("");

  const [opportunityFeed, setOpportunityFeed] = useState<OpportunityFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  const [marketData, setMarketData] = useState<LiveMarketItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [lastMarketRefresh, setLastMarketRefresh] = useState<number | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [premiumMessage, setPremiumMessage] = useState("");

  useEffect(() => {
    setSavedReports(loadSavedReports());
    setRecentSearches(loadRecentSearches());

    const seeded = seedWatchlistsFromPersonalization();
    setWatchlists(seeded.length > 0 ? seeded : loadWatchlists());

    setTrackedOpportunities(loadTrackedOpportunities());
    setMarketData(loadLastGoodMarketState());
    setProfile(loadPersonalizationProfile());
  }, []);

  useEffect(() => {
    async function loadFeed() {
      try {
        setFeedLoading(true);
        setFeedError("");

        const res = await fetch("/api/opportunity-feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchlists }),
        });

        const rawText = await res.text();
        let data: { items?: OpportunityFeedItem[]; error?: string } = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          setFeedError("Opportunity feed returned invalid JSON.");
          setOpportunityFeed([]);
          return;
        }

        if (!res.ok) {
          setFeedError(data.error || "Failed to load opportunity feed.");
          setOpportunityFeed([]);
          return;
        }

        if (Array.isArray(data.items)) {
          setOpportunityFeed(data.items);
        } else {
          setFeedError("Opportunity feed returned invalid data.");
          setOpportunityFeed([]);
        }
      } catch (error) {
        console.error("Feed load error:", error);
        setFeedError("There was an error loading the opportunity feed.");
        setOpportunityFeed([]);
      } finally {
        setFeedLoading(false);
      }
    }

    loadFeed();
  }, [watchlists]);

  useEffect(() => {
    let active = true;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    async function fetchMarketData(retries = 3) {
      try {
        if (active) {
          setMarketLoading(true);
          setMarketError("");
        }

        const res = await fetch("/api/market-data", {
          cache: "no-store",
        });

        const rawText = await res.text();

        let data: { items?: LiveMarketItem[]; error?: string } = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error("Market data returned invalid JSON.");
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to load market data.");
        }

        if (!Array.isArray(data.items)) {
          throw new Error("Market data returned invalid data.");
        }

        const lastGood = loadLastGoodMarketState();
        const merged = mergeWithLastGood(data.items, lastGood);

        if (active) {
          setMarketData(merged);
          setLastMarketRefresh(Date.now());
          setIsUsingFallback(false);
        }

        const goodToPersist = merged.filter(
          (item) => item.price !== null || item.changePercent !== null
        );

        if (goodToPersist.length > 0) {
          persistLastGoodMarketState(merged);
        }
      } catch (error) {
        console.error("Market data load error:", error);

        const fallback = loadLastGoodMarketState();

        if (active) {
          setMarketError(
            error instanceof Error
              ? error.message
              : "There was an error loading market data."
          );

          if (fallback.length > 0) {
            setMarketData(fallback);
            setIsUsingFallback(true);
          }
        }

        if (retries > 0 && active) {
          retryTimeout = setTimeout(() => {
            void fetchMarketData(retries - 1);
          }, 2000);
        }
      } finally {
        if (active) {
          setMarketLoading(false);
        }
      }
    }

    void fetchMarketData();

    const intervalId = setInterval(() => {
      void fetchMarketData();
    }, MARKET_REFRESH_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const overallMarketPulse = useMemo(() => {
    return getStableMarketPulse(marketData);
  }, [marketData]);

  const watchlistAlerts = useMemo(() => {
    return buildWatchlistAlerts({
      watchlists,
      opportunityFeed,
      marketData,
      overallMarketPulse,
    });
  }, [watchlists, opportunityFeed, marketData, overallMarketPulse]);

  const premiumInsight = useMemo(() => {
    return getPremiumInsightText(
      overallMarketPulse,
      trackedOpportunities.length,
      watchlists,
      profile
    );
  }, [overallMarketPulse, trackedOpportunities.length, watchlists, profile]);

  function goToBilling(message: string) {
    setPremiumMessage(message);
    setTimeout(() => {
      router.push("/billing");
    }, 500);
  }

  function handleAddWatchlist() {
    const next = addWatchlistItem(newWatchlist);
    setWatchlists(next);
    setNewWatchlist("");
  }

  function handleRemoveWatchlist(item: string) {
    const next = removeWatchlistItem(item);
    setWatchlists(next);
  }

  return (
    <PlatformShell
      title="Dashboard"
      subtitle="Executive overview, live signals, and daily intelligence"
    >
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-sky-400/15 bg-sky-400/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200/85">
                Executive Control Center
              </div>
              <h3 className="text-4xl font-semibold tracking-tight text-zinc-100">
                Strategic opportunity intelligence
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400 md:text-base">
                {profile?.completed
                  ? `Personalized for a ${labelMarketStyle(
                      profile.marketStyle
                    ).toLowerCase()} market style with emphasis on ${
                      profile.preferredSectors?.[0] || "your selected priorities"
                    }.`
                  : "Monitor live market posture, discover high-conviction opportunities, and act on the most important strategic signals across your focus areas."}
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[520px]">
              <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200/75">
                  Feed Signals
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {opportunityFeed.length}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-violet-200/75">
                  Saved Reports
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {savedReports.length}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/75">
                  Tracked
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {trackedOpportunities.length}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/75">
                  Plan
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {getPlanLabel(userPlan)}
                </p>
              </div>
            </div>
          </div>

          {premiumMessage && (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
              {premiumMessage}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="relative rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <div className="absolute right-6 top-6 rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Live Feed • Auto-recovering
              </div>

              <div className="mb-5 flex items-center justify-between pr-[180px]">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Live Market Signals
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-zinc-100">
                    Risk, leadership, and momentum
                  </h3>
                  <p className="mb-2 mt-2 text-xs text-zinc-500">
                    Last updated:{" "}
                    {lastMarketRefresh
                      ? new Date(lastMarketRefresh).toLocaleTimeString()
                      : "Waiting for first refresh"}
                  </p>
                </div>
              </div>

              {marketLoading && marketData.length === 0 && (
                <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5 text-sm text-zinc-300">
                  Loading live market data...
                </div>
              )}

              {!marketLoading && marketError && marketData.length === 0 && (
                <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5 text-sm text-red-300">
                  {marketError}
                </div>
              )}

              {marketData.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {marketData.map((signal) => {
                    const styles = getConvictionStyles(signal.conviction);

                    return (
                      <div
                        key={signal.id}
                        className={`rounded-[24px] border p-5 ${styles.card}`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p
                              className={`text-[10px] uppercase tracking-[0.14em] ${styles.label}`}
                            >
                              {signal.signalType}
                            </p>
                            <h3 className="mt-2 text-base font-semibold text-zinc-100">
                              {signal.label}
                            </h3>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${styles.pill}`}
                          >
                            {signal.bias}
                          </span>
                        </div>

                        <p className="text-2xl font-semibold text-zinc-100">
                          {formatPrice(signal.price)}
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            (signal.changePercent ?? 0) > 0
                              ? "text-emerald-300"
                              : (signal.changePercent ?? 0) < 0
                              ? "text-red-300"
                              : "text-zinc-400"
                          }`}
                        >
                          {formatPercent(signal.changePercent)}
                        </p>

                        <p className="mt-4 text-sm leading-6 text-zinc-300">
                          {signal.read}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {isUsingFallback && (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-sm text-amber-200">
                  <p className="font-medium">Market data stabilized</p>
                  <p className="mt-1 text-amber-200/80">
                    Orvanthis is maintaining the latest confirmed market state while live feeds reconnect.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Opportunity Feed
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-zinc-100">
                    {profile?.preferredSectors?.[0]
                      ? `Priority signals for ${profile.preferredSectors[0]}`
                      : "Priority strategic signals"}
                  </h3>
                </div>
                <div className="rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  Personalized Feed
                </div>
              </div>

              {feedLoading && (
                <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5 text-sm text-zinc-300">
                  Generating AI opportunity feed...
                </div>
              )}

              {!feedLoading && feedError && (
                <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5 text-sm text-red-300">
                  {feedError}
                </div>
              )}

              {!feedLoading && !feedError && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {opportunityFeed.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[24px] border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-violet-200/80">
                          {item.category}
                        </span>
                        <span className="inline-flex rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                          {item.stage}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold leading-snug text-zinc-100">
                        {item.title}
                      </h3>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Score
                          </p>
                          <p className="text-2xl font-semibold text-zinc-100">
                            {item.score.toFixed(1)}
                          </p>
                        </div>

                        <span className="rounded-full border border-sky-500/15 bg-sky-500/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-sky-200/80">
                          Signal
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-zinc-400">
                        {item.signal}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Premium Insights
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-zinc-100">
                    AI strategic read
                  </h3>
                </div>
                {!hasPremium(userPlan) && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-200">
                    Premium
                  </span>
                )}
              </div>

              {hasPremium(userPlan) ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-5">
                    <p className="text-sm leading-7 text-zinc-200">
                      {premiumInsight}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/assistant?prompt=${encodeURIComponent(
                            `Give me an execution-focused strategic read on today’s market posture${
                              profile?.preferredSectors?.[0]
                                ? ` with emphasis on ${profile.preferredSectors[0]}`
                                : ""
                            }, my tracked opportunities, and where I should focus next.`
                          )}`
                        )
                      }
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 text-left text-sm text-emerald-200"
                    >
                      Generate execution-focused read
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/workspace?query=${encodeURIComponent(
                            `Build a strategic report on the best near-term execution opportunities${
                              profile?.preferredSectors?.[0]
                                ? ` in ${profile.preferredSectors[0]}`
                                : ""
                            } based on current market posture.`
                          )}&autorun=1`
                        )
                      }
                      className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-4 text-left text-sm text-violet-200"
                    >
                      Build premium strategic report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                  <p className="text-sm leading-7 text-amber-200">
                    Premium Insights gives you a sharper AI read on current market posture,
                    your tracked opportunities, and where to focus execution next.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      goToBilling(
                        "Premium Insights is available on Premium and above."
                      )
                    }
                    className="mt-4 rounded-xl border border-amber-500/20 bg-[#111318] px-4 py-2 text-sm font-medium text-amber-200"
                  >
                    Unlock Premium
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Personalization Snapshot
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Goal:{" "}
                  {profile?.goals?.[0]
                    ? labelGoal(profile.goals[0])
                    : "Not configured"}
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Market Style:{" "}
                  {profile ? labelMarketStyle(profile.marketStyle) : "Not configured"}
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Preferred Sector: {profile?.preferredSectors?.[0] || "Not configured"}
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/onboarding")}
                  className="w-full rounded-xl border border-white/8 bg-[#111318] px-4 py-3 text-sm font-medium text-zinc-300"
                >
                  Update Personalization
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Smart Watchlists
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  value={newWatchlist}
                  onChange={(e) => setNewWatchlist(e.target.value)}
                  placeholder="Add watchlist"
                  className="flex-1 rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={handleAddWatchlist}
                  className="rounded-xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {watchlists.length === 0 ? (
                  <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-500">
                    No watchlists yet.
                  </div>
                ) : (
                  watchlists.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleRemoveWatchlist(item)}
                      className="rounded-full border border-sky-500/20 bg-sky-500/[0.06] px-3 py-2 text-sm text-sky-200"
                      title="Click to remove"
                    >
                      {item}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Market Pulse
              </p>
              <h3 className="mt-1 text-xl font-semibold text-zinc-100">
                Executive signal read
              </h3>

              <div className="mt-4 rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
                <div
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${
                    overallMarketPulse.tone === "bullish"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : overallMarketPulse.tone === "bearish"
                      ? "border-red-500/20 bg-red-500/10 text-red-200"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  {overallMarketPulse.bias}
                </div>

                <p className="mt-4 text-sm leading-7 text-zinc-300">
                  {overallMarketPulse.text}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Execution Queue
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-zinc-100">
                    What to act on next
                  </h3>
                </div>
                {!canUseExecutionMode(userPlan) && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-200">
                    Premium
                  </span>
                )}
              </div>

              {canUseExecutionMode(userPlan) ? (
                <div className="space-y-3">
                  {[
                    "Review top tracked opportunity and convert it into a 30-day plan.",
                    "Refine one workspace report into a concrete execution sequence.",
                    "Prioritize one strategic opportunity for calendar follow-up this week.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-sm text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                  <p className="text-sm leading-7 text-amber-200">
                    Execution Queue helps turn analysis into a practical sequence of next moves.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      goToBilling(
                        "Execution Queue is available on Premium and above."
                      )
                    }
                    className="mt-4 rounded-xl border border-amber-500/20 bg-[#111318] px-4 py-2 text-sm font-medium text-amber-200"
                  >
                    Unlock Premium
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Trader Pulse
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-zinc-100">
                    Tactical market module
                  </h3>
                </div>
                {!canUseTraderMode(userPlan) && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-amber-200">
                    Premium
                  </span>
                )}
              </div>

              {canUseTraderMode(userPlan) ? (
                <div className="space-y-3">
                  {[
                    "Bias: follow index momentum and AI leadership alignment.",
                    "Catalysts: monitor macro windows, risk sentiment, and major earnings.",
                    "Risk: do not over-size when the market pulse is neutral.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 text-sm text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                  <p className="text-sm leading-7 text-amber-200">
                    Trader Pulse gives you a short tactical market read with bias, catalysts, and risk context.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      goToBilling(
                        "Trader Pulse is available on Premium and above."
                      )
                    }
                    className="mt-4 rounded-xl border border-amber-500/20 bg-[#111318] px-4 py-2 text-sm font-medium text-amber-200"
                  >
                    Unlock Premium
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Watchlist Alerts
              </p>
              <h3 className="mt-1 text-xl font-semibold text-zinc-100">
                Personalized alerts
              </h3>

              <div className="mt-4 space-y-3">
                {watchlistAlerts.map((alert) => {
                  const toneStyles =
                    alert.tone === "positive"
                      ? "border-emerald-500/15 bg-emerald-500/[0.06]"
                      : alert.tone === "caution"
                      ? "border-amber-500/15 bg-amber-500/[0.06]"
                      : "border-sky-500/15 bg-sky-500/[0.06]";

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-xl border px-4 py-4 ${toneStyles}`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                        {alert.topic}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-zinc-100">
                        {alert.title}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {alert.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}