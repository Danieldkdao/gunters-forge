"use server";

import { db } from "@/db/db";
import { ProductCategory, ProductTable } from "@/db/schema";
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
  createMapFilter,
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
import {
  createStripeProduct,
  updateStripeProduct,
} from "@/services/stripe/helpers";
import { getPriceId } from "@/services/stripe/utils";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { convertDollarsToCents } from "../lib/utils";
import {
  getGlobalProductTag,
  getProductSlugTag,
} from "../server/cache/products";
import {
  confirmProductExistenceDb,
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
import {
  ProductsActiveOption,
  productsActiveOptions,
  ProductsFeaturedOption,
  productsFeaturedOptions,
} from "../lib/params";

// Validate filter options passed in, returns products if everything checks out, otherwise returns null
export const readProductsAction = async (
  options: ReadProductsOptionsSchema,
) => {
  "use cache";
  cacheTag(getGlobalProductTag());

  const { data: optionsData, success: dataSuccess } =
    readProductsOptionsSchema.safeParse(options);
  if (!dataSuccess) return null;

  const { search, sortBy, categories, featured, active, lastCursor } =
    optionsData;

  const { data: cursorData, success: cursorSuccess } =
    productsCursorPaginationSchema.safeParse(lastCursor);
  if (!cursorSuccess) return null;

  const featuredMap: Record<ProductsFeaturedOption, boolean | undefined> = {
    all: undefined,
    featured: true,
    standard: false,
  };

  const activeMap: Record<ProductsActiveOption, boolean | undefined> = {
    all: undefined,
    active: true,
    inactive: false,
  };

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
  const featuredFilter = createMapFilter(
    ProductTable,
    "featured",
    featured,
    productsFeaturedOptions.map((option) => ({
      key: option,
      value: featuredMap[option],
    })),
  );
  const activeFilter = createMapFilter(
    ProductTable,
    "isActive",
    active,
    productsActiveOptions.map((option) => ({
      key: option,
      value: activeMap[option],
    })),
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

  const filters = and(
    searchFilter,
    categoryFilter,
    sortByOption.cursorFilter,
    featuredFilter,
    activeFilter,
  );

  // Fetch one more record than requested page size to check if there is a next page or not
  const products = await db
    .select()
    .from(ProductTable)
    .where(filters)
    .orderBy(...sortByOption.sortBy)
    .limit(PAGE_SIZE + 1);

  const hasNextPage = products.length > PAGE_SIZE;

  // Continues from the last page
  const nextCursor = hasNextPage
    ? writeCursor({
        id: products[PAGE_SIZE - 1].id,
        marker: normalizeData(
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
      search,
      sortBy,
      categories,
      featured,
      active,
    },
  });

  return {
    data: products.slice(0, PAGE_SIZE),
    nextCursor,
    key: productsKey,
  };
};
export type ReadProductsAction = UnwrapAsync<typeof readProductsAction>;

export const readProductAction = async (productSlug: string) => {
  "use cache";
  cacheTag(getProductSlugTag(productSlug));

  return (
    (await db.query.ProductTable.findFirst({
      where: and(
        eq(ProductTable.isActive, true),
        eq(ProductTable.slug, productSlug),
      ),
    })) ?? null
  );
};

export const readRelatedProductsAction = async (category: ProductCategory) => {
  "use cache";
  cacheTag(getGlobalProductTag());

  return db.query.ProductTable.findMany({
    where: and(
      eq(ProductTable.isActive, true),
      eq(ProductTable.category, category),
    ),
    limit: 4,
  });
};

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

  // Creates the Stripe product first so we can use the IDs returned
  // If the creation fails, this does not undo
  const stripeProduct = await createStripeProduct(data);
  if (!stripeProduct) {
    return {
      error: true as const,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  const { price, ...rest } = data;

  try {
    // Convert the dollars to integer cents before storing in DB
    const createdProduct = await insertProductDb({
      ...rest,
      price: convertDollarsToCents(price),
      stripeProductId: stripeProduct.id,
      stripePriceId: getPriceId(stripeProduct.default_price),
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

  const updateResult = updateProductSchema.safeParse(unsafeData);
  if (!updateResult.success) {
    return {
      error: true as const,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { data, success } = createProductSchema.safeParse({
    ...existingProduct,
    ...unsafeData,
  });
  if (!success) {
    return {
      error: true as const,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const stripeProduct = await updateStripeProduct({
    ...existingProduct,
    ...data,
  });
  if (!stripeProduct) {
    return {
      error: true as const,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  const { price, ...rest } = data;

  try {
    const updatedProduct = await updateProductDb(existingProduct.id, {
      ...rest,
      price:
        price === existingProduct.price ? price : convertDollarsToCents(price),
      stripePriceId: getPriceId(stripeProduct.default_price),
    });
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
