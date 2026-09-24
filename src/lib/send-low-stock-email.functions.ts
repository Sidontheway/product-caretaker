import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lowStockProductSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  reorder_point: z.number(),
});

const sendLowStockEmailInput = z.object({
  products: z.array(lowStockProductSchema).min(1),
});

export const sendLowStockEmail = createServerFn({ method: "POST" })
  .validator(sendLowStockEmailInput)
  .handler(async ({ data }) => {
    const apiKey = process.env["RESEND_API_KEY"] ?? process.env["VITE_RESEND_API_KEY"];
    const adminEmails = (process.env["ADMIN_EMAILS"] ?? process.env["VITE_ADMIN_EMAILS"] ?? "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    const fromAddress =
      process.env["EMAIL_FROM"] ??
      process.env["VITE_EMAIL_FROM"] ??
      "Lexicon <noreply@lexicon.local>";

    if (!apiKey || adminEmails.length === 0) {
      return;
    }

    const productLines = data.products
      .map(
        (product) =>
          `<li><strong>${product.name}</strong> — ${product.quantity} available, reorder point ${product.reorder_point}</li>`,
      )
      .join("");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: adminEmails,
        subject: `Lexicon low-stock alert (${data.products.length} product${data.products.length > 1 ? "s" : ""})`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2 style="margin-bottom: 12px;">Low stock alert</h2>
            <p>The following product(s) are at or below their reorder point:</p>
            <ul>${productLines}</ul>
            <p>Please review the stock and place a reorder if needed.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to send low-stock email: ${text || "unknown error"}`);
    }
  });
