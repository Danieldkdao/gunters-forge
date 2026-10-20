import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { readProductsAction } from "@/features/products/actions/actions";
import { ProductDialog } from "@/features/products/components/product-dialog";
import { ProductsFilters } from "@/features/products/components/products-filters";
import { ProductsList } from "@/features/products/components/products-list";
import { ProductsListSkeleton } from "@/features/products/components/products-list-skeletons";
import { loadProductsSearchParams } from "@/features/products/lib/params";
import { SearchParamsProps } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const ProductsPage = (props: SearchParamsProps) => {
  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-2 w-full min-w-0 justify-between">
        <h1 className="text-3xl font-semibold">Products</h1>
        <ProductDialog>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </ProductDialog>
      </div>
      <Suspense fallback={<ProductsLoading />}>
        <ProductsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const ProductsLoading = () => {
  return <ProductsListSkeleton view="list" />;
};

const ProductsSuspense = async ({ searchParams }: SearchParamsProps) => {
  const filters = await loadProductsSearchParams(searchParams);
  const response = await readProductsAction(filters);
  if (!response) {
    return (
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your products. Try refreshing the page or come back later if the issue persists."
      />
    );
  }

  const { data, nextCursor, key } = response;

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <ProductsFilters showActive />
      <ProductsList
        key={key}
        initialProducts={data}
        initialNextCursor={nextCursor}
        view="list"
        showActive
      />
    </div>
  );
};

export default ProductsPage;
