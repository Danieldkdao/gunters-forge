import { OrderActionError } from "../lib/lifecycle";
import "server-only";
import type { DbTransaction } from "@/db/db";
import { OrderItemTable, type ProductSelectData } from "@/db/schema";

export const insertCartOrderItemsDb = async (
  tx: DbTransaction,
  orderId: string,
  items: { product: ProductSelectData; quantity: number }[],
) => {
  if (!items.length)
    throw new OrderActionError("An order must contain products.");
  const insertedItems = await tx
    .insert(OrderItemTable)
    .values(
      items.map(({ product, quantity }) => ({
        orderId,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl,
        unitPrice: product.price,
        category: product.category,
        craftingTimeMinutes: product.craftingTimeMinutes,
        quantity,
        stripePriceId: product.stripePriceId,
      })),
    )
    .returning();
  if (insertedItems.length !== items.length)
    throw new OrderActionError("Failed to insert order items.");
  return insertedItems;
};
