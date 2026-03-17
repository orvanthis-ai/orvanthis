import OpenAI from "openai";

type FeedItem = {
  id: string;
  title: string;
  query: string;
  category: string;
  score: number;
  stage: string;
  signal: string;
};

function safeFallbackFeed(watchlists: string[]): FeedItem[] {
  const topics =
    watchlists.length > 0
      ? watchlists.slice(0, 4)
      : ["AI infrastructure", "Defense tech", "Energy storage", "Regulatory AI"];

  return topics.map((topic, index) => ({
    id: `fallback-${index + 1}`,
    title:
      topic.length > 28
        ? topic.slice(0, 28)
        : topic.charAt(0).toUpperCase() + topic.slice(1),
    query: topic,
    category: "Strategic",
    score: 8.0 + index * 0.2,
    stage: index % 2 === 0 ? "Emerging" : "Growth",
    signal: `Growing market attention and strong strategic relevance around ${topic}.`,
  }));
}

function sanitizeFeedItem(item: unknown, index: number): FeedItem | null {
  if (!item || typeof item !== "object") return null;

  const obj = item as Record<string, unknown>;

  const title =
    typeof obj.title === "string" && obj.title.trim()
      ? obj.title.trim()
      : `Strategic Opportunity ${index + 1}`;

  const query =
    typeof obj.query === "string" && obj.query.trim()
      ? obj.query.trim()
      : title;

  const category =
    typeof obj.category === "string" && obj.category.trim()
      ? obj.category.trim()
      : "Strategic";

  const rawScore =
    typeof obj.score === "number"
      ? obj.score
      : typeof obj.score === "string"
      ? Number(obj.score)
      : 8;

  const score =
    Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 10 ? rawScore : 8;

  const stage =
    typeof obj.stage === "string" && obj.stage.trim()
      ? obj.stage.trim()
      : "Emerging";

  const signal =
    typeof obj.signal === "string" && obj.signal.trim()
      ? obj.signal.trim()
      : "Growing strategic relevance and market momentum.";

  return {
    id:
      typeof obj.id === "string" && obj.id.trim()
        ? obj.id.trim()
        : `generated-${index + 1}`,
    title,
    query,
    category,
    score,
    stage,
    signal,
  };
}

export async function POST(req: Request) {
  let watchlists: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    watchlists = Array.isArray(body?.watchlists)
      ? body.watchlists.filter((item: unknown) => typeof item === "string")
      : [];
  } catch {
    watchlists = [];
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const watchlistContext =
      watchlists.length > 0
        ? `User watchlists: ${watchlists.join(", ")}`
        : "User has no watchlists yet. Generate a balanced premium strategic opportunity feed.";

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `You are generating a premium business intelligence opportunity feed for a platform called Orvanthis.

${watchlistContext}

Return exactly 4 strategic opportunity items as valid JSON only.
Do not include markdown.
Do not include explanations outside JSON.

Each item must follow this exact shape:
{
  "id": "unique-string",
  "title": "short opportunity title",
  "query": "search query to generate a deeper report",
  "category": "short category",
  "score": number,
  "stage": "Emerging or Growth or Mature",
  "signal": "one-sentence summary"
}

Rules:
- Prioritize items aligned with the user's watchlists when provided
- Focus on high-value business, market, startup, infrastructure, regulatory, defense, energy, strategy, or executive intelligence opportunities
- Make them feel useful for founders, investors, strategists, and executives
- Score must be between 1 and 10
- Keep titles short and premium
- Keep signal summaries concise
- Return a JSON array only.`,
    });

    const text = response.output_text?.trim() || "";

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { items: safeFallbackFeed(watchlists), source: "fallback-json-parse" },
        { status: 200 }
      );
    }

    if (!Array.isArray(parsed)) {
      return Response.json(
        { items: safeFallbackFeed(watchlists), source: "fallback-invalid-format" },
        { status: 200 }
      );
    }

    const cleaned = parsed
      .map((item, index) => sanitizeFeedItem(item, index))
      .filter((item): item is FeedItem => item !== null)
      .slice(0, 4);

    if (cleaned.length === 0) {
      return Response.json(
        { items: safeFallbackFeed(watchlists), source: "fallback-empty" },
        { status: 200 }
      );
    }

    return Response.json({ items: cleaned, source: "ai" }, { status: 200 });
  } catch (error) {
    console.error("Opportunity feed error:", error);

    return Response.json(
      { items: safeFallbackFeed(watchlists), source: "fallback-error" },
      { status: 200 }
    );
  }
}