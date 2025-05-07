type Product = {
  id: string;
  title: string;
  price: number;
};

class FakeDB {
  private products: Product[] = [];

  product = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return this.products.find((p) => p.id === where.id) || null;
    },

    create: async (data: { data: Product }) => {
      this.products.push(data.data);
      return data.data;
    },

    findMany: async () => {
      return this.products;
    },
  };

  // Add some initial data
  constructor() {
    this.products.push(
      { id: "1", title: "Product 1", price: 10 },
      { id: "2", title: "Product 2", price: 20 },
      { id: "3", title: "Product 3", price: 30 }
    );
  }
}

export const db = new FakeDB();
