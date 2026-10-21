ALTER TABLE "orders"
  ADD COLUMN "request_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN "stripe_checkout_session_id" text,
  ADD COLUMN "stripe_payment_intent_id" text,
  ADD CONSTRAINT "orders_request_id_unique" UNIQUE("request_id"),
  ADD CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
  ADD CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id");
