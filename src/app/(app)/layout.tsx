import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
        <Sidebar>
            <AppSidebar />
        </Sidebar>
        <SidebarInset>
            <AppHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
