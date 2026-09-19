import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, LogOut, Search } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const linkClass =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link to="/search" className="text-base font-extrabold tracking-tight text-primary">
              Lead Finder
            </Link>
            <nav className="flex items-center gap-1">
              <Link to="/search" className={linkClass} activeProps={{ className: "bg-accent text-accent-foreground" }}>
                <Search className="size-4" /> Search
              </Link>
              <Link to="/saved" className={linkClass} activeProps={{ className: "bg-accent text-accent-foreground" }}>
                <Bookmark className="size-4" /> Saved leads
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
