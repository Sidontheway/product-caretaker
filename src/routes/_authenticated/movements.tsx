import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import { fetchMovements, fetchProducts, type MovementType } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/movements")({
  head: () => ({
    meta: [
      { title: "Movements · Nimbus" },
      { name: "description", content: "Full history of stock in, stock out and returns." },
      { property: "og:title", content: "Movements · Nimbus" },
      { property: "og:description", content: "Full history of stock in, stock out and returns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Movements,
});

const typeLabel: Record<MovementType, string> = {
  in: "Stock In",
  out: "Stock Out",
  return: "Return",
};

const filters = ["all", "in", "out", "return"] as const;

function Movements() {
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const movements = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements(200) });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const rows = (movements.data ?? []).filter((m) => filter === "all" || m.type === filter);

  return (
    <AppShell
      title="Movements"
      email={user.email ?? null}
      actions={
        <MovementDialog
          type="in"
          products={products.data ?? []}
          trigger={
            <button className="text-sm rounded-lg px-3 py-1.5 bg-ink text-paper ring-1 ring-ink">
              Log movement
            </button>
          }
        />
      }
    >
      <div className="p-6">
        <div className="rounded-xl glass ring-1 ring-ink/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold font-display">History</span>
            <div className="flex gap-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] rounded-full px-2.5 py-1 capitalize transition-colors ${
                    filter === f ? "bg-ink text-paper" : "bg-panel/60 text-ink/60 hover:bg-panel"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_110px_90px_150px] gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-ink/50 border-b border-ink/10">
            <span>Product</span>
            <span>Type</span>
            <span className="text-right">Qty</span>
            <span className="text-right">When</span>
          </div>
          <div className="divide-y divide-ink/5 text-sm">
            {rows.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-ink/55">Nothing logged here yet.</p>
            ) : (
              rows.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_110px_90px_150px] gap-3 px-4 py-2.5 items-center hover:bg-panel/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.products?.name ?? "Product"}</div>
                    <div className="text-[11px] text-ink/50 truncate">
                      {m.products?.sku}
                      {m.reference ? ` · ${m.reference}` : ""}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink/60">{typeLabel[m.type]}</span>
                  <span
                    className={`text-right tabular-nums ${
                      m.type === "out" ? "text-amber" : m.type === "return" ? "text-sky" : "text-mint"
                    }`}
                  >
                    {m.type === "out" ? "−" : "+"}
                    {m.quantity}
                  </span>
                  <span className="text-right text-[11px] text-ink/45 tabular-nums">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
