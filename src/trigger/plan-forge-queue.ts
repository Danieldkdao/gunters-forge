import { schemaTask } from "@trigger.dev/sdk";
import { serverEnv } from "@/data/env/server";
import {
  readPlannerRunByTriggerIdDb,
  savePlannerRunDb,
} from "@/features/planner/server/planner-runs";
import { plannerInputSchema } from "@/features/planner/lib/planner-schemas";
import { planForgeQueue } from "@/features/planner/server/planner";

export const planForgeQueueTask = schemaTask({
  id: "plan-forge-queue",
  schema: plannerInputSchema,
  // Run one planning task at a time
  concurrency: { total: 1 },
  maxDuration: 180,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
    randomize: true,
  },
  run: async (_, { ctx }) => {
    const existing = await readPlannerRunByTriggerIdDb(ctx.run.id);
    if (existing) return { planId: existing.id, status: existing.status };
    const plan = await planForgeQueue();
    if (plan.status === "empty") return plan;
    const run = await savePlannerRunDb({
      triggerRunId: ctx.run.id,
      snapshotVersion: plan.snapshotVersion,
      model: serverEnv.OPENROUTER_MODEL,
      summary: plan.summary,
      generatedAt: plan.generatedAt,
      recommendations: plan.orders,
    });
    return { planId: run.id, status: run.status };
  },
});
