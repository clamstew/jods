import { Store, StoreState } from "./store";
import { Subscriber, Unsubscribe } from "./types";

/**
 * Registers a callback to be invoked when the store state changes
 * @param store - The store to subscribe to
 * @param callback - The callback to invoke on state change
 * @returns A function to unsubscribe
 */
export function onUpdate<T extends StoreState>(
  store: T & Store<T>,
  callback: Subscriber<T>
): Unsubscribe {
  return store.subscribe(callback);
}
