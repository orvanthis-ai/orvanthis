import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { message: "Query is required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.7,
    });

    const result =
      completion.choices?.[0]?.message?.content ||
      "No response generated.";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("API GENERATE ERROR:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while generating the response.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}