import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { PlannerRunTable } from "@/db/schema";
import { requireOrderUser } from "@/features/orders/server/orders";
import { createSortByMap } from "@/lib/db-filters";
import { normalizeData, writeCursor } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import {
  plannerRunIdSchema,
  plannerRunsCursorSchema,
  readPlannerRunsSchema,
  type ReadPlannerRunsSchema,
} from "../actions/schemas";
import { PlannerActionError } from "../lib/errors";
import { readPlannerRecommendationsDb } from "./planner-runs";

export const readPlannerRunDb = async (unsafeId: unknown) => {
  await requireOrderUser(true);
  const runId = plannerRunIdSchema.parse(unsafeId);
  const [run] = await db
    .select()
    .from(PlannerRunTable)
    .where(eq(PlannerRunTable.id, runId))
    .limit(1);
  if (!run) throw new PlannerActionError("Plan not found.");
  return { ...run, recommendations: await readPlannerRecommendationsDb(runId) };
};

export const readPlannerRunsDb = async (
  unsafeOptions: ReadPlannerRunsSchema = {},
) => {
  await requireOrderUser(true);
  const { lastCursor, status } = readPlannerRunsSchema.parse(unsafeOptions);
  const cursor = plannerRunsCursorSchema.parse(lastCursor);
  const sort = createSortByMap(PlannerRunTable, cursor, [
    { option: "recently_created", order: "desc", property: "createdAt" },
  ]).recently_created;
  const runs = await db
    .select()
    .from(PlannerRunTable)
    .where(
      and(
        sort.cursorFilter,
        status ? eq(PlannerRunTable.status, status) : undefined,
      ),
    )
    .orderBy(...sort.sortBy)
    .limit(PAGE_SIZE + 1);
  const data = runs.slice(0, PAGE_SIZE);
  const last = data.at(-1);
  return {
    data,
    nextCursor:
      runs.length > PAGE_SIZE && last
        ? writeCursor({ id: last.id, marker: normalizeData(last.createdAt) })
        : null,
    key: JSON.stringify({
      runs: data.map((run) => ({
        id: run.id,
        updated: run.updatedAt.toISOString(),
      })),
      filters: { status },
    }),
  };
};
