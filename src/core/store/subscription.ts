// This file will contain subscription-related logic from core.ts

import { Subscriber, Unsubscribe, Signal } from "../../types";
import { Store, StoreState } from "./types";
import { debug } from "../../utils/debug";
import { setCurrentSubscriber } from "./signal"; // Removed getCurrentSubscriber
import { activeTestHooks } from "../../utils/core/store.test-hook-harness";
import { StoreTestMode } from "../../test/storeTestUtils";

export interface SubscriptionContext<T extends StoreState> {
  signals: Map<string, Signal<any>>;
  definedComputedKeys: Set<string>;
  storeProxy: T & Store<T>;
  previousStateContainer: { value: T };
  subscriberDeps: Map<Subscriber<T>, Set<string>>;
  allSubscribers: Set<Subscriber<T>>;
  trackingInProgress: Set<Subscriber<T>>;
  subscriberCallbacks: Map<Subscriber<T>, () => void>;
  callbackToSubscriber: Map<() => void, Subscriber<T>>;
  activeSubscriptions: Set<Subscriber<T>>;
  suppressNotifications?: boolean;
  originalSuppressNotifications?: boolean;
  // Function to get the current state, potentially needs to be passed or imported
  // getState_impl: () => T; // This might be complex due to storeProxy dependency
}

/**
 * Subscribe to store changes with automatic dependency tracking
 */
export const subscribe_impl = <T extends StoreState>(
  subscriber: Subscriber<T>,
  context: SubscriptionContext<T>,
  options?: { skipInitialCall?: boolean }
): Unsubscribe => {
  context.activeSubscriptions.add(subscriber);
  if (!context.subscriberDeps.has(subscriber)) {
    context.subscriberDeps.set(subscriber, new Set());
  }
  context.trackingInProgress.add(subscriber);

  const trackingCallback = () => {
    if (
      context.trackingInProgress.has(subscriber) ||
      !context.activeSubscriptions.has(subscriber)
    ) {
      return;
    }
    context.trackingInProgress.add(subscriber);
    const deps = context.subscriberDeps.get(subscriber) || new Set<string>();
    // Clear dependencies before tracking new ones
    deps.clear();
    const previousStateForCallback = context.previousStateContainer.value;

    if (activeTestHooks?.onTrackingCallbackDependencies) {
      activeTestHooks.onTrackingCallbackDependencies(subscriber, deps, {
        isTestSubscriber: () => false,
        getTestDependencies: (sub) => {
          const subDeps = context.subscriberDeps.get(sub);
          return subDeps ? Array.from(subDeps) : undefined;
        },
        StoreTestModeEnum: StoreTestMode,
      });
    } else {
      // Production path
    }

    // Create a clean copy of the state without batch methods
    const cleanStoreProxy = { ...context.storeProxy };
    delete (cleanStoreProxy as any).batch;
    delete (cleanStoreProxy as any).beginBatch;
    delete (cleanStoreProxy as any).commitBatch;

    // Clean the previous state as well
    const cleanPreviousState = { ...previousStateForCallback };
    delete (cleanPreviousState as any).batch;
    delete (cleanPreviousState as any).beginBatch;
    delete (cleanPreviousState as any).commitBatch;

    setCurrentSubscriber(trackingCallback);
    // Pass the cleaned proxy and previous state to the subscriber
    subscriber(cleanStoreProxy, cleanPreviousState);
    setCurrentSubscriber(null);

    debug.log(
      "store",
      `Subscriber deps after update: [${[...deps].join(", ")}] `
    );

    // After tracking dependencies, add to allSubscribers if no dependencies
    if (deps.size === 0) {
      context.allSubscribers.add(subscriber);
    } else {
      context.allSubscribers.delete(subscriber);
    }
    context.trackingInProgress.delete(subscriber);
  };

  context.subscriberCallbacks.set(subscriber, trackingCallback);
  context.callbackToSubscriber.set(trackingCallback, subscriber);

  if (!options?.skipInitialCall) {
    // Perform initial tracking call
    setCurrentSubscriber(trackingCallback);
    // For the very first call, previous state might be the same as current or an empty object.
    const previousStateSnapshot = { ...context.previousStateContainer.value }; // Ensure snapshot

    // Create a clean copy for the initial call
    const cleanStoreProxy = { ...context.storeProxy };
    delete (cleanStoreProxy as any).batch;
    delete (cleanStoreProxy as any).beginBatch;
    delete (cleanStoreProxy as any).commitBatch;

    // Clean the previous state as well
    const cleanPreviousState = { ...previousStateSnapshot };
    delete (cleanPreviousState as any).batch;
    delete (cleanPreviousState as any).beginBatch;
    delete (cleanPreviousState as any).commitBatch;

    subscriber(cleanStoreProxy, cleanPreviousState);
    setCurrentSubscriber(null);
    debug.log(
      "store",
      `Initial subscriber deps: [${[
        ...(context.subscriberDeps.get(subscriber) || []),
      ].join(", ")}] `
    );
    // After initial call, if no deps, add to allSubscribers
    if ((context.subscriberDeps.get(subscriber)?.size || 0) === 0) {
      context.allSubscribers.add(subscriber);
    }
  }
  context.trackingInProgress.delete(subscriber);

  return () => {
    debug.log("store", "Unsubscribing subscriber");
    context.activeSubscriptions.delete(subscriber);
    context.allSubscribers.delete(subscriber); // Ensure cleaned from global list too

    // Clean up from tracking callback mappings
    const callback = context.subscriberCallbacks.get(subscriber);
    if (callback) {
      context.callbackToSubscriber.delete(callback);

      // Clean up signal subscriptions
      context.signals.forEach((signal) => {
        const signalSubscribers = (signal[0] as any).subscribers as
          | Set<() => void>
          | undefined;
        if (signalSubscribers && callback) {
          signalSubscribers.delete(callback);
        }
      });
    }

    context.subscriberDeps.delete(subscriber);
    context.subscriberCallbacks.delete(subscriber);
  };
};

