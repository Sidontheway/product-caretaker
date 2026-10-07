import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MovementDialog } from "@/components/MovementDialog";
import { ProductEditDialog } from "@/components/ProductEditDialog";
import { ProductThumbnail } from "@/components/ProductThumbnail";
import { ProductImageDropzone } from "@/components/ProductImageDropzone";
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
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  stockStatus,
  uploadProductImage,
} from "@/lib/inventory";

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
  const totalStock = list.reduce((total, product) => total + product.quantity, 0);

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
      setForm({
        name: "",
        sku: "",
        category: "",
        supplier: "",
        quantity: "0",
        reorder_point: "10",
      });
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
            <span className="text-[11px] text-ink/50">
              {list.length} items · {totalStock} total stock
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="inventory-table min-w-[680px]">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="w-20 text-right">
                    Quantity
                  </th>
                  <th scope="col" className="w-20 text-right">
                    Par
                  </th>
                  <th scope="col" className="w-28 text-right">
                    Status
                  </th>
                  <th scope="col" className="w-32 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[13px] text-ink/55">
                      No products yet — add your first one on the right.
                    </td>
                  </tr>
                ) : (
                  list.map((p) => {
                    const status = stockStatus(p);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductThumbnail name={p.name} imageUrl={p.image_url} />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{p.name}</div>
                              <div className="truncate text-[11px] text-ink/50">
                                {p.sku}
                                {p.category ? ` · ${p.category}` : ""}
                                {p.supplier ? ` · ${p.supplier}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-medium tabular-nums">{p.quantity}</td>
                        <td className="text-right tabular-nums text-ink/50">{p.reorder_point}</td>
                        <td className="text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${statusPill[status]}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-3">
                            <ProductEditDialog
                              product={p}
                              trigger={
                                <button className="text-[11px] text-ink/55 hover:text-ink">
                                  Edit
                                </button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="text-[11px] text-ink/55 hover:text-rose">
                                  Remove
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-panel/95">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove {p.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes the product and its movement history.
                                    Continue only if its stock is zero.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove.mutate(p.id)}>
                                    Remove product
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />
              <Field
                label="SKU"
                value={form.sku}
                onChange={(v) => setForm({ ...form, sku: v })}
                required
              />
              <Field
                label="Category"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
              />
              <Field
                label="Supplier"
                value={form.supplier}
                onChange={(v) => setForm({ ...form, supplier: v })}
              />
              <ProductImageDropzone
                name={form.name}
                imageUrl={imagePreview}
                onFileChange={(file) => {
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : "");
                }}
              />
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
