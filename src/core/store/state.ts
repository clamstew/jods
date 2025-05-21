// This file will contain state-related logic from core.ts

import { isComputed } from "../computed";
import { Store, StoreState } from "./types";
import { Signal } from "../../types";
import {
  createSignal,
  getCurrentSubscriber,
  setCurrentSubscriber,
} from "./signal";
import { activeTestHooks } from "../../utils/core/store.test-hook-harness";

// Forward declaration for storeProxy to be used in getState_impl etc.
// This will need to be passed in or accessed differently once core.ts is refactored.
// For now, we'll assume it's available in the scope where these functions are called.
// let storeProxy: T & Store<T>; // This line will be problematic and needs to be addressed.

/**
 * Get the current state by reading all signals, with computed values unwrapped
 */
export const getStateWithComputedUnwrapped_impl = <T extends StoreState>(
  signals: Map<string, Signal<any>>,
  definedComputedKeys: Set<string>,
  storeProxy: T & Store<T> // Pass storeProxy as an argument
): T => {
  const state: Record<string, any> = {};
  // Process signals
  for (const [key, signal] of signals.entries()) {
    const valueFromSignal = signal[0]();
    // Unwrap computed values stored in signals (e.g., from initialState)
    if (isComputed(valueFromSignal)) {
      state[key] = valueFromSignal();
    } else {
      state[key] = valueFromSignal;
    }
  }
  // Process directly defined computed properties (which are getters on proxyTargetInstance)
  for (const key of definedComputedKeys) {
    // Ensure it wasn't already processed if it somehow got into signals too (defensive)
    if (!Object.prototype.hasOwnProperty.call(state, key)) {
      // Access the getter via the proxy to ensure full get trap logic (like dep tracking) runs
      state[key] = storeProxy[key as keyof T];
    }
  }
  return state as T;
};

/**
 * Get the current state by reading all signals (may include raw computed functions from signals)
 */
export const getState_impl = <T extends StoreState>(
  signals: Map<string, Signal<any>>,
  definedComputedKeys: Set<string>,
  storeProxy: T & Store<T> // Pass storeProxy as an argument
): T => {
  const state: Record<string, any> = {};
  // Process signals
  for (const [key, signal] of signals.entries()) {
    state[key] = signal[0](); // Call read function, gets raw value from signal
  }
  // Process directly defined computed properties (getters provide evaluated value)
  for (const key of definedComputedKeys) {
    if (!Object.prototype.hasOwnProperty.call(state, key)) {
      // Access the getter via the proxy
      state[key] = storeProxy[key as keyof T];
    }
  }

  // Exclude batch-related methods from the state
  delete state.batch;
  delete state.beginBatch;
  delete state.commitBatch;

  return state as T;
};

/**
 * Update multiple properties at once
 */