export const notifySubscribersForProxySet = <T extends StoreState>(
  context: SubscriptionContext<T>,
  changedKey: string,
  currentState: T, // Pass current state
  previousState: T // Pass previous state
) => {
  // Skip notification if suppressNotifications is true
  if (context.suppressNotifications === true) {
    debug.log("store", `Suppressing notifications for ${changedKey} change`);
    return;
  }

  // Make clean copies of state without batch methods
  const cleanCurrentState = { ...currentState };
  const cleanPreviousState = { ...previousState };

  // Remove batch methods
  delete (cleanCurrentState as any).batch;
  delete (cleanCurrentState as any).beginBatch;
  delete (cleanCurrentState as any).commitBatch;
  delete (cleanPreviousState as any).batch;
  delete (cleanPreviousState as any).beginBatch;
  delete (cleanPreviousState as any).commitBatch;

  const notifiedSubscribers = new Set<Subscriber<T>>();

  // First, notify subscribers that specifically depend on the changed key
  context.subscriberDeps.forEach((deps, sub) => {
    if (
      deps.has(changedKey) &&
      context.activeSubscriptions.has(sub) &&
      !context.trackingInProgress.has(sub) &&
      !notifiedSubscribers.has(sub)
    ) {
      const callback = context.subscriberCallbacks.get(sub);
      if (callback) {
        if (activeTestHooks?.filterSubscriberNotification) {
          const hookDecision = activeTestHooks.filterSubscriberNotification(
            sub,
            {
              key: changedKey,
              currentState: cleanCurrentState, // Use clean state
              previousState: cleanPreviousState, // Use clean state
              isGlobal: false,
              deps: deps,
            },
            {
              isTestSubscriber: () => false,
              getTestDependencies: (s) => {
                const subDeps = context.subscriberDeps.get(s);
                return subDeps ? Array.from(subDeps) : undefined;
              },
              StoreTestModeEnum: StoreTestMode,
            }
          );
          if (hookDecision.skip) return; // continue to next subscriber if skipped
        }
        notifiedSubscribers.add(sub); // Add to notified set before calling

        // Execute with tracking disabled to avoid recursive notifications
        context.trackingInProgress.add(sub);
        try {
          callback(); // Call the trackingCallback
        } finally {
          context.trackingInProgress.delete(sub);
        }
      }
    }
  });

  // Then notify global subscribers that haven't been notified yet
  // Only if the value for the changed key has actually changed
  if (
    !Object.is(
      currentState[changedKey as keyof T],
      previousState[changedKey as keyof T]
    )
  ) {
    context.allSubscribers.forEach((sub) => {
      if (
        context.activeSubscriptions.has(sub) &&
        !context.trackingInProgress.has(sub) &&
        !notifiedSubscribers.has(sub)
      ) {
        const callback = context.subscriberCallbacks.get(sub);
        if (callback) {
          if (activeTestHooks?.filterSubscriberNotification) {
            const hookDecision = activeTestHooks.filterSubscriberNotification(
              sub,
              {
                key: changedKey,
                currentState: cleanCurrentState, // Use clean state
                previousState: cleanPreviousState, // Use clean state
                isGlobal: true,
                deps: undefined, // Fixed null to undefined
              },
              {
                isTestSubscriber: () => false,
                getTestDependencies: (s) => {
                  const subDeps = context.subscriberDeps.get(s);
                  return subDeps ? Array.from(subDeps) : undefined;
                },
                StoreTestModeEnum: StoreTestMode,
              }
            );
            if (hookDecision.skip) return; // continue to next subscriber if skipped
          }
          notifiedSubscribers.add(sub); // Add to notified set before calling

          // Execute with tracking disabled to avoid recursive notifications
          context.trackingInProgress.add(sub);
          try {
            callback();
          } finally {
            context.trackingInProgress.delete(sub);
          }
        } else if (typeof sub === "function") {
          // For direct function subscribers (e.g. in tests), call with clean states
          // This is especially important for the unit tests
          notifiedSubscribers.add(sub); // Add to notified set before calling
          sub(cleanCurrentState, cleanPreviousState);
        }
      }
    });
  }
};
