import { StoreState } from "../core/store";

/**
 * Type for changes that can include null values (to indicate deletion)
 */
export type Changes<T extends StoreState> = {
  [K in keyof T]?: T[K] | null | { __old?: T[K]; __new: T[K] } | Changes<any>;
};

/**
 * Applies a patch to an object, modifying it in-place
 * @param target - Object to patch
 * @param changes - Changes to apply to the target
 * @returns The modified target object
 */
export function patch<T extends StoreState>(target: T, changes: Changes<T>): T {
  if (!changes || typeof changes !== "object") {
    return target;
  }

  for (const key in changes) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      const value = changes[key];

      // Handle deletions (null values)
      if (value === null && key in target) {
        delete target[key];
        continue;
      }

      // Handle diff format (__old/__new)
      if (value && typeof value === "object" && "__new" in value) {
        target[key as keyof T] = value.__new as any;
        continue;
      }

      // Handle nested objects recursively
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        target[key] &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        // Recursively patch nested objects
        patch(target[key] as any, value as Changes<any>);
        continue;
      }

      // Apply changes to the target
      if (value !== undefined) {
        // Only assign if value is not undefined
        target[key as keyof T] = value as any;
      }
    }
  }

  return target;
}
