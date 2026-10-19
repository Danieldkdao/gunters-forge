import Stripe from "stripe";

export const getPriceId = (price: string | Stripe.Price | null | undefined) => {
  if (typeof price === "object" && price?.object === "price") {
    return price.id;
  } else if (typeof price === "string") return price;

  throw new Error("Invalid price argument.");
};
