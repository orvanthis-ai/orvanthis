import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAccess } from "@/lib/server-access";

export async function GET() {
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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    const runs = await prisma.agentRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("GET /api/agent-runs error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to load agent runs." },
      { status: 500 }
    );
  }
}

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
    const { agent, title, prompt, route, output, notes, favorite } = body ?? {};

    if (
      typeof agent !== "string" ||
      typeof title !== "string" ||
      typeof prompt !== "string" ||
      typeof route !== "string"
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
        output: typeof output === "string" ? output : null,
        notes: typeof notes === "string" ? notes : null,
        favorite: Boolean(favorite),
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("POST /api/agent-runs error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to save agent run." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
    const { id, output, notes, favorite } = body ?? {};

    if (typeof id !== "string") {
      return NextResponse.json(
        { error: "invalid_request", message: "Run id is required." },
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

    const existing = await prisma.agentRun.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Run not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.agentRun.update({
      where: { id },
      data: {
        ...(typeof output === "string" ? { output } : {}),
        ...(typeof notes === "string" ? { notes } : {}),
        ...(typeof favorite === "boolean" ? { favorite } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/agent-runs error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to update agent run." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "invalid_request", message: "Run id is required." },
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

    const existing = await prisma.agentRun.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Run not found." },
        { status: 404 }
      );
    }

    await prisma.agentRun.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/agent-runs error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to delete agent run." },
      { status: 500 }
    );
  }
}