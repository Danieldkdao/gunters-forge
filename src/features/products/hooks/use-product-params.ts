import { useQueryStates } from "nuqs";
import { productsSearchParams } from "../lib/params";

export const useProductParams = () => {
  return useQueryStates(productsSearchParams, { shallow: false });
};
