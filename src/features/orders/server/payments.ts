import { OrderActionError, getOrderTransitionData } from "../lib/lifecycle";
import { cancellableStatuses } from "../lib/constants";
import "server-only";
import { db } from "@/db/db";
import { OrderTable, OrderItemTable, type OrderSelectData } from "@/db/schema";
import { serverEnv } from "@/data/env/server";
import { stripe } from "@/services/stripe";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import type Stripe from "stripe";
import { confirmOrderExistenceDb, requireOrderUser } from "./orders";
import { revalidateOrderCache } from "./cache/orders";

const paymentIntentId = (value: string | Stripe.PaymentIntent | null) =>
  typeof value === "string" ? value : (value?.id ?? null);

const recordPaidSession = async (session: Stripe.Checkout.Session) => {
  if (session.mode !== "payment" || session.payment_status !== "paid")
    return null;
  const { orderId, userId } = session.metadata ?? {};
  if (!orderId || !userId)
    throw new OrderActionError("Checkout session is missing order metadata.");
  const order = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(OrderTable)
      .where(eq(OrderTable.id, orderId))
      .for("update");
    if (
      !existing ||
      existing.userId !== userId ||
      existing.paymentMethod !== "stripe" ||
      existing.total !== session.amount_total ||
      existing.currency !== session.currency ||
      (existing.stripeCheckoutSessionId &&
        existing.stripeCheckoutSessionId !== session.id)
    ) {
      throw new OrderActionError("Checkout session does not match its order.");
    }
    const intentId = paymentIntentId(session.payment_intent);
    if (!intentId)
      throw new OrderActionError(
        "Paid checkout session is missing its payment intent.",
      );
    // Record payment without altering cancellation or refund state
    const [updated] = await tx
      .update(OrderTable)
      .set({
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: intentId,
        paymentStatus:
          existing.paymentStatus === "unpaid" ? "paid" : existing.paymentStatus,
        ...(existing.status === "pending_payment"
          ? { status: "queued" as const, queuedAt: new Date() }
          : {}),
      })
      .where(eq(OrderTable.id, existing.id))
      .returning();
    return updated;
  });
  revalidateOrderCache(order.userId, order.id);
  return order;
};

export const reconcileStripeRefunds = async (intentId: string) => {
  const order = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(OrderTable)
      .where(eq(OrderTable.stripePaymentIntentId, intentId))
      .for("update");
    if (!existing) return null;
    let refundedAmount = 0;
    // Only recalculate from successful refunds to prevent extra money from being returned
    for await (const refund of stripe.refunds.list({
      payment_intent: intentId,
      limit: 100,
    })) {
      if (refund.status === "succeeded") refundedAmount += refund.amount;
    }
    const paymentStatus =
      refundedAmount >= existing.total
        ? "refunded"
        : refundedAmount > 0
          ? "partially_refunded"
          : "paid";
    const cancel =
      paymentStatus === "refunded" &&
      cancellableStatuses.includes(existing.status);
    if (existing.paymentStatus === paymentStatus && !cancel) return existing;
    const [updated] = await tx
      .update(OrderTable)
      .set({
        paymentStatus,
        ...(cancel ? getOrderTransitionData(existing, "cancelled") : {}),
      })
      .where(eq(OrderTable.id, existing.id))
      .returning();
    return updated;
  });
  if (order) revalidateOrderCache(order.userId, order.id);
  return order;
};

export const reconcileCancelledStripeOrder = async (order: OrderSelectData) => {
  if (
    order.paymentMethod !== "stripe" ||
    order.status !== "cancelled" ||
    !order.stripeCheckoutSessionId
  )
    return;
  let session = await stripe.checkout.sessions.retrieve(
    order.stripeCheckoutSessionId,
  );
  if (session.status === "open") {
    try {
      session = await stripe.checkout.sessions.expire(
        session.id,
        {},
        {
          idempotencyKey: `expire-order-${order.id}`,
        },
      );
    } catch (error) {
      // Checkout might race cancellation, confirm the session state before making a decision
      session = await stripe.checkout.sessions.retrieve(session.id);
      if (session.status === "open") throw error;
    }
  }
  const paidOrder = await recordPaidSession(session);
  if (!paidOrder?.stripePaymentIntentId) return;
  const current = await reconcileStripeRefunds(paidOrder.stripePaymentIntentId);
  if (current?.paymentStatus === "refunded") return;
  // Reuse an order specific key when retrying cancellation refund
  await stripe.refunds.create(
    {
      payment_intent: paidOrder.stripePaymentIntentId,
      metadata: { orderId: paidOrder.id, userId: paidOrder.userId },
    },
    { idempotencyKey: `cancel-order-refund-${paidOrder.id}` },
  );
  await reconcileStripeRefunds(paidOrder.stripePaymentIntentId);
};

