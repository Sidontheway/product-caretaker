import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import {
  ProductPerformanceCard,
  type ProductPerformance,
} from "@/components/ProductPerformanceCard";
import { ProductThumbnail } from "@/components/ProductThumbnail";
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
      { title: "Warehouse dashboard · Lexicon" },
      {
        name: "description",
        content: "Live stock levels, low-stock alerts and today's movements.",
      },
      { property: "og:title", content: "Warehouse dashboard · Lexicon" },
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
  const movements = useQuery({
    queryKey: ["movements", 1000],
    queryFn: () => fetchMovements(1000),
  });

  const list = products.data ?? [];
  const moves = movements.data ?? [];
  const lowStock = list.filter((p) => stockStatus(p) !== "healthy");
  const inToday = moves
    .filter((m) => isToday(m.created_at) && m.type !== "out")
    .reduce((s, m) => s + m.quantity, 0);
  const outToday = moves
    .filter((m) => isToday(m.created_at) && m.type === "out")
    .reduce((s, m) => s + m.quantity, 0);

  const sorted = [...list].sort(
    (a, b) => a.quantity / (a.reorder_point || 1) - b.quantity / (b.reorder_point || 1),
  );

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const thisWeekMoves = moves.filter((movement) => new Date(movement.created_at) >= weekStart);
  const performanceByProduct = new Map<string, ProductPerformance>();
  for (const movement of thisWeekMoves) {
    const product = performanceByProduct.get(movement.product_id) ?? {
      id: movement.product_id,
      name: movement.products?.name ?? "Product",
      sku: movement.products?.sku,
      imageUrl: movement.products?.image_url ?? null,
      stockIn: 0,
      stockOut: 0,
      activity: 0,
    };
    if (movement.type === "in") product.stockIn += movement.quantity;
    if (movement.type === "out") product.stockOut += movement.quantity;
    product.activity += 1;
    performanceByProduct.set(movement.product_id, product);
  }

  const performance = [...performanceByProduct.values()];
  const topStockIn = performance
    .filter((product) => product.stockIn > 0)
    .sort((a, b) => b.stockIn - a.stockIn)
    .slice(0, 3);
  const topStockOut = performance
    .filter((product) => product.stockOut > 0)
    .sort((a, b) => b.stockOut - a.stockOut)
    .slice(0, 3);
  const mostActive = [...performance].sort((a, b) => b.activity - a.activity).slice(0, 3);

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
          <Kpi label="Stock types" value={list.length} />
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
                {lowStock.length} {lowStock.length === 1 ? "stock type is" : "stock types are"}{" "}
                below reorder point.
              </span>{" "}
              {lowStock.map((p) => p.name).join(", ")}
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

      <section aria-label="Product performance" className="space-y-3 px-6 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold font-display">Product performance</h2>
            <p className="mt-0.5 text-xs text-ink/50">Top products by units moved this week.</p>
          </div>
          <span className="text-[11px] text-ink/45">Based on the latest 1,000 movements</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <ProductPerformanceCard
            title="Most stocked in"
            metricLabel="units in"
            products={topStockIn}
            metric={(product) => product.stockIn}
            emptyLabel="No stock-in movements this week."
            tone="text-mint"
          />
          <ProductPerformanceCard
            title="Most moved out"
            metricLabel="units out"
            products={topStockOut}
            metric={(product) => product.stockOut}
            emptyLabel="No stock-out movements this week."
            tone="text-amber"
          />
          <ProductPerformanceCard
            title="Most active"
            metricLabel="movements"
            products={mostActive}
            metric={(product) => product.activity}
            emptyLabel="No movements this week."
            tone="text-sky"
          />
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-5 px-6 pb-6">
        <div className="lg:col-span-2 rounded-xl glass ring-1 ring-ink/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
            <span className="text-sm font-semibold font-display">Stock levels</span>
            <span className="text-[11px] text-ink/50">Sorted by reorder urgency</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="inventory-table min-w-[420px]">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="w-24 text-right">
                    Quantity
                  </th>
                  <th scope="col" className="w-28 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  sorted.slice(0, 10).map((p) => {
                    const status = stockStatus(p);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductThumbnail name={p.name} imageUrl={p.image_url} size="size-8" />
                            <span className="truncate font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="text-right font-medium tabular-nums">{p.quantity}</td>
                        <td className="text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${statusPill[status]}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl glass ring-1 ring-ink/5 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
            <span className="text-sm font-semibold font-display">Movement history</span>
            <Link to="/movements" className="text-[11px] text-sky">
              View all
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="inventory-table min-w-[440px]">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="w-24">
                    Type
                  </th>
                  <th scope="col" className="w-20 text-right">
                    Quantity
                  </th>
                  <th scope="col" className="w-24 text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {moves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[13px] text-ink/50">
                      No movements logged yet.
                    </td>
                  </tr>
                ) : (
                  moves.slice(0, 6).map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-2">
                          <ProductThumbnail
                            name={m.products?.name ?? "Product"}
                            imageUrl={m.products?.image_url ?? null}
                            size="size-8"
                          />
                          <span className="truncate font-medium">
                            {m.products?.name ?? "Product"}
                          </span>
                        </div>
                      </td>
                      <td className="text-[11px] text-ink/55">{typeLabel[m.type]}</td>
                      <td
                        className={`text-right text-[11px] font-medium tabular-nums ${
                          m.type === "out"
                            ? "text-amber"
                            : m.type === "return"
                              ? "text-sky"
                              : "text-mint"
                        }`}
                      >
                        {m.type === "out" ? "−" : "+"}
                        {m.quantity}
                      </td>
                      <td className="text-right text-[11px] tabular-nums text-ink/45">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
      <div className={`text-2xl font-semibold tabular-nums font-display ${tone ?? ""}`}>
        {value}
      </div>
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
