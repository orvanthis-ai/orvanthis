import OpenAI from "openai";

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
        ? `The user's tracked priorities are: ${watchlists.join(", ")}.`
        : `The user has not added watchlists yet. Provide a broad executive strategic brief.`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `You are creating a concise premium executive daily strategic brief for Orvanthis.

${watchlistContext}

Return valid JSON only in this exact shape:
{
  "headline": "short strategic headline",
  "summary": "2-3 sentence summary",
  "priorityOne": "short actionable point",
  "priorityTwo": "short actionable point",
  "priorityThree": "short actionable point"
}

Keep it concise, business-like, and useful for a founder, investor, or operator.
Do not include markdown.
Do not include anything outside JSON.`,
    });

    const text = response.output_text?.trim() || "";
    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (error) {
    console.error("Daily brief error:", error);

    return Response.json({
      headline: "Daily Strategic Brief",
      summary:
        "AI infrastructure, compliance, and strategic automation remain strong focus areas. Monitoring sector-specific signal strength and timing remains the best near-term edge.",
      priorityOne: "Review today’s top feed opportunities.",
      priorityTwo: "Track the highest-conviction watchlist sector.",
      priorityThree: "Generate one focused report for strategic follow-up.",
    });
  }
}