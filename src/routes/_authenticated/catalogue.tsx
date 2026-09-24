import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import { ProductEditDialog } from "@/components/ProductEditDialog";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createProduct, deleteProduct, fetchProducts, stockStatus, uploadProductImage } from "@/lib/inventory";

export const Route = createFileRoute("/_authenticated/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue · Lexicon" },
      { name: "description", content: "Your products, quantities and reorder points." },
      { property: "og:title", content: "Catalogue · Lexicon" },
      { property: "og:description", content: "Your products, quantities and reorder points." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalogue,
});

const statusPill: Record<string, string> = {
  critical: "bg-rose/12 text-rose ring-rose/20",
  low: "bg-amber/12 text-amber ring-amber/20",
  healthy: "bg-mint/12 text-mint ring-mint/20",
};

function Catalogue() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const list = products.data ?? [];

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    supplier: "",
    quantity: "0",
    reorder_point: "10",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const input = {
        name: form.name,
        sku: form.sku,
        category: form.category,
        supplier: form.supplier,
        quantity: Number(form.quantity),
        reorder_point: Number(form.reorder_point),
      };
      const file = imageFile;
      if (file) {
        const image_url = await uploadProductImage(file);
        return createProduct({ ...input, image_url });
      }
      return createProduct(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Product added");
      setForm({ name: "", sku: "", category: "", supplier: "", quantity: "0", reorder_point: "10" });
      setImageFile(null);
      setImagePreview("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Product removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Catalogue" email={user.email ?? null}>
      <div className="grid lg:grid-cols-3 gap-5 p-6">
        <section className="lg:col-span-2 rounded-xl glass ring-1 ring-ink/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-ink/10 flex items-center justify-between">
            <span className="text-sm font-semibold font-display">Products</span>
            <span className="text-[11px] text-ink/50">{list.length} items</span>
          </div>
          <div className="grid grid-cols-[1fr_80px_80px_110px_64px] gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-ink/50 border-b border-ink/10">
            <span>Product</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Par</span>
            <span className="text-right">Status</span>
            <span />
          </div>
          <div className="divide-y divide-ink/5 text-sm">
            {list.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-ink/55">
                No products yet — add your first one on the right.
              </p>
            ) : (
              list.map((p) => {
                const status = stockStatus(p);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_80px_80px_110px_64px] gap-3 px-4 py-2.5 items-center hover:bg-panel/60 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <ProductThumbnail name={p.name} imageUrl={p.image_url} />
                      <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-ink/50 truncate">
                        {p.sku}
                        {p.category ? ` · ${p.category}` : ""}
                        {p.supplier ? ` · ${p.supplier}` : ""}
                      </div>
                      </div>
                    </div>
                    <span className="text-right tabular-nums font-medium">{p.quantity}</span>
                    <span className="text-right tabular-nums text-ink/50">{p.reorder_point}</span>
                    <span className="text-right">
                      <span
                        className={`text-[11px] rounded-full px-2 py-0.5 ring-1 capitalize ${statusPill[status]}`}
                      >
                        {status}
                      </span>
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <ProductEditDialog
                        product={p}
                        trigger={<button className="text-[11px] text-ink/45 hover:text-ink">Edit</button>}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-[11px] text-ink/45 hover:text-rose">Remove</button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-panel/95">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {p.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the product and its movement history. Continue only if its stock is zero.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(p.id)}>Remove product</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-xl glass ring-1 ring-ink/5 p-4">
            <div className="text-sm font-semibold font-display mb-3">Add product</div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                add.mutate();
              }}
            >
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} required />
              <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
              <Field label="Supplier" value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} />
              <div>
                <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
                  Product image
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : "");
                  }}
                  className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-2.5 file:py-1 file:text-xs file:text-paper"
                />
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Selected product"
                    className="mt-2 size-16 rounded-lg object-cover ring-1 ring-ink/10"
                  />
                ) : null}
                <p className="mt-1 text-[11px] text-ink/45">PNG, JPG, WEBP or GIF up to 5 MB.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Opening qty"
                  type="number"
                  value={form.quantity}
                  onChange={(v) => setForm({ ...form, quantity: v })}
                />
                <Field
                  label="Reorder point"
                  type="number"
                  value={form.reorder_point}
                  onChange={(v) => setForm({ ...form, reorder_point: v })}
                />
              </div>
              <button
                type="submit"
                disabled={add.isPending}
                className="w-full text-sm rounded-lg px-3 py-2 bg-ink text-paper ring-1 ring-ink disabled:opacity-60"
              >
                {add.isPending ? "Saving…" : "Add to catalogue"}
              </button>
            </form>
          </div>

          <div className="rounded-xl glass ring-1 ring-ink/5 p-4 space-y-2">
            <div className="text-sm font-semibold font-display">Quick actions</div>
            <MovementDialog
              type="in"
              products={list}
              trigger={
                <button className="w-full text-sm rounded-lg px-3 py-2 bg-panel/70 ring-1 ring-ink/5 hover:bg-panel transition-colors">
                  Log Stock In
                </button>
              }
            />
            <MovementDialog
              type="out"
              products={list}
              trigger={
                <button className="w-full text-sm rounded-lg px-3 py-2 bg-panel/70 ring-1 ring-ink/5 hover:bg-panel transition-colors">
                  Log Stock Out
                </button>
              }
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm"
      />
    </div>
  );
}
