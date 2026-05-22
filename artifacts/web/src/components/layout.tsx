import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile } from "@workspace/api-client-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  HardHat,
  LogOut,
  FolderOpen,
  BookOpen,
} from "lucide-react";

function getNavItems(role: string | undefined) {
  const items = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"] },
    { title: "Projects", url: "/projects", icon: Building2, roles: ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"] },
    { title: "DSR Rates", url: "/dsr-rates", icon: BookOpen, roles: ["owner", "pm", "qs", "admin"] },
    { title: "Approvals", url: "/approvals", icon: ClipboardList, roles: ["owner", "pm", "qs", "finance"] },
    { title: "Organisations", url: "/organisations", icon: Users, roles: ["admin"] },
    { title: "Profile", url: "/profile", icon: Settings, roles: ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"] },
  ];

  return items.filter(item => !role || item.roles.includes(role));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();
  const { data: profile } = useGetMyProfile();

  const navItems = getNavItems(profile?.role);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 font-bold text-lg text-primary">
              <HardHat className="h-6 w-6" />
              <span>OCMS</span>
            </div>
            {profile && (
              <div className="mt-4 flex flex-col">
                <span className="text-sm font-medium">{profile.firstName} {profile.lastName}</span>
                <span className="text-xs text-sidebar-foreground/70 capitalize">{profile.role.replace("_", " ")}</span>
              </div>
            )}
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-muted/30">
          <header className="h-14 border-b bg-background flex items-center px-4 md:hidden">
            <SidebarTrigger />
            <div className="ml-4 font-bold text-primary flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              <span>OCMS</span>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
