"use client";

import {
  FilterLabel,
  MultiSelectFilter,
  SelectFilter,
} from "@/components/filter-components";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { productCategories } from "@/db/shared";
import { FilterIcon } from "lucide-react";
import { useProductParams } from "../hooks/use-product-params";
import {
  formatProductActiveOption,
  formatProductCategory,
  formatProductFeaturedOption,
  formatProductSortByOption,
} from "../lib/formatters";
import {
  productsActiveOptions,
  productsFeaturedOptions,
  productsSortByOptions,
} from "../lib/params";
import { SearchInput } from "@/components/search-input";

export const ProductsFilters = ({
  showActive = false,
}: {
  showActive?: boolean;
}) => {
  const [filters, setFilters] = useProductParams();

  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <SearchInput
        initialValue={filters.search}
        onSearch={(search) => setFilters({ search })}
        placeholder="Search by product name, slug, or description"
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent className="flex flex-col gap-4" align="end">
          <div className="flex flex-col gap-2">
            <FilterLabel>Sort By</FilterLabel>
            <SelectFilter
              value={filters.sortBy}
              onValueChange={(sortBy) => setFilters({ sortBy })}
              format={(sortBy) => formatProductSortByOption(sortBy)}
              options={productsSortByOptions}
              styleOptions={{ placeholder: "Sort by" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FilterLabel>Categories</FilterLabel>
            <MultiSelectFilter
              values={filters.categories}
              onValuesChange={(categories) => setFilters({ categories })}
              format={(category) => formatProductCategory(category).label}
              options={productCategories}
              styleOptions={{ placeholder: "Filter by category" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FilterLabel>Featured</FilterLabel>
            <SelectFilter
              value={filters.featured}
              onValueChange={(featured) => setFilters({ featured })}
              format={(featured) => formatProductFeaturedOption(featured)}
              options={productsFeaturedOptions}
              styleOptions={{ placeholder: "Filter by featured" }}
            />
          </div>
          {/* Controls the UI only, product visibility is still determined by the query */}
          {showActive && (
            <div className="flex flex-col gap-2">
              <FilterLabel>Active</FilterLabel>
              <SelectFilter
                value={filters.active}
                onValueChange={(active) => setFilters({ active })}
                format={(active) => formatProductActiveOption(active)}
                options={productsActiveOptions}
                styleOptions={{ placeholder: "Filter by active" }}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
