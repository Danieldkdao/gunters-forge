import { db } from "@/db/db";
import {
  ProductInsertData,
  ProductSelectData,
  ProductTable,
} from "@/db/schema";
import { userHasPermission } from "@/lib/auth/helpers";
import { and, eq, SQL } from "drizzle-orm";
import { revalidateProductCache } from "./cache/products";
import { isValidId } from "@/lib/utils";

export const confirmProductExistenceDb = async (
  productId: string,
  additionalFilters?: SQL<unknown>[],
) => {
  return (
    (await db.query.ProductTable.findFirst({
      where: and(eq(ProductTable.id, productId), ...(additionalFilters ?? [])),
    })) ?? null
  );
};

// Always recheck permissions to make sure that non-admin users can never access/modify data they aren't allowed to
export const insertProductDb = async (productData: ProductInsertData) => {
  const { hasPermission } = await userHasPermission({ product: ["create"] });
  if (!hasPermission) return null;

  const [insertedProduct] = await db
    .insert(ProductTable)
    .values(productData)
    .returning();
  if (!insertedProduct) return null;

  revalidateProductCache(insertedProduct.id);

  return insertedProduct;
};

export const updateProductDb = async (
  productId: string,
  productData: Partial<
    Omit<ProductSelectData, "id" | "createdAt" | "updatedAt">
  >,
) => {
  const { hasPermission } = await userHasPermission({ product: ["update"] });
  if (!hasPermission) return null;

  const existingProduct = await confirmProductExistenceDb(productId);
  if (!existingProduct) return null;

  const [updatedProduct] = await db
    .update(ProductTable)
    .set(productData)
    .where(eq(ProductTable.id, existingProduct.id))
    .returning();
  if (!updatedProduct) return null;

  revalidateProductCache(updatedProduct.id);

  return updatedProduct;
};

export const populateProductIds = async (productIds: string[]) => {
  if (!isValidId(productIds)) return null;

  const existingCartItems = (
    await Promise.all(
      productIds.map((productId) => confirmProductExistenceDb(productId)),
    )
  ).filter((product): product is ProductSelectData => Boolean(product));
  if (existingCartItems.length !== productIds.length) return null;

  return existingCartItems;
};
