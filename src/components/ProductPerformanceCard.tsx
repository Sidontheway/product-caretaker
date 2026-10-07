import { ProductThumbnail } from "@/components/ProductThumbnail";

export type ProductPerformance = {
  id: string;
  name: string;
  sku: string | undefined;
  imageUrl: string | null;
  stockIn: number;
  stockOut: number;
  activity: number;
};

export function ProductPerformanceCard({
  title,
  metricLabel,
  products,
  metric,
  emptyLabel,
  tone,
}: {
  title: string;
  metricLabel: string;
  products: ProductPerformance[];
  metric: (product: ProductPerformance) => number;
  emptyLabel: string;
  tone: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl glass ring-1 ring-ink/5">
      <h3 className="border-b border-ink/10 px-4 py-3 text-sm font-semibold font-display">
        {title}
      </h3>
      {products.length === 0 ? (
        <p className="px-4 py-5 text-xs text-ink/50">{emptyLabel}</p>
      ) : (
        <ol className="divide-y divide-ink/5">
          {products.map((product, index) => (
            <li key={product.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-ink/40">
                {index + 1}
              </span>
              <ProductThumbnail name={product.name} imageUrl={product.imageUrl} size="size-8" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{product.name}</div>
                <div className="truncate text-[11px] text-ink/45">{product.sku}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className={`text-sm font-semibold tabular-nums ${tone}`}>
                  {metric(product)}
                </div>
                <div className="text-[10px] text-ink/45">{metricLabel}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
