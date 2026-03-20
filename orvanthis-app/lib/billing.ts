import { stripe } from "@/lib/stripe";

export type BillingPlan = "premium" | "premium_plus";
export type BillingCycle = "monthly" | "annual";

function getPriceId(plan: BillingPlan, cycle: BillingCycle) {
  if (plan === "premium" && cycle === "monthly") {
    return process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
  }

  if (plan === "premium" && cycle === "annual") {
    return process.env.STRIPE_PRICE_PREMIUM_ANNUAL;
  }

  if (plan === "premium_plus" && cycle === "monthly") {
    return process.env.STRIPE_PRICE_PREMIUM_PLUS_MONTHLY;
  }

  if (plan === "premium_plus" && cycle === "annual") {
    return process.env.STRIPE_PRICE_PREMIUM_PLUS_ANNUAL;
  }

  return null;
}

export async function createCheckoutSession(args: {
  userId: string;
  email: string;
  plan: BillingPlan;
  cycle: BillingCycle;
}) {
  const priceId = getPriceId(args.plan, args.cycle);

  if (!priceId) {
    throw new Error(
      `Missing Stripe price ID for ${args.plan} (${args.cycle}).`
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: args.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=cancel`,
    metadata: {
      userId: args.userId,
      plan: args.plan,
      cycle: args.cycle,
    },
    subscription_data: {
      metadata: {
        userId: args.userId,
        plan: args.plan,
        cycle: args.cycle,
      },
    },
  });

  return session;
}