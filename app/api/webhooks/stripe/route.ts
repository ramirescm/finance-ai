import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Stripe } from "stripe";

// localhost:3000/api/webhooks/stripe
// listen events from stripe locally
// stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.error();
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.error();
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const event = stripe.webhooks.constructEvent(
    text,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "invoice.paid":
      // updated user
      const { customer, subscription, subscription_details } =
        event.data.object;

      const clerkUserId = subscription_details?.metadata?.clerk_user_id;
      if (!clerkUserId) {
        return NextResponse.error();
      }
      await clerkClient().users.updateUser(clerkUserId, {
        publicMetadata: {
          subscriptionPlan: "premium",
        },
        privateMetadata: {
          stripeCustomerId: customer,
          stripeSubscriptionId: subscription,
        },
      });
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
};
