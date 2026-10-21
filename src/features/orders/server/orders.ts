import { OrderActionError } from "../lib/lifecycle";
import "server-only";
import { randomUUID } from "node:crypto";
import { db, type DbTransaction } from "@/db/db";
import { OrderTable, ProductTable, OrderItemTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { revalidateOrderCache } from "./cache/orders";
import {
  createOrderSchema,
  updateOrderSchema,
  updateOrderDetailsSchema,
} from "../actions/schemas";
import { calculateOrderTotals } from "../lib/utils";
import { insertCartOrderItemsDb } from "./order-items";
import { activeOrderStatuses, getOrderTransitionData } from "../lib/lifecycle";

export const requireOrderUser = async (adminOnly = false) => {
  const { userId, user } = await getCurrentUser();
  if (
    !userId ||
    !user ||
    user.banned ||
    !user.emailVerified ||
    (adminOnly && user.role !== "admin")
  ) {
    throw new OrderActionError(
      "You do not have permission to perform this action.",
    );
  }
  return user;
};

export const confirmOrderExistenceDb = async (
  orderId: string,
  options: { tx?: DbTransaction } = {},
) => {
  const user = await requireOrderUser();
  // Checks access and order existence
  const [order] = await (options.tx ?? db)
    .select()
    .from(OrderTable)
    .where(
      and(
        eq(OrderTable.id, orderId),
        user.role === "admin" ? undefined : eq(OrderTable.userId, user.id),
      ),
    )
    .limit(1);
  return order ?? null;
};

export const createOrderDb = async (unsafeData: unknown) => {
  const user = await requireOrderUser();
  const data = createOrderSchema.parse(unsafeData);
  const requestId = data.requestId ?? randomUUID();
  const order = await db.transaction(async (tx) => {
    // Allows retries to reuse the first committed order
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${requestId}, 0))`,
    );
    const [previous] = await tx
      .select()
      .from(OrderTable)
      .where(eq(OrderTable.requestId, requestId));
    if (previous) {
      if (
        previous.userId !== user.id ||
        previous.paymentMethod !== data.paymentMethod
      ) {
        throw new OrderActionError("This request ID has already been used.");
      }
      const previousItems = await tx
        .select()
        .from(OrderItemTable)
        .where(eq(OrderItemTable.orderId, previous.id));
      const sameCart =
        previousItems.length === data.cartItems.length &&
        data.cartItems.every((item) =>
          previousItems.some(
            (saved) =>
              saved.productId === item.productId &&
              saved.quantity === item.quantity,
          ),
        );
      if (
        !sameCart ||
        previous.customerNotes !== (data.customerNotes ?? null) ||
        previous.deliveryAddress !== (data.deliveryAddress ?? null)
      ) {
        throw new OrderActionError("Use a new request ID for a changed order.");
      }
      return { ...previous, orderItems: previousItems };
    }
    // Keeps the product values stable
    const products = await tx
      .select()
      .from(ProductTable)
      .where(
        and(
          inArray(
            ProductTable.id,
            data.cartItems.map((item) => item.productId),
          ),
          eq(ProductTable.isActive, true),
        ),
      )
      .orderBy(asc(ProductTable.id))
      .for("share");
    if (products.length !== data.cartItems.length)
      throw new OrderActionError("Some products are no longer available.");
    const quantities = new Map(
      data.cartItems.map((item) => [item.productId, item.quantity]),
    );
    const items = products.map((product) => ({
      product,
      quantity: quantities.get(product.id)!,
    }));
    const { subtotal, total } = calculateOrderTotals(
      items.map(({ product, quantity }) => ({
        price: product.price,
        quantity,
      })),
    );
    if (data.paymentMethod === "stripe" && total === 0)
      throw new OrderActionError("Stripe orders must have a positive total.");
    const [inserted] = await tx
      .insert(OrderTable)
      .values({
        userId: user.id,
        requestId,
        customerName: user.name,
        customerEmail: user.email,
        paymentMethod: data.paymentMethod,
        paymentStatus: "unpaid",
        status:
          data.paymentMethod === "cash_on_delivery"
            ? "queued"
            : "pending_payment",
        queuedAt: data.paymentMethod === "cash_on_delivery" ? new Date() : null,
        subtotal,
        total,
        deliveryAddress: data.deliveryAddress ?? null,
        customerNotes: data.customerNotes ?? null,
      })
      .returning();
    const orderItems = await insertCartOrderItemsDb(tx, inserted.id, items);
    return { ...inserted, orderItems };
  });
  // Invalidate cache afterward so both orders and order items refresh
  revalidateOrderCache(order.userId, order.id);
  return order;
};

export const updateOrderDb = async (orderId: string, unsafeData: unknown) => {
  await requireOrderUser(true);
  const data = updateOrderSchema.parse(unsafeData);
  const order = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(OrderTable)
      .where(eq(OrderTable.id, orderId))
      .for("update");
    if (!existing) throw new OrderActionError("Order not found.");
    if (data.status === "cancelled")
      throw new OrderActionError("Use the cancellation action.");
    const changes = data.status
      ? getOrderTransitionData(existing, data.status)
      : {};
    const resultingStatus = data.status ?? existing.status;
    if (data.queueRank !== undefined && resultingStatus !== "queued") {
      throw new OrderActionError("Only waiting orders can be reprioritized.");
    }
    const [updated] = await tx
      .update(OrderTable)
      .set({
        ...changes,
        ...(data.queueRank !== undefined ? { queueRank: data.queueRank } : {}),
        updatedAt: new Date(),
      })
      .where(eq(OrderTable.id, existing.id))
      .returning();
    return updated;
  });
  revalidateOrderCache(order.userId, order.id);
  return order;
};

export const cancelOrderDb = async (orderId: string) => {
  const user = await requireOrderUser();
  const order = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(OrderTable)
      .where(
        and(
          eq(OrderTable.id, orderId),
          user.role === "admin" ? undefined : eq(OrderTable.userId, user.id),
        ),
      )
      .for("update");
    if (!existing) throw new OrderActionError("Order not found.");
    if (existing.status === "cancelled") return existing;
    const [updated] = await tx
      .update(OrderTable)
      .set(getOrderTransitionData(existing, "cancelled"))
      .where(eq(OrderTable.id, existing.id))
      .returning();
    return updated;
  });
  revalidateOrderCache(order.userId, order.id);
  return order;
};

export const markCashPaymentReceivedDb = async (orderId: string) => {
  await requireOrderUser(true);
  const [order] = await db
    .update(OrderTable)
    .set({ paymentStatus: "paid" })
    .where(
      and(
        eq(OrderTable.id, orderId),
        eq(OrderTable.paymentMethod, "cash_on_delivery"),
        inArray(OrderTable.status, [...activeOrderStatuses, "ready"]),
        inArray(OrderTable.paymentStatus, ["unpaid", "paid"]),
      ),
    )
    .returning();
  if (!order)
    throw new OrderActionError(
      "Cash payment can only be recorded for an active cash-on-delivery order.",
    );
  revalidateOrderCache(order.userId, order.id);
  return order;
};

export const updateOrderDetailsDb = async (
  orderId: string,
  unsafeData: unknown,
) => {
  const user = await requireOrderUser();
  const data = updateOrderDetailsSchema.parse(unsafeData);
  const [order] = await db
    .update(OrderTable)
    .set(data)
    .where(
      and(
        eq(OrderTable.id, orderId),
        user.role === "admin" ? undefined : eq(OrderTable.userId, user.id),
        inArray(OrderTable.status, ["pending_payment", "queued"]),
      ),
    )
    .returning();
  if (!order)
    throw new OrderActionError(
      "Order details can only be edited before crafting starts.",
    );
  revalidateOrderCache(order.userId, order.id);
  return order;
};
