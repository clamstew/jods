/** @jsxImportSource react */
import { StoreState } from "../index";
import { getBasicHooks } from "../utils/reactUtils";

/**
 * React hook for subscribing to a jods store defined with defineStore
 *
 * @param store The store created with defineStore
 * @returns The current state of the store, updated reactively
 *
 * @example
 * ```tsx
 * function CartComponent() {
 *   const cartState = useJodsStore(cart);
 *
 *   return (
 *     <div>
 *       <h2>Cart ({cartState.items.length} items)</h2>
 *       {cartState.items.map(item => (
 *         <div key={item.id}>
 *           {item.title} - {item.quantity}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * For updating nested properties, always use the `setState` method instead of direct property assignment:
 *
 * ```tsx
 * // DO THIS - ensures reactivity for nested properties
 * cart.setState({
 *   ...cart.getState(),
 *   preferences: {
 *     ...cart.getState().preferences,
 *     theme: "dark"
 *   }
 * });
 *
 * // DON'T DO THIS - may not trigger component updates
 * cart.store.preferences.theme = "dark";
 * ```
 */
export function useJodsStore<T extends StoreState>(store: any): T {
  const { useState, useEffect, useMemo } = getBasicHooks();

  // NOTE: While useSyncExternalStore would be ideal for working with the signal-based
  // reactivity system, it causes infinite update loops in the current implementation.
  // This useState/useEffect approach ensures stable behavior while still benefiting
  // from the optimized signal-based updates in the underlying store.

  // Store reference won't change during component lifetime
  const storeRef = useMemo(() => ({ current: store }), []);

  // Get initial state
  const [state, setState] = useState(() => store.getState());

  useEffect(() => {
    // Only subscribe once per store instance
    const unsubscribe = storeRef.current.store.subscribe(() => {
      // Get updated state when changes occur
      setState(storeRef.current.getState());
    });

    return unsubscribe;
  }, [storeRef]);

  return state;
}
