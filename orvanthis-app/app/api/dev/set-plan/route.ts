import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_PLANS = ["free", "premium", "premium_plus"] as const;

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "This route is disabled in production." },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body?.plan;

    if (!ALLOWED_PLANS.includes(plan)) {
      return Response.json({ error: "Invalid plan." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      },
    });

    return Response.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Set plan route error:", error);
    return Response.json(
      { error: "Failed to update plan." },
      { status: 500 }
    );
  }
}