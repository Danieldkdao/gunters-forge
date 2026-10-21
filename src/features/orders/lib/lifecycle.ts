import type { OrderSelectData } from "@/db/schema";
import type { OrderStatus } from "@/db/shared";
import { cancellableStatuses } from "./constants";

export class OrderActionError extends Error {}

export const activeOrderStatuses: OrderStatus[] = ["queued", "in_progress"];

// Some statuses must be updated manually
const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  queued: ["in_progress"],
  in_progress: ["ready"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const canTransitionOrder = (from: OrderStatus, to: OrderStatus) =>
  from === to ||
  (to === "cancelled"
    ? cancellableStatuses.includes(from)
    : nextStatuses[from].includes(to));

export const getOrderTransitionData = (
  order: OrderSelectData,
  status: OrderStatus,
  now = new Date(),
): Partial<OrderSelectData> => {
  if (!canTransitionOrder(order.status, status)) {
    throw new OrderActionError(
      `Cannot change an order from ${order.status} to ${status}.`,
    );
  }
  if (status === order.status) return {};
  if (status === "completed" && order.paymentStatus !== "paid") {
    throw new OrderActionError("Record payment before completing this order.");
  }
  return {
    status,
    ...(status === "in_progress" ? { startedAt: now } : {}),
    ...(status === "completed" ? { completedAt: now } : {}),
    ...(status === "cancelled" ? { cancelledAt: now, queueRank: null } : {}),
  };
};
