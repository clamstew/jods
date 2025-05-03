/** @jsxImportSource react */
import { StoreState, onUpdate } from "../index";

// Dynamic import for React to prevent bundling issues
function getReactHooks() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react");
    if (typeof React.useSyncExternalStore === "function") {
      return {
        useSyncExternalStore: React.useSyncExternalStore,
      };
    }

    // Fallback for older React versions
    return {
      useSyncExternalStore: (subscribe: any, getSnapshot: any) => {
        const [state, setState] = React.useState(getSnapshot());

        React.useEffect(() => {
          const unsubscribe = subscribe(() => {
            setState(getSnapshot());
          });
          return unsubscribe;
        }, [subscribe, getSnapshot]);

        return state;
      },
    };
  } catch (e) {
    throw new Error("React is required but could not be loaded");
  }
}

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
 */
export function useJodsStore<T extends StoreState>(store: any): T {
  const { useSyncExternalStore } = getReactHooks();

  // Create a subscription function that uses the store's onUpdate
  const subscribe = (callback: () => void) => {
    return onUpdate(store.store, callback);
  };

  // Get the current state
  const getSnapshot = () => store.getState();

  // Use React's useSyncExternalStore hook
  return useSyncExternalStore(subscribe, getSnapshot);
}
