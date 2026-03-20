"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Bot,
  Activity,
  Search,
  User,
  CreditCard,
  Sparkles,
  ChevronRight,
  Command,
  X,
  LogIn,
  UserPlus,
  LogOut,
  CalendarDays,
  Settings2,
  Home,
  ClipboardCheck,
  Shield,
  HeartPulse,
  Boxes,
  ListTodo,
  Orbit,
  TerminalSquare,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "Workspace", icon: Briefcase },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/agents", label: "Agents", icon: Boxes },
  { href: "/agent-console", label: "Agent Console", icon: TerminalSquare },
  { href: "/agent-analytics", label: "Agent Analytics", icon: BarChart3 },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/autopilot", label: "Autopilot", icon: Orbit },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/signals", label: "Signals", icon: Activity },
  { href: "/opportunities", label: "Opportunities", icon: Search },
  { href: "/account", label: "Account", icon: User },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/onboarding", label: "Onboarding", icon: Settings2 },
  { href: "/prelaunch", label: "Prelaunch", icon: ClipboardCheck },
  { href: "/health", label: "Health", icon: HeartPulse },
  { href: "/dev-admin", label: "Dev Admin", icon: Shield },
];

type CommandAction = {
  id: string;
  label: string;
  hint: string;
  group: "Navigation" | "Quick Actions" | "Auth";
  run: () => void;
};

