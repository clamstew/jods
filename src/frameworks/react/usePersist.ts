import { useEffect, useState, useRef } from "react";
import {
  persist,
  clearPersisted,
  type PersistOptions,
  type PersistStorage,
  type PersistOperation,
} from "../../persist";
import type { Store, StoreState } from "../../core";

/**
 * React hook for persisting a jods store.
 *
 * @param storage - The storage adapter to use
 * @param storeOrStores - The store(s) to persist
 * @param options - Optional persist configuration
 * @returns Object with loading state, error state, and clear function
 *
 * @example
 * // Persist a store to localStorage
 * const { isLoading, error, clear } = usePersist(localStorage, todoStore);
 */
export function usePersist<T extends StoreState>(
  storage: PersistStorage,
  store: Store<T>,
  options?: PersistOptions<T>
): {
  isLoading: boolean;
  error: Error | null;
  clear: () => void | Promise<void>;
};

export function usePersist<T extends Record<string, any>>(
  storage: PersistStorage,
  stores: Store<any>[],
  options?: PersistOptions<T>
): {
  isLoading: boolean;
  error: Error | null;
  clear: () => void | Promise<void>;
};

export function usePersist<T extends Record<string, any>>(
  storage: PersistStorage,
  storeOrStores: Store<any> | Store<any>[],
  options?: PersistOptions<T>
): {
  isLoading: boolean;
  error: Error | null;
  clear: () => void | Promise<void>;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Enhanced error handler that updates React state
  const enhancedOptions: PersistOptions<T> = {
    ...options,
    onError: (err: Error, operation: PersistOperation) => {
      setError(err);
      options?.onError?.(err, operation);
    },
  };

  // Function to clear persisted data
  const clear = () => {
    return clearPersisted(storage, options?.key);
  };

  // Set up persistence on mount
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      setIsLoading(false);
      return () => {}; // Return empty cleanup function for SSR
    }

    const result = Array.isArray(storeOrStores)
      ? persist(storage, storeOrStores, enhancedOptions)
      : persist(storage, storeOrStores, enhancedOptions);

    if (result instanceof Promise) {
      // Handle async storage
      result
        .then((cleanup) => {
          cleanupRef.current = cleanup;
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    } else {
      // Handle sync storage
      cleanupRef.current = result;
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [storage, storeOrStores]);

  // Provide immediate SSR response
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { isLoading: false, error: null, clear: () => {} };
  }

  return { isLoading, error, clear };
}
