import { json } from "../core/json";
import { onUpdate } from "../core/life-cycle/on-update";
import { debug } from "../utils/debug";
import type { Store } from "../core/store";
import type {
  PersistStorage,
  PersistOptions,
  VersionedState,
  PersistOperation,
  PersistMeta,
} from "./types";
import {
  applySecurityFiltering,
  filterNestedObject,
  shouldPersistProperty,
} from "./security";
import { saveStateToStorage } from "./storage"; // Import from local storage.ts

/**
 * Symbol used to track which stores are being persisted
 */
const PERSIST_SYMBOL = Symbol("jods.persisted");

/**
 * Default error handler that logs to debug
 */
export function defaultErrorHandler(
  error: Error,
  operation: PersistOperation
): void {
  debug.error("persist", `Error during ${operation} operation:`, error);
}

/**
 * Apply loaded data to a single store, skipping the version property
 */
function applyDataToSingleStore<T>(
  data: VersionedState<T>,
  store: Store<any>
): void {
  if (!data || typeof data !== "object") {
    return;
  }

  for (const key in data) {
    if (key !== "version" && Object.prototype.hasOwnProperty.call(data, key)) {
      try {
        // Handle circular references by using structured clone if available
        if (typeof structuredClone === "function") {
          (store as Record<string, any>)[key] = structuredClone(
            (data as Record<string, any>)[key]
          );
        } else {
          (store as Record<string, any>)[key] = (data as Record<string, any>)[
            key
          ];
        }
      } catch (err) {
        debug.warn("persist", `Error assigning property ${key}:`, err);
        // Fall back to direct assignment if structured clone fails
        (store as Record<string, any>)[key] = (data as Record<string, any>)[
          key
        ];
      }
    }
  }
}

/**
 * Apply data to multiple stores, matching properties to the appropriate store
 */
function applyDataToMultipleStores<T>(
  data: VersionedState<T>,
  stores: Store<any>[]
): void {
  if (!data || typeof data !== "object") {
    return;
  }

  // Track which properties have been applied to avoid duplicates
  const appliedProps = new Set<string>();

  for (const store of stores) {
    for (const key in data) {
      if (
        key !== "version" &&
        Object.prototype.hasOwnProperty.call(data, key) &&
        key in store &&
        !appliedProps.has(key)
      ) {
        try {
          // Handle circular references by using structured clone if available
          if (typeof structuredClone === "function") {
            (store as Record<string, any>)[key] = structuredClone(
              (data as Record<string, any>)[key]
            );
          } else {
            (store as Record<string, any>)[key] = (data as Record<string, any>)[
              key
            ];
          }
          appliedProps.add(key);
        } catch (err) {
          debug.warn("persist", `Error assigning property ${key}:`, err);
          // Fall back to direct assignment if structured clone fails
          (store as Record<string, any>)[key] = (data as Record<string, any>)[
            key
          ];
          appliedProps.add(key);
        }
      }
    }
  }
}

/**
 * Apply loaded data to stores
 */
export function applyLoadedData<T>(
  data: VersionedState<T>,
  stores: Store<any>[]
): void {
  if (!data || typeof data !== "object") {
    return;
  }

  // For a single store
  if (stores.length === 1) {
    applyDataToSingleStore(data, stores[0]);
    return;
  }

  // For multiple stores
  applyDataToMultipleStores(data, stores);
}

/**
 * Set up subscriptions to all stores
 */
export function setupSubscriptions<T>(
  stores: Store<any>[],
  save: (state: VersionedState<T>) => void
): (() => void)[] {
  const unsubscribes = stores.map((store) => {
    return onUpdate(store, () => {
      const combinedState = getCombinedState(stores);
      save(combinedState as VersionedState<T>);
    });
  });

  return unsubscribes;
}

/**
 * Get combined state from all stores
 */
export function getCombinedState<T>(stores: Store<any>[]): T {
  // For a single store, just use its state
  if (stores.length === 1) {
    return json(stores[0]);
  }

  // For multiple stores, combine their states
  const combinedState: Record<string, any> = {};
  for (const storeItem of stores) {
    const storeState = json(storeItem);
    // Check for property name collisions
    for (const key in storeState) {
      if (Object.prototype.hasOwnProperty.call(combinedState, key)) {
        debug.warn(
          "persist",
          `Property "${key}" exists in multiple stores and may be overwritten`
        );
      }
    }
    Object.assign(combinedState, storeState);
  }

  return combinedState as unknown as T;
}

