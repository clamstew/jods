import { defineStore } from "../../../src/remix/defineStore";
import { z } from "zod";
import { db } from "./fake.db";

export const cart = defineStore({
  name: "cart",
  schema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        quantity: z.number().min(1),
      })
    ),
  }),
  defaults: {
    items: [],
  },
  handlers: {
    async addItem({ current, form }) {
      const productId = form.get("productId")!;
      const quantity = Number(form.get("quantity") || 1);

      const product = await db.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Product not found");

      const existing = current.items.find((i) => i.id === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        current.items.push({
          id: productId,
          title: product.title,
          quantity,
        });
      }

      return current;
    },
  },
});
