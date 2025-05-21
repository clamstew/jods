import { Store, StoreState } from "../store";

/**
 * Subscribe to updates from a store, with type safety for the callback
 * @param store - Store to subscribe to
 * @param callback - Callback function to receive updates
 * @returns Unsubscribe function
 */
export function onUpdate<T extends StoreState>(
  store: T & Partial<Store<T>>,
  callback: (state: T, prevState?: T) => void
): () => void {
  // If it's a jods store with a subscribe method, use it
  if (typeof store.subscribe === "function") {
    return store.subscribe(callback, { skipInitialCall: false });
  }

  // For non-jods objects, at least call once with the initial state
  try {
    callback(store);
  } catch (err) {
    console.error("Error in onUpdate callback:", err);
  }

  // We can't add reliable reactivity to plain objects
  // So we return a no-op cleanup function
  return () => {};
}
