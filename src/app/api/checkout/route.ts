import { serverEnv } from "@/data/env/server";
import { ProductSelectData } from "@/db/schema";
import { confirmProductExistenceDb } from "@/features/products/server/products";
import { errorResponse } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { errorMessage } from "@/lib/utils";
import { stripe } from "@/services/stripe";
import {
  CartItemSchema,
  cartItemSchema,
} from "@/features/cart/actions/schemas";
import { NextResponse } from "next/server";
import z from "zod";

export const POST = async (req: Request) => {
  const { userId, user } = await getCurrentUser(req.headers);
  if (!userId || !user || user.banned || !user.emailVerified) {
    return errorResponse(UNAUTHED_ERROR_MESSAGE, 401);
  }

  const { cartItems }: { cartItems: CartItemSchema[] } = await req.json();
  if (
    !cartItems.length ||
    !z.array(cartItemSchema).safeParse(cartItems).success
  ) {
    return errorResponse(INVALID_DATA_ERROR_MESSAGE, 400);
  }

  const existingCartItems = (
    await Promise.all(
      cartItems.map((cartItem) =>
        (async () => {
          const existingProduct = await confirmProductExistenceDb(
            cartItem.productId,
          );

          return {
            product: existingProduct,
            quantity: cartItem.quantity,
          };
        })(),
      ),
    )
  ).filter(
    (cartItem): cartItem is { product: ProductSelectData; quantity: number } =>
      Boolean(cartItem.product),
  );
  if (existingCartItems.length !== cartItems.length) {
    return errorResponse(NOT_FOUND_ERROR_MESSAGE, 404);
  }

  // TODO: create pending order and order iteme

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      allowed_payment_method_types: ["card"],
      line_items: existingCartItems.map((cartItem) => ({
        price: cartItem.product.stripePriceId,
        quantity: cartItem.quantity,
      })),
      // TODO: add order ID so we can resolve this later
      metadata: {
        userId,
      },
      customer_email: user.email,
      // TODO: create these routes
      success_url: `${serverEnv.APP_URL}/payment/success`,
      cancel_url: `${serverEnv.APP_URL}/payment/cancel`,
    });

    return NextResponse.json({
      error: false,
      message: "Checkout session created successfully!",
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(errorMessage(error), 500);
  }
};