export default function PlatformShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modPressed = isMac ? e.metaKey : e.ctrlKey;

      if (modPressed && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }

      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) {
      setCommandQuery("");
    }
  }, [commandOpen]);

  const commandActions = useMemo<CommandAction[]>(() => {
    const actions: CommandAction[] = [
      { id: "nav-home", label: "Go to Home", hint: "/", group: "Navigation", run: () => router.push("/") },
      { id: "nav-dashboard", label: "Go to Dashboard", hint: "/dashboard", group: "Navigation", run: () => router.push("/dashboard") },
      { id: "nav-workspace", label: "Go to Workspace", hint: "/workspace", group: "Navigation", run: () => router.push("/workspace") },
      { id: "nav-assistant", label: "Go to AI Assistant", hint: "/assistant", group: "Navigation", run: () => router.push("/assistant") },
      { id: "nav-agents", label: "Go to Agents", hint: "/agents", group: "Navigation", run: () => router.push("/agents") },
      { id: "nav-agent-console", label: "Go to Agent Console", hint: "/agent-console", group: "Navigation", run: () => router.push("/agent-console") },
      { id: "nav-agent-analytics", label: "Go to Agent Analytics", hint: "/agent-analytics", group: "Navigation", run: () => router.push("/agent-analytics") },
      { id: "nav-tasks", label: "Go to Tasks", hint: "/tasks", group: "Navigation", run: () => router.push("/tasks") },
      { id: "nav-autopilot", label: "Go to Autopilot", hint: "/autopilot", group: "Navigation", run: () => router.push("/autopilot") },
      { id: "nav-calendar", label: "Go to Calendar", hint: "/calendar", group: "Navigation", run: () => router.push("/calendar") },
      { id: "nav-signals", label: "Go to Signals", hint: "/signals", group: "Navigation", run: () => router.push("/signals") },
      { id: "nav-opportunities", label: "Go to Opportunities", hint: "/opportunities", group: "Navigation", run: () => router.push("/opportunities") },
      { id: "nav-account", label: "Go to Account", hint: "/account", group: "Navigation", run: () => router.push("/account") },
      { id: "nav-billing", label: "Go to Billing", hint: "/billing", group: "Navigation", run: () => router.push("/billing") },
      { id: "nav-onboarding", label: "Go to Onboarding", hint: "/onboarding", group: "Navigation", run: () => router.push("/onboarding") },
      { id: "nav-prelaunch", label: "Go to Prelaunch", hint: "/prelaunch", group: "Navigation", run: () => router.push("/prelaunch") },
      { id: "nav-health", label: "Go to Health", hint: "/health", group: "Navigation", run: () => router.push("/health") },
      { id: "nav-dev-admin", label: "Go to Dev Admin", hint: "/dev-admin", group: "Navigation", run: () => router.push("/dev-admin") },

      {
        id: "qa-open-agent-console",
        label: "Open agent console",
        hint: "Agent Console",
        group: "Quick Actions",
        run: () => router.push("/agent-console"),
      },
      {
        id: "qa-open-agent-analytics",
        label: "Open agent analytics",
        hint: "Agent Analytics",
        group: "Quick Actions",
        run: () => router.push("/agent-analytics"),
      },
      {
        id: "qa-open-autopilot",
        label: "Open autonomous agent loop",
        hint: "Autopilot",
        group: "Quick Actions",
        run: () => router.push("/autopilot"),
      },
      {
        id: "qa-open-health",
        label: "Run app health audit",
        hint: "Health",
        group: "Quick Actions",
        run: () => router.push("/health"),
      },
    ];

    if (session?.user) {
      actions.push({
        id: "auth-logout",
        label: "Log out",
        hint: "End current session",
        group: "Auth",
        run: () => {
          void signOut({ callbackUrl: "/login" });
        },
      });
    } else {
      actions.push(
        {
          id: "auth-login",
          label: "Go to Login",
          hint: "/login",
          group: "Auth",
          run: () => router.push("/login"),
        },
        {
          id: "auth-signup",
          label: "Go to Sign Up",
          hint: "/signup",
          group: "Auth",
          run: () => router.push("/signup"),
        }
      );
    }

    return actions;
  }, [router, session]);

  const filteredActions = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return commandActions;

    return commandActions.filter((action) => {
      return (
        action.label.toLowerCase().includes(q) ||
        action.hint.toLowerCase().includes(q) ||
        action.group.toLowerCase().includes(q)
      );
    });
  }, [commandActions, commandQuery]);

  const groupedActions = useMemo(() => {
    return {
      Navigation: filteredActions.filter((a) => a.group === "Navigation"),
      "Quick Actions": filteredActions.filter((a) => a.group === "Quick Actions"),
      Auth: filteredActions.filter((a) => a.group === "Auth"),
    };
  }, [filteredActions]);

  function runCommand(action: CommandAction) {
    action.run();
    setCommandOpen(false);
  }

  const isLoggedIn = !!session?.user;

  return (
    <main className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-400/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-sky-200/85">
                <Sparkles className="h-3.5 w-3.5" />
                Strategic Intelligence Platform
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
                    Orvanthis
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Executive-grade intelligence, opportunity discovery, and AI-powered analysis.
                  </p>
                </div>

                <div className="rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-200">
                  Pro
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Navigation
                </p>

                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-[#0c0e12] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400 transition hover:border-white/15 hover:text-white"
                >
                  <Command className="h-3.5 w-3.5" />
                  K
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "border-sky-500/25 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.08)]"
                          : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isActive
                              ? "bg-sky-400/10 text-sky-300"
                              : "bg-white/[0.03] text-zinc-500 group-hover:text-zinc-300"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>

                      {isActive ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-zinc-600 transition group-hover:text-zinc-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Authentication
              </p>

              <div className="space-y-2">
                {!isLoggedIn ? (
                  <>
                    <Link
                      href="/login"
                      className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        pathname === "/login"
                          ? "border-sky-500/25 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white"
                          : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/[0.03] p-2 text-zinc-500 group-hover:text-zinc-300">
                          <LogIn className="h-4 w-4" />
                        </div>
                        <span>Login</span>
                      </div>
                    </Link>

                    <Link
                      href="/signup"
                      className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        pathname === "/signup"
                          ? "border-sky-500/25 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white"
                          : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/[0.03] p-2 text-zinc-500 group-hover:text-zinc-300">
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <span>Sign Up</span>
                      </div>
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                    className="group flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/[0.03] p-2 text-zinc-500 group-hover:text-zinc-300">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span>Log Out</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Platform Status
              </p>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Dashboard</span>
                  <span className="text-emerald-300">Active</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Signals</span>
                  <span className="text-emerald-300">Live</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Assistant</span>
                  <span className="text-amber-300">Expanding</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Calendar</span>
                  <span className="text-sky-300">Ready</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#111318] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Account
              </p>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-[#0c0e12] p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/[0.08] text-sm font-semibold text-sky-200">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "O"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {status === "loading"
                      ? "Loading..."
                      : session?.user?.name || session?.user?.email || "Guest User"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {session?.user ? "Authenticated Session" : "Not Logged In"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <header className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_48px_rgba(0,0,0,0.32)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {title}
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">
                    {subtitle}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setCommandOpen(true)}
                    className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-400 transition hover:border-white/15 hover:text-white"
                  >
                    <Command className="h-4 w-4" />
                    <span>Search pages and actions</span>
                    <span className="rounded-lg border border-white/8 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                      Ctrl K
                    </span>
                  </button>

                  <Link
                    href="/billing"
                    className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </header>

            {children}
          </section>
        </div>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-16 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#111318] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
              <Command className="h-5 w-5 text-zinc-500" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search pages, actions, and commands..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setCommandOpen(false)}
                className="rounded-lg border border-white/8 p-2 text-zinc-400 transition hover:border-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-4">
              {filteredActions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/8 bg-[#0c0e12] p-6 text-sm text-zinc-500">
                  No commands matched your search.
                </div>
              ) : (
                <div className="space-y-5">
                  {(["Navigation", "Quick Actions", "Auth"] as const).map((group) => {
                    const items = groupedActions[group];
                    if (items.length === 0) return null;

                    return (
                      <div key={group}>
                        <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          {group}
                        </p>
                        <div className="space-y-2">
                          {items.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => runCommand(action)}
                              className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-left transition hover:border-sky-500/20 hover:bg-[#131821]"
                            >
                              <div>
                                <p className="text-sm font-medium text-zinc-100">
                                  {action.label}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {action.hint}
                                </p>
                              </div>

                              <ChevronRight className="h-4 w-4 text-zinc-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}