import { boolean, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { productCategoryEnum } from "../shared";

export const ProductTable = pgTable("products", {
  id,
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").notNull(),
  imageUrl: text("image").notNull(),
  category: productCategoryEnum("category").notNull(),
  // price in cents, format as coins and dollars
  price: integer("price").notNull(),
  craftingTimeMinutes: integer("crafting_time_minutes").notNull(),
  featured: boolean("featured").notNull(),
  isActive: boolean("is_active").notNull(),
  stripeProductId: varchar("stripe_product_id").notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  ...timestamps,
});

export type ProductInsertData = typeof ProductTable.$inferInsert;
export type ProductSelectData = typeof ProductTable.$inferSelect;
