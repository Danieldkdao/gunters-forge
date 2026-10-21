import { serverEnv } from "@/data/env/server";
import { errorResponse } from "@/lib/api-helpers";
import { stripe } from "@/services/stripe";
import {
  handlePaidCheckoutSession,
  handleUnpaidCheckoutSession,
  reconcileStripeRefunds,
} from "@/features/orders/server/payments";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const POST = async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return errorResponse("Missing signature", 400);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return errorResponse("Invalid signature", 400);
  }
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handlePaidCheckoutSession(event.data.object.id);
        break;
      case "checkout.session.expired":
        await handleUnpaidCheckoutSession(event.data.object.id);
        break;
      case "checkout.session.async_payment_failed":
        await handleUnpaidCheckoutSession(event.data.object.id, true);
        break;
      case "refund.created":
      case "refund.updated":
      case "refund.failed": {
        const intent = event.data.object.payment_intent;
        const intentId = typeof intent === "string" ? intent : intent?.id;
        if (intentId) await reconcileStripeRefunds(intentId);
        break;
      }
    }
  } catch (error) {
    console.error(
      "Stripe order event failed",
      event.id,
      error instanceof Error ? error.message : "Unknown error",
    );
    // Return a failure response so Stripe knows to retry the events that did not finish processing
    return errorResponse("Unable to process payment event", 500);
  }
  return NextResponse.json({ received: true });
};
