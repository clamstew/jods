import { useEffect, useState, useRef } from "react";
import {
  persist,
  clearPersisted,
  type PersistOptions,
  type PersistStorage,
  type PersistOperation,
} from "../../persist";
import type { Store, StoreState } from "../../core";
import { debug } from "../../utils/debug";

/**
 * Remix-compatible hook for client-side persistence.
 * Only runs in the browser environment to avoid SSR issues.
 *
 * @param storage - The client-side storage to use (e.g. localStorage)
 * @param storeOrStores - The store(s) to persist
 * @param options - Optional configuration
 * @returns Object with loading state, error state, and clear function
 */
export function useClientPersist<T extends StoreState>(
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
  const isHydrated = useRef(false);

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

  // Set up persistence on mount, but only in browser
  useEffect(() => {
    // Immediately mark as not loading in SSR or if we've already hydrated
    if (typeof window === "undefined" || typeof document === "undefined") {
      debug.log("persist", "Skipping persistence setup on server");
      setIsLoading(false);
      return () => {};
    }

    // Basic re-hydration guard. More sophisticated logic might be needed if options.key changes.
    if (isHydrated.current) {
      debug.log(
        "persist",
        "Already hydrated, skipping second hydration unless key forced a re-run"
      );
      setIsLoading(false); // Ensure loading is false if we skip
      return () => {};
    }

    debug.log("persist", "Setting up client-side persistence in Remix");
    setIsLoading(true);
    setError(null); // Clear previous errors on new attempt

    // enhancedOptions includes the user's options and our custom onError.
    // It is of type PersistOptions<T>.

    const result = Array.isArray(storeOrStores)
      ? persist(storage, storeOrStores, enhancedOptions)
      : persist(storage, storeOrStores, enhancedOptions);

    if (result instanceof Promise) {
      result
        .then((cleanup) => {
          cleanupRef.current = cleanup;
          isHydrated.current = true;
          setIsLoading(false);
        })
        .catch((err) => {
          // The onError in enhancedOptions should have already been called.
          // setError(err); // This might be redundant if enhancedOptions.onError handles it.
          // Default behavior for the hook on error:
          if (!options?.onError) {
            // If user didn't provide their own onError, set hook's error state.
            setError(err);
          }
          isHydrated.current = true; // Consider hydration attempted
          setIsLoading(false);
        });
    } else {
      // Synchronous case
      cleanupRef.current = result;
      isHydrated.current = true;
      setIsLoading(false);
    }

    return () => {
      debug.log("persist", "Cleaning up client-side persistence in Remix");
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
