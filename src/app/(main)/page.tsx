import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRightIcon,
  HammerIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products/components/product-card";
import { ProductsGridSkeleton } from "@/features/products/components/products-list-skeletons";
import { readFeaturedProductsAction } from "@/features/products/actions/actions";
import { Card, CardContent } from "@/components/ui/card";

const listOptions = [
  {
    icon: ShoppingBagIcon,
    title: "Find your piece",
    description:
      "Browse the collection and choose what belongs in your pack, home, or workshop.",
  },
  {
    icon: HammerIcon,
    title: "Gunter gets to work",
    description:
      "Place your order and Gunter will craft your pieces, one careful detail at a time.",
  },
  {
    icon: PackageCheckIcon,
    title: "Follow the progress",
    description:
      "See when your order enters the queue, is being crafted, and is ready for delivery.",
  },
];

export default function Home() {
  return (
    <div className="pt-20 space-y-16 pb-8 text-base sm:space-y-24">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-10 text-center sm:py-16">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Made by hand.
          <br />
          Built for your next adventure.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
          Weapons, armor, and everyday essentials, crafted with care by Gunter.
          Find your next trusted piece and follow its journey from the forge to
          your door.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            render={<Link href="/products" />}
            nativeButton={false}
          >
            Explore the shop
            <ArrowRightIcon />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/orders" />}
            nativeButton={false}
          >
            Track your order
          </Button>
        </div>
      </section>
      <section className="space-y-6" aria-labelledby="featured-products-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-medium text-primary text-lg">
              From Gunter&apos;s workbench
            </p>
            <h2 id="featured-products-title" className="text-3xl font-semibold">
              Made for the road ahead
            </h2>
          </div>
          <Button
            variant="ghost"
            render={<Link href="/products" />}
            nativeButton={false}
          >
            View all products
            <ArrowRightIcon />
          </Button>
        </div>
        <Suspense fallback={<ProductsGridSkeleton rows={4} />}>
          <FeaturedProducts />
        </Suspense>
      </section>
      <section className="border-t pt-10" aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title" className="mb-8 text-3xl font-semibold">
          A little care in every step.
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {listOptions.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="flex flex-col gap-3">
              <CardContent>
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-semibold">{title}</h3>
                  <p className="text-lg text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </ol>
      </section>
    </div>
  );
}

const FeaturedProducts = async () => {
  const products = await readFeaturedProductsAction().catch(() => null);
  if (!products)
    return (
      <p className="border-y py-8 text-muted-foreground">
        The collection couldn&apos;t be loaded.{" "}
        <Link
          href="/products"
          className="font-medium text-foreground underline"
        >
          Visit the shop to try again.
        </Link>
      </p>
    );
  if (!products.length)
    return (
      <p className="border-y py-8 text-muted-foreground">
        Gunter is preparing the next collection. Check back soon for new pieces.
      </p>
    );
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
