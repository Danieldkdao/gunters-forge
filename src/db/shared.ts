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

export const orderStatuses = [
  "pending_payment",
  "queued",
  "in_progress",
  "ready",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const orderStatusEnum = pgEnum("order_statuses", orderStatuses);

export const orderPaymentMethods = ["stripe", "cash_on_delivery"] as const;
export type OrderPaymentMethod = (typeof orderPaymentMethods)[number];
export const orderPaymentMethodEnum = pgEnum(
  "order_payment_methods",
  orderPaymentMethods,
);

export const orderPaymentStatuses = [
  "unpaid",
  "paid",
  "partially_refunded",
  "refunded",
] as const;
export type OrderPaymentStatus = (typeof orderPaymentStatuses)[number];
export const orderPaymentStatusEnum = pgEnum(
  "order_payment_statuses",
  orderPaymentStatuses,
);

export const plannerRunStatuses = [
  "pending_review",
  "approved",
  "applied",
  "rejected",
  "stale",
] as const;
export const plannerRunStatusEnum = pgEnum(
  "planner_run_statuses",
  plannerRunStatuses,
);
export type PlannerRunStatus = (typeof plannerRunStatuses)[number];

export const plannerWorkTypes = [
  "small_job",
  "extended_project",
  "batch_candidate",
  "standard",
] as const;
export const plannerWorkTypeEnum = pgEnum(
  "planner_work_types",
  plannerWorkTypes,
);
