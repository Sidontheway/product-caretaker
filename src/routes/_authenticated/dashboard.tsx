import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import {
  fetchMovements,
  fetchProducts,
  isToday,
  stockStatus,
  type MovementType,
} from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Warehouse dashboard · Nimbus" },
      { name: "description", content: "Live stock levels, low-stock alerts and today's movements." },
      { property: "og:title", content: "Warehouse dashboard · Nimbus" },
      {
        property: "og:description",
        content: "Live stock levels, low-stock alerts and today's movements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const statusPill: Record<string, string> = {
  critical: "bg-rose/12 text-rose ring-rose/20",
  low: "bg-amber/12 text-amber ring-amber/20",
  healthy: "bg-mint/12 text-mint ring-mint/20",
};

const typeLabel: Record<MovementType, string> = {
  in: "Stock In",
  out: "Stock Out",
  return: "Return",
};

function Dashboard() {
  const { user } = Route.useRouteContext();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const movements = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements(30) });

  const list = products.data ?? [];
  const moves = movements.data ?? [];
  const lowStock = list.filter((p) => stockStatus(p) !== "healthy");
  const inToday = moves
    .filter((m) => isToday(m.created_at) && m.type !== "out")
    .reduce((s, m) => s + m.quantity, 0);
  const outToday = moves
    .filter((m) => isToday(m.created_at) && m.type === "out")
    .reduce((s, m) => s + m.quantity, 0);

  const sorted = [...list].sort((a, b) => a.quantity / (a.reorder_point || 1) - b.quantity / (b.reorder_point || 1));

  return (
    <AppShell
      title="Warehouse dashboard"
      badge={products.isFetching ? "Syncing…" : "Up to date"}
      email={user.email ?? null}
      actions={
        <>
          <MovementDialog
            type="in"
            products={list}
            trigger={
              <button className="text-sm rounded-lg px-3 py-1.5 bg-ink text-paper ring-1 ring-ink">
                Stock In
              </button>
            }
          />
          <MovementDialog
            type="out"
            products={list}
            trigger={
              <button className="text-sm rounded-lg px-3 py-1.5 bg-panel/70 ring-1 ring-ink/5 hover:bg-panel transition-colors">
                Stock Out
              </button>
            }
          />
          <MovementDialog
            type="return"
            products={list}
            trigger={
              <button className="text-sm rounded-lg px-3 py-1.5 bg-panel/70 ring-1 ring-ink/5 hover:bg-panel transition-colors">
                Return
              </button>
            }
          />
        </>
      }
    >
      <section className="px-6 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Total SKUs" value={list.length} />
          <Kpi label="Low stock" value={lowStock.length} tone="text-rose" />
          <Kpi label="In today" value={inToday} tone="text-mint" />
          <Kpi label="Out today" value={outToday} tone="text-amber" />
        </div>
      </section>

      {lowStock.length > 0 ? (
        <div className="px-6 pb-5">
          <div className="rounded-xl bg-rose/8 ring-1 ring-rose/20 px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="size-2 rounded-full bg-rose shrink-0" />
            <p className="text-sm text-pretty text-ink/80 max-w-[70ch]">
              <span className="font-medium">
                {lowStock.length} {lowStock.length === 1 ? "SKU is" : "SKUs are"} below reorder
                point.
              </span>{" "}
              {lowStock
                .slice(0, 3)
                .map((p) => p.name)
                .join(", ")}
            </p>
            <Link
              to="/catalogue"
              className="ml-auto text-sm rounded-lg px-3 py-1.5 bg-rose text-paper ring-1 ring-rose shrink-0"
            >
              Review stock
            </Link>
          </div>
        </div>
      ) : null}

      <section className="grid lg:grid-cols-3 gap-5 px-6 pb-6">
        <div className="lg:col-span-2 rounded-xl glass ring-1 ring-ink/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
            <span className="text-sm font-semibold font-display">Stock levels</span>
            <span className="text-[11px] text-ink/50">Sorted by reorder urgency</span>
          </div>
          <div className="grid grid-cols-[1fr_88px_100px] gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-ink/50 border-b border-ink/10">
            <span>Product</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Status</span>
          </div>
          <div className="flex-1 divide-y divide-ink/5 text-sm">
            {sorted.length === 0 ? (
              <EmptyState />
            ) : (
              sorted.slice(0, 10).map((p) => {
                const status = stockStatus(p);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_88px_100px] gap-3 px-4 py-2.5 items-center hover:bg-panel/60 transition-colors"
                  >
                    <span className="font-medium text-pretty truncate">{p.name}</span>
                    <span className="text-right tabular-nums font-medium">{p.quantity}</span>
                    <span className="text-right">
                      <span
                        className={`text-[11px] rounded-full px-2 py-0.5 ring-1 capitalize ${statusPill[status]}`}
                      >
                        {status}
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl glass ring-1 ring-ink/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
            <span className="text-sm font-semibold font-display">Movement history</span>
            <Link to="/movements" className="text-[11px] text-sky">
              View all
            </Link>
          </div>
          <div className="flex-1 divide-y divide-ink/5 text-sm">
            {moves.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-ink/50">No movements logged yet.</p>
            ) : (
              moves.slice(0, 6).map((m) => (
                <div key={m.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{m.products?.name ?? "Product"}</span>
                    <span className="text-[11px] text-ink/45 tabular-nums shrink-0">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-ink/55 truncate">
                      {typeLabel[m.type]}
                      {m.reference ? ` · ${m.reference}` : ""}
                    </span>
                    <span
                      className={`text-[11px] tabular-nums shrink-0 ${
                        m.type === "out" ? "text-amber" : m.type === "return" ? "text-sky" : "text-mint"
                      }`}
                    >
                      {m.type === "out" ? "−" : "+"}
                      {m.quantity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl glass ring-1 ring-ink/5 px-4 py-3.5">
      <div className="text-[11px] uppercase tracking-[0.12em] text-ink/50">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums font-display ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-[13px] text-ink/60">No products yet.</p>
      <Link to="/catalogue" className="mt-2 inline-block text-[13px] text-sky hover:underline">
        Add your first product →
      </Link>
    </div>
  );
}
