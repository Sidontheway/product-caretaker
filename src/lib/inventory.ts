import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  user_id: string;
  name: string;
  sku: string;
  category: string | null;
  supplier: string | null;
  unit: string | null;
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

export type MovementWithProduct = Movement & { products: { name: string; sku: string } | null };

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

export async function fetchMovements(limit = 50): Promise<MovementWithProduct[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*, products(name, sku)")
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
  quantity: number;
  reorder_point: number;
  unit_cost?: number;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in");
  const { error } = await supabase.from("products").insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
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
  const { error } = await supabase.from("stock_movements").insert({ ...input, user_id: userId });
  if (error) throw error;
}

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
  );
}
