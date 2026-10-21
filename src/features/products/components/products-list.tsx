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
import { ProductCard } from "./product-card";

export const ProductsList = ({
  initialProducts,
  initialNextCursor,
  view = "grid",
  showAllActive = false,
}: {
  initialProducts: ProductSelectData[];
  initialNextCursor: string | null;
  view?: "list" | "grid";
  showAllActive?: boolean;
}) => {
  const [filters] = useProductParams();
  const fetchProducts = useCallback(
    async (lastCursor: string | null) => {
      return await readProductsAction({
        ...filters,
        active: showAllActive ? filters.active : "active",
        lastCursor,
      });
    },
    [filters, showAllActive],
  );

  const {
    items: products,
    isPending,
    nextCursor,
    error,
    sentinelRef,
  } = useInfiniteCursor(initialProducts, initialNextCursor, fetchProducts, {
    customErrorMessage: "Failed to load products. Please try again.",
  });

  return (
    <div className="flex flex-col gap-2">
      {products.length ? (
        // View changes presentation only, both use the same data and pagination
        view === "list" ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )
      ) : (
        <NotFound
          title="No products found"
          description={`Try adjusting your filters or ${view === "list" ? "adding new products" : "refreshing the page"}`}
        />
      )}
      <ListLoader loading={isPending} />
      <Sentinel ref={sentinelRef} show={!!nextCursor} />
      <ListError error={error} />
    </div>
  );
};
