import { db } from "@/db/db";
import { ProductTable } from "@/db/schema";
import { and, eq, type SQL } from "drizzle-orm";

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
