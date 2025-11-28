import { Store, StoreState } from "../../core/store";
import { isComputed } from "../../core/computed";
import { getBasicHooks } from "../../utils/reactUtils";

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
      // If the property is a computed value, automatically invoke it with store as 'this' context
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
 * React hook to use JODS stores in components
 * Compatible with React 16.8+ and Preact
 *
 * @param store - The JODS store to subscribe to
 * @returns The current state of the store with computed properties automatically resolved when accessed
 *
 * @example
 * ```jsx
 * import { useJods } from 'jods/react';
 * import { userStore } from './stores/user';
 *
 * function UserProfile() {
 *   const user = useJods(userStore);
 *
 *   return (
 *     <div>
 *       <h1>{user.fullName}</h1>
 *       <button onClick={() => userStore.isActive = !userStore.isActive}>
 *         Toggle Active Status
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useJods<T extends StoreState>(store: T & Store<T>): T {
  // Get necessary React hooks
  const { useState, useEffect, useMemo } = getBasicHooks();

  // Set the React context flag on the store
  useMemo(() => {
    // Set the React context flag using a less-than-ideal approach
    // In future versions, we'll use the proper API
    (store as any)._reactContext = true;
    return store;
  }, [store]);

  // Use React's useState to manage the component state
  const [state, setState] = useState<T>(() => store.getState());

  // Setup subscription to store changes
  useEffect(() => {
    // Create subscription to store changes
    const unsubscribe = store.subscribe((_receivedState, _prevState) => {
      setState(store.getState());
    });

    // Clean up subscription when component unmounts
    return unsubscribe;
  }, [store]); // Only re-run effect if store reference changes

  // Create and memoize the computed proxy to prevent unnecessary re-renders
  const proxiedState = useMemo(() => {
    return createComputedProxy(state, store);
  }, [state, store]);

  return proxiedState;
}
