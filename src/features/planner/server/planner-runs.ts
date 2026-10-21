import { asc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { PlannerRunTable, PlannerRecommendationTable } from "@/db/schema";
import { savePlannerRunSchema } from "../actions/schemas";
import { readPlannerSnapshotDb } from "./planner-snapshot";

export const readPlannerRunByTriggerIdDb = async (triggerRunId: string) => {
  const [run] = await db
    .select()
    .from(PlannerRunTable)
    .where(eq(PlannerRunTable.triggerRunId, triggerRunId))
    .limit(1);
  return run ?? null;
};

export const savePlannerRunDb = async (unsafeData: unknown) => {
  const data = savePlannerRunSchema.parse(unsafeData);
  return db.transaction(async (tx) => {
    const snapshot = await readPlannerSnapshotDb({ tx });
    const [run] = await tx
      .insert(PlannerRunTable)
      .values({
        triggerRunId: data.triggerRunId,
        snapshotVersion: data.snapshotVersion,
        model: data.model,
        summary: data.summary,
        generatedAt: data.generatedAt,
        status:
          snapshot.version === data.snapshotVersion
            ? "pending_review"
            : "stale",
      })
      .onConflictDoNothing({ target: PlannerRunTable.triggerRunId })
      .returning();
    if (!run) {
      const [existing] = await tx
        .select()
        .from(PlannerRunTable)
        .where(eq(PlannerRunTable.triggerRunId, data.triggerRunId));
      if (!existing)
        throw new Error("Unable to retrieve the saved planner run.");
      return existing;
    }
    await tx
      .insert(PlannerRecommendationTable)
      .values(
        data.recommendations.map((item) => ({ ...item, plannerRunId: run.id })),
      );
    return run;
  });
};

export const readPlannerRecommendationsDb = (
  runId: string,
  client: Pick<typeof db, "select"> = db,
) =>
  client
    .select()
    .from(PlannerRecommendationTable)
    .where(eq(PlannerRecommendationTable.plannerRunId, runId))
    .orderBy(asc(PlannerRecommendationTable.position));
