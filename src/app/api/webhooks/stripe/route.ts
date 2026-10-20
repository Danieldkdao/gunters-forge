import { serverEnv } from "@/data/env/server";
import { errorResponse } from "@/lib/api-helpers";
import { stripe } from "@/services/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const POST = async (req: Request) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error(error);
    return errorResponse("Invalid signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const { userId, orderId } = session.metadata ?? {};
    if (!userId || !orderId) {
      console.error("Missing metadata in Stripe session:", session.id);
      return errorResponse("Missing metadata", 400);
    }

    // TODO: handle marking orders complete and other checkout completion logic
  }

  return NextResponse.json({ received: true });
};
