import { pgEnum } from "drizzle-orm/pg-core";

export const userRoles = ["admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];
export const userRoleEnum = pgEnum("user_roles", userRoles);

export const productCategories = [
  "weapons",
  "armor",
  "household",
  "tools_supplies",
] as const;
export type ProductCategory = (typeof productCategories)[number];
export const productCategoryEnum = pgEnum(
  "product_categories",
  productCategories,
);
