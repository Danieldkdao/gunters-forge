import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { plannerRunStatusEnum, plannerWorkTypeEnum } from "../shared";
import { OrderTable } from "./order";
import { user } from "./user";

export const PlannerRunTable = pgTable(
  "planner_runs",
  {
    id,
    triggerRunId: text("trigger_run_id").notNull().unique(),
    status: plannerRunStatusEnum("status").notNull().default("pending_review"),
    snapshotVersion: text("snapshot_version").notNull(),
    model: text("model").notNull(),
    summary: text("summary").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
    reviewedBy: uuid("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    appliedBy: uuid("applied_by").references(() => user.id, {
      onDelete: "set null",
    }),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("planner_runs_status_created_idx").on(
      table.status,
      table.createdAt,
      table.id,
    ),
    check(
      "planner_runs_snapshot_version_check",
      sql`${table.snapshotVersion} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);

export const PlannerRecommendationTable = pgTable(
  "planner_recommendations",
  {
    id,
    plannerRunId: uuid("planner_run_id")
      .notNull()
      .references(() => PlannerRunTable.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => OrderTable.id, { onDelete: "restrict" }),
    orderRef: text("order_ref").notNull(),
    position: integer("position").notNull(),
    workType: plannerWorkTypeEnum("work_type").notNull(),
    reason: text("reason").notNull(),
  },
  (table) => [
    unique("planner_recommendations_run_order_unique").on(
      table.plannerRunId,
      table.orderId,
    ),
    unique("planner_recommendations_run_position_unique").on(
      table.plannerRunId,
      table.position,
    ),
    unique("planner_recommendations_run_ref_unique").on(
      table.plannerRunId,
      table.orderRef,
    ),
    check("planner_recommendations_position_check", sql`${table.position} > 0`),
    check(
      "planner_recommendations_order_ref_check",
      sql`${table.orderRef} ~ '^order-[1-9][0-9]*$'`,
    ),
  ],
);

export const plannerRunRelations = relations(
  PlannerRunTable,
  ({ many, one }) => ({
    recommendations: many(PlannerRecommendationTable),
    reviewer: one(user, {
      fields: [PlannerRunTable.reviewedBy],
      references: [user.id],
      relationName: "planner_reviewer",
    }),
    applier: one(user, {
      fields: [PlannerRunTable.appliedBy],
      references: [user.id],
      relationName: "planner_applier",
    }),
  }),
);

export const plannerRecommendationRelations = relations(
  PlannerRecommendationTable,
  ({ one }) => ({
    plannerRun: one(PlannerRunTable, {
      fields: [PlannerRecommendationTable.plannerRunId],
      references: [PlannerRunTable.id],
    }),
    order: one(OrderTable, {
      fields: [PlannerRecommendationTable.orderId],
      references: [OrderTable.id],
    }),
  }),
);

export type PlannerRunSelectData = typeof PlannerRunTable.$inferSelect;
export type PlannerRecommendationSelectData =
  typeof PlannerRecommendationTable.$inferSelect;
