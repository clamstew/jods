import type { PersistStorage } from "../types";

/**
 * Creates a REST API storage adapter that implements the PersistStorage interface.
 *
 * @param endpoint - The base API endpoint for state storage
 * @param authToken - Optional authentication token for API requests
 * @param options - Optional configuration for request behavior
 * @returns A storage adapter compatible with persist()
 *
 * @example
 * ```js
 * import { store, persist } from "jods";
 * import { createAPIStorage } from "jods/persist/adapters/api";
 *
 * const userStore = store({ name: "User", preferences: {} });
 * const apiStorage = createAPIStorage(
 *   "https://api.example.com/state",
 *   "user-auth-token"
 * );
 *
 * persist(apiStorage, userStore, { key: "user" });
 * ```
 */
export function createAPIStorage(
  endpoint: string,
  authToken?: string,
  options?: {
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
  }
): PersistStorage {
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options?.headers || {}),
  };

  return {
    async getItem(key) {
      try {
        const response = await fetch(`${endpoint}/${key}`, {
          headers: defaultHeaders,
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Item not found
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.text();
        return data;
      } catch (error) {
        console.error("Failed to get item:", error);
        return null;
      }
    },

    async setItem(key, value) {
      try {
        const response = await fetch(`${endpoint}/${key}`, {
          method: "PUT",
          headers: defaultHeaders,
          body: value,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to set item:", error);
        throw error;
      }
    },

    async removeItem(key) {
      try {
        const response = await fetch(`${endpoint}/${key}`, {
          method: "DELETE",
          headers: defaultHeaders,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to remove item:", error);
        throw error;
      }
    },
  };
}
