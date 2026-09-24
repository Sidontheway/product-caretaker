import { supabase } from "@/integrations/supabase/client";
import { notifyLowStockIfNeeded } from "@/lib/low-stock-email";

export type Product = {
  id: string;
  user_id: string;
  name: string;
  sku: string;
  category: string | null;
  supplier: string | null;
  unit: string | null;
  image_url: string | null;
  quantity: number;
  reorder_point: number;
  unit_cost: number | null;
  created_at: string;
  updated_at: string;
};

export type MovementType = "in" | "out" | "return";

export type Movement = {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  reference: string | null;
  note: string | null;
  created_at: string;
};

export type MovementWithProduct = Movement & {
  products: { name: string; sku: string; image_url: string | null } | null;
};

export function stockStatus(p: Pick<Product, "quantity" | "reorder_point">) {
  if (p.quantity <= Math.ceil(p.reorder_point / 2)) return "critical" as const;
  if (p.quantity <= p.reorder_point) return "low" as const;
  return "healthy" as const;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Product images must be 5 MB or smaller");
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchMovements(limit = 50): Promise<MovementWithProduct[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*, products(name, sku, image_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as MovementWithProduct[];
}

export async function createProduct(input: {
  name: string;
  sku: string;
  category?: string;
  supplier?: string;
  unit?: string;
  image_url?: string | undefined;
  quantity: number;
  reorder_point: number;
  unit_cost?: number;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in");
  const { error } = await supabase.from("products").insert({ ...input, user_id: userId });
  if (error) throw error;

  await notifyLowStockIfNeeded();
}

export async function updateProduct(
  id: string,
  input: {
    name: string;
    sku: string;
    category?: string;
    supplier?: string;
    image_url?: string;
    reorder_point: number;
  },
) {
  const { error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { data: product, error: lookupError } = await supabase
    .from("products")
    .select("quantity")
    .eq("id", id)
    .single();
  if (lookupError) throw lookupError;
  if (Number(product.quantity) > 0) {
    throw new Error("This product cannot be removed while it has stock.");
  }

  const { data: deletedProduct, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("quantity", 0)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!deletedProduct) {
    throw new Error("This product could not be removed because its stock changed.");
  }
}

export async function logMovement(input: {
  product_id: string;
  type: MovementType;
  quantity: number;
  reference?: string;
  note?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in");

  const { data: insertedMovement, error } = await supabase
    .from("stock_movements")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  try {
    await notifyLowStockIfNeeded();
  } catch (notificationError) {
    const reversalDelta = insertedMovement.type === "out"
      ? insertedMovement.quantity
      : -insertedMovement.quantity;

    const { data: product, error: productLookupError } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", insertedMovement.product_id)
      .single();

    if (productLookupError) {
      throw new Error(
        `${notificationError instanceof Error ? notificationError.message : "Notification failed"}. ` +
        `Stock rollback failed: ${productLookupError.message}`,
      );
    }

    const { error: rollbackError } = await supabase
      .from("products")
      .update({
        quantity: Number(product.quantity) + reversalDelta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", insertedMovement.product_id);

    if (rollbackError) {
      throw new Error(
        `${notificationError instanceof Error ? notificationError.message : "Notification failed"}. ` +
        `Stock rollback failed: ${rollbackError.message}`,
      );
    }

    const { error: deleteMovementError } = await supabase
      .from("stock_movements")
      .delete()
      .eq("id", insertedMovement.id)
      .eq("user_id", userId);

    if (deleteMovementError) {
      throw new Error(
        `${notificationError instanceof Error ? notificationError.message : "Notification failed"}. ` +
        `Movement rollback failed: ${deleteMovementError.message}`,
      );
    }

    throw notificationError instanceof Error
      ? notificationError
      : new Error("Low-stock notification failed");
  }
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  );
}
