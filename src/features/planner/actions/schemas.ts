import z from "zod";
import { plannerRunStatuses } from "@/db/shared";
import {
  createCursorPaginationSchema,
  isoTimestampSchema,
} from "@/lib/schemas";
import { plannerOutputSchema } from "../lib/planner-schemas";

export const plannerRunIdSchema = z.uuid();

export const savedPlannerRecommendationsSchema = z
  .array(
    plannerOutputSchema.shape.orders.element.extend({
      orderId: z.uuid(),
      position: z.number().int().positive(),
    }),
  )
  .min(1)
  .max(100)
  // Ensure that each item only appears once and that no items have the same position
  .refine(
    (items) =>
      new Set(items.map((item) => item.orderId)).size === items.length &&
      new Set(items.map((item) => item.orderRef)).size === items.length &&
      items.every((item, index) => item.position === index + 1),
    {
      message:
        "Recommendations must contain unique orders and references with consecutive positions.",
    },
  );

export const savePlannerRunSchema = z
  .object({
    triggerRunId: z.string().trim().min(1).max(256),
    snapshotVersion: z.string().regex(/^[0-9a-f]{64}$/),
    model: z.string().trim().min(1).max(256),
    summary: plannerOutputSchema.shape.summary,
    generatedAt: isoTimestampSchema,
    recommendations: savedPlannerRecommendationsSchema,
  })
  .strict();

export const readPlannerRunsSchema = z
  .object({
    lastCursor: z.base64url().nullable().default(null),
    status: z.enum(plannerRunStatuses).optional(),
  })
  .strict();

export const plannerRunsCursorSchema = createCursorPaginationSchema(
  z.object({ id: z.uuid(), marker: isoTimestampSchema }),
);
export type ReadPlannerRunsSchema = z.input<typeof readPlannerRunsSchema>;
