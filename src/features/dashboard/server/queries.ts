import "server-only";

import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/db";
import {
  OrderItemTable,
  OrderTable,
  PlannerRunTable,
  ProductTable,
} from "@/db/schema";
import { requireOrderUser } from "@/features/orders/server/orders";
import { queueOrder } from "@/features/orders/server/queue-order";
import { activeOrderStatuses } from "@/features/orders/lib/lifecycle";

export const readDashboardStatsDb = async () => {
  await requireOrderUser(true);
  const [[orders], [products], [plans]] = await Promise.all([
    db
      .select({
        total: count(),
        queued:
          sql<number>`count(*) filter (where ${OrderTable.status} = 'queued')`.mapWith(
            Number,
          ),
        inProgress:
          sql<number>`count(*) filter (where ${OrderTable.status} = 'in_progress')`.mapWith(
            Number,
          ),
        ready:
          sql<number>`count(*) filter (where ${OrderTable.status} = 'ready')`.mapWith(
            Number,
          ),
        paidValue:
          sql<number>`coalesce(sum(${OrderTable.total}) filter (where ${OrderTable.paymentStatus} = 'paid'), 0)`.mapWith(
            Number,
          ),
      })
      .from(OrderTable),
    db
      .select({
        total: count(),
        active:
          sql<number>`count(*) filter (where ${ProductTable.isActive})`.mapWith(
            Number,
          ),
      })
      .from(ProductTable),
    db
      .select({ awaitingReview: count() })
      .from(PlannerRunTable)
      .where(eq(PlannerRunTable.status, "pending_review")),
  ]);
  return { orders, products, plans };
};

export const readDashboardOverviewDb = async () => {
  const user = await requireOrderUser(true);
  const orderFields = {
    id: OrderTable.id,
    orderNumber: OrderTable.orderNumber,
    status: OrderTable.status,
    total: OrderTable.total,
    createdAt: OrderTable.createdAt,
  };
  const [stats, queue, recentOrders, products, plans] = await Promise.all([
    readDashboardStatsDb(),
    db
      .select(orderFields)
      .from(OrderTable)
      .where(inArray(OrderTable.status, activeOrderStatuses))
      .orderBy(queueOrder)
      .limit(4),
    db
      .select(orderFields)
      .from(OrderTable)
      .orderBy(desc(OrderTable.createdAt), desc(OrderTable.id))
      .limit(4),
    db
      .select({
        id: ProductTable.id,
        name: ProductTable.name,
        imageUrl: ProductTable.imageUrl,
        price: ProductTable.price,
        category: ProductTable.category,
        isActive: ProductTable.isActive,
      })
      .from(ProductTable)
      .orderBy(desc(ProductTable.updatedAt), desc(ProductTable.id))
      .limit(4),
    db
      .select({
        id: PlannerRunTable.id,
        summary: PlannerRunTable.summary,
        status: PlannerRunTable.status,
        generatedAt: PlannerRunTable.generatedAt,
      })
      .from(PlannerRunTable)
      .orderBy(desc(PlannerRunTable.createdAt), desc(PlannerRunTable.id))
      .limit(3),
  ]);
  const ids = [
    ...new Set([...queue, ...recentOrders].map((order) => order.id)),
  ];
  const items = ids.length
    ? await db
        .select({
          orderId: OrderItemTable.orderId,
          productName: OrderItemTable.productName,
          quantity: OrderItemTable.quantity,
        })
        .from(OrderItemTable)
        .where(inArray(OrderItemTable.orderId, ids))
    : [];
  const withItems = (orders: typeof queue) =>
    orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.orderId === order.id),
    }));
  return {
    name: user.name,
    stats,
    queue: withItems(queue),
    recentOrders: withItems(recentOrders),
    products,
    plans,
  };
};

export type DashboardOverviewData = Awaited<
  ReturnType<typeof readDashboardOverviewDb>
>;
