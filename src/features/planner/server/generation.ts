import "server-only";
import { runs, tasks } from "@trigger.dev/sdk";
import z from "zod";
import { requireOrderUser } from "@/features/orders/server/orders";
import type { planForgeQueueTask } from "@/trigger/plan-forge-queue";
import { PlannerActionError } from "../lib/errors";
import { readPlannerRunByTriggerIdDb } from "./planner-runs";
import { isValidId } from "@/lib/utils";

export const generatePlannerRun = async (requestId: string) => {
  await requireOrderUser(true);
  if (!isValidId(requestId)) throw new Error("Invalid request ID");
  const handle = await tasks.trigger<typeof planForgeQueueTask>(
    "plan-forge-queue",
    {},
    { idempotencyKey: `planner-${requestId}` },
  );
  return { runId: handle.id };
};

export const readPlannerGeneration = async (unsafeId: string) => {
  await requireOrderUser(true);
  const id = z
    .string()
    .regex(/^run_[a-zA-Z0-9]+$/)
    .max(128)
    .parse(unsafeId);
  const saved = await readPlannerRunByTriggerIdDb(id);
  if (saved) return { state: "completed" as const, planId: saved.id };
  const run = await runs.retrieve<typeof planForgeQueueTask>(id);
  if (run.taskIdentifier !== "plan-forge-queue")
    throw new PlannerActionError("Planning job not found.");
  if (run.isSuccess) {
    if (run.output?.status === "empty") return { state: "empty" as const };
    throw new PlannerActionError("The job finished without a saved plan.");
  }
  if (run.isFailed || run.isCancelled || run.status === "EXPIRED")
    return { state: "failed" as const };
  return { state: "running" as const };
};
