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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      logMovement({
        product_id: productId,
        type,
        quantity: Number(quantity),
        reference: reference || undefined,
      }),
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
            if (!productId) return toast.error("Pick a product first");
            mutation.mutate();
          }}
        >
          <div>
            <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.sku} ({p.quantity})
                </option>
              ))}
            </select>
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
