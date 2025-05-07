/** @jsxImportSource react */
import { StoreState } from "../index";
import { useJodsFetchers } from "./useJodsFetchers";
import { getBasicHooks } from "../utils/reactUtils";

/**
 * Hook for implementing optimistic UI updates with jods stores
 *
 * @param store The jods store
 * @param actionName The name of the action being performed
 * @param optimisticData Function that returns the optimistic state update
 */
export function useOptimisticUpdate<T extends StoreState>(
  store: any,
  actionName: string,
  optimisticData: (currentState: T) => Partial<T>
) {
  const { useState, useEffect } = getBasicHooks();
  const currentState = store.getState() as T;
  const actionId = `${store.name}.${actionName}`;
  const { isSubmitting } = useJodsFetchers(actionId);
  const [optimisticState, setOptimisticState] = useState<T | null>(null);

  useEffect(() => {
    if (isSubmitting && !optimisticState) {
      // When submission starts, apply optimistic update
      setOptimisticState({
        ...currentState,
        ...optimisticData(currentState),
      } as T);
    } else if (!isSubmitting && optimisticState) {
      // When submission completes, clear optimistic state
      setOptimisticState(null);
    }
  }, [isSubmitting, currentState, optimisticState]);

  // Return either the optimistic state or the actual state
  return optimisticState || currentState;
}
