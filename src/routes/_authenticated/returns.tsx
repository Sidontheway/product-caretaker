import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import { fetchMovements, fetchProducts } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/returns")({
  head: () => ({
    meta: [
      { title: "Returns · Nimbus" },
      { name: "description", content: "Returned units restocked back into your inventory." },
      { property: "og:title", content: "Returns · Nimbus" },
      { property: "og:description", content: "Returned units restocked back into your inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Returns,
});

function Returns() {
  const { user } = Route.useRouteContext();
  const movements = useQuery({ queryKey: ["movements"], queryFn: () => fetchMovements(200) });
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const rows = (movements.data ?? []).filter((m) => m.type === "return");
  const total = rows.reduce((s, m) => s + m.quantity, 0);

  return (
    <AppShell
      title="Returns"
      email={user.email ?? null}
      actions={
        <MovementDialog
          type="return"
          products={products.data ?? []}
          trigger={
            <button className="text-sm rounded-lg px-3 py-1.5 bg-ink text-paper ring-1 ring-ink">
              Log return
            </button>
          }
        />
      }
    >
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl glass ring-1 ring-ink/5 px-4 py-3.5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink/50">Returns logged</div>
            <div className="text-2xl font-semibold tabular-nums font-display">{rows.length}</div>
          </div>
          <div className="rounded-xl glass ring-1 ring-ink/5 px-4 py-3.5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink/50">Units restocked</div>
            <div className="text-2xl font-semibold tabular-nums font-display text-sky">{total}</div>
          </div>
        </div>

        <div className="rounded-xl glass ring-1 ring-ink/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10">
            <span className="text-sm font-semibold font-display">Returned items</span>
          </div>
          <div className="divide-y divide-ink/5 text-sm">
            {rows.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-ink/55">No returns recorded yet.</p>
            ) : (
              rows.map((m) => (
                <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.products?.name ?? "Product"}</div>
                    <div className="text-[11px] text-ink/50 truncate">
                      {m.products?.sku}
                      {m.reference ? ` · ${m.reference}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="tabular-nums text-sky">+{m.quantity}</div>
                    <div className="text-[11px] text-ink/45 tabular-nums">
                      {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
