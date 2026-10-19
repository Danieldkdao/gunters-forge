import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { productCategoryEnum } from "../shared";

export const ProductTable = pgTable("products", {
  id,
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").notNull(),
  imageUrl: text("image"),
  category: productCategoryEnum("category").notNull(),
  // price in cents, format as coins and dollars
  price: integer("price").notNull(),
  craftingTimeMinutes: integer("crafting_time_minutes").notNull(),
  featured: boolean("featured").notNull(),
  isActive: boolean("is_active").notNull(),
  ...timestamps,
});

export type ProductInsertData = typeof ProductTable.$inferInsert;
export type ProductSelectData = typeof ProductTable.$inferSelect;
