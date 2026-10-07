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
    dateFilter === "week"
      ? formatDate(weekStart)
      : dateFilter === "today"
        ? todayKey
        : dateFilter === "7days" || dateFilter === "30days"
          ? formatDate(periodStart)
          : dateFilter === "custom"
            ? fromDate
            : "";
  const rangeEnd =
    dateFilter === "week"
      ? formatDate(weekEnd)
      : dateFilter === "today"
        ? todayKey
        : dateFilter === "custom"
          ? toDate
          : "";

  const rows = (movements.data ?? []).filter((m) => {
    const movementDate = formatDate(new Date(m.created_at));
    const matchesDate =
      (!rangeStart || movementDate >= rangeStart) && (!rangeEnd || movementDate <= rangeEnd);
    const matchesType = filter === "all" || m.type === filter;
    return matchesDate && matchesType;
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
      <div className="space-y-4 p-6">
        <section
          aria-label="Movement filters"
          className="rounded-xl glass ring-1 ring-ink/5 p-4 sm:p-5"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold font-display">History filters</h2>
              <p className="mt-0.5 text-xs text-ink/50">Choose a movement type and date range.</p>
            </div>
            <span className="text-xs tabular-nums text-ink/50">
              Showing {rows.length} of {(movements.data ?? []).length} movements
            </span>
          </div>
          <div className="space-y-4">
            <fieldset className="min-w-0">
              <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink/50">
                Movement type
              </legend>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      filter === f ? "bg-ink text-paper" : "bg-panel/60 text-ink/60 hover:bg-panel"
                    }`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "in"
                        ? "Stock In"
                        : f === "out"
                          ? "Stock Out"
                          : "Returns"}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="min-w-0">
              <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink/50">
                Date range
              </legend>
              <div className="flex flex-wrap gap-2">
                {dateFilters.map((date) => (
                  <button
                    key={date}
                    onClick={() => setDateFilter(date)}
                    aria-pressed={dateFilter === date}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      dateFilter === date
                        ? "bg-ink text-paper"
                        : "bg-panel/60 text-ink/60 hover:bg-panel"
                    }`}
                  >
                    {date === "week"
                      ? "This week"
                      : date === "all"
                        ? "All time"
                        : date === "today"
                          ? "Today"
                          : date === "7days"
                            ? "Last 7 days"
                            : date === "30days"
                              ? "Last 30 days"
                              : "Custom"}
                  </button>
                ))}
              </div>
              {dateFilter === "custom" && (
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                    From
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(event) => setFromDate(event.target.value)}
                      className="h-9 rounded-lg border border-ink/10 bg-panel/60 px-2 text-xs text-ink"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-ink/50">
                    To
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(event) => setToDate(event.target.value)}
                      className="h-9 rounded-lg border border-ink/10 bg-panel/60 px-2 text-xs text-ink"
                    />
                  </label>
                </div>
              )}
            </fieldset>
          </div>
        </section>

        <div className="rounded-xl glass ring-1 ring-ink/5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
            <h2 className="text-sm font-semibold font-display">Movement history</h2>
            <span className="text-[11px] tabular-nums text-ink/50">
              {rows.length} {rows.length === 1 ? "record" : "records"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="inventory-table min-w-[680px]">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="w-36">
                    Type
                  </th>
                  <th scope="col" className="w-28 text-right">
                    Quantity
                  </th>
                  <th scope="col" className="w-52 text-right">
                    Date &amp; time
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[13px] text-ink/55">
                      {(movements.data ?? []).length === 0
                        ? "Nothing logged here yet."
                        : "No movements match these filters."}
                    </td>
                  </tr>
                ) : (
                  rows.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumbnail
                            name={m.products?.name ?? "Product"}
                            imageUrl={m.products?.image_url ?? null}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {m.products?.name ?? "Product"}
                            </div>
                            <div className="truncate text-[11px] text-ink/50">
                              {m.products?.sku}
                              {m.reference ? ` · ${m.reference}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                            m.type === "out"
                              ? "bg-amber/10 text-amber ring-amber/20"
                              : m.type === "return"
                                ? "bg-sky/10 text-sky ring-sky/20"
                                : "bg-mint/10 text-mint ring-mint/20"
                          }`}
                        >
                          {typeLabel[m.type]}
                        </span>
                      </td>
                      <td className="text-right">
                        <span
                          className={`font-semibold tabular-nums ${
                            m.type === "out"
                              ? "text-amber"
                              : m.type === "return"
                                ? "text-sky"
                                : "text-mint"
                          }`}
                        >
                          {m.type === "out" ? "−" : "+"}
                          {m.quantity}
                        </span>
                      </td>
                      <td className="text-right text-[11px] tabular-nums text-ink/55">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