export const setState_impl = <T extends StoreState>(
  partial: Partial<T>,
  signals: Map<string, Signal<any>>,
  definedComputedKeys: Set<string>,
  storeProxy: T & Store<T>, // Pass storeProxy
  previousStateContainer: { value: T }, // Use a container for previousState
  subscriberDeps: Map<any, Set<string>>, // For allSubscribers, trackingInProgress, activeSubscriptions
  allSubscribers: Set<any>,
  trackingInProgress: Set<any>,
  activeSubscriptions: Set<any>,
  subscriberCallbacks: Map<any, () => void>
): { changedKeys: Set<string>; prevState: T; currentState: T } | null => {
  const prevState = getState_impl(signals, definedComputedKeys, storeProxy);
  previousStateContainer.value = { ...prevState };

  const changedKeys = new Set<string>();

  // First, collect all changed keys but don't notify yet
  for (const [key, value] of Object.entries(partial)) {
    let signal = signals.get(key);
    if (!signal) {
      // New property
      signal = createSignal(value);
      signals.set(key, signal);
      changedKeys.add(key); // Add to changedKeys because it's a new property
    } else {
      // Existing property
      const currentValue = signal[0]();
      if (!Object.is(currentValue, value)) {
        signal[1](value); // write(value)
        changedKeys.add(key);
      }
    }
  }

  if (changedKeys.size === 0) return null;

  const currentState = getState_impl(signals, definedComputedKeys, storeProxy);

  // Ensure batch methods are excluded from state objects passed to subscribers
  if ("batch" in prevState) delete (prevState as any).batch;
  if ("beginBatch" in prevState) delete (prevState as any).beginBatch;
  if ("commitBatch" in prevState) delete (prevState as any).commitBatch;

  if ("batch" in currentState) delete (currentState as any).batch;
  if ("beginBatch" in currentState) delete (currentState as any).beginBatch;
  if ("commitBatch" in currentState) delete (currentState as any).commitBatch;

  // Process subscribers carefully to avoid duplicate notifications
  // We only want to notify each subscriber once, even if multiple keys changed
  const notifiedSubscribers = new Set();

  // First notify subscribers with specific dependencies
  for (const [subscriber, deps] of subscriberDeps.entries()) {
    // Skip if not active or already processing
    if (
      !activeSubscriptions.has(subscriber) ||
      trackingInProgress.has(subscriber) ||
      notifiedSubscribers.has(subscriber)
    ) {
      continue;
    }

    // Check if any of its dependencies changed
    let shouldNotify = false;
    for (const changedKey of changedKeys) {
      if (deps.has(changedKey)) {
        shouldNotify = true;
        break;
      }
    }

    if (shouldNotify) {
      const callback = subscriberCallbacks.get(subscriber);
      if (callback) {
        notifiedSubscribers.add(subscriber);
        callback();
      }
    }
  }

  // Then notify global subscribers that weren't already notified
  for (const subscriber of allSubscribers) {
    if (
      !activeSubscriptions.has(subscriber) ||
      trackingInProgress.has(subscriber) ||
      notifiedSubscribers.has(subscriber)
    ) {
      continue;
    }

    const callback = subscriberCallbacks.get(subscriber);
    if (callback) {
      notifiedSubscribers.add(subscriber);
      callback();
    } else if (typeof subscriber === "function") {
      // Direct call for the test case
      notifiedSubscribers.add(subscriber);
      subscriber(currentState, prevState);
    }
  }

  return { changedKeys, prevState, currentState };
};

export function initializeStateAndSignals<T extends StoreState>(
  initialState: T,
  signals: Map<string, Signal<any>>,
  definedComputedKeys: Set<string>
) {
  // For debugging
  console.log("Initializing state with keys:", Object.keys(initialState));

  for (const key of Object.keys(initialState)) {
    const descriptor = Object.getOwnPropertyDescriptor(initialState, key);

    // Check if this is a getter/computed property
    if (descriptor && descriptor.get) {
      // Register as a computed property
      definedComputedKeys.add(key);
      console.log(`Added computed key (via getter): ${key}`);

      // Create a signal for this computed property to store its value
      signals.set(key, createSignal(undefined));

      if (activeTestHooks?.onComputedPropertyAdded) {
        activeTestHooks.onComputedPropertyAdded(key, descriptor.get, {
          getCurrentSubscriber,
          setCurrentSubscriber,
        });
      }
    } else {
      const initialValue = initialState[key as keyof T];
      if (isComputed(initialValue)) {
        // Mark as a computed property
        definedComputedKeys.add(key);
        console.log(`Added computed key (via computed function): ${key}`);

        // Store the computed function directly in the signal
        // This ensures it's available for lookup by key later
        signals.set(key, createSignal(initialValue));

        if (activeTestHooks?.onComputedPropertyAdded) {
          activeTestHooks.onComputedPropertyAdded(key, initialValue, {
            getCurrentSubscriber,
            setCurrentSubscriber,
          });
        }
      } else {
        signals.set(key, createSignal(initialValue));
      }
    }
  }

  // For debugging
  console.log("Initialized computedKeys:", Array.from(definedComputedKeys));
  console.log("Initialized signals:", Array.from(signals.keys()));
}
