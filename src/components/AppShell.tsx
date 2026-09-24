import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/BrandMark";

const nav = [
  { to: "/dashboard", label: "Dashboard", dot: "bg-sky" },
  { to: "/catalogue", label: "Catalogue", dot: "bg-mint" },
  { to: "/movements", label: "Movements", dot: "bg-amber" },
  { to: "/returns", label: "Returns", dot: "bg-rose" },
] as const;

export function AppShell({
  title,
  badge,
  actions,
  email,
  children,
}: {
  title: string;
  badge?: string;
  actions?: ReactNode;
  email?: string | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen w-full bg-paper text-ink flex antialiased">
      <aside className="w-[224px] shrink-0 border-r border-ink/10 glass hidden md:flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <BrandLockup compact />
        </div>
        <nav className="px-3 py-2 flex-1 space-y-0.5 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-ink/65 hover:bg-panel/50 transition-colors"
              activeProps={{
                className:
                  "flex items-center gap-2.5 rounded-lg bg-panel/70 ring-1 ring-ink/5 px-3 py-2 font-medium text-ink",
              }}
            >
              <span className={`size-4 rounded-sm shrink-0 ${item.dot}`} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-ink/10 text-[11px] text-ink/50">
          <div className="truncate">Signed in · {email ?? "—"}</div>
          <button onClick={signOut} className="mt-2 text-sky hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/25 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(84vw,280px)] flex-col border-r border-ink/10 bg-paper shadow-xl transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <BrandLockup compact />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="grid size-9 place-items-center rounded-lg text-ink/60 hover:bg-panel/70 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-3 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-ink/65 hover:bg-panel/50 transition-colors"
              activeProps={{
                className:
                  "flex items-center gap-2.5 rounded-lg bg-panel/70 ring-1 ring-ink/5 px-3 py-2 font-medium text-ink",
              }}
            >
              <span className={`size-4 rounded-sm shrink-0 ${item.dot}`} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-ink/10 px-5 py-4 text-[11px] text-ink/50">
          <div className="truncate">Signed in · {email ?? "—"}</div>
          <button onClick={signOut} className="mt-2 text-sky hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-ink/10 glass flex items-center justify-between px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setSidebarOpen((isOpen) => !isOpen)}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-ink/70 hover:bg-panel/70 hover:text-ink md:hidden"
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <h1 className="text-[15px] font-semibold font-display truncate">{title}</h1>
            {badge ? (
              <span className="hidden sm:inline text-[11px] rounded-full px-2 py-0.5 bg-mint/12 text-mint ring-1 ring-mint/20">
                {badge}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
