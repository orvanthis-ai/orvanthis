import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const watchlists = Array.isArray(body?.watchlists)
      ? body.watchlists.filter((item: unknown) => typeof item === "string")
      : [];

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
- Make the feed feel like a strategic intelligence terminal, not a generic AI list

Return a JSON array only.`,
    });

    const text = response.output_text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Feed generation returned invalid JSON." },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed)) {
      return Response.json(
        { error: "Feed generation returned invalid format." },
        { status: 500 }
      );
    }

    return Response.json({ items: parsed });
  } catch (error) {
    console.error("Opportunity feed error:", error);
    return Response.json(
      { error: "Something went wrong while generating the opportunity feed." },
      { status: 500 }
    );
  }
}