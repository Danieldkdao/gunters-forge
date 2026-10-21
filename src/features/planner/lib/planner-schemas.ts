import z from "zod";

export const plannerInputSchema = z.object({}).strict();

export const plannerOutputSchema = z
  .object({
    summary: z.string().trim().min(1).max(500),
    orders: z
      .array(
        z
          .object({
            orderRef: z.string().regex(/^order-[1-9]\d*$/),
            workType: z.enum([
              "small_job",
              "extended_project",
              "batch_candidate",
              "standard",
            ]),
            reason: z.string().trim().min(1).max(300),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

export type PlannerOutput = z.infer<typeof plannerOutputSchema>;
