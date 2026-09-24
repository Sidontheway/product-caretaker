import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
          <div className="size-8 rounded-lg bg-ink grid place-items-center">
            <span className="text-paper font-semibold text-[13px] font-display">N</span>
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold font-display">Nimbus</div>
            <div className="text-[11px] text-ink/55">Stock Control</div>
          </div>
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

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 border-b border-ink/10 glass flex items-center justify-between px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
