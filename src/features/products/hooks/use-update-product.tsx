import { ProductSelectData } from "@/db/schema";
import { useState } from "react";
import { ProductDialog } from "../components/product-dialog";

export const useUpdateProduct = (existingProduct: ProductSelectData) => {
  const [open, setOpen] = useState(false);

  const handleProductUpdate = () => {
    setOpen(true);
  };

  const UpdateProductDialog = (
    <ProductDialog
      existingProduct={existingProduct}
      open={open}
      onOpenChange={setOpen}
    />
  );

  return { handleProductUpdate, UpdateProductDialog };
};
