import { Store, StoreState } from "../store";
import { History } from "./core";
import { HistoryOptions, HistoryEntry, IHistory } from "./types";

/**
 * Creates a history tracker for a store
 * @param store The store to track
 * @param options Configuration options
 * @returns A History instance
 */
export function history<T extends StoreState>(
  store: T & Store<T>,
  options?: HistoryOptions
): History<T> {
  return new History<T>(store, options);
}

// Export types
export type { HistoryOptions, HistoryEntry, IHistory };
export { History };
