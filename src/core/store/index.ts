import { createStore } from "./core";
import { Store, StoreState, StoreContextOptions } from "./types";

export {
  createSignal,
  getCurrentSubscriber,
  setCurrentSubscriber,
} from "./signal";

/**
 * Creates a reactive store with fine-grained updates via signals.
 * @param initialState Initial store state
 * @param options Configuration options
 * @returns Mutable proxy object with Store interface
 */
export function store<T extends StoreState>(
  initialState: T,
  options: StoreContextOptions = {}
): T & Store<T> {
  return createStore(initialState, options);
}

// Export types
export type { Store, StoreState, StoreContextOptions } from "./types";
