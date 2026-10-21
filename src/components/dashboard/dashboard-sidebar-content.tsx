"use client";

import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingBagIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

const navigation = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: PackageIcon,
  },
  {
    title: "Orders",
    url: "/dashboard/orders",
    icon: ShoppingBagIcon,
  },
];

export const DashboardSidebarContent = () => (
  <Suspense
    fallback={
      <SidebarContent>
        <Skeleton className="h-32" />
      </SidebarContent>
    }
  >
    <SidebarNavigation />
  </Suspense>
);

const SidebarNavigation = () => {
  const pathname = usePathname();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                  isActive={
                    pathname === item.url ||
                    (item.url !== "/dashboard" &&
                      pathname.startsWith(`${item.url}/`))
                  }
                  className="flex items-center gap-2 h-10"
                >
                  <item.icon className="not-group-data-[collapsible=icon]:size-5!" />
                  <span className="text-lg font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
};
