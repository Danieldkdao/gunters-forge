import { createHash } from "node:crypto";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/db";
import { OrderItemTable, OrderTable } from "@/db/schema";
import { queueOrder } from "@/features/orders/server/queue-order";

export const readPlannerSnapshotDb = async () => {
  // Orders and items are read from the same transaction to prevent changes from altering the snapshot
  const snapshot = await db.transaction(
    async (tx) => {
      const orders = await tx
        .select({
          id: OrderTable.id,
          status: OrderTable.status,
          queueRank: OrderTable.queueRank,
          queuedAt: OrderTable.queuedAt,
          createdAt: OrderTable.createdAt,
          updatedAt: OrderTable.updatedAt,
        })
        .from(OrderTable)
        .where(
          and(
            inArray(OrderTable.status, ["queued", "in_progress"]),
            or(
              eq(OrderTable.paymentStatus, "paid"),
              and(
                eq(OrderTable.paymentMethod, "cash_on_delivery"),
                eq(OrderTable.paymentStatus, "unpaid"),
              ),
            ),
          ),
        )
        .orderBy(queueOrder)
        // Detect overflow
        .limit(101);
      if (orders.length > 100)
        throw new Error(
          "The planner supports up to 100 active orders per run.",
        );
      const items = orders.length
        ? await tx
            .select({
              id: OrderItemTable.id,
              orderId: OrderItemTable.orderId,
              productId: OrderItemTable.productId,
              category: OrderItemTable.category,
              quantity: OrderItemTable.quantity,
              craftingTimeMinutes: OrderItemTable.craftingTimeMinutes,
            })
            .from(OrderItemTable)
            .where(
              inArray(
                OrderItemTable.orderId,
                orders.map((order) => order.id),
              ),
            )
            .orderBy(asc(OrderItemTable.id))
        : [];
      return { orders, items };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
  return {
    ...snapshot,
    version: createHash("sha256")
      .update(JSON.stringify(snapshot))
      .digest("hex"),
  };
};

export type PlannerSnapshot = Awaited<ReturnType<typeof readPlannerSnapshotDb>>;
