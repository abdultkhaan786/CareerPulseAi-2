import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Gauge,
  LogOut,
  Menu as MenuIcon,
  Moon,
  PlusCircle,
  Search,
  ShieldCheck,
  Sun,
  Target,
  UserRound,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cx, initials } from "@/lib/format";
import { Logo } from "./Logo";
import { Menu } from "../ui/Menu";
import { IconButton } from "../ui/Button";

const NAV = [
  { to: "/app", label: "Dashboard", icon: Gauge, end: true },
  { to: "/app/jobs", label: "Jobs", icon: Briefcase },
  { to: "/app/market", label: "Market insights", icon: BarChart3 },
  { to: "/app/skill-gap", label: "Skill gap", icon: Target },
  { to: "/app/profile", label: "Profile", icon: UserRound }
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Logo to="/app" light />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition",
                isActive ? "bg-white/[0.08] text-white" : "text-night-ink hover:bg-white/[0.04] hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cx("h-[18px] w-[18px]", isActive ? "text-signal-bright" : "text-night-ink/70 group-hover:text-night-ink")} aria-hidden />
                {label}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-signal-bright" aria-hidden />}
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to="/app/jobs/new"
          onClick={onNavigate}
          className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-[15px] font-medium text-night-ink transition hover:border-signal-bright/60 hover:text-white"
        >
          <PlusCircle className="h-[18px] w-[18px]" aria-hidden />
          Post a job
        </NavLink>
      </nav>
      {user && (
        <div className="m-3 rounded-xl bg-white/[0.04] p-3">
          <p className="text-xs text-night-ink">Profile skills</p>
          <p className="num mt-0.5 font-display text-2xl font-bold text-white">{user.skills.length}</p>
          <p className="mt-1 text-xs text-night-ink">
            {user.skills.length ? "Used to score every listing." : "Add skills to see your match scores."}
          </p>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => setDrawer(false), [location.pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/app/jobs?title=${encodeURIComponent(q.trim())}` : "/app/jobs");
    setQ("");
  };

  return (
    <div className="min-h-screen lg:pl-[264px]">
      <a href="#main" className="sr-only z-[80] rounded-lg bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] bg-night lg:block">
        <SideNav />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fadeIn bg-night/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] animate-slideIn bg-night shadow-lift">
            <IconButton label="Close menu" onClick={() => setDrawer(false)} className="absolute right-3 top-4 text-night-ink hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </IconButton>
            <SideNav onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <IconButton label="Open menu" onClick={() => setDrawer(true)} className="-ml-1 lg:hidden">
            <MenuIcon className="h-5 w-5" />
          </IconButton>
          <form onSubmit={search} role="search" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search job titles…"
              aria-label="Search job titles"
              className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-signal focus:ring-4 focus:ring-signal/15"
            />
          </form>
          <div className="ml-auto flex items-center gap-1.5">
            <IconButton label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggle}>
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </IconButton>
            {user && (
              <Menu
                label="Account menu"
                header={
                  <>
                    <p className="font-medium">{user.name}</p>
                    <p className="truncate text-sm text-muted">{user.email}</p>
                    {user.isAdmin && (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-iris-soft px-2 py-0.5 text-xs font-medium text-iris">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </p>
                    )}
                  </>
                }
                trigger={
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal-bright font-display text-sm font-bold text-night ring-2 ring-transparent transition hover:ring-signal/30">
                    {initials(user.name)}
                  </span>
                }
                items={[
                  { label: "Profile & skills", icon: <UserRound className="h-4 w-4" />, onSelect: () => navigate("/app/profile") },
                  { label: "Post a job", icon: <PlusCircle className="h-4 w-4" />, onSelect: () => navigate("/app/jobs/new") },
                  {
                    label: "Sign out",
                    icon: <LogOut className="h-4 w-4" />,
                    danger: true,
                    onSelect: () => {
                      logout();
                      navigate("/login");
                    }
                  }
                ]}
              />
            )}
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight sm:text-[34px]">{title}</h1>
        {description && <div className="mt-1.5 max-w-2xl text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
