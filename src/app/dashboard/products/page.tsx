import { Button } from "@/components/ui/button";
import { ProductDialog } from "@/features/products/components/product-dialog";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const ProductsPage = () => {
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
        <ProductsSuspense />
      </Suspense>
    </div>
  );
};

const ProductsLoading = () => {
  return <div>loading</div>;
};

const ProductsSuspense = async () => {
  return <div>suspense</div>;
};

export default ProductsPage;