/**
 * Create a debounced save function for persisting state
 */
export function createDebouncedSave<T>(
  storage: PersistStorage,
  key: string,
  options: PersistOptions<T>,
  handleError: (err: Error, op: PersistOperation) => void,
  stores: Store<any>[]
): (state: VersionedState<T>) => void {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingState: VersionedState<T> | null = null;
  const debounceMs = options.debounceMs ?? options.throttleMs ?? 100;
  const serialize = options.serialize ?? JSON.stringify;

  return (state: VersionedState<T>): void => {
    // For single store, use it for security filtering
    if (stores.length === 1) {
      state = applySecurityFiltering(state, options, stores[0]);
    } else {
      // For multiple stores, we need more complex handling
      // Security filtering needs to know which store owns each property

      // First, get the original property assignments
      const storePropertyMap = new Map<string, Store<any>>();
      for (const store of stores) {
        const storeState = json(store);
        for (const key in storeState) {
          if (
            Object.prototype.hasOwnProperty.call(storeState, key) &&
            key !== "version"
          ) {
            storePropertyMap.set(key, store);
          }
        }
      }

      // Now do property-by-property filtering
      const filteredState: Record<string, any> = {};

      // Always preserve version information
      if (state.version !== undefined) {
        filteredState.version = state.version;
      }

      // Check each top-level property
      for (const key in state) {
        if (key === "version") continue; // Already handled

        const ownerStore = storePropertyMap.get(key);
        if (shouldPersistProperty(key, state[key], [], options, ownerStore)) {
          // If it's an object, recursively filter its properties
          if (
            typeof state[key] === "object" &&
            state[key] !== null &&
            !Array.isArray(state[key])
          ) {
            filteredState[key] = filterNestedObject(
              state[key],
              [key],
              options,
              ownerStore
            );
          } else {
            filteredState[key] = state[key];
          }
        }
      }

      state = filteredState as VersionedState<T>;
    }

    // Apply partial selector if provided
    if (options.partial) {
      state = options.partial(state) as VersionedState<T>;
    }

    // Add version if specified
    if (options.version !== undefined) {
      state.version = options.version;
    }

    pendingState = state;

    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
      saveTimer = null;
      if (pendingState === null) return;

      const stateToSave = pendingState;
      pendingState = null;

      saveStateToStorage(storage, key, stateToSave, serialize, handleError);
    }, debounceMs);
  };
}

/**
 * Mark stores as being persisted
 */
export function markStoresAsPersisted(
  stores: Store<any>[],
  key: string,
  storage: PersistStorage
): void {
  for (const store of stores) {
    (store as any)[PERSIST_SYMBOL] = {
      key,
      storage,
    };
  }
}

/**
 * Remove persistence markers from stores
 */
export function unmarkStoresAsPersisted(stores: Store<any>[]): void {
  for (const store of stores) {
    delete (store as any)[PERSIST_SYMBOL];
  }
}

/**
 * Type guard to check if a value is a PersistStorage implementation
 */
export function isPersistStorage(value: unknown): value is PersistStorage {
  return (
    typeof value === "object" &&
    value !== null &&
    "getItem" in value &&
    "setItem" in value &&
    typeof (value as PersistStorage).getItem === "function" &&
    typeof (value as PersistStorage).setItem === "function"
  );
}

/**
 * Type guard to check if a store is being persisted
 */
export function isPersisted(store: unknown): boolean {
  return (
    typeof store === "object" &&
    store !== null &&
    PERSIST_SYMBOL in (store as any)
  );
}

/**
 * Get persistence metadata from a store if it exists
 * Used internally by helper functions like clearPersisted
 */
export function getPersistMeta(store: unknown): PersistMeta | undefined {
  if (!isPersisted(store)) return undefined;
  return (store as any)[PERSIST_SYMBOL];
}

/**
 * Export PERSIST_SYMBOL for use in core.ts or other modules if needed.
 */
export { PERSIST_SYMBOL };
