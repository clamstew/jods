import { describe, it, expect, vi } from "vitest";
import { withJods } from "../remix/withJods";
import { defineStore } from "../remix/defineStore";
import { z } from "zod";

// Setup a test request
const createTestRequest = () => {
  return {
    url: "https://example.com/profile",
  } as unknown as Request;
};

// Create test stores for testing withJods
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
    loader: async ({ request: _request }) => {
      // Mock a loader that returns data
      return {
        name: "Loaded User",
        email: "loaded@example.com",
      };
    },
  });

  // Settings store
  const settingsStore = defineStore({
    name: "settings",
    schema: z.object({
      theme: z.enum(["light", "dark", "system"]),
      notifications: z.boolean(),
    }),
    defaults: {
      theme: "system",
      notifications: true,
    },
    handlers: {},
    loader: async ({ request: _request }) => {
      // Mock a loader that returns data
      return {
        theme: "dark",
        notifications: false,
      };
    },
  });

  return [userStore, settingsStore];
};

describe("withJods", () => {
  it("should combine data from multiple store loaders", async () => {
    const stores = createTestStores();
    const request = createTestRequest();

    // Create a loader function wrapped with withJods
    const loader = withJods(stores, async () => {
      return {
        title: "User Profile",
      };
    });

    // Call the loader with the request
    const result = await loader({ request });

    // Check that the result includes:
    // 1. User data from the stores
    expect(result.__jods).toBeDefined();
    expect(result.__jods.user).toEqual({
      name: "Loaded User",
      email: "loaded@example.com",
    });
    expect(result.__jods.settings).toEqual({
      theme: "dark",
      notifications: false,
    });

    // 2. Custom data from the loader function
    expect(result.title).toBe("User Profile");
  });

  it("should work without a custom loader function", async () => {
    const stores = createTestStores();
    const request = createTestRequest();

    // Create a loader without custom function
    const loader = withJods(stores);

    // Call the loader
    const result = await loader({ request });

    // Should still include store data
    expect(result.__jods).toBeDefined();
    expect(result.__jods.user).toBeDefined();
    expect(result.__jods.settings).toBeDefined();

    // But no custom data
    expect(Object.keys(result).length).toBe(1); // Only __jods
  });

  it("should call all store loaders with the request", async () => {
    const stores = createTestStores();
    const request = createTestRequest();

    // Spy on the loaders
    const userLoaderSpy = vi.spyOn(stores[0], "loader" as any);
    const settingsLoaderSpy = vi.spyOn(stores[1], "loader" as any);

    // Create and call the loader
    const loader = withJods(stores);
    await loader({ request });

    // Verify both loaders were called with the request
    expect(userLoaderSpy).toHaveBeenCalledWith({ request });
    expect(settingsLoaderSpy).toHaveBeenCalledWith({ request });
  });

  it("should handle errors in store loaders", async () => {
    // Create a store with a loader that throws an error
    const errorStore = defineStore({
      name: "error",
      schema: z.object({ value: z.string() }),
      defaults: { value: "" },
      handlers: {},
      loader: async () => {
        throw new Error("Loader error");
      },
    });

    const request = createTestRequest();

    // Create a loader with the error store
    const loader = withJods([errorStore]);

    // Should propagate the error
    await expect(loader({ request })).rejects.toThrow("Loader error");
  });

  it("should handle missing loaders in some stores", async () => {
    // Create a store without a loader
    const noLoaderStore = defineStore({
      name: "noLoader",
      schema: z.object({ value: z.string() }),
      defaults: { value: "default" },
      handlers: {},
      // No loader property
    });

    const request = createTestRequest();

    // Create a loader with the store
    const loader = withJods([noLoaderStore]);

    // Should still work
    const result = await loader({ request });

    // Should include empty data for the store
    expect(result.__jods).toBeDefined();
    expect(result.__jods.noLoader).toEqual({ value: "default" });
  });
});
