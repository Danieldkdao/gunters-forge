import { OrderStatus } from "@/db/shared";

export const cancellableStatuses: OrderStatus[] = [
  "in_progress",
  "pending_payment",
  "queued",
];

export const checkoutStorageKey = "gunters-forge-checkout";
