import { StoreState } from "../types";
import { createSignal } from "../signal";
import { notifySubscribersForProxySet } from "../subscription";
import { getState_impl } from "../state";
import { isComputed } from "../../computed";
import { isBatchActive, recordBatchChange } from "../../batch";
import { ExtendedProxyContext, getRawValue } from "./helpers";
import { registerComputedDefinition } from "../../computed-registry";

// The set trap implementation
export function setTrap<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  target: T,
  prop: string | symbol,
  value: any,
  _receiver: any
): boolean {
  const {
    signals,
    definedComputedKeys,
    previousStateContainer,
    storeInstance,
    subscriptionContext,
  } = context;

  const key = String(prop);
  let valueActuallyChanged = false;
  const rawNewValue = getRawValue(value);

  // Check if we're in a batch operation
  if (isBatchActive()) {
    // For computed properties, we need to remember that this was a set operation on a computed
    if (definedComputedKeys.has(key)) {
      // If it's a settable computed, record it for the batch
      const computedDefinition = Reflect.get(target, prop, _receiver);
      if (
        isComputed(computedDefinition) &&
        typeof (computedDefinition as any).set === "function"
      ) {
        // Record the computed property change but don't call the setter yet
        recordBatchChange(key, rawNewValue);
        return true;
      } else {
        // Trying to set a non-settable computed or something misconfigured during batch
        console.warn(
          `Attempted to set non-settable computed property "${key}" or invalid property during batch operation.`
        );
        return false; // Indicate failure
      }
    } else {
      // For regular properties, just record the change
      recordBatchChange(key, rawNewValue);

      // Update the signal and target for accurate reads during the batch, but don't notify
      let signal = signals.get(key);
      if (!signal) {
        // New property being added to the store
        signal = createSignal(rawNewValue);
        signals.set(key, signal);
        Reflect.set(target, prop, rawNewValue);
      } else {
        // Existing property - update the signal but suppress notification
        const currentValue = signal[0]();
        if (!Object.is(currentValue, rawNewValue)) {
          signal[1](rawNewValue); // Update signal with raw value
          Reflect.set(target, prop, rawNewValue); // Update target with raw value
        }
      }

      return true;
    }
  }

  // Save original suppressNotifications value
  const originalSuppressNotifications =
    subscriptionContext.suppressNotifications;

  try {
    // Turn on suppressNotifications for this individual operation
    if (isBatchActive()) {
      subscriptionContext.suppressNotifications = true;
    }

    // Normal (non-batch) property setting logic
    if (definedComputedKeys.has(key)) {
      // If the new value is also a computed function, allow replacement
      // This supports history restoration and user re-defining computed properties
      if (isComputed(value)) {
        // Replace the computed definition
        Reflect.set(target, prop, value);
        // Re-register the computed definition for history
        registerComputedDefinition(storeInstance, key, value);
        valueActuallyChanged = true;
      } else {
        // Try to use as settable computed
        const computedDefinition = Reflect.get(target, prop, _receiver);
        if (
          isComputed(computedDefinition) &&
          typeof (computedDefinition as any).set === "function"
        ) {
          const stateBeforeComputedSet = getState_impl(
            // Get raw state
            signals,
            definedComputedKeys,
            storeInstance
          );
          // Pass rawNewValue to the setter
          (computedDefinition as any).set.call(storeInstance, rawNewValue); // Settable computed handles its own reactivity propagation.
          // It might change multiple underlying signals.

          // No stateAfterComputedSet variable needed here, valueActuallyChanged handles notification trigger
          valueActuallyChanged = true;
          previousStateContainer.value = stateBeforeComputedSet;
        } else {
          // Trying to set a non-settable computed with a non-computed value
          console.warn(
            `Attempted to set non-settable computed property "${key}" with a non-computed value.`
          );
          return false; // Indicate failure
        }
      }
    } else {
      // Not a computed property (or not a settable one)
      const stateBeforeUpdate = getState_impl(
        signals,
        definedComputedKeys,
        storeInstance
      );
      previousStateContainer.value = stateBeforeUpdate; // Capture state before this potential change for this key

      let signal = signals.get(key);
      if (!signal) {
        // New property being added to the store
        signal = createSignal(rawNewValue);
        signals.set(key, signal);
        Reflect.set(target, prop, rawNewValue); // Set raw value on target (initialState clone)
        valueActuallyChanged = true;
      } else {
        // Existing property
        const currentSignalValue = signal[0](); // This is raw
        if (!Object.is(currentSignalValue, rawNewValue)) {
          signal[1](rawNewValue); // Update signal with raw value
          Reflect.set(target, prop, rawNewValue); // Ensure raw target also has raw value
          valueActuallyChanged = true;
        } else {
          // Value is the same, but ensure raw target is also up-to-date
          // (e.g. if it held a proxy before due to direct initialState modification)
          Reflect.set(target, prop, rawNewValue);
          // valueActuallyChanged remains false
        }
      }

      // If the assigned value was a computed function, track it.
      if (isComputed(value)) {
        // original value, not rawNewValue
        definedComputedKeys.add(key);
        Reflect.set(target, prop, value); // Store the computed function itself on the target
        
        // Register the computed value for history restoration
        // Store the entire ComputedValue so it can be re-applied after time-travel
        registerComputedDefinition(storeInstance, key, value);
      }
    }

    // Only notify if in non-batch mode and suppressNotifications is not enabled
    if (
      valueActuallyChanged &&
      !subscriptionContext.suppressNotifications &&
      !isBatchActive()
    ) {
      const currentState = getState_impl(
        signals,
        definedComputedKeys,
        storeInstance
      );

      // Use notifySubscribersForProxySet directly from context.subscriptionContext
      notifySubscribersForProxySet(
        subscriptionContext,
        key,
        currentState, // This is the new current state
        previousStateContainer.value // This was state before this specific key's change
      );

      // Update the global previousStateContainer *after* notification for this key.
      previousStateContainer.value = { ...currentState };
    }

    return true; // Indicate success
  } finally {
    // Restore original suppressNotifications value
    if (isBatchActive()) {
      subscriptionContext.suppressNotifications = originalSuppressNotifications;
    }
  }
}
