import { defineStore, j } from "../../../src/remix";
import { db } from "./fake.db";

// Define types for the cart store
type CartItem = {
  id: string;
  title: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

export const cart = defineStore({
  name: "cart",
  schema: j.object({
    items: j.array(
      j.object({
        id: j.string(),
        title: j.string(),
        quantity: j.number().min(1),
      })
    ),
  }),
  defaults: {
    items: [],
  },
  handlers: {
    async addItem({ current, form }: { current: CartState; form: FormData }) {
      const productId = form.get("productId")!;
      const quantity = Number(form.get("quantity") || 1);

      const product = await db.product.findUnique({
        where: { id: String(productId) },
      });
      if (!product) throw new Error("Product not found");

      const existing = current.items.find((i) => i.id === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        current.items.push({
          id: String(productId),
          title: product.title,
          quantity,
        });
      }

      return current;
    },
  },
});
