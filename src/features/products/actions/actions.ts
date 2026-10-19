"use server";

import { db } from "@/db/db";
import { ProductTable } from "@/db/schema";
import { userHasPermission } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NO_PERMISSION_DATA_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
} from "@/lib/constants";
import {
  createInArrayFilter,
  createSearchFilter,
  createSortByMap,
} from "@/lib/db-filters";
import { UnwrapAsync } from "@/lib/types";
import {
  errorMessage,
  isValidId,
  normalizeData,
  writeCursor,
} from "@/lib/utils";
import { and } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getGlobalProductTag } from "../server/cache/products";
import {
  confirmProductExistenceDb,
  deleteProductDb,
  insertProductDb,
  updateProductDb,
} from "../server/products";
import {
  createProductSchema,
  CreateProductSchema,
  productsCursorPaginationSchema,
  readProductsOptionsSchema,
  ReadProductsOptionsSchema,
  updateProductSchema,
  UpdateProductSchema,
} from "./schemas";

// Validate filter options passed in, returns products if everything checks out, otherwise returns null
export const readProductsAction = async (
  options: ReadProductsOptionsSchema,
) => {
  "use cache";
  cacheTag(getGlobalProductTag());

  const { data: optionsData, success: dataSuccess } =
    readProductsOptionsSchema.safeParse(options);
  if (!dataSuccess) return null;

  const { search, sortBy, categories, lastCursor } = optionsData;

  const { data: cursorData, success: cursorSuccess } =
    productsCursorPaginationSchema.safeParse(lastCursor);
  if (!cursorSuccess) return null;

  const searchFilter = createSearchFilter(ProductTable, search, [
    "name",
    "slug",
    "description",
  ]);
  const categoryFilter = createInArrayFilter(
    ProductTable,
    categories,
    "category",
  );
  const sortByMap = createSortByMap(ProductTable, cursorData, [
    {
      option: "recently_created",
      order: "desc",
      property: "createdAt",
    },
    {
      option: "oldest",
      order: "asc",
      property: "createdAt",
    },
    {
      option: "recently_updated",
      order: "desc",
      property: "updatedAt",
    },
    {
      option: "price_high_to_low",
      order: "desc",
      property: "price",
    },
    {
      option: "price_low_to_high",
      order: "asc",
      property: "price",
    },
  ]);

  const sortByOption = sortByMap[sortBy];

  const filters = and(searchFilter, categoryFilter, sortByOption.cursorFilter);

  // Fetch one more record than requested page size to check if there is a next page or not
  const products = await db
    .select()
    .from(ProductTable)
    .where(filters)
    .orderBy(...sortByOption.sortBy)
    .limit(PAGE_SIZE + 1);

  const hasNextPage = products.length > PAGE_SIZE;

  const nextCursor = hasNextPage
    ? writeCursor({
        id: products[PAGE_SIZE - 1].id,
        timestamp: normalizeData(
          products[PAGE_SIZE - 1][sortByOption.nextCursorField],
        ),
      })
    : null;

  // Rerender components when filters change/products are updated
  const productsKey = JSON.stringify({
    products: products.map((product) => ({
      id: product.id,
      updated: product.updatedAt.toISOString(),
    })),
    filters: {
      search: options.search,
      sortBy: options.sortBy,
      categories: options.categories,
    },
  });

  return {
    data: products.slice(0, PAGE_SIZE),
    nextCursor,
    key: productsKey,
  };
};
export type ReadProductsAction = UnwrapAsync<typeof readProductsAction>;

export const createProductAction = async (unsafeData: CreateProductSchema) => {
  const { hasPermission } = await userHasPermission({ product: ["create"] });
  if (!hasPermission) {
    return {
      error: true as const,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  const { data, success } = createProductSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true as const,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const createdProduct = await insertProductDb({
      ...data,
    });
    if (!createdProduct) throw new Error("Failed to create product.");

    return {
      error: false as const,
      message: "Product created successfully!",
      productId: createdProduct.id,
    };
  } catch (error) {
    console.error(error);

    return {
      error: true as const,
      message: errorMessage(error),
    };
  }
};

export const updateProductAction = async (
  productId: string,
  unsafeData: UpdateProductSchema,
) => {
  if (!isValidId(productId)) {
    return {
      error: true as const,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { hasPermission } = await userHasPermission({ product: ["update"] });
  if (!hasPermission) {
    return {
      error: true as const,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  const existingProduct = await confirmProductExistenceDb(productId);
  if (!existingProduct) {
    return {
      error: true as const,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { data, success } = updateProductSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true as const,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedProduct = await updateProductDb(existingProduct.id, data);
    if (!updatedProduct) throw new Error("Failed to update product.");

    return {
      error: false as const,
      message: "Product updated successfully!",
      productId: updatedProduct.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true as const,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteProductAction = async (productId: string) => {
  if (!isValidId(productId)) {
    return {
      error: true as const,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { hasPermission } = await userHasPermission({ product: ["delete"] });
  if (!hasPermission) {
    return {
      error: true as const,
      message: NO_PERMISSION_DATA_MESSAGE,
    };
  }

  const existingProduct = await confirmProductExistenceDb(productId);
  if (!existingProduct) {
    return {
      error: true as const,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedProduct = await deleteProductDb(existingProduct.id);
    if (!deletedProduct) throw new Error("Failed to delete product.");

    return {
      error: false as const,
      message: "Product deleted successfully!",
      productId: deletedProduct.id,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true as const,
      message: errorMessage(error),
    };
  }
};
