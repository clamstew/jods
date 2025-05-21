import type { PersistStorage } from "../types";

/**
 * Creates an IndexedDB storage adapter that implements the PersistStorage interface.
 *
 * @param dbName - The name of the IndexedDB database
 * @param storeName - The name of the object store
 * @returns A storage adapter compatible with persist()
 *
 * @example
 * ```js
 * import { store, persist } from "jods";
 * import { createIndexedDBStorage } from "jods/persist/adapters/indexeddb";
 *
 * const userStore = store({ name: "User", preferences: {} });
 * const dbStorage = createIndexedDBStorage("myAppDB", "userSettings");
 *
 * persist(dbStorage, userStore, { key: "user" });
 * ```
 */
export function createIndexedDBStorage(
  dbName: string,
  storeName: string
): PersistStorage {
  // Open database connection
  const openDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  return {
    async getItem(key) {
      const db = await openDB();
      return new Promise<string | null>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);

        // Clean up by closing the database once transaction completes
        transaction.oncomplete = () => db.close();
      });
    },

    async setItem(key, value) {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        // Clean up by closing the database once transaction completes
        transaction.oncomplete = () => db.close();
      });
    },

    async removeItem(key) {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        // Clean up by closing the database once transaction completes
        transaction.oncomplete = () => db.close();
      });
    },
  };
}
