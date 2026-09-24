import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logMovement, type MovementType, type Product } from "@/lib/inventory";
import { ProductThumbnail } from "@/components/ProductThumbnail";

const labels: Record<MovementType, string> = {
  in: "Stock In",
  out: "Stock Out",
  return: "Return",
};

export function MovementDialog({
  type,
  products,
  trigger,
}: {
  type: MovementType;
  products: Product[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reference, setReference] = useState("");
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const selectedProduct = products.find((product) => product.id === productId);

  const mutation = useMutation({
    mutationFn: logMovement,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(`${labels[type]} logged`);
      setOpen(false);
      setQuantity("1");
      setReference("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-panel/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display">{labels[type]}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!productId) {
              toast.error("Pick a product first");
              return;
            }
            mutation.mutate({
              product_id: productId,
              type,
              quantity: Number(quantity),
              ...(reference ? { reference } : {}),
            });
          }}
        >
          <div>
            <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
              Product
            </label>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={productMenuOpen}
                onClick={() => setProductMenuOpen((isOpen) => !isOpen)}
                className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-left text-sm"
              >
                {selectedProduct ? (
                  <span className="flex items-center gap-2">
                    <ProductThumbnail
                      name={selectedProduct.name}
                      imageUrl={selectedProduct.image_url}
                      size="size-8"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{selectedProduct.name}</span>
                      <span className="block truncate text-[11px] text-ink/50">
                        {selectedProduct.sku} · {selectedProduct.quantity} available
                      </span>
                    </span>
                  </span>
                ) : (
                  <span className="text-ink/55">Select a product…</span>
                )}
              </button>
              {productMenuOpen ? (
                <div
                  role="listbox"
                  aria-label="Products"
                  className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg bg-paper p-1 shadow-lg ring-1 ring-ink/15"
                >
                  {products.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-ink/55">No products available</div>
                  ) : (
                    products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        role="option"
                        aria-selected={product.id === productId}
                        onClick={() => {
                          setProductId(product.id);
                          setProductMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-panel/70"
                      >
                        <ProductThumbnail
                          name={product.name}
                          imageUrl={product.image_url}
                          size="size-9"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{product.name}</span>
                          <span className="block truncate text-[11px] text-ink/50">
                            {product.sku} · {product.quantity} available
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
              Reference
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO-229, order #4471, RMA-88…"
              className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full text-sm rounded-lg px-3 py-2 bg-ink text-paper ring-1 ring-ink disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : `Log ${labels[type]}`}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
