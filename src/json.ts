import { isComputed } from "./computed";
import { Store, StoreState } from "./store";

/**
 * Creates a deep clone of an object with computed values resolved
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const result = {} as Record<string, any>;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, any>)[key];

      if (isComputed(value)) {
        // If the value is computed, get its current value
        result[key] = value();
      } else if (typeof value === "object" && value !== null) {
        // Recursively clone nested objects
        result[key] = deepClone(value);
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
 * @param storeOrState - The store or state object to transform
 * @returns A plain JSON object
 */
export function json<T extends StoreState>(
  storeOrState: T | (T & Store<T>)
): T {
  // Check if it's a store or a plain object
  const state =
    "getState" in storeOrState ? storeOrState.getState() : storeOrState;
  return deepClone(state);
}
