import { createStore } from "./core";
import { Store, StoreState, StoreContextOptions } from "./types";

export {
  createSignal,
  getCurrentSubscriber,
  setCurrentSubscriber,
} from "./signal";

/**
 * Creates a reactive store with fine-grained updates via signals.
 * 
 * **Note on Computed Values:**
 * When you define a store interface with `ComputedValue<T>`, TypeScript sees
 * the property as `ComputedValue<T>`. However, at runtime, accessing the property
 * returns `T` directly (the proxy unwraps it). To get proper typing when reading
 * computed values, use one of these approaches:
 * 
 * 1. Use `json(store)` which returns all values as plain types
 * 2. Define computed properties as their result type and cast when assigning:
 *    ```ts
 *    interface State { doubled?: number; }
 *    s.doubled = computed(() => s.count * 2) as any;
 *    ```
 * 3. Call the computed as a function: `s.doubled()` (works at runtime)
 * 
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
