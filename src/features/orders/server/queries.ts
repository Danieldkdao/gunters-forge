import { OrderActionError } from "../lib/lifecycle";
import "server-only";
import { db } from "@/db/db";
import { OrderTable, OrderItemTable } from "@/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  ordersCursorPaginationSchema,
  readOrdersSchema,
  type ReadOrdersSchema,
} from "../actions/schemas";
import { createSortByMap } from "@/lib/db-filters";
import { PAGE_SIZE } from "@/lib/constants";
import { normalizeData, writeCursor } from "@/lib/utils";
import { activeOrderStatuses } from "../lib/lifecycle";
import { confirmOrderExistenceDb, requireOrderUser } from "./orders";

// In progress work comes first, then using assigned ranking or order number
const queuePriority = sql`case when ${OrderTable.status} = 'in_progress' then 0 else 1 end`;
const queueRank = sql`coalesce(${OrderTable.queueRank}, ${OrderTable.orderNumber})`;
const queueOrder = sql`${queuePriority}, ${queueRank}, ${OrderTable.queuedAt} nulls last,
  ${OrderTable.createdAt}, ${OrderTable.id}`;

export const readOrderQueuePositionDb = async (orderId: string) => {
  const order = await confirmOrderExistenceDb(orderId);
  if (!order) throw new OrderActionError("Order not found.");
  if (!activeOrderStatuses.includes(order.status)) return null;
  // Rank before selecting to prevent always having position one for the selected order
  const ranked = db
    .select({
      id: OrderTable.id,
      position:
        sql<number>`(row_number() over (order by ${queueOrder}))::integer`.as(
          "position",
        ),
    })
    .from(OrderTable)
    .where(inArray(OrderTable.status, activeOrderStatuses))
    .as("ranked_orders");
  const [result] = await db
    .select({ position: ranked.position })
    .from(ranked)
    .where(eq(ranked.id, orderId));
  return result
    ? { position: result.position, ordersAhead: result.position - 1 }
    : null;
};

export const readOrderDb = async (orderId: string) => {
  const order = await confirmOrderExistenceDb(orderId);
  if (!order) throw new OrderActionError("Order not found.");
  const orderItems = await db
    .select()
    .from(OrderItemTable)
    .where(eq(OrderItemTable.orderId, order.id))
    .orderBy(asc(OrderItemTable.id));
  const queuePosition = await readOrderQueuePositionDb(order.id);
  return { ...order, orderItems, queuePosition };
};

export const readOrdersDb = async (
  options: ReadOrdersSchema = {},
  scope: "mine" | "admin" | "queue" = "mine",
) => {
  const user = await requireOrderUser(scope !== "mine");
  const { lastCursor, status } = readOrdersSchema.parse(options);
  const cursor = ordersCursorPaginationSchema.parse(lastCursor);
  if (cursor && (scope === "queue") === cursor.marker instanceof Date) {
    throw new OrderActionError("Invalid cursor for this order list.");
  }
  const historySort = createSortByMap(
    OrderTable,
    cursor && cursor.marker instanceof Date
      ? { id: cursor.id, marker: cursor.marker }
      : null,
    [{ option: "recently_created", order: "desc", property: "createdAt" }],
  ).recently_created;
  const queueCursorFilter =
    cursor && !(cursor.marker instanceof Date)
      ? sql`(${queuePriority}, ${queueRank},
          coalesce(${OrderTable.queuedAt}, 'infinity'::timestamptz),
          ${OrderTable.createdAt}, ${OrderTable.id}) >
        (${cursor.marker.priority}::integer, ${cursor.marker.rank}::integer,
          coalesce(${cursor.marker.queuedAt?.toISOString() ?? null}::timestamptz, 'infinity'::timestamptz),
          ${cursor.marker.createdAt.toISOString()}::timestamp, ${cursor.id}::uuid)`
      : undefined;
  const where = and(
    scope === "mine" ? eq(OrderTable.userId, user.id) : undefined,
    scope === "queue"
      ? inArray(OrderTable.status, activeOrderStatuses)
      : undefined,
    status ? eq(OrderTable.status, status) : undefined,
    scope === "queue" ? queueCursorFilter : historySort.cursorFilter,
  );
  // Fetch one extra order to determine if there is a next page without having to do a separate count query
  const orders = await db
    .select()
    .from(OrderTable)
    .where(where)
    .orderBy(...(scope === "queue" ? [queueOrder] : historySort.sortBy))
    .limit(PAGE_SIZE + 1);
  const hasNextPage = orders.length > PAGE_SIZE;
  const page = orders.slice(0, PAGE_SIZE);
  const lastOrder = page.at(-1);
  const nextCursor =
    hasNextPage && lastOrder
      ? writeCursor({
          id: lastOrder.id,
          marker:
            scope === "queue"
              ? {
                  priority: lastOrder.status === "in_progress" ? 0 : 1,
                  rank: lastOrder.queueRank ?? lastOrder.orderNumber,
                  queuedAt: normalizeData(lastOrder.queuedAt),
                  createdAt: normalizeData(lastOrder.createdAt),
                }
              : normalizeData(lastOrder.createdAt),
        })
      : null;
  const orderItems = page.length
    ? await db
        .select()
        .from(OrderItemTable)
        .where(
          inArray(
            OrderItemTable.orderId,
            page.map((order) => order.id),
          ),
        )
        .orderBy(asc(OrderItemTable.id))
    : [];
  const data = page.map((order) => ({
    ...order,
    orderItems: orderItems.filter((item) => item.orderId === order.id),
  }));
  const key = JSON.stringify({
    orders: page.map((order) => ({
      id: order.id,
      updated: order.updatedAt.toISOString(),
    })),
    filters: { scope, status },
  });
  return { data, nextCursor, key };
};
