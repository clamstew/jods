import { Signal } from "../../types";

// Track the current subscriber function
let currentSubscriber: (() => void) | null = null;

/**
 * Gets the currently active subscriber
 */
export const getCurrentSubscriber = () => currentSubscriber;

/**
 * Sets the current active subscriber
 */
export const setCurrentSubscriber = (fn: (() => void) | null) => {
  currentSubscriber = fn;
};

/**
 * Creates a signal with the given initial value
 * @param initialValue The initial value of the signal
 * @returns A tuple of [read, write] functions
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  function read(): T {
    // Track the current subscriber if one is active
    if (currentSubscriber !== null) {
      subscribers.add(currentSubscriber);
    }
    // Expose subscribers set for cleanup during unsubscribe
    (read as any).subscribers = subscribers;
    return value;
  }

  function write(newValue: T): boolean {
    // Use Object.is for proper equality check
    if (Object.is(value, newValue)) return false;
    value = newValue;

    // Notify all direct subscribers for this signal (e.g., computed's markDirty)
    const callbacksToRun = [...subscribers];
    for (const callback of callbacksToRun) {
      callback();
    }
    return true;
  }

  return [read, write];
}
