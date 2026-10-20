import z from "zod";

// Store product ID and quantity, fetch the product details separately
export const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().min(1),
});
export type CartItemSchema = z.infer<typeof cartItemSchema>;
