import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useT, type Lang } from "@/lib/i18n";
import {
  Languages,
  Home,
  Building2,
  ClipboardList,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
} from "lucide-react";

const ALL_ROLES = ["owner", "pm", "site_engineer", "qs", "finance", "contractor", "qc", "store", "hr", "admin"];

type NavItem = { titleKey: string; url: string; icon: any; roles: string[] };

function getNavItems(role: string | undefined): NavItem[] {
  const items: NavItem[] = [
    { titleKey: "nav.dashboard", url: "/", icon: Home, roles: ALL_ROLES },
    { titleKey: "nav.projects", url: "/projects", icon: Building2, roles: ALL_ROLES },
    { titleKey: "nav.approvals", url: "/approvals", icon: ClipboardList, roles: ["owner", "pm", "qs", "finance"] },
    { titleKey: "nav.dsrRates", url: "/dsr-rates", icon: BookOpen, roles: ["owner", "pm", "qs", "admin"] },
    { titleKey: "nav.organisations", url: "/organisations", icon: Users, roles: ["admin"] },
    { titleKey: "nav.profile", url: "/profile", icon: Settings, roles: ALL_ROLES },
  ];
  return items.filter(i => !role || i.roles.includes(role));
}

function LangSwitcher() {
  const { lang, setLang } = useT();
  const opts: Lang[] = ["en", "ta"];
  return (
    <div className="flex items-center gap-1 text-xs bg-white border border-border rounded-full px-1.5 py-1" data-testid="lang-switcher">
      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
      {opts.map(o => (
        <button
          key={o}
          onClick={() => setLang(o)}
          className={`px-2 py-0.5 rounded-full font-semibold transition ${lang === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          data-testid={`lang-${o}`}
        >
          {o.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Logo({ t }: { t: (k: string) => string }) {
  return (
    <Link href="/">
      <a className="flex items-center gap-2 bg-white border border-border rounded-full pl-2 pr-4 py-1.5 hover:shadow-sm transition" data-testid="logo-home">
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 18 L10 6" /><path d="M10 18 L16 6" /><path d="M16 18 L20 10" />
          </svg>
        </span>
        <span className="font-extrabold text-sm tracking-tight">{t("app.name")}</span>
      </a>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: profile } = useGetMyProfile();
  const { t } = useT();

  const navItems = getNavItems(profile?.role);
  const initials = `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen w-full bg-[hsl(240_30%_94%)] p-3 md:p-5">
      <div className="mx-auto max-w-[1440px] bg-white rounded-[28px] border border-border shadow-[0_8px_40px_-12px_rgba(76,29,149,0.15)] overflow-hidden">
        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-3 px-4 md:px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Logo t={t} />
          </div>

          {/* Pill nav */}
          <nav className="hidden md:flex items-center gap-1 bg-[hsl(240_25%_96%)] rounded-full p-1.5 border border-border/60" data-testid="top-nav">
            {navItems.map((item) => {
              const isActive = location === item.url;
              return (
                <Link key={item.titleKey} href={item.url}>
                  <a
                    className={`group inline-flex items-center gap-2 rounded-full text-sm font-semibold transition ${
                      isActive
                        ? "bg-primary text-primary-foreground px-4 py-2 shadow-sm"
                        : "text-muted-foreground hover:text-foreground h-9 w-9 justify-center"
                    }`}
                    title={t(item.titleKey)}
                    data-testid={`nav-${item.titleKey}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {isActive && <span>{t(item.titleKey)}</span>}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button className="h-9 w-9 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition" data-testid="btn-search">
              <Search className="h-4 w-4" />
            </button>
            <button className="h-9 w-9 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition" data-testid="btn-notifications">
              <Bell className="h-4 w-4" />
            </button>
            {profile && (
              <div className="hidden md:flex items-center gap-2 bg-white border border-border rounded-full pl-1 pr-3 py-1" data-testid="user-chip">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold">{profile.firstName} {profile.lastName}</span>
                  <span className="text-[10px] text-muted-foreground">{profile.email}</span>
                </div>
              </div>
            )}
            <button
              onClick={async () => { await logout(); setLocation("/login"); }}
              className="h-9 w-9 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-rose-600 transition"
              title={t("nav.logout")}
              data-testid="btn-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav row */}
        <div className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-border/60 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link key={item.titleKey} href={item.url}>
                <a className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{t(item.titleKey)}</span>
                </a>
              </Link>
            );
          })}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <main className="p-4 md:p-6 lg:p-8 bg-[hsl(240_30%_98%)]">
          {children}
        </main>
      </div>
    </div>
  );
}
