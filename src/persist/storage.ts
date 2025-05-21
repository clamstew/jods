import { debug } from "../utils/debug";
import type {
  PersistStorage,
  PersistOptions,
  VersionedState,
  PersistOperation,
} from "./types";
import type { Store } from "../core/store";
import { applyLoadedData } from "./utils"; // Will be created later

/**
 * Save state to storage with error handling
 */
export function saveStateToStorage<T>(
  storage: PersistStorage,
  key: string,
  state: VersionedState<T>,
  serialize: (state: VersionedState<T>) => string,
  handleError: (err: Error, op: PersistOperation) => void
): void {
  let serialized: string;
  try {
    serialized = serialize(state);
    debug.log("persist", `Saving data to key: ${key}`);
  } catch (err) {
    handleError(err as Error, "save");
    return;
  }

  try {
    const result = storage.setItem(key, serialized);
    if (result instanceof Promise) {
      result.catch((err: Error) => {
        handleError(err, "save");
      });
    }
  } catch (err) {
    handleError(err as Error, "save");
  }
}

/**
 * Load data from storage asynchronously
 */
export async function loadDataAsync<T>(
  storage: PersistStorage,
  key: string,
  stores: Store<any>[],
  options: PersistOptions<T>,
  handleError: (err: Error, op: PersistOperation) => void
): Promise<void> {
  debug.log("persist", `Loading data from key: ${key} (async)`);

  try {
    const storedValue = await storage.getItem(key);
    if (storedValue != null) {
      let state: VersionedState<T>;
      try {
        const deserialize = options.deserialize ?? JSON.parse;
        state = deserialize(storedValue);
      } catch (err) {
        handleError(err as Error, "load");
        return;
      }

      // Apply migration if version changed
      if (
        options.migrate &&
        options.version !== undefined &&
        state.version !== options.version
      ) {
        try {
          debug.log(
            "persist",
            `Migrating from version ${state.version} to ${options.version}`
          );
          state = options.migrate(state);
        } catch (err) {
          handleError(err as Error, "load");
          return;
        }
      }

      // Validate state if a validator is provided
      if (options.validate) {
        try {
          const validationResult = options.validate(state);
          const isValid =
            typeof validationResult === "boolean"
              ? validationResult
              : validationResult.valid;

          if (!isValid) {
            const message =
              typeof validationResult === "boolean"
                ? "Validation failed"
                : validationResult.message || "Validation failed";

            const validationError = new Error(message);
            handleError(validationError, "load");
            return;
          }
        } catch (err) {
          handleError(err as Error, "load");
          return;
        }
      }

      // Apply state to stores
      applyLoadedData(state, stores);
    }
  } catch (err) {
    handleError(err as Error, "load");
  }
}

/**
 * Load data from storage synchronously
 */
export function loadDataSync<T>(
  storage: PersistStorage,
  key: string,
  stores: Store<any>[],
  options: PersistOptions<T>,
  handleError: (err: Error, op: PersistOperation) => void
): void {
  debug.log("persist", `Loading data from key: ${key} (sync)`);

  try {
    const storedValue = storage.getItem(key) as string | null;
    if (storedValue != null) {
      let state: VersionedState<T>;
      try {
        const deserialize = options.deserialize ?? JSON.parse;
        state = deserialize(storedValue);
      } catch (err) {
        handleError(err as Error, "load");
        return;
      }

      // Apply migration if version changed
      if (
        options.migrate &&
        options.version !== undefined &&
        state.version !== options.version
      ) {
        try {
          debug.log(
            "persist",
            `Migrating from version ${state.version} to ${options.version}`
          );
          state = options.migrate(state);
        } catch (err) {
          handleError(err as Error, "load");
          return;
        }
      }

      // Validate state if a validator is provided
      if (options.validate) {
        try {
          const validationResult = options.validate(state);
          const isValid =
            typeof validationResult === "boolean"
              ? validationResult
              : validationResult.valid;

          if (!isValid) {
            const message =
              typeof validationResult === "boolean"
                ? "Validation failed"
                : validationResult.message || "Validation failed";

            const validationError = new Error(message);
            handleError(validationError, "load");
            return;
          }
        } catch (err) {
          handleError(err as Error, "load");
          return;
        }
      }

      // Apply state to stores
      applyLoadedData(state, stores);
    }
  } catch (err) {
    handleError(err as Error, "load");
  }
}

/**
 * Clears persisted state from storage
 */
export function clearPersisted(
  storage: PersistStorage,
  key: string = "jods"
): void | Promise<void> {
  debug.log("persist", `Clearing persisted data for key: ${key}`);

  if (storage.removeItem) {
    return storage.removeItem(key);
  } else {
    return storage.setItem(key, "");
  }
}

/**
 * Gets persisted state from storage without applying it to a store
 */
export function getPersisted<T>(
  storage: PersistStorage,
  key: string = "jods"
): T | null | Promise<T | null> {
  debug.log("persist", `Getting persisted data for key: ${key}`);

  const result = storage.getItem(key);

  if (result instanceof Promise) {
    return result.then((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    });
  } else {
    if (!result) return null;
    try {
      return JSON.parse(result) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Checks if persistence is available for the given storage
 */
export function isPersistAvailable(
  storage: PersistStorage
): boolean | Promise<boolean> {
  const testKey = "jods-test-" + Math.random().toString(36).substring(2, 9);
  debug.log("persist", "Testing storage availability");

  try {
    // Try to write to storage
    const result = storage.setItem(testKey, "test");

    const cleanup = () => {
      try {
        if (storage.removeItem) {
          storage.removeItem(testKey);
        } else {
          storage.setItem(testKey, "");
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    if (result instanceof Promise) {
      return result
        .then(() => {
          cleanup();
          debug.log("persist", "Async storage is available");
          return true;
        })
        .catch(() => {
          debug.log("persist", "Async storage is NOT available");
          return false;
        });
    } else {
      cleanup();
      debug.log("persist", "Sync storage is available");
      return true;
    }
  } catch {
    debug.log("persist", "Storage is NOT available");
    return false;
  }
}
