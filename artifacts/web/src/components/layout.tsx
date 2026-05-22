import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useT, type Lang } from "@/lib/i18n";
import {
  Home,
  Building2,
  ClipboardList,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Languages,
  Sun,
  Moon,
  Menu,
  X,
  ChevronsLeft,
  HardHat,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const ALL_ROLES = ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"];

type NavItem = { titleKey: string; url: string; icon: any; roles: string[] };
type NavGroup = { labelKey: string; items: NavItem[] };

function getNavGroups(role: string | undefined): NavGroup[] {
  const groups: NavGroup[] = [
    {
      labelKey: "nav.group.overview",
      items: [
        { titleKey: "nav.dashboard", url: "/", icon: Home, roles: ALL_ROLES },
        { titleKey: "nav.projects", url: "/projects", icon: Building2, roles: ALL_ROLES },
      ],
    },
    {
      labelKey: "nav.group.delivery",
      items: [
        { titleKey: "nav.approvals", url: "/approvals", icon: ClipboardList, roles: ["owner", "pm", "qs", "finance"] },
      ],
    },
    {
      labelKey: "nav.group.library",
      items: [
        { titleKey: "nav.dsrRates", url: "/dsr-rates", icon: BookOpen, roles: ["owner", "pm", "qs", "admin"] },
      ],
    },
    {
      labelKey: "nav.group.admin",
      items: [
        { titleKey: "nav.organisations", url: "/organisations", icon: Users, roles: ["admin"] },
        { titleKey: "nav.profile", url: "/profile", icon: Settings, roles: ALL_ROLES },
      ],
    },
  ];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !role || i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}

// ─── Dark-mode hook (persisted) ──────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("mc.theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("mc.theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

// ─── Lang switcher (icon-only when collapsed) ────────────────────────────────
function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useT();
  const opts: Lang[] = ["en", "ta"];
  if (compact) {
    return (
      <button
        onClick={() => setLang(lang === "en" ? "ta" : "en")}
        className="h-9 w-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
        title={lang.toUpperCase()}
        data-testid="lang-switcher-compact"
      >
        <Languages className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs bg-muted rounded-full p-1" data-testid="lang-switcher">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => setLang(o)}
          className={`px-2.5 py-1 rounded-full font-bold transition ${lang === o ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          data-testid={`lang-${o}`}
        >
          {o.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ─── Logo ────────────────────────────────────────────────────────────────────
function Logo({ collapsed, t }: { collapsed: boolean; t: (k: string) => string }) {
  return (
    <Link href="/">
      <a className="flex items-center gap-2.5 group" data-testid="logo-home">
        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 flex-shrink-0">
          <HardHat className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-extrabold text-[15px] tracking-tight truncate">{t("app.name")}</span>
            <span className="text-[10px] text-muted-foreground font-semibold truncate">Construction ERP</span>
          </div>
        )}
      </a>
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
  groups,
  collapsed,
  onClose,
  t,
  mobile,
}: {
  groups: NavGroup[];
  collapsed: boolean;
  onClose?: () => void;
  t: (k: string) => string;
  mobile?: boolean;
}) {
  const [location] = useLocation();
  return (
    <aside
      className={`
        ${mobile ? "fixed inset-y-0 left-0 z-50 w-72" : "sticky top-0 h-screen"}
        ${collapsed && !mobile ? "w-[78px]" : "w-72"}
        flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200
      `}
      data-testid="sidebar"
    >
      {/* Header */}
      <div className={`flex items-center ${collapsed && !mobile ? "justify-center" : "justify-between"} px-4 py-5 border-b border-sidebar-border`}>
        <Logo collapsed={collapsed && !mobile} t={t} />
        {mobile && (
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-sidebar-accent flex items-center justify-center" data-testid="mobile-close">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.labelKey}>
            {(!collapsed || mobile) && (
              <div className="px-2 mb-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
                {t(group.labelKey)}
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                const inner = (
                  <a
                    onClick={onClose}
                    className={`
                      group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-all
                      ${collapsed && !mobile ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"}
                      ${isActive
                        ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    `}
                    title={collapsed && !mobile ? t(item.titleKey) : undefined}
                    data-testid={`nav-${item.titleKey}`}
                  >
                    <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                    {(!collapsed || mobile) && <span className="truncate">{t(item.titleKey)}</span>}
                    {isActive && (!collapsed || mobile) && <span className="ml-auto h-2 w-2 rounded-full bg-white/70" />}
                  </a>
                );
                return (
                  <li key={item.titleKey}>
                    <Link href={item.url}>{inner}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer card */}
      {(!collapsed || mobile) && (
        <div className="m-3 p-4 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
          <div className="flex items-center gap-2 text-xs font-bold mb-1">
            <ShieldCheck className="h-4 w-4" /> Pro Tip
          </div>
          <p className="text-[11px] leading-snug text-white/90">File DPRs daily to keep CPI and SPI accurate across your portfolio.</p>
        </div>
      )}
    </aside>
  );
}

// ─── Top header ──────────────────────────────────────────────────────────────
function TopHeader({
  onToggleSidebar,
  onOpenMobile,
  collapsed,
  profile,
  onLogout,
  t,
}: {
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  collapsed: boolean;
  profile: any;
  onLogout: () => void;
  t: (k: string) => string;
}) {
  const { dark, toggle } = useDarkMode();
  const initials = `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3">
        {/* Sidebar toggles */}
        <button
          onClick={onOpenMobile}
          className="md:hidden h-9 w-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center"
          data-testid="mobile-open"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex h-9 w-9 rounded-xl bg-muted hover:bg-muted/70 items-center justify-center text-muted-foreground hover:text-foreground transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-testid="sidebar-toggle"
        >
          <ChevronsLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search projects, DPRs, RA bills…"
            className="w-full h-10 rounded-full bg-muted/60 border border-transparent focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/15 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground transition"
            data-testid="header-search"
          />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <button
            onClick={toggle}
            className="h-9 w-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            title={dark ? "Light mode" : "Dark mode"}
            data-testid="theme-toggle"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            className="relative h-9 w-9 rounded-xl bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            data-testid="btn-notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border border-background" />
          </button>

          {/* Profile chip */}
          {profile && (
            <div className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-muted/60 hover:bg-muted transition" data-testid="user-chip">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-xs font-extrabold ring-2 ring-background">
                {initials}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-extrabold">{profile.firstName} {profile.lastName}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{profile.role}</span>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="h-9 w-9 rounded-xl bg-muted hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 flex items-center justify-center text-muted-foreground transition"
            title={t("nav.logout")}
            data-testid="btn-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile } = useGetMyProfile();
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = getNavGroups(profile?.role);
  const handleLogout = async () => { await logout(); setLocation("/login"); };

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-x-hidden">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[320px] w-[320px] rounded-full bg-fuchsia-200/20 blur-3xl" />
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar groups={groups} collapsed={collapsed} t={t} />
        </div>

        {/* Mobile sidebar + scrim */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <Sidebar groups={groups} collapsed={false} mobile onClose={() => setMobileOpen(false)} t={t} />
          </>
        )}

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <TopHeader
            onToggleSidebar={() => setCollapsed((c) => !c)}
            onOpenMobile={() => setMobileOpen(true)}
            collapsed={collapsed}
            profile={profile}
            onLogout={handleLogout}
            t={t}
          />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
