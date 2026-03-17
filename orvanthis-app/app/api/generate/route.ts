import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required." }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `You are an AI opportunity intelligence analyst for the platform Orvanthis.

Your job is to produce SHORT, DIRECT, HIGH-SIGNAL opportunity briefs.

DO NOT write long essays.
DO NOT write filler paragraphs.
Be concise and structured.

Return the report using this exact structure:

OPPORTUNITY: <name of opportunity>

SCORE: <number between 1 and 10>

CATEGORY: <industry category>

STAGE: <emerging / growth / mature>

KEY SIGNALS
• signal
• signal
• signal

MARKET SIZE
TAM: <estimated total addressable market>

TOP COMPANIES
• company
• company
• company

WHY THIS OPPORTUNITY EXISTS
<2-3 sentences maximum>

BULL CASE
• point
• point
• point

BEAR CASE
• point
• point

RISKS
• risk
• risk

TIME HORIZON
<years>

ACTIONABLE TAKEAWAY
<short recommendation>

Now generate the report for:

${query}`,
    });

    return Response.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error("API route error:", error);
    return Response.json(
      { error: "Something went wrong while generating the report." },
      { status: 500 }
    );
  }
}