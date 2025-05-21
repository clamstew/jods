import type { PersistStorage } from "../types";

/**
 * Creates an in-memory storage adapter that implements the PersistStorage interface.
 * Useful for testing or temporary storage that doesn't persist across page reloads.
 *
 * @param initialData - Optional initial data to populate the storage
 * @returns A storage adapter compatible with persist()
 *
 * @example
 * ```js
 * import { store, persist } from "jods";
 * import { createMemoryStorage } from "jods/persist/adapters/memory";
 *
 * const tempStore = store({ count: 0 });
 * const memoryStorage = createMemoryStorage();
 *
 * persist(memoryStorage, tempStore, { key: "temp" });
 * ```
 */
export function createMemoryStorage(
  initialData: Record<string, string> = {}
): PersistStorage & {
  clear: () => void;
  getAll: () => Record<string, string>;
} {
  // Create a copy of the initialData to prevent mutation of the passed object
  let storage = { ...initialData };

  return {
    getItem(key) {
      return storage[key] || null;
    },

    setItem(key, value) {
      storage[key] = value;
    },

    removeItem(key) {
      delete storage[key];
    },

    // Helper method to clear all data (not required by the interface)
    clear() {
      storage = {};
    },

    // Helper method to get all stored data (not required by the interface)
    getAll() {
      return { ...storage };
    },
  };
}
