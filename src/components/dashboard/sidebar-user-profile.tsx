"use client";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { ChevronUp, LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { UserProfile } from "../user-profile";

export const SidebarUserProfile = () => {
  const { data: session } = useAuthSession();
  const { signOut, isSigningOut } = useSignOut();

  if (!session) return null;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="h-16"
                  tooltip="Account"
                />
              }
            >
              <UserProfile
                {...session.user}
                className="size-12 group-data-[collapsible=icon]:size-8"
              />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-lg font-semibold">
                  {session.user.name}
                </span>
                <span className="truncate text-base text-muted-foreground">
                  {session.user.email}
                </span>
              </div>
              <ChevronUp className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={-5}
              alignOffset={40}
              className="w-auto!"
            >
              <div className="flex flex-col gap-0.5 p-2">
                <span className="text-base font-semibold">
                  {session.user.name}
                </span>
                <span className="text-base text-muted-foreground">
                  {session.user.email}
                </span>
              </div>
              <DropdownMenuItem
                variant="destructive"
                onClick={signOut}
                disabled={isSigningOut}
              >
                <LogOutIcon /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};
