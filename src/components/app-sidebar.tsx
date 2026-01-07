"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  User,
  Users,
} from "lucide-react";
import { AppLogo } from "@/components/icons";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/teams",
    label: "Teams",
    icon: Users,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <AppLogo />
          <span className="text-lg font-semibold font-headline">Resolution Bingo</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="hidden flex-col gap-2 rounded-lg border bg-card p-4 text-center group-data-[collapsible=icon]:flex">
            <h3 className="font-headline font-semibold">New Team?</h3>
            <Button size="sm">Create</Button>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-center group-data-[collapsible=icon]:hidden">
            <h3 className="font-headline font-semibold">Ready for a new challenge?</h3>
            <p className="text-sm text-muted-foreground">Create a new team and invite your friends to join.</p>
            <Button size="sm">Create New Team</Button>
        </div>
      </SidebarFooter>
    </>
  );
}