export const createOrderCheckoutSession = async (orderId: string) => {
  await requireOrderUser();
  const order = await confirmOrderExistenceDb(orderId);
  if (
    !order ||
    order.paymentMethod !== "stripe" ||
    order.status !== "pending_payment" ||
    order.paymentStatus !== "unpaid"
  ) {
    throw new OrderActionError("This order is not awaiting Stripe payment.");
  }
  if (order.stripeCheckoutSessionId) {
    const previous = await stripe.checkout.sessions.retrieve(
      order.stripeCheckoutSessionId,
    );
    if (previous.status === "open" && previous.url) return previous;
    if (previous.payment_status === "paid")
      await handlePaidCheckoutSession(previous.id);
    else if (previous.status === "expired")
      await handleUnpaidCheckoutSession(previous.id);
    throw new OrderActionError(
      "This checkout has already completed or expired.",
    );
  }
  // Stop retrying unresolved session creation after 24 hours
  if (Date.now() - order.createdAt.getTime() > 23 * 60 * 60 * 1000) {
    throw new OrderActionError(
      "This payment attempt is too old to retry. Cancel it and place a new order.",
    );
  }
  const items = await db
    .select()
    .from(OrderItemTable)
    .where(eq(OrderItemTable.orderId, order.id))
    .orderBy(asc(OrderItemTable.id));
  if (!items.length) throw new OrderActionError("Order has no items.");
  const tax = order.total - order.subtotal;
  const itemSubtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  if (tax < 0 || itemSubtotal !== order.subtotal)
    throw new OrderActionError("Order totals do not match its items.");
  const suffix = order.id
    .replaceAll("-", "")
    .slice(0, 8)
    .split("")
    .map((character) => String.fromCharCode(97 + parseInt(character, 16)))
    .join("");
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      integration_identifier: `gunters-forge-${suffix}`,
      client_reference_id: order.id,
      metadata: { userId: order.userId, orderId: order.id },
      payment_intent_data: {
        metadata: { userId: order.userId, orderId: order.id },
      },
      customer_email: order.customerEmail,
      line_items: [
        ...items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: order.currency,
            unit_amount: item.unitPrice,
            product_data: { name: item.productName },
          },
        })),
        ...(tax > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: order.currency,
                  unit_amount: tax,
                  product_data: { name: "Order tax (5%)" },
                },
              },
            ]
          : []),
      ],
      success_url: `${serverEnv.APP_URL}/payment/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverEnv.APP_URL}/payment/cancel?orderId=${order.id}`,
    },
    { idempotencyKey: `order-checkout-${order.id}`, maxNetworkRetries: 2 },
  );
  const [linked] = await db
    .update(OrderTable)
    .set({ stripeCheckoutSessionId: session.id })
    .where(
      and(
        eq(OrderTable.id, order.id),
        or(
          isNull(OrderTable.stripeCheckoutSessionId),
          eq(OrderTable.stripeCheckoutSessionId, session.id),
        ),
      ),
    )
    .returning();
  if (!linked) throw new OrderActionError("Unable to link checkout to order.");
  revalidateOrderCache(linked.userId, linked.id);
  if (linked.status === "cancelled") {
    await reconcileCancelledStripeOrder(linked);
    throw new OrderActionError("This order was cancelled.");
  }
  if (
    session.amount_total !== linked.total ||
    session.currency !== linked.currency
  ) {
    throw new OrderActionError("Checkout total does not match the order.");
  }
  if (session.status !== "open" || !session.url) {
    if (session.payment_status === "paid")
      await handlePaidCheckoutSession(session.id);
    throw new OrderActionError(
      "This checkout has already completed or expired.",
    );
  }
  return session;
};

export const handlePaidCheckoutSession = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const order = await recordPaidSession(session);
  if (!order) return;
  if (order.status === "cancelled") await reconcileCancelledStripeOrder(order);
  else if (order.stripePaymentIntentId)
    await reconcileStripeRefunds(order.stripePaymentIntentId);
};

export const handleUnpaidCheckoutSession = async (
  sessionId: string,
  failed = false,
) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid") {
    await handlePaidCheckoutSession(session.id);
    return;
  }
  if (!failed && session.status !== "expired") return;
  const { orderId, userId } = session.metadata ?? {};
  if (!orderId || !userId)
    throw new OrderActionError("Checkout session is missing order metadata.");
  const [order] = await db
    .update(OrderTable)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      queueRank: null,
      stripeCheckoutSessionId: session.id,
    })
    .where(
      and(
        eq(OrderTable.id, orderId),
        eq(OrderTable.userId, userId),
        eq(OrderTable.paymentMethod, "stripe"),
        eq(OrderTable.status, "pending_payment"),
        eq(OrderTable.paymentStatus, "unpaid"),
        or(
          isNull(OrderTable.stripeCheckoutSessionId),
          eq(OrderTable.stripeCheckoutSessionId, session.id),
        ),
      ),
    )
    .returning();
  if (order) revalidateOrderCache(order.userId, order.id);
};
