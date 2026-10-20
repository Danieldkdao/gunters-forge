import { ErrorState } from "@/components/error-state";
import { readProductsAction } from "@/features/products/actions/actions";
import { ProductsFilters } from "@/features/products/components/products-filters";
import { ProductsList } from "@/features/products/components/products-list";
import { ProductsListSkeleton } from "@/features/products/components/products-list-skeletons";
import { loadProductsSearchParams } from "@/features/products/lib/params";
import { SearchParamsProps } from "@/lib/types";
import { Suspense } from "react";

const ProductsPage = (props: SearchParamsProps) => {
  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-col gap-0.5 w-full min-w-0">
        <h1 className="text-3xl font-semibold">All Products</h1>
        <p className="text-muted-foreground text-lg">
          Explore weapons, armor, and everyday essentials, each expertly forged
          by Gunter.
        </p>
      </div>
      <Suspense fallback={<ProductsLoading />}>
        <ProductsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const ProductsLoading = () => {
  return <ProductsListSkeleton rows={8} />;
};

const ProductsSuspense = async ({ searchParams }: SearchParamsProps) => {
  const filters = await loadProductsSearchParams(searchParams);
  const response = await readProductsAction({
    ...filters,
    active: "active",
  });
  if (!response) {
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load the products. Try refreshing the page or come back later if the issue persists."
      />
    );
  }

  const { data, nextCursor, key } = response;

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <ProductsFilters />
      {/* Prevents showing non-admin users inactive products */}
      <ProductsList
        key={key}
        initialProducts={data}
        initialNextCursor={nextCursor}
      />
    </div>
  );
};

export default ProductsPage;
