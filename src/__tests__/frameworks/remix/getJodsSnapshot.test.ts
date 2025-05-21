import { describe, it, expect, vi } from "vitest";
import { getJodsSnapshot } from "../../../frameworks/remix/getJodsSnapshot";
import { defineStore } from "../../../frameworks/remix/defineStore";
import { j } from "../../../utils/zod";

describe("getJodsSnapshot", () => {
  it("should combine states from multiple stores into a snapshot", () => {
    // Create mock stores
    const userStore = {
      name: "user",
      getState: vi.fn().mockReturnValue({
        name: "Burt Macklin",
        email: "burt.macklin@fbi.pawnee.city",
      }),
    };

    const cartStore = {
      name: "cart",
      getState: vi.fn().mockReturnValue({
        items: [{ id: "1", name: "Product 1", quantity: 2 }],
      }),
    };

    // Get snapshot
    const snapshot = getJodsSnapshot([userStore, cartStore]);

    // Verify the getState methods were called
    expect(userStore.getState).toHaveBeenCalled();
    expect(cartStore.getState).toHaveBeenCalled();

    // Verify snapshot structure
    expect(snapshot).toEqual({
      user: {
        name: "Burt Macklin",
        email: "burt.macklin@fbi.pawnee.city",
      },
      cart: {
        items: [{ id: "1", name: "Product 1", quantity: 2 }],
      },
    });
  });

  it("should handle real defineStore instances", () => {
    // Create actual stores using defineStore
    const userStore = defineStore({
      name: "user",
      schema: j.object({
        name: j.string(),
        email: j.string(),
      }),
      defaults: {
        name: "Test User",
        email: "test@example.com",
      },
      handlers: {},
    });

    const themeStore = defineStore({
      name: "theme",
      schema: j.object({
        mode: j.enum(["light", "dark"]),
        accent: j.string(),
      }),
      defaults: {
        mode: "light",
        accent: "blue",
      },
      handlers: {},
    });

    // Update store values to verify they're reflected in snapshot
    userStore.setState({
      name: "Updated User",
      email: "updated@example.com",
    });

    themeStore.setState({
      mode: "dark",
      accent: "purple",
    });

    // Get snapshot
    const snapshot = getJodsSnapshot([userStore, themeStore]);

    // Verify snapshot
    expect(snapshot.user.name).toBe("Updated User");
    expect(snapshot.user.email).toBe("updated@example.com");
    expect(snapshot.theme.mode).toBe("dark");
    expect(snapshot.theme.accent).toBe("purple");
  });

  it("should return an empty object for empty stores array", () => {
    const snapshot = getJodsSnapshot([]);
    expect(snapshot).toEqual({});
  });

  it("should ignore stores without a name or getState method", () => {
    // Stores with missing properties
    const invalidStore1 = { getState: vi.fn() }; // Missing name
    const invalidStore2 = { name: "invalid" }; // Missing getState
    const validStore = {
      name: "valid",
      getState: vi.fn().mockReturnValue({ value: "test" }),
    };

    // The following line would normally cause a TypeScript error,
    // but we want to test the runtime behavior with invalid stores
    const snapshot = getJodsSnapshot([
      invalidStore1 as any,
      invalidStore2 as any,
      validStore,
    ]);

    // Only the valid store should be in the snapshot
    expect(Object.keys(snapshot)).toEqual(["valid"]);
    expect(snapshot.valid).toEqual({ value: "test" });
  });
});
