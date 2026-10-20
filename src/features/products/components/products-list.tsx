"use client";

import { ListError, ListLoader, Sentinel } from "@/components/list-components";
import { NotFound } from "@/components/not-found";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductSelectData } from "@/db/schema";
import { useInfiniteCursor } from "@/hooks/use-infinite-cursor";
import { useCallback } from "react";
import { readProductsAction } from "../actions/actions";
import { useProductParams } from "../hooks/use-product-params";
import { ProductsListRow } from "./products-list-row";

export const ProductsList = ({
  initialProducts,
  initialNextCursor,
}: {
  initialProducts: ProductSelectData[];
  initialNextCursor: string | null;
}) => {
  const [filters] = useProductParams();
  const fetchProducts = useCallback(
    async (lastCursor: string | null) => {
      return await readProductsAction({
        ...filters,
        lastCursor,
      });
    },
    [filters],
  );

  const {
    items: products,
    isPending,
    nextCursor,
    error,
    sentinelRef,
  } = useInfiniteCursor(initialProducts, initialNextCursor, fetchProducts, {
    additionalDeps: [filters],
    customErrorMessage: "Failed to load products. Please try again.",
  });

  return (
    <div className="flex flex-col gap-2">
      {products.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Crafting Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <ProductsListRow key={product.id} product={product} />
            ))}
          </TableBody>
        </Table>
      ) : (
        <NotFound
          title="No products found"
          description="Try adjusting your filters or adding new products"
        />
      )}
      <ListLoader loading={isPending} />
      <Sentinel ref={sentinelRef} show={!!nextCursor} />
      <ListError error={error} />
    </div>
  );
};
