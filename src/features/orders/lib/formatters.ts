import { format } from "date-fns";
import type { OrderPaymentStatus, OrderStatus } from "@/db/shared";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  queued: "In the queue",
  in_progress: "Being crafted",
  ready: "Ready for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const paymentStatusLabels: Record<OrderPaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

export const formatOrderNumber = (number: number) =>
  `GF-${String(number).padStart(6, "0")}`;
export const formatOrderDate = (date: Date) =>
  format(date, "MMM d, yyyy · h:mm a");
