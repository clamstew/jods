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
 * This file provides two implementations:
 * 1. In development: Returns the full React debugger UI component from debugger.tsx
 * 2. In production: Returns a null component to avoid including the UI in production builds
 *
 * Note: The debugger.tsx file contains the full React implementation and may be flagged
 * as "unused" by tools like Knip, but it's dynamically required in development mode.
 */
export function createDebugger<T extends StoreState>(
  store: T & Store<T>,
  options?: DebuggerOptions
) {
  // Create a history tracker for this store (still useful for time-travel functionality)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const historyTracker = new History(store, {
    maxEntries: options?.maxEntries || 50,
  });

  // In production, return a null component immediately
  if (process.env.NODE_ENV !== "development") {
    return function StoreDebugger() {
      return null;
    };
  }

  // In development, try to load the full debugger UI from the TSX file
  try {
    // Only attempt to load in browser environment
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fullDebugger = require("./debugger.tsx");
      if (fullDebugger && fullDebugger.createDebugger) {
        return fullDebugger.createDebugger(store, options);
      }
    }
  } catch (e) {
    console.warn("Failed to load full debugger UI:", e);
  }

  // Fall back to null implementation if loading fails or not in browser environment
  return function StoreDebugger() {
    return null;
  };
}
