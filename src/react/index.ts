import { Store, StoreState } from "../store";
import { json } from "../json";
import { onUpdate } from "../hooks";
import { createDebugger, DebuggerOptions } from "./debugger";

export { createDebugger, DebuggerOptions };

// For dynamic import types
type ReactModule = {
  useSyncExternalStore: (
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => any
  ) => any;
};

/**
 * React hook to use a jods store with automatic reactive updates
 * @param store The store to sync with React
 * @returns A reactive store proxy that updates components on changes
 */
export function useJods<T extends StoreState>(store: T & Store<T>): T {
  // Only try to use React if it's available
  try {
    // This requires React 18+
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react") as ReactModule;

    // Get a snapshot of the store
    const getSnapshot = () => json(store) as T;

    // Subscribe to store changes
    const subscribe = (callback: () => void) => {
      const unsubscribe = onUpdate(store, () => {
        callback();
      });
      return unsubscribe;
    };

    // Use React's useSyncExternalStore to sync with our jods store
    const state = React.useSyncExternalStore(subscribe, getSnapshot);

    // Return a proxy that updates the store on mutation
    return new Proxy(state, {
      set(target, prop, value) {
        // @ts-expect-error - Property assignment through index signature
        store[prop] = value;
        return true;
      },
    });
  } catch (e) {
    console.error("Error using React hook, React 18+ is required:", e);
    // If React is not available, just return the store
    return store;
  }
}
