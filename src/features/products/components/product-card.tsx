import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  ClockIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductSelectData } from "@/db/schema";
import {
  formatPrice,
  formatProductCategory,
} from "@/features/products/lib/formatters";
import { Button } from "@/components/ui/button";

export const ProductCard = ({ product }: { product: ProductSelectData }) => {
  const { label, icon: CategoryIcon } = formatProductCategory(product.category);

  return (
    <Card className="group h-full gap-4 pt-0 transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="relative block aspect-4/3 overflow-hidden bg-muted"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {product.featured && (
          <Badge className="absolute left-3 top-3 gap-1.5">
            <SparklesIcon className="size-4" aria-hidden="true" />
            Featured
          </Badge>
        )}
      </Link>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-xl font-semibold">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 text-lg md:text-base">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CategoryIcon className="size-4" aria-hidden="true" />
            <span className="text-lg md:text-base">{label}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="size-4 shrink-0" aria-hidden="true" />
            <span className="text-lg md:text-base">
              Est. crafting time:{" "}
              {product.craftingTimeMinutes.toLocaleString("en-US")} min
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto justify-between flex-wrap gap-3 border-t">
        <span className="text-xl font-semibold tabular-nums">
          {formatPrice(product.price)}
        </span>
        <Button>
          <PlusIcon />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};
