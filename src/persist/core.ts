import { debug } from "../utils/debug";
import type { Store } from "../core/store";
import type { StoreState } from "../core/store/types";
import type { PersistOptions, PersistStorage } from "./types";
import {
  defaultErrorHandler,
  createDebouncedSave,
  setupSubscriptions,
  markStoresAsPersisted,
  unmarkStoresAsPersisted,
} from "./utils";
import { loadDataAsync, loadDataSync } from "./storage";

// Initialize the persist debug category
// Safely add 'persist' to debug categories if needed
const existingCategories =
  Array.isArray((debug as any).categories) &&
  (debug as any).categories !== undefined
    ? (debug as any).categories
    : [];
debug.configure({
  categories: [...existingCategories, "persist"],
});

/**
 * Persists a JODS store's state to the given storage backend. On initialization,
 * it will load any existing state from storage into the store. Thereafter, it
 * will save the store's state to storage whenever the store changes (debounced
 * to limit frequency).
 *
 * @param storage - An object implementing the storage interface
 * @param storeOrStores - The store(s) to persist
 * @param options - Optional settings for key name, debounce interval, etc.
 * @returns A function to stop persistence or a Promise resolving to such a function
 */
export function persist<T extends StoreState>(
  storage: PersistStorage,
  store: Store<T>,
  options?: PersistOptions<T>
): (() => void) | Promise<() => void>;

export function persist<T extends Record<string, any>>(
  storage: PersistStorage,
  stores: Store<any>[],
  options?: PersistOptions<T>
): (() => void) | Promise<() => void>;

export function persist<T extends Record<string, any>>(
  storage: PersistStorage,
  storeOrStores: Store<any> | Store<any>[],
  options: PersistOptions<T> = {}
): (() => void) | Promise<() => void> {
  debug.log("persist", "Initializing persistence");

  // Normalize options with defaults
  const key = options.key ?? "jods";
  const handleError = options.onError ?? defaultErrorHandler;

  // Convert single store to array for consistent handling
  const stores = Array.isArray(storeOrStores) ? storeOrStores : [storeOrStores];

  // Mark stores as being persisted
  markStoresAsPersisted(stores, key, storage);

  // Create debounced save function
  const scheduleSave = createDebouncedSave(
    storage,
    key,
    options,
    handleError,
    stores
  );

  // Create cleanup function
  let unsubscribes: Array<() => void> = [];
  const cleanup = (): void => {
    debug.log("persist", `Cleaning up persistence for key: ${key}`);

    // Clean up any pending saves
    // Accessing private properties like saveTimer is not ideal. Consider refactoring createDebouncedSave to return a cleanup method.
    const debouncedSaveInstance = scheduleSave as any;
    if (debouncedSaveInstance.saveTimer) {
      clearTimeout(debouncedSaveInstance.saveTimer);
      debouncedSaveInstance.saveTimer = null;
    }

    // Unsubscribe all listeners
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    unsubscribes = [];

    // Remove persistence markers from stores
    unmarkStoresAsPersisted(stores);
  };

  // Check if storage is async or sync
  const maybePromise = storage.getItem(key);
  const isAsync = maybePromise instanceof Promise;

  // Handle async vs sync paths
  if (isAsync) {
    return loadDataAsync(storage, key, stores, options, handleError).then(
      () => {
        // If loadOnlyMode is true, don't subscribe to changes
        if (!options.loadOnlyMode) {
          unsubscribes = setupSubscriptions(stores, scheduleSave);
          debug.log(
            "persist",
            `Set up subscriptions for ${stores.length} store(s)`
          );
        }

        return cleanup;
      }
    );
  } else {
    // Synchronous path
    loadDataSync(storage, key, stores, options, handleError);

    // If loadOnlyMode is true, don't subscribe to changes
    if (!options.loadOnlyMode) {
      unsubscribes = setupSubscriptions(stores, scheduleSave);
      debug.log(
        "persist",
        `Set up subscriptions for ${stores.length} store(s) (sync)`
      );
    }

    return cleanup;
  }
}
