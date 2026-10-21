"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDownIcon,
  LaptopIcon,
  LayoutDashboardIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  PackageIcon,
  PaletteIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useSignOut } from "@/hooks/use-sign-out";
import { useCartStore } from "@/stores/cart-store";
import { useState } from "react";
import { CartDrawer } from "@/features/cart/components/cart-drawer";

const themeOptions = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: LaptopIcon },
];

export const Header = () => {
  const { data: session, isPending } = useAuthSession();
  const { signOut, isSigningOut } = useSignOut();
  const { theme, setTheme } = useTheme();
  const [cartOpen, setCartOpen] = useState(false);
  const isMounted = useIsMounted();

  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  return (
    <>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-6 lg:gap-10">
            <Link
              href="/"
              aria-label="Gunter's Forge home"
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={40}
                height={40}
                className="size-8 shrink-0"
              />
              <div className="hidden min-w-0 sm:block">
                <span className="block truncate font-heading text-lg font-semibold sm:text-2xl">
                  Gunter&apos;s Forge
                </span>
              </div>
            </Link>
            <nav
              aria-label="Main navigation"
              className="hidden shrink-0 sm:flex items-center gap-8"
            >
              <Link
                href="/products"
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Shop
              </Link>
              <Link
                href="/play"
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Play
              </Link>
              {session?.user.role === "admin" && (
                <Link
                  href="/dashboard"
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`View cart, ${cartItemCount} items`}
              className="relative size-11 shrink-0"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCartIcon className="size-5" aria-hidden="true" />
              {hasHydrated && cartItemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold tabular-nums text-primary-foreground ring-2 ring-background"
                >
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Button>
            {/* Shows a placeholder until the component mounts and we get the user session information */}
            {!isMounted || isPending ? (
              <Skeleton className="h-10 w-24 rounded-md" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      aria-label="Open account menu"
                      className="h-11 gap-2 px-2"
                    />
                  }
                >
                  <UserProfile
                    name={session.user.name}
                    image={session.user.image}
                    className="size-8"
                  />
                  <span className="hidden max-w-32 truncate sm:block">
                    {session.user.name}
                  </span>
                  <ChevronDownIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 max-w-[calc(100vw-2rem)]"
                >
                  <div className="min-w-0 px-2 py-2">
                    <p className="truncate text-lg font-semibold">
                      {session.user.name}
                    </p>
                    <p className="truncate text-base text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {session?.user.role === "admin" && (
                    <DropdownMenuItem render={<Link href="/dashboard" />}>
                      <LayoutDashboardIcon aria-hidden="true" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem render={<Link href="/products" />}>
                    <ShoppingBagIcon aria-hidden="true" />
                    Shop products
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/orders" />}>
                    <PackageIcon aria-hidden="true" />
                    My orders
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <PaletteIcon aria-hidden="true" />
                      Appearance
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={theme}
                        onValueChange={setTheme}
                      >
                        {themeOptions.map(({ value, label, icon: Icon }) => (
                          <DropdownMenuRadioItem key={value} value={value}>
                            <Icon aria-hidden="true" />
                            {label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isSigningOut}
                    onClick={signOut}
                  >
                    <LogOutIcon aria-hidden="true" />
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <ThemeToggle aria-label="Change theme" />
                <Button render={<Link href="/sign-in" />} nativeButton={false}>
                  <LogInIcon aria-hidden="true" />
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
