/** @jsxImportSource react */
import { describe, it, expect, vi } from "vitest";
import { rehydrateClient } from "../remix/rehydrateClient";
import { defineStore } from "../remix/defineStore";
import { z } from "zod";

// Define types for test data
interface UserState {
  name: string;
  email: string;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

// Test store creation helper
const createTestStores = () => {
  // User store
  const userStore = defineStore({
    name: "user",
    schema: z.object({
      name: z.string(),
      email: z.string(),
    }),
    defaults: {
      name: "Default User",
      email: "default@example.com",
    },
    handlers: {},
  });

  // Cart store
  const cartStore = defineStore({
    name: "cart",
    schema: z.object({
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          quantity: z.number(),
        })
      ),
    }),
    defaults: {
      items: [],
    },
    handlers: {},
  });

  return [userStore, cartStore];
};

describe("rehydrateClient", () => {
  it("should rehydrate multiple stores from a snapshot", () => {
    const stores = createTestStores();
    const [userStore, cartStore] = stores;

    // Create a snapshot that would come from the server
    const snapshot = {
      user: {
        name: "Burt Macklin",
        email: "burt.macklin@fbi.pawnee.city",
      } as UserState,
      cart: {
        items: [
          { id: "1", name: "Product 1", quantity: 2 },
          { id: "2", name: "Product 2", quantity: 1 },
        ],
      } as CartState,
    };

    // Rehydrate the stores
    rehydrateClient(snapshot, stores);

    // Get typesafe versions of the store state
    const userState = userStore.getState() as UserState;
    const cartState = cartStore.getState() as CartState;

    // Verify stores were updated
    expect(userState.name).toBe("Burt Macklin");
    expect(userState.email).toBe("burt.macklin@fbi.pawnee.city");

    expect(cartState.items).toHaveLength(2);
    expect(cartState.items[0].name).toBe("Product 1");
    expect(cartState.items[1].quantity).toBe(1);
  });

  it("should handle partial snapshots", () => {
    const stores = createTestStores();
    const [userStore, cartStore] = stores;

    // Create a partial snapshot with only one store
    const snapshot = {
      user: {
        name: "Michael Scarn",
        email: "michael.scarn@threatlevelmidnight.com",
      } as UserState,
      // cart is missing
    };

    // Rehydrate the stores
    rehydrateClient(snapshot, stores);

    // Get typesafe versions of the store state
    const userState = userStore.getState() as UserState;
    const cartState = cartStore.getState() as CartState;

    // Verify user store was updated
    expect(userState.name).toBe("Michael Scarn");

    // Cart store should remain with defaults
    expect(cartState.items).toEqual([]);
  });

  it("should use Object.assign to properly trigger signals", () => {
    const stores = createTestStores();
    const userStores = stores.slice(0, 1); // Only use the user store to fix unused warning

    // Spy on Object.assign to verify it's called
    const originalAssign = Object.assign;
    const assignSpy = vi.spyOn(Object, "assign");

    const snapshot = {
      user: {
        name: "Signal Test",
        email: "signal@example.com",
      } as UserState,
    };

    // Rehydrate
    rehydrateClient(snapshot, userStores);

    // Verify Object.assign was called with the store and the snapshot
    expect(assignSpy).toHaveBeenCalled();

    // Check that we're passing the store.store as the target
    const assignCalls = assignSpy.mock.calls;
    const storeAssignCall = assignCalls.find(
      (call) => call[1] === snapshot.user
    );

    expect(storeAssignCall).toBeTruthy();

    // Restore original
    Object.assign = originalAssign;
  });

  it("should ignore undefined snapshots", () => {
    const stores = createTestStores();
    const [userStore] = stores;

    // Create initial state to verify it doesn't change
    userStore.setState({
      name: "Initial User",
      email: "initial@example.com",
    } as any); // Use 'any' to bypass type checking for this test

    // Undefined snapshot
    const snapshot = undefined;

    // Pass undefined snapshot to test error handling
    rehydrateClient(snapshot as any, stores);

    // Verify stores were not updated
    const userState = userStore.getState() as UserState;
    expect(userState.name).toBe("Initial User");
  });

  it("should handle empty stores array", () => {
    // This should not throw
    expect(() => {
      rehydrateClient({}, []);
    }).not.toThrow();
  });
});
