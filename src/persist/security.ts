import { debug } from "../utils/debug";
import type { Store } from "../core/store"; // Adjusted path
import type { PersistOptions, VersionedState } from "./types"; // Import from local types.ts

/**
 * Symbol to mark properties that should never be persisted
 */
export const NEVER_PERSIST = Symbol("jods.neverPersist");

/**
 * Symbol to mark properties that should always be persisted
 */
export const ALWAYS_PERSIST = Symbol("jods.alwaysPersist");

/**
 * Checks if a property should be persisted based on security options
 */
export function shouldPersistProperty<T>(
  key: string,
  value: any,
  path: string[] = [],
  options: PersistOptions<T> = {},
  store?: Store<any>
): boolean {
  const fullPath = path.length > 0 ? [...path, key].join(".") : key;

  // If store has NEVER_PERSIST metadata, check if this property is in the list
  if (store && NEVER_PERSIST in store) {
    const neverPersistList = (store as any)[NEVER_PERSIST];
    if (Array.isArray(neverPersistList)) {
      for (const neverPersistPath of neverPersistList) {
        if (
          neverPersistPath === key ||
          neverPersistPath === fullPath ||
          fullPath.startsWith(`${neverPersistPath}.`) ||
          (path.length === 0 && key.startsWith(`${neverPersistPath}.`))
        ) {
          debug.log(
            "persist",
            `Excluding property marked as never persist: ${fullPath}`
          );
          return false;
        }
      }
    }
  }

  // If store has ALWAYS_PERSIST metadata and this property is in the list, always persist it
  if (store && ALWAYS_PERSIST in store) {
    const alwaysPersistList = (store as any)[ALWAYS_PERSIST];
    if (Array.isArray(alwaysPersistList)) {
      for (const alwaysPersistPath of alwaysPersistList) {
        if (
          alwaysPersistPath === key ||
          alwaysPersistPath === fullPath ||
          fullPath.startsWith(`${alwaysPersistPath}.`) ||
          (path.length === 0 && key.startsWith(`${alwaysPersistPath}.`))
        ) {
          debug.log("persist", `Always persisting property: ${fullPath}`);
          return true;
        }
      }
    }
  }

  // Check sensitive keys (highest priority)
  if (
    options.sensitiveKeys?.includes(fullPath) ||
    options.sensitiveKeys?.includes(key)
  ) {
    debug.log("persist", `Excluding sensitive key: ${fullPath}`);
    return false;
  }

  // Check explicit allow list (if provided)
  if (options.allowList && options.allowList.length > 0) {
    const isAllowed = options.allowList.some(
      (allowedPattern) =>
        fullPath === allowedPattern || // Exact match for the current path
        allowedPattern.startsWith(fullPath + ".") // Current path is an ancestor of an allowed path
    );

    if (!isAllowed) {
      debug.log(
        "persist",
        `Excluding key not in allowList (or not an ancestor of an allowed item): ${fullPath}`
      );
      return false;
    }
  }

  // Check explicit deny list
  if (
    options.denyList?.some(
      (denied) =>
        denied === fullPath ||
        denied === key ||
        fullPath.startsWith(`${denied}.`) ||
        (path.length === 0 && key.startsWith(`${denied}.`))
    )
  ) {
    debug.log("persist", `Excluding denied key: ${fullPath}`);
    return false;
  }

  // Use custom filter if provided
  if (options.persistenceFilter) {
    const shouldPersist = options.persistenceFilter(key, value, path);
    if (!shouldPersist) {
      debug.log("persist", `Custom filter excluded key: ${fullPath}`);
    }
    return shouldPersist;
  }

  return true;
}

/**
 * Applies security filtering to the state object
 */
export function applySecurityFiltering<T>(
  state: VersionedState<T>,
  options: PersistOptions<T>,
  store?: Store<any>
): VersionedState<T> {
  // If no security options are provided and no store persistence boundaries, return the state as is
  if (
    !options.sensitiveKeys?.length &&
    !options.allowList?.length &&
    !options.denyList?.length &&
    !options.persistenceFilter &&
    (!store || (!(NEVER_PERSIST in store) && !(ALWAYS_PERSIST in store)))
  ) {
    return state;
  }

  // Create a filtered copy of the state
  const filteredState: Record<string, any> = {};

  // Always preserve version information
  if (state.version !== undefined) {
    filteredState.version = state.version;
  }

  // Check each top-level property
  for (const key in state) {
    if (key === "version") continue; // Already handled

    if (shouldPersistProperty(key, state[key], [], options, store)) {
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
          store
        );
      } else {
        filteredState[key] = state[key];
      }
    }
  }

  return filteredState as VersionedState<T>;
}

/**
 * Recursively filters nested objects based on security options
 */
export function filterNestedObject<T>(
  obj: Record<string, any>,
  path: string[],
  options: PersistOptions<T>,
  store?: Store<any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    const currentPath = [...path, key];

    if (shouldPersistProperty(key, obj[key], path, options, store)) {
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        result[key] = filterNestedObject(obj[key], currentPath, options, store);
      } else {
        result[key] = obj[key];
      }
    }
  }

  return result;
}
