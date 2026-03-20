import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAccess } from "@/lib/server-access";

export async function POST(req: Request) {
  try {
    const access = await getServerAccess();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error, message: access.message },
        { status: access.status }
      );
    }

    const email = access.user.email;
    if (!email) {
      return NextResponse.json(
        { error: "unauthorized", message: "Missing user email." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      agent,
      title,
      prompt,
      route,
      output,
      notes,
      favorite,
    } = body ?? {};

    if (
      typeof agent !== "string" ||
      typeof title !== "string" ||
      typeof prompt !== "string" ||
      typeof route !== "string" ||
      typeof output !== "string"
    ) {
      return NextResponse.json(
        { error: "invalid_request", message: "Missing required fields." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "not_found", message: "User not found." },
        { status: 404 }
      );
    }

    const run = await prisma.agentRun.create({
      data: {
        userId: user.id,
        agent,
        title,
        prompt,
        route,
        output,
        notes: typeof notes === "string" ? notes : null,
        favorite: Boolean(favorite),
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("POST /api/agent-runs/save-output error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to save output." },
      { status: 500 }
    );
  }
}