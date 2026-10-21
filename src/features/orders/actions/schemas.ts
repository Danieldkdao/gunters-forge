import { orderPaymentMethods, orderStatuses } from "@/db/shared";
import { cartItemSchema } from "@/features/cart/actions/schemas";
import z from "zod";
import {
  createCursorPaginationSchema,
  isoTimestampSchema,
} from "@/lib/schemas";

export const createOrderSchema = z
  .object({
    cartItems: z
      .array(
        cartItemSchema.extend({ quantity: z.number().int().min(1).max(999) }),
      )
      .min(1)
      .max(99)
      .refine(
        (items) =>
          new Set(items.map((item) => item.productId)).size === items.length,
        {
          message: "Each product must appear only once in the cart.",
        },
      ),
    paymentMethod: z.enum(orderPaymentMethods),
    deliveryAddress: z.string().trim().min(1).max(1000).nullable().optional(),
    customerNotes: z.string().trim().max(2000).nullable().optional(),
    requestId: z.uuid().optional(),
  })
  .strict();
export type CreateOrderSchema = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z
  .object({
    status: z.enum(orderStatuses).optional(),
    queueRank: z.number().int().min(1).max(2147483647).optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  })
  .refine(
    (data) => data.status !== "cancelled" || data.queueRank === undefined,
    {
      message: "Cancel an order separately from changing its queue rank.",
    },
  );
export type UpdateOrderSchema = z.infer<typeof updateOrderSchema>;

// History solely uses the timestamps to do cursor pagination
// The queue needs priority and rank to determine the ordering
export const ordersCursorPaginationSchema = createCursorPaginationSchema(
  z.object({
    id: z.uuid(),
    marker: z.union([
      isoTimestampSchema,
      z.object({
        priority: z.number().int().min(0).max(1),
        rank: z.number().int(),
        queuedAt: isoTimestampSchema.nullable(),
        createdAt: isoTimestampSchema,
      }),
    ]),
  }),
);

export const readOrdersSchema = z
  .object({
    lastCursor: z.base64url().nullable().default(null),
    status: z.enum(orderStatuses).optional(),
  })
  .strict();
export type ReadOrdersSchema = z.input<typeof readOrdersSchema>;

export const updateOrderDetailsSchema = z
  .object({
    customerNotes: z.string().trim().max(2000).nullable().optional(),
    deliveryAddress: z.string().trim().min(1).max(1000).optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
  });
