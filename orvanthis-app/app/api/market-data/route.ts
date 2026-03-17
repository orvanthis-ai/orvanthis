type TwelveDataPriceResponse = {
  price?: string;
  status?: string;
  message?: string;
};

type TwelveDataQuote = {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  average_volume?: string;
  is_market_open?: boolean;
  status?: string;
  message?: string;
};

type MarketItem = {
  id: string;
  symbol: string;
  label: string;
  price: number | null;
  changePercent: number | null;
  bias: string;
  conviction: "high" | "moderate" | "low";
  signalType: string;
  read: string;
  sourceStatus: "live" | "partial" | "fallback";
};

function toNumber(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function getSignalType(symbol: string): string {
  if (symbol === "SPY" || symbol === "QQQ") return "Index Proxy";
  if (symbol === "NVDA" || symbol === "AMD" || symbol === "MSFT") return "AI Leadership";
  return "Market Signal";
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

async function fetchSymbol(symbol: string, label: string, apiKey: string): Promise<MarketItem> {
  try {
    const priceUrl = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(
      symbol
    )}&apikey=${encodeURIComponent(apiKey)}`;

    const quoteUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(
      symbol
    )}&apikey=${encodeURIComponent(apiKey)}`;

    const [priceRes, quoteRes] = await Promise.all([
      fetch(priceUrl, { cache: "no-store" }),
      fetch(quoteUrl, { cache: "no-store" }),
    ]);

    const priceJson = (await priceRes.json()) as TwelveDataPriceResponse;
    const quoteJson = (await quoteRes.json()) as TwelveDataQuote;

    const latestPrice =
      toNumber(priceJson.price) ??
      toNumber(quoteJson.close) ??
      toNumber(quoteJson.open);

    let changePercent = toNumber(quoteJson.percent_change);

    if (changePercent === null) {
      const previousClose = toNumber(quoteJson.previous_close);
      if (
        latestPrice !== null &&
        previousClose !== null &&
        previousClose !== 0
      ) {
        changePercent = ((latestPrice - previousClose) / previousClose) * 100;
      }
    }

    const sourceStatus: "live" | "partial" | "fallback" =
      latestPrice !== null && changePercent !== null
        ? "live"
        : latestPrice !== null || changePercent !== null
        ? "partial"
        : "fallback";

    return {
      id: symbol.toLowerCase(),
      symbol,
      label,
      price: latestPrice,
      changePercent,
      bias: getBias(changePercent),
      conviction: getConviction(changePercent),
      signalType: getSignalType(symbol),
      read: getRead(label, changePercent),
      sourceStatus,
    };
  } catch (error) {
    console.error(`Market item fetch failed for ${symbol}:`, error);

    return {
      id: symbol.toLowerCase(),
      symbol,
      label,
      price: null,
      changePercent: null,
      bias: "Awaiting Data",
      conviction: "low",
      signalType: getSignalType(symbol),
      read: `${label} could not be loaded yet.`,
      sourceStatus: "fallback",
    };
  }
}

export async function GET() {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Missing TWELVE_DATA_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const symbols = [
      { symbol: "SPY", label: "S&P 500" },
      { symbol: "QQQ", label: "Nasdaq 100" },
      { symbol: "NVDA", label: "NVIDIA" },
      { symbol: "AMD", label: "AMD" },
      { symbol: "MSFT", label: "Microsoft" },
    ];

    const items = await Promise.all(
      symbols.map(({ symbol, label }) => fetchSymbol(symbol, label, apiKey))
    );

    return Response.json({ items }, { status: 200 });
  } catch (error) {
    console.error("Market data route error:", error);
    return Response.json(
      { error: "Failed to load live market data." },
      { status: 500 }
    );
  }
}