"use server";

import { OrderActionError } from "@/features/orders/lib/lifecycle";
import {
  readDashboardOverviewDb,
  readDashboardStatsDb,
} from "../server/queries";

const actionError = (error: unknown) => ({
  error: true as const,
  message:
    error instanceof OrderActionError
      ? error.message
      : "Unable to load the forge overview. Please try again.",
});

export const readDashboardStatsAction = async () => {
  try {
    return { error: false as const, data: await readDashboardStatsDb() };
  } catch (error) {
    return actionError(error);
  }
};

export const readDashboardOverviewAction = async () => {
  try {
    return { error: false as const, data: await readDashboardOverviewDb() };
  } catch (error) {
    return actionError(error);
  }
};
