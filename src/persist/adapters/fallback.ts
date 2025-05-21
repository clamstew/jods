import type { PersistStorage } from "../types";
import { createMemoryStorage } from "./memory";

/**
 * Creates a composite storage adapter that tries multiple storage mechanisms in order.
 * If a storage mechanism fails, it falls back to the next one in the list.
 *
 * @param storages - Array of storage mechanisms to try in order
 * @returns A storage adapter compatible with persist()
 *
 * @example
 * ```js
 * import { store, persist } from "jods";
 * import { createFallbackStorage, createMemoryStorage } from "jods/persist/adapters";
 *
 * // Create a storage that tries localStorage first, falls back to sessionStorage,
 * // and finally falls back to memory storage
 * const fallbackStorage = createFallbackStorage([
 *   localStorage,
 *   sessionStorage,
 *   createMemoryStorage()
 * ]);
 *
 * const appState = store({
 *   theme: "light",
 *   notifications: true
 * });
 *
 * persist(fallbackStorage, appState, { key: "app-state" });
 * ```
 */
export function createFallbackStorage(
  storages: PersistStorage[]
): PersistStorage {
  // Create memory storage as final fallback
  const memoryStorage = createMemoryStorage();

  // Check if storage is available (simplified browser storage check)
  const isStorageAvailable = (storage: PersistStorage): boolean => {
    try {
      const testKey = "__storage_test__";
      storage.setItem?.(testKey, testKey);
      storage.removeItem?.(testKey);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return false;
    }
  };

  // Verify available storages
  const availableStorages = storages.filter((storage) => {
    try {
      return isStorageAvailable(storage);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return false;
    }
  });

  return {
    async getItem(key) {
      // Try each storage in order
      for (const storage of availableStorages) {
        try {
          const result = await storage.getItem?.(key);
          if (result !== null) {
            return result;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Continue to next storage on error
          continue;
        }
      }

      // Final fallback to memory storage
      return memoryStorage.getItem(key);
    },

    async setItem(key, value) {
      // Try to write to each storage
      let lastError = null;

      for (const storage of availableStorages) {
        try {
          await storage.setItem?.(key, value);
          return; // Successfully saved, exit early
        } catch (e) {
          lastError = e;
          // Continue to next storage on error
          continue;
        }
      }

      // If all failed, use memory storage
      memoryStorage.setItem(key, value);

      // If we reached here with an error but saved to memory,
      // we might want to log a warning
      if (lastError && availableStorages.length > 0) {
        console.warn(
          "Failed to write to preferred storage mechanisms, falling back to memory storage",
          lastError
        );
      }
    },

    async removeItem(key) {
      // Remove from all storages to maintain consistency
      const promises = availableStorages.map((storage) => {
        try {
          return storage.removeItem?.(key);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Ignore errors on remove
          return Promise.resolve();
        }
      });

      await Promise.all(promises);

      // Also remove from memory fallback
      memoryStorage.removeItem?.(key);
    },
  };
}
