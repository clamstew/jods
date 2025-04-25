import { useState, useEffect } from "preact/hooks";
import { Store, StoreState } from "../store";
import { isComputed } from "../computed";

/**
 * Creates a proxy that automatically resolves computed properties
 * when accessed, without calling them directly.
 */
function createComputedProxy<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop);
      // If the property is a computed value, automatically call it
      if (isComputed(value)) {
        return value();
      }
      return value;
    },
  });
}

/**
 * Preact-specific hook to subscribe to a Jods store and get its state.
 * Automatically resolves computed properties when accessed.
 *
 * @param store The store to subscribe to
 * @returns The current state of the store with computed properties automatically resolved
 */
export function useJods<T extends StoreState>(store: T & Store<T>): T {
  // Get the current state - ensure we have a valid state to start with
  const [state, setState] = useState<T>(() => store.getState());

  // Subscribe to the store
  useEffect(() => {
    // Set up subscription to receive updates
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [store]);

  // Return proxied state that auto-resolves computed properties
  return createComputedProxy(state);
}
