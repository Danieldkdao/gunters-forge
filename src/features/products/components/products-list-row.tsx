import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ProductSelectData } from "@/db/schema";
import { format } from "date-fns";
import { EllipsisIcon } from "lucide-react";
import Image from "next/image";
import { formatPrice, formatProductCategory } from "../lib/formatters";
import { ProductOptions } from "./product-options";
import { cn } from "@/lib/utils";

export const ProductsListRow = ({
  product,
}: {
  product: ProductSelectData;
}) => {
  const { label: categoryLabel, icon: CategoryIcon } = formatProductCategory(
    product.category,
  );

  return (
    <TableRow
      key={product.id}
      className={cn(!product.isActive && "opacity-50")}
    >
      <TableCell>
        <div className="flex items-start gap-3">
          <div className="size-12 relative rounded-md overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="rounded-md object-cover"
            />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <p className="font-semibold">{product.name}</p>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CategoryIcon className="size-5" />
          <span className="text-base">{categoryLabel}</span>
        </div>
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums min-w-22">
        {formatPrice(product.price)}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap tabular-nums min-w-32">
        {product.craftingTimeMinutes} min
      </TableCell>
      <TableCell className="min-w-22">
        <Badge variant={product.isActive ? "default" : "secondary"}>
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="min-w-22">
        {product.featured ? (
          <Badge variant="outline">Featured</Badge>
        ) : (
          <span className="text-muted-foreground">Standard</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <p>{format(product.createdAt, "MMM d, yyyy")}</p>
        <p className="text-muted-foreground">
          {format(product.createdAt, "h:mm a")}
        </p>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <p>{format(product.updatedAt, "MMM d, yyyy")}</p>
        <p className="text-muted-foreground">
          {format(product.updatedAt, "h:mm a")}
        </p>
      </TableCell>
      <TableCell>
        <ProductOptions existingProduct={product}>
          <Button variant="ghost" size="icon">
            <EllipsisIcon />
          </Button>
        </ProductOptions>
      </TableCell>
    </TableRow>
  );
};
