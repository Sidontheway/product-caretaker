import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductImageDropzone } from "@/components/ProductImageDropzone";
import { updateProduct, uploadProductImage, type Product } from "@/lib/inventory";

export function ProductEditDialog({ product, trigger }: { product: Product; trigger: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    category: product.category ?? "",
    supplier: product.supplier ?? "",
    reorder_point: String(product.reorder_point),
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product.image_url ?? "");

  useEffect(() => {
    if (!open) return;
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category ?? "",
      supplier: product.supplier ?? "",
      reorder_point: String(product.reorder_point),
    });
    setImageFile(null);
    setImagePreview(product.image_url ?? "");
  }, [open, product]);

  const edit = useMutation({
    mutationFn: async () => {
      return updateProduct(product.id, {
        name: form.name,
        sku: form.sku,
        category: form.category,
        supplier: form.supplier,
        ...(imageFile
          ? { image_url: await uploadProductImage(imageFile) }
          : product.image_url
            ? { image_url: product.image_url }
            : {}),
        reorder_point: Number(form.reorder_point),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Product updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-panel/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Edit product</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            edit.mutate();
          }}
        >
          <Field label="Name" value={form.name} required onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="SKU" value={form.sku} required onChange={(value) => setForm({ ...form, sku: value })} />
          <Field label="Category" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
          <Field label="Supplier" value={form.supplier} onChange={(value) => setForm({ ...form, supplier: value })} />
          <ProductImageDropzone
            name={form.name}
            imageUrl={imagePreview}
            onFileChange={(file) => {
              setImageFile(file);
              setImagePreview(file ? URL.createObjectURL(file) : product.image_url ?? "");
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current qty" value={String(product.quantity)} disabled onChange={() => undefined} />
            <Field
              label="Reorder point"
              type="number"
              value={form.reorder_point}
              onChange={(value) => setForm({ ...form, reorder_point: value })}
            />
          </div>
          <button
            type="submit"
            disabled={edit.isPending}
            className="w-full text-sm rounded-lg px-3 py-2 bg-ink text-paper ring-1 ring-ink disabled:opacity-60"
          >
            {edit.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.12em] text-ink/50 mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg bg-panel/70 ring-1 ring-ink/10 px-3 py-2 text-sm disabled:opacity-60"
      />
    </div>
  );
}