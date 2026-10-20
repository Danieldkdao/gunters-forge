import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "../ui/sidebar";
import { DashboardSidebarContent } from "./dashboard-sidebar-content";
import { SidebarUserProfile } from "./sidebar-user-profile";
import Image from "next/image";

export const DashboardSidebar = () => {
  return (
    <Sidebar collapsible="icon" className="min-w-0">
      <SidebarHeader className="min-w-0">
        <SidebarMenu className="min-w-0">
          <SidebarMenuItem className="min-w-0">
            <SidebarMenuButton
              size="lg"
              tooltip="Gunter's Forge"
              render={<Link href="/" />}
              className="min-w-0 flex items-center gap-3 h-12 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0!"
            >
              <div className="relative size-8 shrink-0 transition-[width-height] duration-200 group-data-[collapsible=icon]:size-6 flex justify-center items-center">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block text-2xl truncate font-semibold group-data-[collapsible=icon]:hidden">
                  Gunter&apos;s Forge
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <DashboardSidebarContent />
      <SidebarUserProfile />
      <SidebarRail />
    </Sidebar>
  );
};
