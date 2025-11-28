import { useState, useEffect } from "preact/hooks";
import { Store, StoreState } from "../../core/store";
import { isComputed } from "../../core/computed";

/**
 * Creates a proxy that automatically resolves computed properties
 * when accessed, without calling them directly.
 */
function createComputedProxy<T extends object>(
  target: T,
  store: T & Store<T>
): T {
  return new Proxy(target, {
    get(obj, prop) {
      const value = Reflect.get(obj, prop);
      // If the property is a computed value, automatically invoke it with store
      if (isComputed(value)) {
        // Call the computed property with the store as the this context
        // Cast needed because ComputedValue<T> extends T for DX, but is still callable
        return (value as unknown as (this: typeof store) => unknown).call(store);
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
    // Set up subscription - store.subscribe handles signal subscriptions internally
    const unsubscribe = store.subscribe(() => {
      // Update component state only when the store actually changes
      setState(store.getState());
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [store]);

  // Return proxied state that auto-resolves computed properties
  return createComputedProxy(state, store);
}
