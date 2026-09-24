import { supabase } from "@/integrations/supabase/client";
import { sendLowStockEmail } from "@/lib/send-low-stock-email.functions";

export async function notifyLowStockIfNeeded() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    throw new Error(`Low-stock email check failed: ${error.message}`);
  }

  const lowStockProducts = (data ?? []).filter(
    (product) => Number(product.quantity) <= Number(product.reorder_point),
  );

  if (lowStockProducts.length === 0) {
    return;
  }

  await sendLowStockEmail({
    data: {
      products: lowStockProducts.map((product) => ({
        name: String(product.name),
        quantity: Number(product.quantity),
        reorder_point: Number(product.reorder_point),
      })),
    },
  });
}
