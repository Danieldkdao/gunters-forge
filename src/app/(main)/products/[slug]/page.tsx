import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  ClockIcon,
  HammerIcon,
  SparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductSelectData } from "@/db/schema";
import {
  readProductAction,
  readRelatedProductsAction,
} from "@/features/products/actions/actions";
import { ProductCard } from "@/features/products/components/product-card";
import {
  ProductDetailsSkeleton,
  RelatedProductsSkeleton,
} from "@/features/products/components/product-details-skeleton";
import { ProductPurchase } from "@/features/products/components/product-purchase";
import {
  formatPrice,
  formatProductCategory,
} from "@/features/products/lib/formatters";
import { ParamsId } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

export default function ProductPage(props: ParamsId<"slug">) {
  return (
    <Suspense fallback={<ProductDetailsSkeleton />}>
      <ProductDetails {...props} />
    </Suspense>
  );
}

const ProductDetails = async ({ params }: ParamsId<"slug">) => {
  const { slug } = await params;
  const product = await readProductAction(slug);
  if (!product) notFound();
  const { label, icon: CategoryIcon } = formatProductCategory(product.category);
  return (
    <div className="min-w-0 space-y-10">
      <Button
        variant="ghost"
        render={<Link href="/products" />}
        nativeButton={false}
      >
        <ArrowLeftIcon />
        All products
      </Button>
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            loading="eager"
            sizes="(max-width: 1023px) 100vw, (max-width: 1280px) 50vw, 608px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 space-y-6">
          <h1 className="wrap-break-word text-3xl font-semibold sm:text-4xl">
            {product.name}
          </h1>
          <p className="whitespace-pre-wrap wrap-break-word text-xl text-muted-foreground">
            {product.description}
          </p>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 text-lg text-muted-foreground">
                <CategoryIcon className="size-5" aria-hidden="true" />
                {label}
              </span>
              {product.featured && (
                <Badge>
                  <SparklesIcon aria-hidden="true" />
                  Featured
                </Badge>
              )}
            </div>
            <p className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
              <ClockIcon className="size-5 shrink-0" aria-hidden="true" />
              {product.craftingTimeMinutes.toLocaleString("en-US")} minutes to
              craft each item
            </p>
            <p className="flex items-center gap-2 text-lg text-muted-foreground">
              <BadgeCheckIcon className="size-5 shrink-0" aria-hidden="true" />
              Handcrafted by Gunter in Mautern
            </p>
          </div>
          <Separator />
          <p className="text-3xl font-semibold tabular-nums">
            {formatPrice(product.price)}
          </p>
          <ProductPurchase
            productId={product.id}
            name={product.name}
            price={product.price}
            className="border-none pt-0"
          />
        </div>
      </div>
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts product={product} />
      </Suspense>
    </div>
  );
};

const RelatedProducts = async ({ product }: { product: ProductSelectData }) => {
  const products = (await readRelatedProductsAction(product.category)).filter(
    (item) => item.id !== product.id,
  );
  if (!products.length) return null;
  return (
    <section aria-labelledby="related-products-title" className="space-y-4">
      <h2 id="related-products-title" className="text-2xl font-semibold">
        Related products
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
};
