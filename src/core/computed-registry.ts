/**
 * Registry for tracking computed property definitions across stores.
 * This enables history time-travel to restore computed properties correctly.
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
 * Map of property key -> array of definitions (for versioned history)
 * Each definition includes the history index when it was set
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
 * Register a computed property definition for a store.
 * Called when user assigns a computed value to a store property.
 * 
 * @param store - The store instance
 * @param key - The property key
 * @param computedValue - The computed value (returned by computed())
 */
export function registerComputedDefinition<T extends StoreState>(
  store: T & Store<T>,
  key: string,
  computedValue: ComputedValue<any>
): void {
  const map = getDefinitionsMap(store);
  const currentIndex = storeHistoryIndex.get(store) ?? 0;
  
  // Get existing definitions for this key
  let definitions = map.get(key);
  if (!definitions) {
    definitions = [];
    map.set(key, definitions);
  }
  
  // Add new definition with current history index
  definitions.push({
    computedValue,
    historyIndex: currentIndex,
  });
}

/**
 * Get the computed definition for a property at a specific history index.
 * Returns the definition that was active at that point in history.
 * 
 * @param store - The store instance
 * @param key - The property key
 * @param historyIndex - The history index to look up
 * @returns The computed value, or undefined if none exists
 */
export function getComputedDefinition<T extends StoreState>(
  store: T & Store<T>,
  key: string,
  historyIndex: number
): ComputedValue<any> | undefined {
  const map = storeComputedDefinitions.get(store);
  if (!map) return undefined;
  
  const definitions = map.get(key);
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
 * Get all computed property keys for a store
 * 
 * @param store - The store instance
 * @returns Array of property keys that have computed definitions
 */
export function getComputedKeys<T extends StoreState>(
  store: T & Store<T>
): string[] {
  const map = storeComputedDefinitions.get(store);
  if (!map) return [];
  return Array.from(map.keys());
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

