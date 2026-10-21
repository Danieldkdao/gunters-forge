import { schemaTask } from "@trigger.dev/sdk";
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
  run: async () => planForgeQueue(),
});
