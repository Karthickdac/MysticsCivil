import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useT, type Lang } from "@/lib/i18n";
import { Languages } from "lucide-react";
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
    { titleKey: "nav.dashboard", url: "/", icon: LayoutDashboard, roles: ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"] },
    { titleKey: "nav.projects", url: "/projects", icon: Building2, roles: ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"] },
    { titleKey: "nav.dsrRates", url: "/dsr-rates", icon: BookOpen, roles: ["owner", "pm", "qs", "admin"] },
    { titleKey: "nav.approvals", url: "/approvals", icon: ClipboardList, roles: ["owner", "pm", "qs", "finance"] },
    { titleKey: "nav.organisations", url: "/organisations", icon: Users, roles: ["admin"] },
    { titleKey: "nav.profile", url: "/profile", icon: Settings, roles: ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"] },
  ];

  return items.filter(item => !role || item.roles.includes(role));
}

function LangSwitcher() {
  const { lang, setLang, t } = useT();
  const opts: { value: Lang; label: string }[] = [
    { value: "en", label: t("label.english") },
    { value: "ta", label: t("label.tamil") },
  ];
  return (
    <div className="flex items-center gap-1 text-xs" data-testid="lang-switcher">
      <Languages className="h-3.5 w-3.5 opacity-70" />
      {opts.map(o => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          className={`px-2 py-0.5 rounded ${lang === o.value ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent/50"}`}
          data-testid={`lang-${o.value}`}
        >
          {o.value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: profile } = useGetMyProfile();
  const { t } = useT();

  const navItems = getNavItems(profile?.role);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-lg text-primary">
                <HardHat className="h-6 w-6" />
                <span>{t("app.name")}</span>
              </div>
              <LangSwitcher />
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
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={async () => { await logout(); setLocation("/login"); }} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>{t("nav.logout")}</span>
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
              <span>{t("app.name")}</span>
            </div>
            <div className="ml-auto"><LangSwitcher /></div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
