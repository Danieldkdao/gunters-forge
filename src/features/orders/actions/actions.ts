"use server";

import z from "zod";
import { OrderActionError } from "../lib/lifecycle";
import {
  createOrderSchema,
  updateOrderSchema,
  type ReadOrdersSchema,
} from "./schemas";
import {
  cancelOrderDb,
  createOrderDb,
  markCashPaymentReceivedDb,
  requireOrderUser,
  updateOrderDb,
  updateOrderDetailsDb,
} from "../server/orders";
import {
  readOrderDb,
  readOrdersDb,
  readOrderQueuePositionDb,
} from "../server/queries";
import {
  createOrderCheckoutSession,
  reconcileCancelledStripeOrder,
} from "../server/payments";
import { isValidId } from "@/lib/utils";

const actionError = (error: unknown) => ({
  error: true as const,
  message:
    error instanceof z.ZodError
      ? "Invalid order data."
      : error instanceof OrderActionError
        ? error.message
        : "Unable to process this order.",
});

export const createOrderAction = async (unsafeData: unknown) => {
  try {
    const data = createOrderSchema.parse(unsafeData);
    if (data.paymentMethod !== "cash_on_delivery")
      throw new OrderActionError("Use the Stripe checkout flow instead.");
    const order = await createOrderDb(data);
    return {
      error: false as const,
      message: "Order created successfully!",
      data: order,
      orderId: order.id,
    };
  } catch (error) {
    return actionError(error);
  }
};

export const updateOrderAction = async (
  orderId: string,
  unsafeData: unknown,
) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    await requireOrderUser(true);
    const data = updateOrderSchema.parse(unsafeData);
    const order =
      data.status === "cancelled"
        ? await cancelOrderDb(orderId)
        : await updateOrderDb(orderId, data);
    if (order.status === "cancelled") {
      try {
        await reconcileCancelledStripeOrder(order);
      } catch {
        return {
          error: true as const,
          message:
            "Order cancelled, but payment reconciliation failed. Retry cancellation to finish processing the payment.",
          orderId: order.id,
        };
      }
    }
    return {
      error: false as const,
      message: "Order updated successfully!",
      orderId: order.id,
    };
  } catch (error) {
    return actionError(error);
  }
};

export const cancelOrderAction = async (orderId: string) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    const order = await cancelOrderDb(orderId);
    try {
      await reconcileCancelledStripeOrder(order);
    } catch {
      return {
        error: true as const,
        message:
          "Order cancelled, but payment reconciliation failed. Retry cancellation to finish processing the payment.",
        orderId: order.id,
      };
    }
    return {
      error: false as const,
      message: "Order cancelled successfully!",
      orderId: order.id,
    };
  } catch (error) {
    return actionError(error);
  }
};

export const markCashPaymentReceivedAction = async (orderId: string) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    const order = await markCashPaymentReceivedDb(orderId);
    return {
      error: false as const,
      message: "Cash payment recorded.",
      orderId: order.id,
    };
  } catch (error) {
    return actionError(error);
  }
};

export const readMyOrdersAction = async (options: ReadOrdersSchema = {}) => {
  try {
    return await readOrdersDb(options, "mine");
  } catch {
    return null;
  }
};

export const readOrdersAction = async (options: ReadOrdersSchema = {}) => {
  try {
    return await readOrdersDb(options, "admin");
  } catch {
    return null;
  }
};

export const readOrderQueueAction = async (options: ReadOrdersSchema = {}) => {
  try {
    return await readOrdersDb(options, "queue");
  } catch {
    return null;
  }
};

export const readOrderAction = async (orderId: string) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    return { error: false as const, data: await readOrderDb(orderId) };
  } catch (error) {
    return actionError(error);
  }
};

export const readOrderQueuePositionAction = async (orderId: string) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    return {
      error: false as const,
      data: await readOrderQueuePositionDb(orderId),
    };
  } catch (error) {
    return actionError(error);
  }
};

export const retryOrderCheckoutAction = async (orderId: string) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    const session = await createOrderCheckoutSession(orderId);
    return { error: false as const, orderId, url: session.url };
  } catch (error) {
    return actionError(error);
  }
};

export const updateOrderDetailsAction = async (
  orderId: string,
  unsafeData: unknown,
) => {
  try {
    if (!isValidId(orderId)) throw new Error("Invalid order ID");
    const order = await updateOrderDetailsDb(orderId, unsafeData);
    return {
      error: false as const,
      message: "Order details updated.",
      orderId: order.id,
    };
  } catch (error) {
    return actionError(error);
  }
};
