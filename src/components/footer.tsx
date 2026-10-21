import Image from "next/image";
import Link from "next/link";
import { HammerIcon, PackageIcon, ShoppingBagIcon } from "lucide-react";
import { CopyrightText } from "./copyright-text";
import { Suspense } from "react";

export const Footer = () => {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0"
              />
              <span className="font-heading text-2xl font-semibold">
                Gunter&apos;s Forge
              </span>
            </Link>
            <p className="text-base text-muted-foreground">
              Weapons, armor, and everyday essentials, expertly crafted for
              every adventure.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HammerIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="text-base">Handcrafted in Mautern</span>
            </div>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-8 gap-y-3 md:pt-2"
          >
            <Link
              href="/products"
              className="inline-flex min-h-11 items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShoppingBagIcon className="size-4" aria-hidden="true" />
              Shop products
            </Link>
            <Link
              href="/play"
              className="inline-flex min-h-11 items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Play Gunter&apos;s Mining Adventure
            </Link>
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <PackageIcon className="size-4" aria-hidden="true" />
              My orders
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Suspense>
            <CopyrightText />
          </Suspense>
          <p className="text-base">Forged with care. Built to last.</p>
        </div>
      </div>
    </footer>
  );
};
