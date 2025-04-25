import { DiffResult } from "./types";
import { json } from "./json";
import { Store, StoreState } from "./store";

/**
 * Compares two objects and returns their differences
 * @param a - The first object
 * @param b - The second object
 * @returns An object containing differences, or undefined if objects are equal
 */
export function diff<T extends StoreState, U extends StoreState>(
  a: T | (T & Store<T>),
  b: U | (U & Store<U>)
): DiffResult | undefined {
  // Convert stores to plain objects
  const objA = json(a);
  const objB = json(b);

  // Check equality to avoid unnecessary diffing
  if (deepEqual(objA, objB)) {
    return undefined;
  }

  return createDiff(objA, objB);
}

/**
 * Recursively checks if two values are deeply equal
 */
function deepEqual(a: any, b: any): boolean {
  // Check for reference equality
  if (a === b) return true;

  // If either is null or not an object, they must be equal to pass the reference check
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  // Check if arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }

    return true;
  }

  // If one is array and the other is not, they're not equal
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Compare object keys
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Creates a diff object that describes the differences between two objects
 */
function createDiff(a: any, b: any): DiffResult {
  if (a === b) return {};

  // If b is undefined (property removed)
  if (b === undefined) {
    return { __old: a, __new: undefined };
  }

  // If a is undefined (property added)
  if (a === undefined) {
    return { __old: undefined, __new: b };
  }

  // If types differ
  if (typeof a !== typeof b) {
    return { __old: a, __new: b };
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    return createArrayDiff(a, b);
  }

  // Handle objects
  if (
    typeof a === "object" &&
    a !== null &&
    typeof b === "object" &&
    b !== null
  ) {
    return createObjectDiff(a, b);
  }

  // For primitives, just return the difference
  return { __old: a, __new: b };
}

/**
 * Creates a diff for two arrays
 */
function createArrayDiff(a: any[], b: any[]): DiffResult {
  const diff: DiffResult = {};

  // Store the maximum length
  const maxLength = Math.max(a.length, b.length);

  // Check if any element is different
  let hasDiff = false;

  for (let i = 0; i < maxLength; i++) {
    if (i >= a.length) {
      // Element added in b
      diff[i] = { __added: b[i] };
      hasDiff = true;
    } else if (i >= b.length) {
      // Element removed from a
      diff[i] = { __removed: a[i] };
      hasDiff = true;
    } else if (!deepEqual(a[i], b[i])) {
      // Element changed
      const elementDiff = createDiff(a[i], b[i]);
      if (Object.keys(elementDiff).length > 0) {
        diff[i] = elementDiff;
        hasDiff = true;
      }
    }
  }

  return hasDiff ? diff : {};
}

/**
 * Creates a diff for two objects
 */
function createObjectDiff(
  a: Record<string, any>,
  b: Record<string, any>
): DiffResult {
  const diff: DiffResult = {};

  // Get all keys from both objects
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  // Check each key for differences
  for (const key of keys) {
    if (!(key in a)) {
      // Property added in b
      diff[key] = { __added: b[key] };
    } else if (!(key in b)) {
      // Property removed from a
      diff[key] = { __removed: a[key] };
    } else if (!deepEqual(a[key], b[key])) {
      // Property changed
      const propertyDiff = createDiff(a[key], b[key]);
      if (Object.keys(propertyDiff).length > 0) {
        diff[key] = propertyDiff;
      }
    }
  }

  return diff;
}
