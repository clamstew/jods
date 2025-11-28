/**
 * Registry for tracking computed property definitions across stores.
 * This enables history time-travel to restore computed properties correctly.
 * 
 * Supports both direct and nested computed properties:
 * - Direct: `store.doubled = computed(...)`
 * - Nested: `store.stats.total = computed(...)` (path: "stats.total")
 * 
 * @module computed-registry
 */

import { ComputedValue } from "./computed";
import { Store, StoreState } from "./store/types";

/**
 * A single computed definition entry
 */
export interface ComputedDefinition {
  /** The computed value (the callable function returned by computed()) */
  computedValue: ComputedValue<any>;
  /** The history index when this definition was set (for versioned tracking) */
  historyIndex?: number;
}

/**
 * Map of property path -> array of definitions (for versioned history)
 * Path can be "key" for direct or "parent.child" for nested
 */
export type ComputedDefinitionsMap = Map<string, ComputedDefinition[]>;

/**
 * WeakMap from store to its computed definitions
 * Using WeakMap so stores can be garbage collected
 */
const storeComputedDefinitions = new WeakMap<object, ComputedDefinitionsMap>();

/**
 * WeakMap from store to its current history index
 * Updated by history module when navigating
 */
const storeHistoryIndex = new WeakMap<object, number>();

/**
 * WeakMap from nested object to its parent store
 * This allows nested proxies to register computed definitions on the main store
 */
const nestedObjectToStore = new WeakMap<object, { store: object; path: string }>();

/**
 * Get or create the computed definitions map for a store
 */
function getDefinitionsMap(store: object): ComputedDefinitionsMap {
  let map = storeComputedDefinitions.get(store);
  if (!map) {
    map = new Map();
    storeComputedDefinitions.set(store, map);
  }
  return map;
}

/**
 * Register a nested object's relationship to its parent store.
 * Called when accessing a nested object through the store proxy.
 * 
 * @param nestedObj - The nested object (e.g., store.stats)
 * @param store - The root store
 * @param path - The path from root (e.g., "stats")
 */
export function registerNestedObject<T extends StoreState>(
  nestedObj: object,
  store: T & Store<T>,
  path: string
): void {
  nestedObjectToStore.set(nestedObj, { store, path });
}

/**
 * Get the root store for a nested object
 */
export function getRootStoreForNestedObject(nestedObj: object): { store: object; path: string } | undefined {
  return nestedObjectToStore.get(nestedObj);
}

/**
 * Register a computed property definition for a store.
 * Supports both direct properties and nested paths.
 * 
 * @param store - The store instance (or nested object)
 * @param key - The property key (or full path for nested)
 * @param computedValue - The computed value (returned by computed())
 */
export function registerComputedDefinition<T extends StoreState>(
  store: T & Store<T>,
  key: string,
  computedValue: ComputedValue<any>
): void {
  // Check if this is actually a nested object
  const nestedInfo = nestedObjectToStore.get(store);
  const rootStore = nestedInfo ? nestedInfo.store : store;
  const fullPath = nestedInfo ? `${nestedInfo.path}.${key}` : key;
  
  const map = getDefinitionsMap(rootStore);
  const currentIndex = storeHistoryIndex.get(rootStore) ?? 0;
  
  // Get existing definitions for this path
  let definitions = map.get(fullPath);
  if (!definitions) {
    definitions = [];
    map.set(fullPath, definitions);
  }
  
  // Add new definition with current history index
  definitions.push({
    computedValue,
    historyIndex: currentIndex,
  });
}

/**
 * Get the computed definition for a property path at a specific history index.
 * Returns the definition that was active at that point in history.
 * 
 * @param store - The store instance
 * @param path - The property path (e.g., "doubled" or "stats.total")
 * @param historyIndex - The history index to look up
 * @returns The computed value, or undefined if none exists
 */
export function getComputedDefinition<T extends StoreState>(
  store: T & Store<T>,
  path: string,
  historyIndex: number
): ComputedValue<any> | undefined {
  const map = storeComputedDefinitions.get(store);
  if (!map) return undefined;
  
  const definitions = map.get(path);
  if (!definitions || definitions.length === 0) return undefined;
  
  // Find the definition that was active at the given history index
  // Walk backwards through definitions to find the most recent one <= historyIndex
  let bestMatch: ComputedDefinition | undefined;
  for (const def of definitions) {
    if (def.historyIndex !== undefined && def.historyIndex <= historyIndex) {
      if (!bestMatch || (def.historyIndex > (bestMatch.historyIndex ?? -1))) {
        bestMatch = def;
      }
    }
  }
  
  // If no versioned match found, use the first definition (initial computed)
  if (!bestMatch && definitions.length > 0) {
    bestMatch = definitions[0];
  }
  
  return bestMatch?.computedValue;
}

/**
 * Get all computed property paths for a store
 * Includes both direct properties and nested paths
 * 
 * @param store - The store instance
 * @returns Array of property paths that have computed definitions
 */
export function getComputedKeys<T extends StoreState>(
  store: T & Store<T>
): string[] {
  const map = storeComputedDefinitions.get(store);
  if (!map) return [];
  return Array.from(map.keys());
}

/**
 * Set a value at a nested path in an object
 * 
 * @param obj - The root object
 * @param path - Dot-separated path (e.g., "stats.total")
 * @param value - The value to set
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split(".");
  let current = obj;
  
  // Navigate to the parent of the target property
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Set the final property
  const finalKey = parts[parts.length - 1];
  current[finalKey] = value;
}

/**
 * Update the current history index for a store.
 * Called by the history module when navigating.
 * 
 * @param store - The store instance
 * @param index - The current history index
 */
export function setStoreHistoryIndex<T extends StoreState>(
  store: T & Store<T>,
  index: number
): void {
  storeHistoryIndex.set(store, index);
}

/**
 * Get the current history index for a store
 * 
 * @param store - The store instance
 * @returns The current history index, or 0 if not set
 */
export function getStoreHistoryIndex<T extends StoreState>(
  store: T & Store<T>
): number {
  return storeHistoryIndex.get(store) ?? 0;
}

/**
 * Clear all computed definitions for a store.
 * Useful for cleanup or testing.
 * 
 * @param store - The store instance
 */
export function clearComputedDefinitions<T extends StoreState>(
  store: T & Store<T>
): void {
  storeComputedDefinitions.delete(store);
  storeHistoryIndex.delete(store);
}

