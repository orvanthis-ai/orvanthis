import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
}

export async function runSafeAI(prompt: string) {
  try {
    const openai = getClient();

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return {
      ok: true as const,
      text: response.output_text || "No response generated.",
    };
  } catch (error) {
    console.error("AI ERROR:", error);

    return {
      ok: false as const,
      text: "AI temporarily unavailable.",
    };
  }
}