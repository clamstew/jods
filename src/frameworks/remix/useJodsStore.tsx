/** @jsxImportSource react */
import { StoreState } from "../../index";
import { getBasicHooks } from "../../utils/reactUtils";

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
 * For updating properties, use direct property assignment as it's the preferred approach in jods:
 *
 * ```tsx
 * // DO THIS - use direct property mutation for all properties (preferred approach)
 * cart.store.preferences.theme = "dark";
 *
 * // AVOID THIS - while supported, setState is not the preferred approach in jods
 * cart.setState({
 *   ...cart.getState(),
 *   preferences: {
 *     ...cart.getState().preferences,
 *     theme: "dark"
 *   }
 * });
 * ```
 */
export function useJodsStore<T extends StoreState>(store: any): T {
  const { useState, useEffect, useRef, useMemo } = getBasicHooks();

  // Store reference won't change during component lifetime
  const storeRef = useRef(store);

  // Track which paths are accessed during rendering
  const accessedPaths = useRef(new Set<string>());

  // Set the React context flag on the store
  useMemo(() => {
    // Mark the store as being used in a React context to enable enhanced proxying
    if (storeRef.current && storeRef.current.store) {
      (storeRef.current.store as any)._reactContext = true;
    }
    return storeRef.current;
  }, [storeRef]);

  // Get initial state
  const [state, setState] = useState(() => {
    if (
      storeRef.current &&
      storeRef.current.store &&
      typeof storeRef.current.store.getState === "function"
    ) {
      return storeRef.current.store.getState();
    }
    // Fallback or error if store structure is not as expected
    // For testing, if store is passed directly and not wrapped by defineStore, it might be store.getState()
    if (typeof store.getState === "function") return store.getState();
    return {} as T; // Should ideally throw or handle error
  });

  // Setup subscription to store changes
  useEffect(() => {
    if (
      storeRef.current &&
      storeRef.current.store &&
      typeof storeRef.current.store.subscribe === "function"
    ) {
      const actualStore = storeRef.current.store;
      const unsubscribe = actualStore.subscribe(
        (_newState: T, _prevState: T) => {
          setState(actualStore.getState());
        }
      );
      // Ensure state is current if subscribe doesn't fire immediately or store changed before effect
      setState(actualStore.getState());
      return unsubscribe;
    }
    // Fallback for direct store instance if not wrapped (consistent with useState logic)
    if (typeof store.subscribe === "function") {
      const unsubscribe = store.subscribe((_newState: T, _prevState: T) => {
        setState(store.getState());
      });
      setState(store.getState());
      return unsubscribe;
    }
    return () => {}; // No-op unsubscribe if store is not valid
  }, [storeRef, store]); // Added store to dependencies for the direct store case

  // Create a proxy to track accessed properties
  return new Proxy(state as T, {
    get(target, prop) {
      if (typeof prop === "string") {
        // Track top-level property access
        accessedPaths.current.add(prop);

        const value = target[prop as keyof typeof target];

        // If the value is an object, create a nested proxy to track deeper access
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return new Proxy(value, {
            get(nestedTarget, nestedProp) {
              if (typeof nestedProp === "string") {
                // Track nested property access
                accessedPaths.current.add(`${prop}.${nestedProp}`);
              }
              return Reflect.get(nestedTarget, nestedProp);
            },
            set(nestedTarget, nestedProp, nestedValue) {
              if (typeof nestedProp === "string") {
                // When setting nested properties directly, update the path in the store
                if (storeRef.current && storeRef.current.store) {
                  // Create the path to set the property (for debugging)
                  const nestedPath = `${prop}.${nestedProp}`;
                  console.log(`Setting nested property: ${nestedPath}`);

                  // Get parent object from the store
                  const parentObj = storeRef.current.store[prop];

                  // Create a copy if needed to avoid direct mutation of frozen objects (if any)
                  const updatedObj = { ...parentObj };

                  // Set the nested property
                  updatedObj[nestedProp] = nestedValue;

                  // Update the parent property in the store
                  storeRef.current.store[prop] = updatedObj;

                  // Ensure the value is updated in our target as well for immediate local updates
                  Reflect.set(nestedTarget, nestedProp, nestedValue);

                  return true;
                }
              }
              return Reflect.set(nestedTarget, nestedProp, nestedValue);
            },
          });
        }
        return value;
      }
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      if (
        typeof prop === "string" &&
        storeRef.current &&
        storeRef.current.store
      ) {
        // Direct property update on the store
        storeRef.current.store[prop] = value;
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  });
}
