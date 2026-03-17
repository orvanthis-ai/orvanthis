export type OpportunityFeedItem = {
  id: string;
  title: string;
  query: string;
  category: string;
  score: number;
  stage: string;
  signal: string;
};

export type LiveMarketItem = {
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

export type MarketPulse = {
  bias: string;
  text: string;
  tone: "bullish" | "bearish" | "neutral";
};

export type WatchlistAlertTone = "positive" | "caution" | "neutral";

export type WatchlistAlert = {
  id: string;
  topic: string;
  title: string;
  tone: WatchlistAlertTone;
  body: string;
  actionLabel: string;
  queryToRun: string;
  meta?: string;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function topicKeywords(topic: string): string[] {
  const words = normalize(topic)
    .split(/[^a-z0-9]+/g)
    .map((w) => w.trim())
    .filter(Boolean);

  const filtered = words.filter(
    (w) => w.length >= 4 && !["with", "from", "this", "that"].includes(w)
  );

  return (filtered.length > 0 ? filtered : words).slice(0, 6);
}

function matchStrength(topic: string, item: OpportunityFeedItem) {
  const keys = topicKeywords(topic);
  const hay = normalize(
    [item.title, item.query, item.category, item.signal, item.stage].join(" ")
  );

  let hits = 0;
  for (const key of keys) {
    if (!key) continue;
    if (hay.includes(key)) hits += 1;
  }

  if (hits === 0) return 0;
  if (hits >= 3) return 3;
  return hits;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatScore(score: number) {
  const safe = Number.isFinite(score) ? clamp(score, 0, 10) : 0;
  return safe.toFixed(1);
}

function marketSummary(marketData: LiveMarketItem[]) {
  const spy =
    marketData.find((item) => item.symbol === "SPY")?.changePercent ?? null;
  const qqq =
    marketData.find((item) => item.symbol === "QQQ")?.changePercent ?? null;

  const aiLeaders = marketData
    .filter((item) => ["NVDA", "AMD", "MSFT"].includes(item.symbol))
    .map((item) => item.changePercent)
    .filter((v): v is number => v !== null);

  const aiAverage =
    aiLeaders.length > 0
      ? aiLeaders.reduce((s, v) => s + v, 0) / aiLeaders.length
      : null;

  return { spy, qqq, aiAverage };
}

export function buildWatchlistAlerts(args: {
  watchlists: string[];
  opportunityFeed: OpportunityFeedItem[];
  marketData: LiveMarketItem[];
  overallMarketPulse: MarketPulse;
}): WatchlistAlert[] {
  const { watchlists, opportunityFeed, marketData, overallMarketPulse } = args;

  if (watchlists.length === 0) {
    return [
      {
        id: "watchlists-empty",
        topic: "Watchlists",
        title: "Add watchlists to activate alerts",
        tone: "neutral",
        body: "Add 2–4 priority sectors (e.g. AI infrastructure, defense tech, compliance) to generate personalized alerting against your feed and market posture.",
        actionLabel: "Add priorities",
        queryToRun: "Top emerging opportunities aligned to my priorities",
        meta: "Personalization requires watchlists",
      },
    ];
  }

  const alerts: WatchlistAlert[] = [];
  const { spy, qqq, aiAverage } = marketSummary(marketData);

  for (const topic of watchlists.slice(0, 8)) {
    const ranked = opportunityFeed
      .map((item) => {
        const strength = matchStrength(topic, item);
        const score = item.score ?? 0;
        const weighted = strength * 2 + clamp(score / 2, 0, 5);
        return { item, strength, weighted };
      })
      .filter((x) => x.strength > 0)
      .sort((a, b) => b.weighted - a.weighted);

    const best = ranked[0]?.item;

    if (best) {
      const tone: WatchlistAlertTone =
        best.score >= 8.2
          ? "positive"
          : best.score >= 6.6
          ? "neutral"
          : "caution";

      const metaParts = [
        best.category?.trim() ? best.category.trim() : null,
        best.stage?.trim() ? best.stage.trim() : null,
        Number.isFinite(best.score) ? `Score ${formatScore(best.score)}` : null,
      ].filter(Boolean);

      alerts.push({
        id: `wl-${normalize(topic).slice(0, 28)}-${best.id}`,
        topic,
        title: `Watchlist signal: ${best.title}`,
        tone,
        body:
          best.signal?.trim() ||
          `Opportunity activity related to ${topic} is showing up in your feed. Open to generate an executive brief with key signals, risks, and actionable takeaways.`,
        actionLabel: "Open brief",
        queryToRun: best.query || best.title,
        meta: metaParts.join(" • "),
      });

      continue;
    }

    if (overallMarketPulse.tone === "bearish") {
      alerts.push({
        id: `wl-posture-${normalize(topic).slice(0, 28)}`,
        topic,
        title: `Risk posture: ${topic}`,
        tone: "caution",
        body:
          "Market posture is currently cautious. For this watchlist, tighten entry criteria (pricing power, contracted demand, clear ROI) and avoid crowded narratives until conditions improve.",
        actionLabel: "Run risk scan",
        queryToRun: `Risks and near-term catalysts for ${topic}`,
        meta:
          spy !== null || qqq !== null
            ? `SPY ${spy ?? "N/A"}% • QQQ ${qqq ?? "N/A"}%`
            : undefined,
      });
      continue;
    }

    if (overallMarketPulse.tone === "bullish") {
      alerts.push({
        id: `wl-tailwind-${normalize(topic).slice(0, 28)}`,
        topic,
        title: `Tailwind check: ${topic}`,
        tone: "positive",
        body:
          "Market bias is constructive. For this watchlist, prioritize speed: identify 3–5 targets, validate budget owners, and pressure-test competitive differentiation before attention becomes crowded.",
        actionLabel: "Run acceleration scan",
        queryToRun: `Top opportunities and fastest go-to-market wedges in ${topic}`,
        meta:
          aiAverage !== null
            ? `AI leadership avg ${aiAverage.toFixed(2)}%`
            : spy !== null || qqq !== null
            ? `SPY ${spy ?? "N/A"}% • QQQ ${qqq ?? "N/A"}%`
            : undefined,
      });
      continue;
    }

    alerts.push({
      id: `wl-monitor-${normalize(topic).slice(0, 28)}`,
      topic,
      title: `Monitoring: ${topic}`,
      tone: "neutral",
      body:
        "No direct feed hits yet. Keep this watchlist active and run a targeted scan for new entrants, procurement signals, and regulatory catalysts that could change momentum quickly.",
      actionLabel: "Run targeted scan",
      queryToRun: `Latest market signals, competitors, and catalysts for ${topic}`,
    });
  }

  const unique = new Map<string, WatchlistAlert>();
  for (const alert of alerts) {
    if (!unique.has(alert.id)) unique.set(alert.id, alert);
  }

  return Array.from(unique.values()).slice(0, 6);
}