import { ComputeFunction } from "./types";

/**
 * Symbol for identifying computed properties
 */
export const COMPUTED_SYMBOL = Symbol("computed");

/**
 * Interface for computed value object
 */
export interface ComputedValue<T = any> {
  (): T;
  [COMPUTED_SYMBOL]: true;
}

/**
 * Creates a computed property that will recalculate its value
 * only when accessed and any of its dependencies have changed
 *
 * @param fn - The function to compute the value
 * @returns A function that returns the computed value
 */
export function computed<T>(fn: ComputeFunction<T>): ComputedValue<T> {
  // Create getter function
  const getter = () => fn();

  // Mark the function as computed
  Object.defineProperty(getter, COMPUTED_SYMBOL, {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return getter as ComputedValue<T>;
}

/**
 * Checks if a value is a computed property
 * @param value - The value to check
 * @returns True if the value is a computed property
 */
export function isComputed(value: any): value is ComputedValue {
  return (
    value && typeof value === "function" && value[COMPUTED_SYMBOL] === true
  );
}
