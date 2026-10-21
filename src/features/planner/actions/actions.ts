"use server";

import z from "zod";
import { OrderActionError } from "@/features/orders/lib/lifecycle";
import { PlannerActionError } from "../lib/errors";
import {
  approvePlannerRunDb,
  applyPlannerRunDb,
  rejectPlannerRunDb,
} from "../server/reviews";
import { readPlannerRunDb, readPlannerRunsDb } from "../server/queries";
import type { ReadPlannerRunsSchema } from "./schemas";

const actionError = (error: unknown) => ({
  error: true as const,
  message:
    error instanceof z.ZodError
      ? "Invalid planner data."
      : error instanceof PlannerActionError || error instanceof OrderActionError
        ? error.message
        : "Unable to process this plan.",
});

export const readPlannerRunsAction = async (
  options: ReadPlannerRunsSchema = {},
) => {
  try {
    return await readPlannerRunsDb(options);
  } catch {
    return null;
  }
};

export const readPlannerRunAction = async (runId: string) => {
  try {
    return { error: false as const, data: await readPlannerRunDb(runId) };
  } catch (error) {
    return actionError(error);
  }
};

export const approvePlannerRunAction = async (runId: string) => {
  try {
    const data = await approvePlannerRunDb(runId);
    return {
      error: false as const,
      message: "Plan approved.",
      data,
      planId: data.id,
    };
  } catch (error) {
    return actionError(error);
  }
};

export const applyPlannerRunAction = async (runId: string) => {
  try {
    const data = await applyPlannerRunDb(runId);
    return {
      error: false as const,
      message: "Plan applied.",
      data,
      planId: data.id,
    };
  } catch (error) {
    return actionError(error);
  }
};

export const rejectPlannerRunAction = async (runId: string) => {
  try {
    const data = await rejectPlannerRunDb(runId);
    return {
      error: false as const,
      message: "Plan rejected.",
      data,
      planId: data.id,
    };
  } catch (error) {
    return actionError(error);
  }
};
