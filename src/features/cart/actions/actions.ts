"use server";

import { db } from "@/db/db";
import { ProductTable } from "@/db/schema";
import { UnwrapAsync } from "@/lib/types";
import { isValidId } from "@/lib/utils";
import { and, eq, inArray } from "drizzle-orm";

export const readCartProductsAction = async (unsafeIds: string[]) => {
  if (!isValidId(unsafeIds)) return null;

  const ids = [...new Set(unsafeIds)];
  if (!ids.length) return null;

  // Return only active products, cart can't access missing product IDs
  return db
    .select({
      id: ProductTable.id,
      name: ProductTable.name,
      imageUrl: ProductTable.imageUrl,
      category: ProductTable.category,
      price: ProductTable.price,
      isActive: ProductTable.isActive,
    })
    .from(ProductTable)
    .where(and(inArray(ProductTable.id, ids), eq(ProductTable.isActive, true)));
};
export type ReadCartProductsAction = UnwrapAsync<typeof readCartProductsAction>;
