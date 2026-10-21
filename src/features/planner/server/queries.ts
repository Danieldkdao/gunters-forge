import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { PlannerRunTable, OrderTable, OrderItemTable } from "@/db/schema";
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
import { readPlannerSnapshotDb } from "./planner-snapshot";

export const readPlannerRunDb = async (unsafeId: unknown) => {
  await requireOrderUser(true);
  const runId = plannerRunIdSchema.parse(unsafeId);
  const [run] = await db
    .select()
    .from(PlannerRunTable)
    .where(eq(PlannerRunTable.id, runId))
    .limit(1);
  if (!run) throw new PlannerActionError("Plan not found.");
  const recommendations = await readPlannerRecommendationsDb(runId);
  const ids = recommendations.map((item) => item.orderId);
  const [orders, items, snapshot] = await Promise.all([
    ids.length
      ? db
          .select({
            id: OrderTable.id,
            orderNumber: OrderTable.orderNumber,
            status: OrderTable.status,
            queueRankIsManual: OrderTable.queueRankIsManual,
          })
          .from(OrderTable)
          .where(inArray(OrderTable.id, ids))
      : [],
    ids.length
      ? db
          .select({
            id: OrderItemTable.id,
            orderId: OrderItemTable.orderId,
            productName: OrderItemTable.productName,
            quantity: OrderItemTable.quantity,
            craftingTimeMinutes: OrderItemTable.craftingTimeMinutes,
          })
          .from(OrderItemTable)
          .where(inArray(OrderItemTable.orderId, ids))
      : [],
    readPlannerSnapshotDb(),
  ]);
  const queued = snapshot.orders.filter((order) => order.status === "queued");
  return {
    ...run,
    isStale:
      (run.status === "pending_review" || run.status === "approved") &&
      run.snapshotVersion !== snapshot.version,
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      order:
        orders.find((order) => order.id === recommendation.orderId) ?? null,
      items: items.filter((item) => item.orderId === recommendation.orderId),
      currentPosition:
        queued.findIndex((order) => order.id === recommendation.orderId) + 1 ||
        null,
    })),
  };
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

export const readPlanningScreenDb = async () => {
  await requireOrderUser(true);
  const [history, snapshot] = await Promise.all([
    readPlannerRunsDb(),
    readPlannerSnapshotDb(),
  ]);
  const latest = history.data[0];
  return {
    history,
    plan: latest ? await readPlannerRunDb(latest.id) : null,
    overview: {
      queued: snapshot.orders.filter((order) => order.status === "queued")
        .length,
      inProgress: snapshot.orders.filter(
        (order) => order.status === "in_progress",
      ).length,
      craftingMinutes: snapshot.items.reduce(
        (total, item) => total + item.quantity * item.craftingTimeMinutes,
        0,
      ),
    },
  };
};

export type PlanningScreenData = Awaited<
  ReturnType<typeof readPlanningScreenDb>
>;
export type PlannerDetailData = Awaited<ReturnType<typeof readPlannerRunDb>>;
