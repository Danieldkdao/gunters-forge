import { serverEnv } from "@/data/env/server";
import "server-only";
import Stripe from "stripe";

export const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2026-09-30.endive",
});
