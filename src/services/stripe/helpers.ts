import { ProductInsertData, ProductSelectData } from "@/db/schema";
import { stripe } from "./index";
import { confirmProductExistenceDb } from "@/features/products/server/products";
import Stripe from "stripe";

export const createStripeProduct = async (
  product: Omit<ProductInsertData, "stripePriceId" | "stripeProductId">,
) => {
  try {
    const response = await stripe.products.create({
      name: product.name,
      description: product.description,
      images: [product.imageUrl],
      active: product.isActive,
      default_price_data: {
        currency: "usd",
        unit_amount: product.price * 100,
      },
    });
    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateStripeProduct = async (product: ProductSelectData) => {
  try {
    const existingProduct = await confirmProductExistenceDb(product.id);
    if (!existingProduct) throw new Error("Product not found.");

    let newPrice: Stripe.Response<Stripe.Price> | null = null;

    if (product.price !== existingProduct.price) {
      newPrice = await stripe.prices.create({
        product: product.stripeProductId,
        unit_amount: product.price * 100,
        currency: "usd",
        active: product.isActive,
      });
    }

    const response = await stripe.products.update(product.stripeProductId, {
      name: product.name,
      description: product.description,
      images: [product.imageUrl],
      active: product.isActive,
      default_price: newPrice?.id,
    });

    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const disableStripeProduct = async (product: ProductSelectData) => {
  try {
    const response = await stripe.products.update(product.stripeProductId, {
      active: false,
    });

    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
};
