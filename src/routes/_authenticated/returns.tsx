import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import { fetchMovements, fetchProducts } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/returns")({
  head: () => ({
    meta: [
      { title: "Returns · Lexicon" },
      { name: "description", content: "Returned units restocked back into your inventory." },
      { property: "og:title", content: "Returns · Lexicon" },
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
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink/50">
              Returns logged
            </div>
            <div className="text-2xl font-semibold tabular-nums font-display">{rows.length}</div>
          </div>
          <div className="rounded-xl glass ring-1 ring-ink/5 px-4 py-3.5">
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink/50">
              Units restocked
            </div>
            <div className="text-2xl font-semibold tabular-nums font-display text-sky">{total}</div>
          </div>
        </div>

        <div className="rounded-xl glass ring-1 ring-ink/5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
            <h2 className="text-sm font-semibold font-display">Returned items</h2>
            <span className="text-[11px] tabular-nums text-ink/50">
              {rows.length} {rows.length === 1 ? "record" : "records"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="inventory-table min-w-[500px]">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="w-32 text-right">
                    Quantity restocked
                  </th>
                  <th scope="col" className="w-48 text-right">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[13px] text-ink/55">
                      No returns recorded yet.
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
                      <td className="text-right font-medium tabular-nums text-sky">
                        +{m.quantity}
                      </td>
                      <td className="text-right text-[11px] tabular-nums text-ink/45">
                        {new Date(m.created_at).toLocaleDateString()}
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
