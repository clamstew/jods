import { Store, StoreState } from "../store";
import { isComputed } from "../computed";

type UseSyncExternalStoreType = <T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
) => T;

// Try to dynamically get useSyncExternalStore with a function
function getUseSyncExternalStore(): UseSyncExternalStoreType {
  let reactModule: any;

  // Try to get React module
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    reactModule = require("react");
  } catch (e) {
    // This shouldn't happen, but we'll handle it anyway
    throw new Error("React is required but could not be loaded");
  }

  // Return useSyncExternalStore if available
  if (typeof reactModule.useSyncExternalStore === "function") {
    return reactModule.useSyncExternalStore;
  }

  // Try experimental version
  if (typeof reactModule.unstable_useSyncExternalStore === "function") {
    return reactModule.unstable_useSyncExternalStore;
  }

  // Create fallback implementation for React < 18
  return function syncExternalStoreFallback<T>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => T
  ): T {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react");
    const [state, setState] = React.useState(getSnapshot());

    React.useEffect(() => {
      const handleChange = () => {
        setState(getSnapshot());
      };
      const unsubscribe = subscribe(handleChange);
      return unsubscribe;
    }, [subscribe, getSnapshot]);

    return state;
  };
}

// Get the appropriate implementation
const useSyncExternalStore = getUseSyncExternalStore();

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
  // Get the raw state (without evaluating computed properties)
  const rawState = useSyncExternalStore(
    store.subscribe,
    () => store.getState(),
    () => store.getState()
  );

  // Create a proxy that resolves computed properties on access
  // Note: This doesn't create a new object on every render
  return createComputedProxy(rawState);
}
