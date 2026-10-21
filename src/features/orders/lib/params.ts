import { orderStatuses } from "@/db/shared";
import { createLoader, parseAsStringEnum } from "nuqs/server";

export const orderStatusOptions = ["all", ...orderStatuses] as const;
export const ordersSearchParams = {
  status: parseAsStringEnum([...orderStatusOptions]).withDefault("all"),
  view: parseAsStringEnum(["all", "queue"]).withDefault("all"),
};
export const loadOrdersSearchParams = createLoader(ordersSearchParams);
