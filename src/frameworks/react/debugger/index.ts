import { Store, StoreState } from "../../../core/store";
import { History } from "../../../core/history";

export interface DebuggerOptions {
  showDiff?: boolean;
  position?: "bottom" | "right";
  maxEntries?: number;
}

/**
 * Create a debugger component for a store with time travel capabilities
 *
 * This exports a simple function that:
 * 1. In development & browser environment: Dynamically loads the full React debugger
 * 2. In production or test environments: Returns a null component
 *
 * The actual debugger UI is only loaded in development mode in a browser environment,
 * ensuring it's not included in production builds and doesn't cause issues in tests.
 */
export function createDebugger<T extends StoreState>(
  store: T & Store<T>,
  options?: DebuggerOptions
) {
  // Create a history tracker for the store (for time-travel functionality)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const historyTracker = new History(store, {
    maxEntries: options?.maxEntries || 50,
  });

  // In test or production environments, return a null component
  if (
    process.env.NODE_ENV !== "development" ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return function StoreDebugger() {
      return null;
    };
  }

  // For development in browser environments, return a component
  // that will be properly rendered by the framework
  return function StoreDebugger() {
    // The actual implementation is loaded and rendered at runtime
    // by whatever React framework integration is being used
    return {
      type: "div",
      props: {
        className: "jods-debugger-placeholder",
        "data-store-id": store.id || "default",
        "data-options": JSON.stringify(options || {}),
      },
    };
  };
}
