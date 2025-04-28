import { Store, StoreState } from "../store";
import { History } from "../history";

export interface DebuggerOptions {
  showDiff?: boolean;
  position?: "bottom" | "right";
  maxEntries?: number;
}

/**
 * Create a debugger component for a store with time travel capabilities
 */
export function createDebugger<T extends StoreState>(
  store: T & Store<T>,
  options?: DebuggerOptions
) {
  // Create a history tracker for this store
  const historyTracker = new History(store, {
    maxEntries: options?.maxEntries || 50,
  });

  // In an actual React environment, this would return a component
  // that displays the debugger UI. The implementation is provided
  // at runtime to avoid dependency issues.
  return function StoreDebugger() {
    return null;
  };
}
