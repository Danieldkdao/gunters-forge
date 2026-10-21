import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { id } from "../helpers";
import { OrderTable } from "./order";
import { ProductTable } from "./product";
import { productCategoryEnum } from "../shared";
import { relations } from "drizzle-orm";

export const OrderItemTable = pgTable("order_item", {
  id,
  orderId: uuid("order_id")
    .notNull()
    .references(() => OrderTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => ProductTable.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  productImageUrl: text("product_image_url").notNull(),
  category: productCategoryEnum("category").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  craftingTimeMinutes: integer("crafting_time_minutes").notNull(),
  stripePriceId: text("stripe_price_id"),
});

export type OrderItemInsertData = typeof OrderItemTable.$inferInsert;
export type OrderItemSelectData = typeof OrderItemTable.$inferSelect;

export const orderItemRelations = relations(OrderItemTable, ({ one }) => ({
  order: one(OrderTable, {
    fields: [OrderItemTable.orderId],
    references: [OrderTable.id],
  }),
  product: one(ProductTable, {
    fields: [OrderItemTable.productId],
    references: [ProductTable.id],
  }),
}));
