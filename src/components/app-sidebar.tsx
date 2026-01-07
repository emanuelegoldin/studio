"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListCheck,
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
  {
    href: "/profile/resolutions",
    label: "Resolutions",
    icon: ListCheck
  }
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
      <SidebarFooter/>
    </>
  );
}
