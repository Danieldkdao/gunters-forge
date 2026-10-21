import { Skeleton } from "@/components/ui/skeleton";
import { ProductsGridSkeleton } from "./products-list-skeletons";

export const RelatedProductsSkeleton = () => (
  <div role="status" aria-busy="true" className="space-y-4">
    <span className="sr-only">Loading related products…</span>
    <Skeleton className="h-8 w-56" />
    <ProductsGridSkeleton rows={4} />
  </div>
);

export const ProductDetailsSkeleton = () => (
  <div role="status" aria-busy="true" className="space-y-10">
    <span className="sr-only">Loading product…</span>
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-9 w-36" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
    <RelatedProductsSkeleton />
  </div>
);
