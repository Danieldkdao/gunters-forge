"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductSelectData } from "@/db/schema";
import {
  CircleCheckIcon,
  CircleMinusIcon,
  EditIcon,
  SquareArrowOutUpRightIcon,
} from "lucide-react";
import { ReactElement } from "react";
import { useToggleActiveProduct } from "../hooks/use-toggle-active-product";
import { useUpdateProduct } from "../hooks/use-update-product";

export const ProductOptions = ({
  children,
  existingProduct,
}: {
  children: ReactElement;
  existingProduct: ProductSelectData;
}) => {
  const { handleProductUpdate, UpdateProductDialog } =
    useUpdateProduct(existingProduct);
  const { isActive, isToggleActiveProductPending, handleToggleActiveProduct } =
    useToggleActiveProduct(existingProduct.id, existingProduct.isActive);

  return (
    <>
      {UpdateProductDialog}
      <DropdownMenu>
        <DropdownMenuTrigger render={children} />
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem>
            <SquareArrowOutUpRightIcon />
            View Product
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleProductUpdate}
            disabled={isToggleActiveProductPending}
          >
            <EditIcon />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isToggleActiveProductPending}
            onClick={handleToggleActiveProduct}
          >
            {isActive ? <CircleCheckIcon /> : <CircleMinusIcon />}
            {isActive ? "Mark Inactive" : "Mark Active"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
