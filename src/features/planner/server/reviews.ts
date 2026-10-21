import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/db";
import { OrderTable, OrderItemTable, PlannerRunTable } from "@/db/schema";
import { requireOrderUser } from "@/features/orders/server/orders";
import { revalidateOrderCache } from "@/features/orders/server/cache/orders";
import {
  plannerRunIdSchema,
  savedPlannerRecommendationsSchema,
} from "../actions/schemas";
import { PlannerActionError } from "../lib/errors";
import { readPlannerRecommendationsDb } from "./planner-runs";
import { readPlannerSnapshotDb } from "./planner-snapshot";

const reviewPlannerRunDb = async (
  unsafeId: unknown,
  decision: "approved" | "applied" | "rejected",
) => {
  const runId = plannerRunIdSchema.parse(unsafeId);
  const user = await requireOrderUser(true);
  const result = await db.transaction(async (tx) => {
    await tx.execute(
      sql`lock table ${OrderTable}, ${OrderItemTable} in share row exclusive mode`,
    );
    const [run] = await tx
      .select()
      .from(PlannerRunTable)
      .where(eq(PlannerRunTable.id, runId))
      .for("update");
    if (!run) throw new PlannerActionError("Plan not found.");
    if (run.status === decision && decision !== "approved")
      return { run, orders: [] };
    if (run.status === "applied" || run.status === "rejected")
      throw new PlannerActionError(
        "This plan has already been reviewed and cannot be changed.",
      );
    if (decision === "rejected") {
      const [updated] = await tx
        .update(PlannerRunTable)
        .set({
          status: "rejected",
          reviewedBy: user.id,
          reviewedAt: new Date(),
        })
        .where(eq(PlannerRunTable.id, runId))
        .returning();
      return { run: updated, orders: [] };
    }
    if (run.status === "stale") return { run, orders: [] };
    const snapshot = await readPlannerSnapshotDb({ tx });
    if (snapshot.version !== run.snapshotVersion) {
      const [updated] = await tx
        .update(PlannerRunTable)
        .set({ status: "stale" })
        .where(eq(PlannerRunTable.id, runId))
        .returning();
      return { run: updated, orders: [] };
    }
    const recommendations = await readPlannerRecommendationsDb(runId, tx);
    const validated = savedPlannerRecommendationsSchema.parse(
      recommendations.map(
        ({ orderId, orderRef, position, workType, reason }) => ({
          orderId,
          orderRef,
          position,
          workType,
          reason,
        }),
      ),
    );
    const queued = snapshot.orders.filter((order) => order.status === "queued");
    if (
      validated.length !== queued.length ||
      validated.some(
        (item) => !queued.some((order) => order.id === item.orderId),
      ) ||
      queued.some(
        (order, index) =>
          order.queueRankIsManual &&
          order.queueRank !== null &&
          validated[index].orderId !== order.id,
      )
    ) {
      throw new PlannerActionError(
        "The saved recommendations do not match the waiting queue.",
      );
    }
    if (decision === "approved") {
      if (run.status === "approved") return { run, orders: [] };
      const [updated] = await tx
        .update(PlannerRunTable)
        .set({
          status: "approved",
          reviewedBy: user.id,
          reviewedAt: new Date(),
        })
        .where(eq(PlannerRunTable.id, runId))
        .returning();
      return { run: updated, orders: [] };
    }
    if (run.status !== "approved")
      throw new PlannerActionError("Approve this plan before applying it.");
    const ranks = sql.join(
      validated.map(
        (item) =>
          sql`when ${item.orderId}::uuid then ${item.position}::integer`,
      ),
      sql` `,
    );
    const orders = await tx
      .update(OrderTable)
      .set({
        queueRank: sql`case ${OrderTable.id} ${ranks} else ${OrderTable.queueRank} end`,
        updatedAt: new Date(),
      })
      .where(
        inArray(
          OrderTable.id,
          validated.map((item) => item.orderId),
        ),
      )
      .returning({ id: OrderTable.id, userId: OrderTable.userId });
    if (orders.length !== validated.length)
      throw new PlannerActionError("Unable to apply every recommendation.");
    const [updated] = await tx
      .update(PlannerRunTable)
      .set({ status: "applied", appliedBy: user.id, appliedAt: new Date() })
      .where(eq(PlannerRunTable.id, runId))
      .returning();
    return { run: updated, orders };
  });
  for (const order of result.orders)
    revalidateOrderCache(order.userId, order.id);
  if (result.run.status === "stale")
    throw new PlannerActionError(
      "The queue changed. Generate a fresh plan before approving or applying it.",
    );
  return result.run;
};

export const approvePlannerRunDb = (runId: unknown) =>
  reviewPlannerRunDb(runId, "approved");
export const applyPlannerRunDb = (runId: unknown) =>
  reviewPlannerRunDb(runId, "applied");
export const rejectPlannerRunDb = (runId: unknown) =>
  reviewPlannerRunDb(runId, "rejected");
