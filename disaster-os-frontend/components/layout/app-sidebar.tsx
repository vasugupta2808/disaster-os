"use client";

import { LogOut, Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const sosItem = NAV_ITEMS.find((item) => item.href === "/sos")!;
  const otherItems = NAV_ITEMS.filter((item) => item.href !== "/sos");

  return (
    <Sidebar collapsible="icon" className="border-r-0 border-sidebar-border glass-panel m-2 rounded-2xl h-[calc(100vh-16px)]">
      <SidebarHeader className="px-4 py-6">
        <Link href="/home" className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-md">
            <Siren className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
            Disaster OS
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={sosItem.description}
                  className={cn(
                    "bg-severity-critical/10 text-severity-critical hover:bg-severity-critical/20 rounded-xl transition-all h-11",
                    "hover:text-severity-critical font-bold",
                    pathname === sosItem.href &&
                      "bg-gradient-to-r from-red-600 to-rose-500 text-white hover:text-white shadow-lg shadow-red-500/20",
                  )}
                >
                  <Link href={sosItem.href}>
                    <sosItem.icon className="h-5 w-5" />
                    <span className="ml-1 text-base">{sosItem.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {otherItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      tooltip={item.description}
                      className={cn(
                        "rounded-xl transition-all h-10 hover:bg-secondary/80",
                        isActive && "bg-secondary text-primary font-medium shadow-sm"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4.5 w-4.5" />
                        <span className="ml-1">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              tooltip="Sign out"
              className="text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors h-10"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="truncate ml-1 font-medium">{user?.email ?? "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
