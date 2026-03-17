"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWatchlistAlerts } from "./lib/watchlist-alerts";

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

type DailyBrief = {
  headline: string;
  summary: string;
  priorityOne: string;
  priorityTwo: string;
  priorityThree: string;
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

const SAVED_REPORTS_KEY = "orvanthis:savedReports";
const RECENT_SEARCHES_KEY = "orvanthis:recentSearches";
const WATCHLISTS_KEY = "orvanthis:watchlists";
const LAST_GOOD_MARKET_KEY = "orvanthis:lastGoodMarketState";
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

function persistSavedReports(reports: SavedReport[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVED_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // ignore storage errors
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

function persistRecentSearches(searches: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // ignore storage errors
  }
}

function loadWatchlists(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WATCHLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .slice(0, 12);
  } catch {
    return [];
  }
}

function persistWatchlists(watchlists: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(watchlists));
  } catch {
    // ignore storage errors
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
  } catch {
    // ignore storage errors
  }
}

function mergeWithLastGood(
  fresh: LiveMarketItem[],
  lastGood: LiveMarketItem[]
): LiveMarketItem[] {
  const map = new Map(lastGood.map((item) => [item.symbol, item]));

  return fresh.map((item) => {
    const prior = map.get(item.symbol);
    if (!prior) return item;

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

function sectionTone(title: string) {
  const lower = title.toLowerCase();

  if (lower.includes("score") || lower.includes("opportunity")) {
    return "border-sky-500/20 bg-sky-500/[0.05] text-sky-200";
  }
  if (lower.includes("bull")) {
    return "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-200";
  }
  if (lower.includes("bear") || lower.includes("risk")) {
    return "border-red-500/20 bg-red-500/[0.05] text-red-200";
  }
  if (
    lower.includes("market") ||
    lower.includes("category") ||
    lower.includes("stage")
  ) {
    return "border-violet-500/20 bg-violet-500/[0.05] text-violet-200";
  }

  return "border-white/10 bg-white/[0.02] text-zinc-200";
}

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatPrice(value: number | null) {
  if (value === null) return "N/A";
  return `$${value.toFixed(2)}`;
}

function getBias(changePercent: number | null): string {
  if (changePercent === null) return "Awaiting Data";
  if (changePercent >= 1.25) return "Bullish";
  if (changePercent >= 0.25) return "Mild Bullish";
  if (changePercent <= -1.25) return "Bearish";
  if (changePercent <= -0.25) return "Mild Bearish";
  return "Neutral";
}

function getConviction(changePercent: number | null): "high" | "moderate" | "low" {
  if (changePercent === null) return "low";
  const abs = Math.abs(changePercent);
  if (abs >= 1.25) return "high";
  if (abs >= 0.25) return "moderate";
  return "low";
}

function getRead(label: string, changePercent: number | null): string {
  const bias = getBias(changePercent);

  if (changePercent === null) {
    return `${label} is waiting on a usable live market reading. Orvanthis will keep the last good signal when available.`;
  }

  if (bias === "Bullish" || bias === "Mild Bullish") {
    return `${label} is showing positive short-term momentum, which supports a constructive near-term read.`;
  }

  if (bias === "Bearish" || bias === "Mild Bearish") {
    return `${label} is trading under pressure, which supports a more cautious near-term view.`;
  }

  return `${label} is relatively balanced right now, so the market read remains neutral until momentum strengthens.`;
}

function getPrediction(changePercent: number | null) {
  if (changePercent === null) {
    return {
      direction: "Awaiting Live Data",
      confidence: "low" as const,
      read: "Live movement has not been returned yet, so prediction stays on standby.",
    };
  }

  if (changePercent >= 1.25) {
    return {
      direction: "Upside Continuation Likely",
      confidence: "high" as const,
      read: "Momentum is strong enough to support continued upside bias unless broader macro pressure interrupts.",
    };
  }

  if (changePercent >= 0.25) {
    return {
      direction: "Mild Upside Bias",
      confidence: "moderate" as const,
      read: "Short-term action supports a constructive read, though confirmation is still developing.",
    };
  }

  if (changePercent <= -1.25) {
    return {
      direction: "Downside Pressure Likely",
      confidence: "high" as const,
      read: "Weakness is strong enough to suggest further downside pressure unless buyers step in decisively.",
    };
  }

  if (changePercent <= -0.25) {
    return {
      direction: "Mild Downside Bias",
      confidence: "moderate" as const,
      read: "The near-term read leans cautious, though broader trend confirmation remains limited.",
    };
  }

  return {
    direction: "Rangebound / Neutral",
    confidence: "low" as const,
    read: "Price action is balanced, so directional edge remains limited until stronger momentum appears.",
  };
}

function getStableMarketPulse(marketData: LiveMarketItem[]) {
  if (marketData.length === 0) {
    return {
      bias: "Awaiting Market Data",
      text: "Live market data has not loaded yet.",
      tone: "neutral" as const,
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

  const weightedScore = (spy ?? 0) * 0.4 + (qqq ?? 0) * 0.4 + (aiAverage ?? 0) * 0.2;

  if (weightedScore >= 0.6) {
    return {
      bias: "Bullish Bias",
      text: "Broad market and growth leadership are aligned enough to support a constructive risk read.",
      tone: "bullish" as const,
    };
  }

  if (weightedScore <= -0.6) {
    return {
      bias: "Cautious Bias",
      text: "Broad weakness is strong enough to justify a more defensive short-term market posture.",
      tone: "bearish" as const,
    };
  }

  return {
    bias: "Neutral Bias",
    text: "The market read is balanced right now, so conviction stays neutral until stronger confirmation appears.",
    tone: "neutral" as const,
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [watchlists, setWatchlists] = useState<string[]>([]);
  const [watchlistInput, setWatchlistInput] = useState("");

  const [opportunityFeed, setOpportunityFeed] = useState<OpportunityFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");

  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState("");

  const [marketData, setMarketData] = useState<LiveMarketItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [lastMarketRefresh, setLastMarketRefresh] = useState<number | null>(null);

  useEffect(() => {
    setSavedReports(loadSavedReports());
    setRecentSearches(loadRecentSearches());
    setWatchlists(loadWatchlists());
    setMarketData(loadLastGoodMarketState());
  }, []);

  useEffect(() => {
    async function loadFeed() {
      try {
        setFeedLoading(true);
        setFeedError("");

        const res = await fetch("/api/opportunity-feed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
    async function loadDailyBrief() {
      try {
        setBriefLoading(true);
        setBriefError("");

        const res = await fetch("/api/daily-brief", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ watchlists }),
        });

        const rawText = await res.text();

        let data: Partial<DailyBrief> = {};
        try {
          data = JSON.parse(rawText);
        } catch {
          setBriefError("Daily brief returned invalid JSON.");
          setDailyBrief(null);
          return;
        }

        if (!res.ok) {
          setBriefError("Failed to load daily brief.");
          setDailyBrief(null);
          return;
        }

        if (
          typeof data.headline === "string" &&
          typeof data.summary === "string" &&
          typeof data.priorityOne === "string" &&
          typeof data.priorityTwo === "string" &&
          typeof data.priorityThree === "string"
        ) {
          setDailyBrief({
            headline: data.headline,
            summary: data.summary,
            priorityOne: data.priorityOne,
            priorityTwo: data.priorityTwo,
            priorityThree: data.priorityThree,
          });
        } else {
          setBriefError("Daily brief returned invalid data.");
          setDailyBrief(null);
        }
      } catch (error) {
        console.error("Daily brief load error:", error);
        setBriefError("There was an error loading the daily brief.");
        setDailyBrief(null);
      } finally {
        setBriefLoading(false);
      }
    }

    loadDailyBrief();
  }, [watchlists]);

  useEffect(() => {
    let active = true;

    async function loadMarketData() {
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
          if (active) {
            setMarketError("Market data returned invalid JSON.");
          }
          return;
        }

        if (!res.ok) {
          if (active) {
            setMarketError(data.error || "Failed to load market data.");
          }
          return;
        }

        if (Array.isArray(data.items)) {
          const lastGood = loadLastGoodMarketState();
          const merged = mergeWithLastGood(data.items, lastGood);

          if (active) {
            setMarketData(merged);
            setLastMarketRefresh(Date.now());
          }

          const goodToPersist = merged.filter(
            (item) => item.price !== null || item.changePercent !== null
          );

          if (goodToPersist.length > 0) {
            persistLastGoodMarketState(merged);
          }
        } else if (active) {
          setMarketError("Market data returned invalid data.");
        }
      } catch (error) {
        console.error("Market data load error:", error);
        if (active) {
          setMarketError("There was an error loading market data.");
        }
      } finally {
        if (active) {
          setMarketLoading(false);
        }
      }
    }

    loadMarketData();
    const intervalId = setInterval(loadMarketData, MARKET_REFRESH_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  function handleSaveReport(newQuery: string, newResult: string) {
    if (!newQuery.trim() || !newResult.trim()) return;

    setSavedReports((prev) => {
      const next: SavedReport[] = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          query: newQuery.trim(),
          result: newResult.trim(),
          timestamp: Date.now(),
        },
        ...prev,
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

      persistSavedReports(next);
      return next;
    });
  }

  function handleDeleteReport(id: string) {
    setSavedReports((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistSavedReports(next);
      return next;
    });
  }

  function loadSavedReport(report: SavedReport) {
    setQuery(report.query);
    setResult(report.result);
  }

  function handleSaveRecentSearch(newQuery: string) {
    const clean = newQuery.trim();
    if (!clean) return;

    setRecentSearches((prev) => {
      if (prev[0] === clean) return prev;
      const next = [clean, ...prev.filter((item) => item !== clean)].slice(0, 8);
      persistRecentSearches(next);
      return next;
    });
  }

  function handleAddWatchlist() {
    const clean = watchlistInput.trim();
    if (!clean) return;

    setWatchlists((prev) => {
      const exists = prev.some(
        (item) => item.toLowerCase() === clean.toLowerCase()
      );
      if (exists) return prev;

      const next = [clean, ...prev].slice(0, 12);
      persistWatchlists(next);
      return next;
    });

    setWatchlistInput("");
  }

  function handleRemoveWatchlist(itemToRemove: string) {
    setWatchlists((prev) => {
      const next = prev.filter((item) => item !== itemToRemove);
      persistWatchlists(next);
      return next;
    });
  }

  async function runReport(searchQuery: string) {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    try {
      setLoading(true);
      setResult("");
      setQuery(cleanQuery);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: cleanQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data.error || "Something went wrong.");
        return;
      }

      const generated = (data.result as string) || "No report was returned.";
      setResult(generated);
      handleSaveReport(cleanQuery, generated);
      handleSaveRecentSearch(cleanQuery);
    } catch (error) {
      console.error("Generate report error:", error);
      setResult("There was an error generating the report.");
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    await runReport(query);
  }

  async function handleFeedClick(feedQuery: string) {
    await runReport(feedQuery);
  }

  function renderStrategicReport(text: string) {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const sections: { title: string; content: string[] }[] = [];
    let currentTitle = "Executive Summary";
    let currentContent: string[] = [];

    const sectionTitles = [
      "OPPORTUNITY",
      "SCORE",
      "CATEGORY",
      "STAGE",
      "KEY SIGNALS",
      "MARKET SIZE",
      "TOP COMPANIES",
      "WHY THIS OPPORTUNITY EXISTS",
      "BULL CASE",
      "BEAR CASE",
      "RISKS",
      "TIME HORIZON",
      "ACTIONABLE TAKEAWAY",
      "Opportunity Summary",
      "Opportunity Score",
      "Opportunity Score (1-10)",
      "Why This Matters",
      "Bull Case",
      "Bear Case",
      "Risks",
      "Time Horizon",
      "Final Insight",
    ];

    function isSectionHeader(line: string) {
      return sectionTitles.some(
        (title) =>
          line === title ||
          line.startsWith(`${title}:`) ||
          line.startsWith(`### ${title}`)
      );
    }

    for (const line of lines) {
      if (isSectionHeader(line)) {
        if (currentContent.length > 0) {
          sections.push({ title: currentTitle, content: currentContent });
        }

        currentTitle = line.replace(/^###\s*/, "").replace(/:$/, "");
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.push({ title: currentTitle, content: currentContent });
    }

    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const tone = sectionTone(section.title);

          return (
            <div
              key={`${section.title}-${index}`}
              className={`rounded-2xl border p-5 ${tone}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {section.title}
                </h3>
              </div>

              <div className="space-y-3">
                {section.content.map((line, i) => {
                  const isBullet = line.startsWith("- ") || line.startsWith("• ");

                  if (isBullet) {
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-zinc-100"
                      >
                        • {line.replace(/^[-•]\s*/, "")}
                      </div>
                    );
                  }

                  return (
                    <p key={i} className="text-sm leading-7 text-zinc-100/95">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const opportunityScore = useMemo(() => {
    if (!result) return 8.4;

    const patterns = [
      /Opportunity Score\s*(?:\(1-10\))?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /SCORE\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*\/\s*10/i,
      /\b(\d+(?:\.\d+)?)\s*out of\s*10\b/i,
    ];

    for (const pattern of patterns) {
      const match = result.match(pattern);
      if (match && match[1]) {
        const parsed = Number(match[1]);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 10) {
          return parsed;
        }
      }
    }

    return 8.4;
  }, [result]);

  const scoreLabel = useMemo(() => {
    if (opportunityScore >= 8) return "High Conviction";
    if (opportunityScore >= 6) return "Moderate Conviction";
    return "Low Conviction";
  }, [opportunityScore]);

  const scoreCardStyles = useMemo(() => {
    if (opportunityScore >= 8) {
      return {
        card: "border-emerald-500/25 bg-emerald-500/[0.08]",
        text: "text-emerald-200/85",
        pill: "border border-emerald-500/25 bg-emerald-500/15 text-emerald-200",
      };
    }

    if (opportunityScore >= 6) {
      return {
        card: "border-amber-500/25 bg-amber-500/[0.08]",
        text: "text-amber-200/85",
        pill: "border border-amber-500/25 bg-amber-500/15 text-amber-200",
      };
    }

    return {
      card: "border-red-500/25 bg-red-500/[0.08]",
      text: "text-red-200/85",
      pill: "border border-red-500/25 bg-red-500/15 text-red-200",
    };
  }, [opportunityScore]);

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

  return (
    <main className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr_280px]">
          <aside className="hidden xl:flex flex-col gap-4">
            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Control Panel
              </p>
              <h3 className="mt-2 text-sm font-semibold text-zinc-100">
                Strategic Focus
              </h3>

              <div className="mt-4 space-y-2">
                {watchlists.slice(0, 6).map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2 text-xs text-zinc-200"
                  >
                    {item}
                  </div>
                ))}

                {watchlists.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/8 bg-[#0c0e12] px-3 py-3 text-xs text-zinc-500">
                    No sectors added yet
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Market Bias
              </p>

              <div className="mt-3 space-y-3">
                {marketData.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-zinc-400">{item.label}</span>
                    <span
                      className={
                        item.conviction === "high" && (item.changePercent ?? 0) >= 0
                          ? "text-emerald-300"
                          : item.conviction === "high"
                          ? "text-red-300"
                          : "text-amber-300"
                      }
                    >
                      {item.bias}
                    </span>
                  </div>
                ))}

                {marketData.length === 0 && (
                  <div className="text-xs text-zinc-500">Market data not loaded</div>
                )}
              </div>
            </div>

            <button
              onClick={() => runReport("Top emerging AI opportunities")}
              className="rounded-2xl border border-white/8 bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Quick AI Scan
            </button>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Session Notes
              </p>
              <p className="mt-3 text-xs leading-6 text-zinc-400">
                Live market data refreshes automatically every 90 seconds.
              </p>
            </div>
          </aside>

          <div>
            <header className="mb-8 rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_48px_rgba(0,0,0,0.38)]">
              <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center rounded-full border border-sky-400/15 bg-sky-400/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200/85">
                    Executive Strategy Workspace
                  </div>
                  <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 md:text-5xl">
                    Orvanthis
                  </h1>
                  <p className="mt-3 text-sm text-zinc-400 md:text-base">
                    Premium strategic intelligence for founders, operators, investors, and business leaders.
                    Monitor opportunities, track priority sectors, and turn market signals into decisions.
                  </p>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[380px]">
                  <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200/75">
                      Feed Signals
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-zinc-100">
                      {opportunityFeed.length || 0}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Active opportunities in view
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-violet-200/75">
                      Saved Reports
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-zinc-100">
                      {savedReports.length}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Stored intelligence briefs
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className={`rounded-2xl border p-5 ${scoreCardStyles.card}`}>
                  <p className={`text-[11px] uppercase tracking-[0.18em] ${scoreCardStyles.text}`}>
                    Opportunity Score
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <h3 className="text-4xl font-semibold text-zinc-100">
                      {opportunityScore.toFixed(1)}
                    </h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${scoreCardStyles.pill}`}>
                      {scoreLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    Confidence level from the most recent report.
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-violet-200/75">
                    Watchlists
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <h3 className="text-4xl font-semibold text-zinc-100">{watchlists.length}</h3>
                    <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.08] px-2.5 py-1 text-[11px] text-violet-100">
                      Personalized
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    Tracked sectors shaping your feed.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/75">
                    Recent Searches
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <h3 className="text-4xl font-semibold text-zinc-100">{recentSearches.length}</h3>
                    <span className="rounded-full border border-amber-500/15 bg-amber-500/[0.08] px-2.5 py-1 text-[11px] text-amber-100">
                      Memory
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    Search history for fast reuse.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Dashboard Type
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-100">
                    Business Intelligence
                  </h3>
                  <p className="mt-3 text-sm text-zinc-400">
                    Built for strategy, market evaluation, and executive insight.
                  </p>
                </div>
              </div>
            </header>

            <section className="mb-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <div className="mb-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Daily Strategic Brief
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
                    Executive briefing
                  </h2>
                </div>

                {briefLoading && (
                  <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5 text-sm text-zinc-300">
                    Preparing daily strategic brief...
                  </div>
                )}

                {!briefLoading && briefError && (
                  <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5 text-sm text-red-300">
                    {briefError}
                  </div>
                )}

                {!briefLoading && !briefError && dailyBrief && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-5">
                      <p className="text-sm font-medium text-zinc-100">{dailyBrief.headline}</p>
                      <p className="mt-3 text-sm leading-7 text-zinc-300">{dailyBrief.summary}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-500/18 bg-emerald-500/[0.06] p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                          Priority One
                        </p>
                        <p className="mt-2 text-sm text-zinc-100">{dailyBrief.priorityOne}</p>
                      </div>

                      <div className="rounded-2xl border border-amber-500/18 bg-amber-500/[0.06] p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                          Priority Two
                        </p>
                        <p className="mt-2 text-sm text-zinc-100">{dailyBrief.priorityTwo}</p>
                      </div>

                      <div className="rounded-2xl border border-violet-500/18 bg-violet-500/[0.06] p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                          Priority Three
                        </p>
                        <p className="mt-2 text-sm text-zinc-100">{dailyBrief.priorityThree}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <div className="mb-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Query Workspace
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
                    Strategic intelligence query
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Analyze markets, sectors, competitors, startup spaces, or executive opportunities.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Search markets, sectors, competitors, or strategic opportunities..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        generateReport();
                      }
                    }}
                    className="rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-4 text-white outline-none placeholder:text-zinc-600 focus:border-sky-500/40"
                  />

                  <button
                    onClick={generateReport}
                    disabled={loading}
                    className="rounded-2xl border border-white/8 bg-white px-6 py-4 font-semibold text-black transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Generating..." : "Generate Report"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "AI infrastructure startups",
                    "Defense robotics software",
                    "Energy storage intelligence",
                    "Regulatory compliance AI",
                  ].map((idea) => (
                    <button
                      key={idea}
                      onClick={() => setQuery(idea)}
                      className="rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-8 rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Market Signal Engine
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
                    Live market risk, leadership, and prediction signals
                  </h2>
                </div>
                <div className="rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  {lastMarketRefresh
                    ? `Updated ${new Date(lastMarketRefresh).toLocaleTimeString()}`
                    : "Live Market Data"}
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {marketData.map((signal) => {
                    const styles = getConvictionStyles(signal.conviction);
                    const prediction = getPrediction(signal.changePercent);
                    const predictionStyles = getConvictionStyles(prediction.confidence);

                    return (
                      <div
                        key={signal.id}
                        className={`rounded-[24px] border p-5 ${styles.card}`}
                      >
                        <div className="mb-3 flex flex-col items-start gap-2">
                          <span className={`text-[10px] uppercase tracking-[0.14em] ${styles.label}`}>
                            {signal.signalType}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex w-fit max-w-full rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${styles.pill}`}
                            >
                              {signal.bias}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                              {signal.sourceStatus === "live"
                                ? "Live"
                                : signal.sourceStatus === "partial"
                                ? "Partial"
                                : "Cached"}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-semibold text-zinc-100">
                          {signal.label}
                        </h3>

                        <div className="mt-3">
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
                        </div>

                        <div className={`mt-4 rounded-xl border p-3 ${predictionStyles.card}`}>
                          <p className={`text-[10px] uppercase tracking-[0.14em] ${predictionStyles.label}`}>
                            Prediction
                          </p>
                          <p className="mt-2 text-sm font-medium text-zinc-100">
                            {prediction.direction}
                          </p>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-zinc-300">
                          {prediction.read}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {marketError && marketData.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4 text-sm text-amber-200">
                  Live refresh had an issue, so Orvanthis is holding the last known good market state.
                </div>
              )}
            </section>

            <section className="mb-8 rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Opportunity Feed
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
                    Priority strategic signals
                  </h2>
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
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {opportunityFeed.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleFeedClick(item.query)}
                      className="group flex flex-col justify-between rounded-[24px] border border-white/8 bg-[#0c0e12] p-5 text-left transition hover:border-sky-500/30 hover:bg-[#101317]"
                    >
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="inline-flex max-w-full rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-violet-200/80">
                          {item.category}
                        </span>
                        <span className="inline-flex max-w-full rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-300">
                          {item.stage}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold leading-snug text-zinc-100 transition group-hover:text-white">
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

                      <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-zinc-500 group-hover:text-zinc-300">
                        Open report
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
              <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Intelligence Output
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-zinc-100">
                      Strategic report
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    Executive Memo
                  </div>
                </div>

                {loading && (
                  <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5 text-sm text-zinc-300">
                    Generating strategic intelligence...
                  </div>
                )}

                {!loading && !result && (
                  <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c0e12] p-8 text-sm text-zinc-500">
                    Run a query or open a feed signal to generate a structured executive report.
                  </div>
                )}

                {!loading && result && (
                  <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-6 shadow-inner">
                    <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/8 bg-[#12161c] px-5 py-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Report Type
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-100">
                          Executive Strategic Brief
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Current Query
                        </p>
                        <p className="mt-1 text-sm text-zinc-200">{query || "N/A"}</p>
                      </div>
                    </div>

                    {renderStrategicReport(result)}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Watchlists
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                    Tracked priorities
                  </h2>

                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add watchlist topic..."
                      value={watchlistInput}
                      onChange={(e) => setWatchlistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddWatchlist();
                        }
                      }}
                      className="flex-1 rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddWatchlist}
                      className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {watchlists.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c0e12] px-4 py-3 text-xs text-zinc-500">
                        Add priorities like AI infrastructure, defense tech, robotics, or compliance.
                      </div>
                    )}

                    {watchlists.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-full border border-white/8 bg-[#0c0e12] px-3 py-2"
                      >
                        <span className="text-xs text-zinc-300">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWatchlist(item)}
                          className="rounded-full border border-white/8 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500 transition hover:border-red-400/40 hover:text-red-300"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Recent Searches
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                    Research memory
                  </h2>

                  <div className="mt-4 space-y-3">
                    {recentSearches.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c0e12] p-4 text-xs text-zinc-500">
                        Your recent searches will appear here.
                      </div>
                    )}

                    {recentSearches.map((search, index) => (
                      <button
                        key={`${search}-${index}`}
                        type="button"
                        onClick={() => setQuery(search)}
                        className="block w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-[#101317] hover:text-white"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Saved Reports
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                    Stored intelligence
                  </h2>

                  <div className="mt-4 space-y-3">
                    {savedReports.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c0e12] p-4 text-xs text-zinc-500">
                        Generate a report to start building your intelligence archive.
                      </div>
                    )}

                    {savedReports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-[#0c0e12] p-4"
                      >
                        <button
                          type="button"
                          onClick={() => loadSavedReport(report)}
                          className="flex-1 text-left transition hover:opacity-90"
                        >
                          <p className="line-clamp-2 text-xs font-medium uppercase tracking-[0.08em] text-zinc-100">
                            {report.query}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {new Date(report.timestamp).toLocaleString()}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          className="ml-1 rounded-full border border-white/8 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500 transition hover:border-red-400/40 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Executive Notes
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                    Platform status
                  </h2>

                  <div className="mt-4 space-y-4 text-sm text-zinc-400">
                    <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
                      Live market data now uses last known good state protection.
                    </div>
                    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
                      Prediction cards are more stable when a refresh returns incomplete data.
                    </div>
                    <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                      Market pulse now uses a weighted methodology to reduce noise.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden xl:flex flex-col gap-4">
            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Live Signal
              </p>

              <h3 className="mt-2 text-sm font-semibold text-zinc-100">
                Market Pulse
              </h3>

              <p className="mt-3 text-xs leading-6 text-zinc-400">
                {overallMarketPulse.text}
              </p>

              <div
                className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${
                  overallMarketPulse.tone === "bullish"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : overallMarketPulse.tone === "bearish"
                    ? "border-red-500/20 bg-red-500/10 text-red-200"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                }`}
              >
                {overallMarketPulse.bias}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Top Signal
              </p>

              {marketData.length > 0 ? (
                <>
                  <h3 className="mt-2 text-sm font-semibold text-zinc-100">
                    {marketData[0].label}
                  </h3>

                  <p className="mt-3 text-xs leading-6 text-zinc-400">
                    {getPrediction(marketData[0].changePercent).read}
                  </p>

                  <div className="mt-3 text-xs text-zinc-300">
                    {formatPrice(marketData[0].price)} • {formatPercent(marketData[0].changePercent)}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-zinc-500">
                  No top market signal available yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Watchlist Alerts
              </p>

              <div className="mt-3 space-y-3">
                {watchlistAlerts.map((alert) => {
                  const toneStyles =
                    alert.tone === "positive"
                      ? "border-emerald-500/15 bg-emerald-500/[0.06]"
                      : alert.tone === "caution"
                      ? "border-amber-500/15 bg-amber-500/[0.06]"
                      : "border-sky-500/15 bg-sky-500/[0.06]";

                  const pillStyles =
                    alert.tone === "positive"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : alert.tone === "caution"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                      : "border-sky-500/20 bg-sky-500/10 text-sky-200";

                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => runReport(alert.queryToRun)}
                      className={`group w-full rounded-xl border px-3 py-3 text-left text-xs text-zinc-200 transition hover:border-white/15 hover:bg-[#101317] ${toneStyles}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            {alert.topic}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-100">
                            {alert.title}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${pillStyles}`}
                        >
                          {alert.tone === "positive"
                            ? "Tailwind"
                            : alert.tone === "caution"
                            ? "Caution"
                            : "Monitor"}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-3 leading-6 text-zinc-300">
                        {alert.body}
                      </p>

                      {alert.meta && (
                        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                          {alert.meta}
                        </p>
                      )}

                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500 group-hover:text-zinc-300">
                        {alert.actionLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Status
              </p>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Feed Engine</span>
                  <span className="text-emerald-300">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Daily Brief</span>
                  <span className="text-emerald-300">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Market Panel</span>
                  <span className="text-emerald-300">Protected</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}