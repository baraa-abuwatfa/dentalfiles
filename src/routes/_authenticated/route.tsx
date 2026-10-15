import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Settings, Users, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.pathname } });
    return { user: data.user };
  },
  component: AppShell,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="flex h-full flex-col bg-sidebar p-5 text-sidebar-foreground">
      <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2" onClick={onNav}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary font-display font-bold text-sidebar-primary-foreground">D</span>
        <span className="font-display text-lg font-semibold text-sidebar-accent-foreground">DentalFile <span className="text-sidebar-primary">AI</span></span>
      </Link>
      <nav className="grid gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} onClick={onNav}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <p className="truncate px-3 text-xs">{user.email}</p>
        <button onClick={signOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-4 w-4" />Log out
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block"><SidebarContent /></aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="w-64 border-0 p-0"><SidebarContent onNav={() => setOpen(false)} /></SheetContent>
          </Sheet>
          <span className="font-display font-semibold">DentalFile AI</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-10"><Outlet /></main>
      </div>
    </div>
  );
}
