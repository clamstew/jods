import { isComputed } from "./computed";
import { Store, StoreState } from "./store";

/**
 * Creates a deep clone of an object with computed values resolved
 * @param obj - The object to clone
 * @param visited - WeakMap to track already visited objects (for circular references)
 * @returns A deep clone of the object
 */
function deepClone<T>(obj: T, visited = new WeakMap<object, any>()): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj as object)) {
    return visited.get(obj as object);
  }

  // Create result based on object type
  const result: any = Array.isArray(obj) ? [] : {};

  // Add to visited objects map before recursing to handle circular refs
  visited.set(obj as object, result);

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      result[i] = deepClone(obj[i], visited);
    }
    return result as unknown as T;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, any>)[key];

      if (isComputed(value)) {
        // If the value is computed, get its current value
        result[key] = value();
      } else if (typeof value === "object" && value !== null) {
        // Recursively clone nested objects with the same visited map
        result[key] = deepClone(value, visited);
      } else {
        // Use the value as is for primitives
        result[key] = value;
      }
    }
  }

  return result as T;
}

/**
 * Transforms a store into a plain JSON object with computed values resolved
 * Handles circular references by creating references to already visited objects
 * @param storeOrState - The store or state object to transform
 * @returns A plain JSON object
 */
export function json<T extends StoreState>(
  storeOrState: T | (T & Store<T>)
): T {
  // Check if it's a store or a plain object
  const state =
    "getState" in storeOrState ? storeOrState.getState() : storeOrState;

  // Create a clone without batch-related methods
  const cloned = deepClone(state);

  // Remove batch-related methods from the result
  if (cloned && typeof cloned === "object") {
    delete (cloned as any).batch;
    delete (cloned as any).beginBatch;
    delete (cloned as any).commitBatch;
  }

  return cloned;
}
