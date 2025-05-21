import { StoreState } from "../types";
import { notifySubscribersForProxySet } from "../subscription";
import { getState_impl } from "../state";
import { isBatchActive, recordBatchChange } from "../../batch";
import { ExtendedProxyContext } from "./helpers";

// The deleteProperty trap implementation
export function deletePropertyTrap<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  target: T,
  prop: string | symbol
): boolean {
  const {
    signals,
    definedComputedKeys,
    previousStateContainer,
    storeInstance,
    subscriptionContext,
  } = context;

  const key = String(prop);

  // Check if we're in a batch operation
  if (isBatchActive()) {
    // Record deletion in the batch - use undefined to indicate deletion
    recordBatchChange(key, undefined);

    // For immediate state consistency, remove from signals/computed and target
    // but don't trigger notifications (they'll happen after batch completes)
    if (signals.has(key)) {
      signals.delete(key);
    }
    if (definedComputedKeys.has(key)) {
      definedComputedKeys.delete(key);
    }

    // Try to delete from the target, but don't fail if it doesn't work
    try {
      Reflect.deleteProperty(target, prop);
    } catch (err) {
      // Ignore errors deleting from target during batch
      console.warn(`Non-critical error deleting property during batch: ${err}`);
    }

    return true;
  }

  if (signals.has(key) || definedComputedKeys.has(key)) {
    // Check both
    const stateBeforeDelete = getState_impl(
      signals,
      definedComputedKeys,
      storeInstance
    );

    signals.delete(key);
    definedComputedKeys.delete(key); // Remove from computed if it was one

    // Delete from raw target, ignoring any errors
    try {
      Reflect.deleteProperty(target, prop);
    } catch (err) {
      console.warn(`Error deleting property from target: ${err}`);
    }

    // Only notify if suppressNotifications is not enabled
    if (!subscriptionContext.suppressNotifications) {
      const currentState = getState_impl(
        signals,
        definedComputedKeys,
        storeInstance
      );
      notifySubscribersForProxySet(
        subscriptionContext,
        key,
        currentState,
        stateBeforeDelete
      );
      previousStateContainer.value = { ...currentState };
    }
    return true;
  }

  // If not in signals or definedComputedKeys, just try to delete from target
  try {
    return Reflect.deleteProperty(target, prop);
  } catch (err) {
    console.warn(`Error deleting property: ${err}`);
    return false;
  }
}
