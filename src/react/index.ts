import { Store, StoreState } from "../store";
import { json } from "../json";
import { onUpdate } from "../hooks";
import { History } from "../history";
import { DebuggerOptions } from "./debugger";

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

/**
 * Create a debugger component for a store with time travel capabilities
 * @param store The store to debug
 * @param options Debugger options
 * @returns A React component that renders the debugger
 */
export function createDebugger<T extends StoreState>(
  store: T & Store<T>,
  options?: DebuggerOptions
): () => any {
  // Only activate in development mode
  if (process.env.NODE_ENV !== "production") {
    // Create a history tracker for this store
    // We don't directly use it in this simplified version
    new History(store, {
      maxEntries: options?.maxEntries || 50,
    });

    // Simple placeholder component - in reality, this would render a debugger UI
    // In an actual app, we'd create a real React component with the debugger UI
    return function JodsDebugger() {
      console.log(
        "JODS debugger enabled, but custom UI implementation required"
      );
      return null;
    };
  }

  // In production, return an empty component
  return () => null;
}
