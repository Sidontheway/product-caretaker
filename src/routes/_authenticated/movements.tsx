import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import { fetchMovements, fetchProducts, type MovementType } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/movements")({
  head: () => ({
    meta: [
      { title: "Movements · Lexicon" },
      { name: "description", content: "Full history of stock in, stock out and returns." },
      { property: "og:title", content: "Movements · Lexicon" },
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
const dateFilters = ["week", "all", "today", "7days", "30days", "custom"] as const;

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function Movements() {
  const { user } = Route.useRouteContext();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [dateFilter, setDateFilter] = useState<(typeof dateFilters)[number]>("week");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const movements = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements(200) });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const today = new Date();
  const todayKey = formatDate(today);
  const weekStart = new Date(today);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const periodStart = new Date(today);
  periodStart.setDate(periodStart.getDate() - (dateFilter === "7days" ? 6 : 29));
  const rangeStart =
    dateFilter === "week" ? formatDate(weekStart)
      : dateFilter === "today" ? todayKey : dateFilter === "7days" || dateFilter === "30days"
      ? formatDate(periodStart)
      : dateFilter === "custom" ? fromDate : "";
  const rangeEnd =
    dateFilter === "week" ? formatDate(weekEnd)
      : dateFilter === "today" ? todayKey : dateFilter === "custom" ? toDate : "";

  const rows = (movements.data ?? []).filter((m) => {
    const matchesType = filter === "all" || m.type === filter;
    const movementDate = formatDate(new Date(m.created_at));
    const matchesDate =
      (!rangeStart || movementDate >= rangeStart) && (!rangeEnd || movementDate <= rangeEnd);
    return matchesType && matchesDate;
  });

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
          <div className="px-4 py-3 border-b border-ink/10 flex flex-col items-start gap-3">
            <span className="text-sm font-semibold font-display">History</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-ink/45">Type</span>
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[11px] rounded-full px-3 py-1.5 capitalize transition-colors ${
                      filter === f ? "bg-ink text-paper" : "bg-panel/60 text-ink/60 hover:bg-panel"
                    }`}
                  >
                    {f === "all" ? "All" : f === "in" ? "Stock In" : f === "out" ? "Stock Out" : "Returns"}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-ink/45">Date</span>
                {dateFilters.map((date) => (
                  <button
                    key={date}
                    onClick={() => setDateFilter(date)}
                    className={`text-[11px] rounded-full px-3 py-1.5 transition-colors ${
                      dateFilter === date
                        ? "bg-ink text-paper"
                        : "bg-panel/60 text-ink/60 hover:bg-panel"
                    }`}
                  >
                    {date === "week" ? "This week" : date === "all" ? "All time" : date === "today" ? "Today" : date === "7days" ? "Last 7 days" : date === "30days" ? "Last 30 days" : "Custom"}
                  </button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                    From
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(event) => setFromDate(event.target.value)}
                      className="h-8 rounded-lg border border-ink/10 bg-panel/60 px-2 text-[11px] text-ink"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                    To
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(event) => setToDate(event.target.value)}
                      className="h-8 rounded-lg border border-ink/10 bg-panel/60 px-2 text-[11px] text-ink"
                    />
                  </label>
                </div>
              )}
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
              <p className="px-4 py-8 text-[13px] text-ink/55">
                {(movements.data ?? []).length === 0
                  ? "Nothing logged here yet."
                  : "No movements match these filters."}
              </p>
            ) : (
              rows.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_110px_90px_150px] gap-3 px-4 py-2.5 items-center hover:bg-panel/60 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <ProductThumbnail
                      name={m.products?.name ?? "Product"}
                      imageUrl={m.products?.image_url ?? null}
                    />
                    <div className="min-w-0">
                    <div className="font-medium truncate">{m.products?.name ?? "Product"}</div>
                    <div className="text-[11px] text-ink/50 truncate">
                      {m.products?.sku}
                      {m.reference ? ` · ${m.reference}` : ""}
                    </div>
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
