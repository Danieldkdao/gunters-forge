import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { user } from "./user";
import {
  orderPaymentMethodEnum,
  orderPaymentStatusEnum,
  orderStatusEnum,
} from "../shared";
import { relations } from "drizzle-orm";

export const OrderTable = pgTable("orders", {
  id,
  orderNumber: integer("order_number")
    .generatedAlwaysAsIdentity()
    .notNull()
    .unique(),
  requestId: uuid("request_id").defaultRandom().notNull().unique(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  paymentMethod: orderPaymentMethodEnum("payment_method").notNull(),
  paymentStatus: orderPaymentStatusEnum("payment_status").notNull(),
  currency: text("currency").notNull().default("usd"),
  subtotal: integer("subtotal").notNull(),
  total: integer("total").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  deliveryAddress: text("delivery_address"),
  customerNotes: text("customer_notes"),
  queueRank: integer("queue_rank"),
  queuedAt: timestamp("queued_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...timestamps,
});

export type OrderInsertData = typeof OrderTable.$inferInsert;
export type OrderSelectData = typeof OrderTable.$inferSelect;

export const orderRelations = relations(OrderTable, ({ one }) => ({
  user: one(user, {
    fields: [OrderTable.userId],
    references: [user.id],
  }),
}));
