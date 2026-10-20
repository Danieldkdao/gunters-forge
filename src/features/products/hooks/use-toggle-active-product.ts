import { useState, useTransition } from "react";
import { updateProductAction } from "../actions/actions";
import { toast } from "@/components/ui/toast";

export const useToggleActiveProduct = (
  productId: string,
  defaultActive: boolean,
) => {
  const [isPending, startTransition] = useTransition();
  const [isActive, setIsActive] = useState(defaultActive);

  const handleToggleActiveProduct = () => {
    startTransition(async () => {
      const newState = !isActive;
      // Updates the state so user sees the change instantly
      // If an error occurs the value is rolled back
      setIsActive(newState);
      const response = await updateProductAction(productId, {
        isActive: newState,
      });
      if (response.error) {
        toast.error(response.message);
        setIsActive(!newState);
      } else {
        toast.success(response.message);
      }
    });
  };

  return {
    isActive,
    isToggleActiveProductPending: isPending,
    handleToggleActiveProduct,
  };
};
