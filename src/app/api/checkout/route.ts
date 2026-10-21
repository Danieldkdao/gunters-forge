import { errorResponse } from "@/lib/api-helpers";
import { createOrderSchema } from "@/features/orders/actions/schemas";
import {
  createOrderDb,
  requireOrderUser,
} from "@/features/orders/server/orders";
import { createOrderCheckoutSession } from "@/features/orders/server/payments";
import { NextResponse } from "next/server";
import z from "zod";
import { isValidId } from "@/lib/utils";

export const POST = async (req: Request) => {
  try {
    await requireOrderUser();
  } catch {
    return errorResponse(
      "You must sign in with a verified account to check out.",
      401,
    );
  }
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return errorResponse("Invalid checkout data.", 400);
  }
  const body = z
    .object({
      cartItems: createOrderSchema.shape.cartItems,
      deliveryAddress: createOrderSchema.shape.deliveryAddress,
      customerNotes: createOrderSchema.shape.customerNotes,
      requestId: z.uuid().optional(),
    })
    .strict()
    .safeParse(input);
  const headerRequestId = req.headers.get("idempotency-key");
  if (
    !body.success ||
    (headerRequestId !== null && !isValidId(headerRequestId))
  ) {
    return errorResponse("Invalid checkout data.", 400);
  }
  if (
    headerRequestId &&
    body.data.requestId &&
    headerRequestId !== body.data.requestId
  ) {
    return errorResponse("Conflicting request IDs.", 400);
  }
  let orderId: string | undefined;
  try {
    const order = await createOrderDb({
      ...body.data,
      paymentMethod: "stripe",
      requestId: headerRequestId ?? body.data.requestId,
    });
    // Preserve order ID on errors if possible so that client can retry the payment
    orderId = order.id;
    const session = await createOrderCheckoutSession(order.id);
    return NextResponse.json({
      error: false,
      message: "Checkout session created successfully!",
      orderId: order.id,
      url: session.url,
    });
  } catch (error) {
    console.error(
      "Order checkout failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      {
        error: true,
        message: orderId
          ? "Unable to start checkout. Retry payment for this order."
          : "Unable to create this order. Check that all products are available.",
        ...(orderId ? { orderId } : {}),
      },
      { status: orderId ? 502 : 400 },
    );
  }
};
