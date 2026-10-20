"use client";

import { DialogDrawer } from "@/components/dialog-drawer";
import { ProductSelectData } from "@/db/schema";
import { SetterType } from "@/lib/types";
import { ReactElement, useState } from "react";
import { ProductForm } from "./product-form";

export const ProductDialog = ({
  children,
  open,
  onOpenChange,
  existingProduct,
}: {
  children?: ReactElement;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
  existingProduct?: ProductSelectData;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openToUse = open ?? isOpen;
  const setOpenToUse = onOpenChange ?? setIsOpen;

  return (
    <DialogDrawer
      trigger={children}
      open={openToUse}
      onOpenChange={setOpenToUse}
      options={{
        title: existingProduct ? "Update Product" : "Create Product",
      }}
    >
      <ProductForm
        existingProduct={existingProduct}
        afterAction={() => setOpenToUse(false)}
      />
    </DialogDrawer>
  );
};
