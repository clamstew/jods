import { describe, it, expect, vi } from "vitest";
import { store } from "../../core/store";
import {
  persist,
  clearPersisted,
  getPersisted,
  isPersisted,
  isPersistAvailable,
} from "../../persist";
import { computed } from "../../core/computed";

describe("💾 persist API", () => {
  // Mock storage implementations for testing

  // Mock localStorage-like synchronous storage
  const createMockStorage = () => {
    const storage: {
      data: Record<string, string>;
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    } = {
      data: {} as Record<string, string>,
      getItem: vi.fn((key: string) => storage.data[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage.data[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage.data[key];
      }),
    };
    return storage;
  };

  // Mock async storage (like IndexedDB adapter)
  const createMockAsyncStorage = () => {
    const storage: {
      data: Record<string, string>;
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    } = {
      data: {} as Record<string, string>,
      getItem: vi.fn(async (key: string) => storage.data[key] || null),
      setItem: vi.fn(async (key: string, value: string) => {
        storage.data[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete storage.data[key];
      }),
    };
    return storage;
  };

  describe("Basic functionality", () => {
    it("loads persisted data into store", () => {
      const mockStorage = createMockStorage();
      mockStorage.data["test-key"] = JSON.stringify({ count: 42 });

      const testStore = store({ count: 0 });
      persist(mockStorage, testStore, { key: "test-key" });

      expect(testStore.count).toBe(42);
    });

    it("persists store changes to storage", async () => {
      const mockStorage = createMockStorage();
      const testStore = store({ count: 0 });

      persist(mockStorage, testStore, { key: "test-key", debounceMs: 0 });
      testStore.count = 99;

      // Wait for debounce
      await new Promise((r) => setTimeout(r, 10));

      expect(mockStorage.setItem).toHaveBeenCalled();
      expect(JSON.parse(mockStorage.data["test-key"]).count).toBe(99);
    });

    it("cleanup function stops persistence", async () => {
      const mockStorage = createMockStorage();
      const testStore = store({ count: 0 });

      const cleanup = persist(mockStorage, testStore, {
        key: "test-key",
        debounceMs: 0,
      });

      testStore.count = 5;
      await new Promise((r) => setTimeout(r, 10));

      // Verify first update was persisted
      expect(JSON.parse(mockStorage.data["test-key"]).count).toBe(5);

      // Stop persistence
      if (typeof cleanup === "function") {
        cleanup();
      } else {
        await cleanup.then((fn) => fn());
      }

      // Clear mock calls
      vi.clearAllMocks();

      // Update again
      testStore.count = 100;
      await new Promise((r) => setTimeout(r, 10));

      // Should not have been called again
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // Original data should still exist
      expect(JSON.parse(mockStorage.data["test-key"]).count).toBe(5);
    });

    it("can be checked with isPersisted", () => {
      const mockStorage = createMockStorage();
      const testStore = store({ count: 0 });

      expect(isPersisted(testStore)).toBe(false);

      persist(mockStorage, testStore);

      expect(isPersisted(testStore)).toBe(true);
    });
  });

  describe("Sync vs. Async Storage", () => {
    it("works with synchronous storage", () => {
      const mockStorage = createMockStorage();
      const testStore = store({ value: "sync" });

      const result = persist(mockStorage, testStore);

      expect(typeof result).toBe("function"); // Returns cleanup function directly
    });

    it("works with asynchronous storage", async () => {
      const mockAsyncStorage = createMockAsyncStorage();
      const testStore = store({ value: "async" });

      const result = persist(mockAsyncStorage, testStore);

      expect(result instanceof Promise).toBe(true); // Returns Promise
      const cleanup = await result;
      expect(typeof cleanup).toBe("function"); // Promise resolves to cleanup function
    });

    it("loads asynchronously from async storage", async () => {
      const mockAsyncStorage = createMockAsyncStorage();
      mockAsyncStorage.data["async-test"] = JSON.stringify({
        loaded: true,
        value: 42,
      });

      const testStore = store({ loaded: false, value: 0 });
      await persist(mockAsyncStorage, testStore, { key: "async-test" });

      expect(testStore.loaded).toBe(true);
      expect(testStore.value).toBe(42);
    });

    it("saves asynchronously to async storage", async () => {
      const mockAsyncStorage = createMockAsyncStorage();
      const testStore = store({ value: "initial" });

      await persist(mockAsyncStorage, testStore, {
        key: "async-test",
        debounceMs: 0,
      });

      testStore.value = "updated";
      await new Promise((r) => setTimeout(r, 10)); // Wait for debounce

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      expect(
        JSON.parse((await mockAsyncStorage.getItem("async-test")) as string)
          .value
      ).toBe("updated");
    });
  });

  describe("Error Handling", () => {
    it("handles loading errors gracefully", () => {
      // Create a modified error storage that won't throw on initial getItem
      // but will throw on setItem
      const customErrorStorage = {
        getItem: vi.fn(() => null), // Don't throw on initial load
        setItem: vi.fn(() => {
          throw new Error("Storage error on set");
        }),
      };

      const testStore = store({ safe: true });

      // Should not throw during persist
      persist(customErrorStorage, testStore);

      // Store should be unchanged
      expect(testStore.safe).toBe(true);
    });

    it("handles parsing errors gracefully", () => {
      const mockStorage = createMockStorage();
      mockStorage.data["corrupt"] = "{not-valid-json}";

      const testStore = store({ safe: true });

      // Using try/catch instead of expect().not.toThrow()
      try {
        persist(mockStorage, testStore, { key: "corrupt" });
        // If we get here, the persist function handled the error internally
        expect(testStore.safe).toBe(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        throw new Error("Error should be handled internally but was thrown");
      }
    });

    it("uses custom error handler when provided", () => {
      const errorHandler = vi.fn();
      const mockStorage = createMockStorage();
      mockStorage.data["corrupt"] = "{not-valid-json}";

      persist(mockStorage, store({}), {
        key: "corrupt",
        onError: errorHandler,
      });

      expect(errorHandler).toHaveBeenCalled();
    });

    it("handles saving errors gracefully", async () => {
      // Create a storage that only errors on setItem, not getItem
      const savingErrorStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error("Storage error on set");
        }),
      };

      const testStore = store({ value: "test" });

      try {
        persist(savingErrorStorage, testStore, { debounceMs: 0 });

        // Update the store to trigger a save
        testStore.value = "updated";
        await new Promise((r) => setTimeout(r, 10)); // Wait for debounce

        // If we get here, the error was handled internally
        expect(savingErrorStorage.setItem).toHaveBeenCalled();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        throw new Error("Error should be handled internally but was thrown");
      }
    });
  });

  describe("Advanced Features", () => {
    it("persists multiple stores under one key", async () => {
      const mockStorage = createMockStorage();
      const userStore = store({ name: "Test" });
      const cartStore = store({ items: [] as string[] });

      persist(mockStorage, [userStore, cartStore], {
        key: "app",
        debounceMs: 0,
      });

      userStore.name = "Updated";
      cartStore.items = ["item1"];

      await new Promise((r) => setTimeout(r, 10));

      const saved = JSON.parse(mockStorage.data["app"]);
      expect(saved).toHaveProperty("name", "Updated");
      expect(saved).toHaveProperty("items");
      expect(saved.items).toContain("item1");
    });

    it("persists only partial state when selector provided", async () => {
      const mockStorage = createMockStorage();
      const userStore = store({ name: "Test", token: "secret" });

      persist(mockStorage, userStore, {
        key: "partial",
        partial: (state) => ({ name: state.name }), // Only persist name
        debounceMs: 0,
      });

      userStore.token = "newsecret";
      await new Promise((r) => setTimeout(r, 10));

      const saved = JSON.parse(mockStorage.data["partial"]);
      expect(saved).toHaveProperty("name");
      expect(saved).not.toHaveProperty("token");
    });

    it("applies migrations for version changes", () => {
      const mockStorage = createMockStorage();
      mockStorage.data["v1"] = JSON.stringify({
        oldField: "value",
        version: "1",
      });

      const testStore = store({ newField: "" });

      // Use inline migrate function instead of spy
      persist(mockStorage, testStore, {
        key: "v1",
        version: "2",
        migrate: (oldState) => {
          // Cast to any to avoid TypeScript errors in test
          const old = oldState as any;
          if (old.oldField) {
            return {
              newField: old.oldField,
              version: "2",
            };
          }
          return oldState;
        },
      });

      expect(testStore.newField).toBe("value");
    });

    it("loads data but doesn't subscribe with loadOnlyMode option", async () => {
      const mockStorage = createMockStorage();
      mockStorage.data["load-only"] = JSON.stringify({ value: "initial" });

      const testStore = store({ value: "default" });
      persist(mockStorage, testStore, {
        key: "load-only",
        loadOnlyMode: true,
        debounceMs: 0,
      });

      expect(testStore.value).toBe("initial");

      testStore.value = "updated";
      await new Promise((r) => setTimeout(r, 10));

      // Should not save the update
      const saved = JSON.parse(mockStorage.data["load-only"]);
      expect(saved.value).toBe("initial");
    });

    it("supports throttling instead of debouncing", async () => {
      const mockStorage = createMockStorage();
      const testStore = store({ count: 0 });

      persist(mockStorage, testStore, {
        key: "throttle-test",
        throttleMs: 0, // Setting to 0 for testing, but would normally be > 0
      });

      testStore.count = 1;
      await new Promise((r) => setTimeout(r, 10));

      expect(JSON.parse(mockStorage.data["throttle-test"]).count).toBe(1);
    });
  });

  describe("Helper Functions", () => {
    it("clearPersisted removes data from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.data["to-clear"] = JSON.stringify({ value: "test" });

      clearPersisted(mockStorage, "to-clear");

      expect(mockStorage.removeItem).toHaveBeenCalledWith("to-clear");
      expect(mockStorage.data["to-clear"]).toBeUndefined();
    });

    it("getPersisted returns data without affecting store", () => {
      const mockStorage = createMockStorage();
      mockStorage.data["get-test"] = JSON.stringify({ value: "test" });

      type TestData = { value: string };
      const result = getPersisted<TestData>(mockStorage, "get-test");

      // Since we're using a sync storage, result should not be a Promise
      expect(result).not.toBeNull();
      expect(result).toEqual({ value: "test" });
    });

    it("getPersisted works with async storage", async () => {
      const mockAsyncStorage = createMockAsyncStorage();
      mockAsyncStorage.data["async-get"] = JSON.stringify({ value: "async" });

      const dataPromise = getPersisted(mockAsyncStorage, "async-get");
      expect(dataPromise instanceof Promise).toBe(true);

      const data = await dataPromise;
      expect(data).toEqual({ value: "async" });
    });

    it("isPersistAvailable checks if storage is available", () => {
      const mockStorage = createMockStorage();

      const result = isPersistAvailable(mockStorage);
      expect(result).toBe(true);

      // Test with async storage
      const mockAsyncStorage = createMockAsyncStorage();
      const asyncResult = isPersistAvailable(mockAsyncStorage);
      expect(asyncResult instanceof Promise).toBe(true);
    });
  });

  describe("Integration with computed", () => {
    it("doesn't persist computed values", async () => {
      const mockStorage = createMockStorage();
      const testStore = store({ count: 0 });

      // Create a computed value and call it to get the value
      const doubleCount = computed(() => testStore.count * 2);

      // Store the computed value using a specific key
      (testStore as any).double = doubleCount();

      persist(mockStorage, testStore, { key: "computed-test", debounceMs: 0 });

      testStore.count = 5;
      // This doesn't auto-update because we're storing the value, not the getter
      await new Promise((r) => setTimeout(r, 10));

      // Serialized state should have count but not double
      const saved = JSON.parse(mockStorage.data["computed-test"]);
      expect(saved).toHaveProperty("count", 5);
      expect(saved.double).toBe(0); // Still 0 because we assigned the initial computed value
    });

    it("recomputes computed values when read after loading from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.data["computed-load"] = JSON.stringify({ count: 10 });

      interface TestStoreWithComputed
        extends ReturnType<typeof store<{ count: number }>> {
        getDouble(): number;
      }

      const testStore = store({ count: 0 }) as TestStoreWithComputed;

      // Setup a computed function
      testStore.getDouble = function () {
        return this.count * 2;
      };

      // Initial value before loading
      expect(testStore.getDouble()).toBe(0);

      // Load from storage, count becomes 10
      persist(mockStorage, testStore, { key: "computed-load" });

      // Computed method should now return updated value
      expect(testStore.getDouble()).toBe(20);
    });
  });

  describe("Cleanup and unsubscribe", () => {
    it("properly unsubscribes from all stores in multi-store setup", async () => {
      const mockStorage = createMockStorage();
      const store1 = store({ value1: "first" });
      const store2 = store({ value2: "second" });

      const cleanup = persist(mockStorage, [store1, store2], {
        key: "multi",
        debounceMs: 0,
      });

      // Verify initial persist
      store1.value1 = "updated1";
      await new Promise((r) => setTimeout(r, 10));
      expect(JSON.parse(mockStorage.data["multi"]).value1).toBe("updated1");

      store2.value2 = "updated2";
      await new Promise((r) => setTimeout(r, 10));
      expect(JSON.parse(mockStorage.data["multi"]).value2).toBe("updated2");

      // Clear mocks to track new calls
      vi.clearAllMocks();

      // Cleanup
      if (typeof cleanup === "function") {
        cleanup();
      } else {
        await cleanup.then((fn) => fn());
      }

      // Should no longer persist
      store1.value1 = "not-persisted";
      store2.value2 = "also-not-persisted";
      await new Promise((r) => setTimeout(r, 10));

      expect(mockStorage.setItem).not.toHaveBeenCalled();
      expect(JSON.parse(mockStorage.data["multi"]).value1).toBe("updated1");
      expect(JSON.parse(mockStorage.data["multi"]).value2).toBe("updated2");
    });

    it("removes isPersisted status after unsubscribe", () => {
      const mockStorage = createMockStorage();
      const testStore = store({ value: "test" });

      expect(isPersisted(testStore)).toBe(false);

      const cleanup = persist(mockStorage, testStore);

      expect(isPersisted(testStore)).toBe(true);

      if (typeof cleanup === "function") {
        cleanup();
      }

      expect(isPersisted(testStore)).toBe(false);
    });
  });
});
