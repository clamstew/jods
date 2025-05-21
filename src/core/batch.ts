import type { Store, StoreState } from "./store";
import { ProxyContext } from "./store/types";
import { SubscriptionContext } from "./store/subscription";
import { debug, DebugCategory } from "../utils/debug";
import { Subscriber } from "../types";
import { isComputed, markAllComputedDirty } from "./computed";

// We need to determine React context status, but can't directly import reactContextGlobal
// as it would create a circular dependency. Use a function that checks the context instead.
let isReactContext = false;
export function setIsReactContext(value: boolean): void {
  isReactContext = value;
}

// Track active batches globally
const batchStack: Array<{
  changes: Map<string, any>;
  storeName?: string;
  storeCtx: WeakRef<BatchStoreContext<any>>;
}> = [];

// Type for the store context with batching
export interface BatchStoreContext<T extends StoreState> {
  proxyContext: ProxyContext<T> & {
    subscriptionContext: SubscriptionContext<T>;
  };
  storeProxy: T & Store<T>;
}

/**
 * Reset batch state completely - used for testing only
 */
export function resetBatchState(): void {
  batchStack.length = 0;
}

/**
 * Determines if batching is currently active
 */
export function isBatchActive(): boolean {
  return batchStack.length > 0;
}

/**
 * Clear batch stack - used for testing and error recovery
 */
export function clearBatchStack(): void {
  batchStack.length = 0;
}

/**
 * Records a change to the current batch if batching is active
 */
export function recordBatchChange(key: string, value: any): boolean {
  if (!isBatchActive()) return false;

  const currentBatch = batchStack[batchStack.length - 1];
  currentBatch.changes.set(key, value);
  return true;
}

/**
 * Gets the current batch store context if batching is active
 */
export function getCurrentBatchStoreContext<
  T extends StoreState
>(): BatchStoreContext<T> | null {
  if (!isBatchActive()) return null;

  const ctx = batchStack[batchStack.length - 1].storeCtx.deref();
  return ctx || null;
}

/**
 * Execute a function in a batched context, deferring subscriber notifications
 * until all changes are complete
 */
export function batch<T extends StoreState, R>(
  storeCtx: BatchStoreContext<T>,
  fn: () => R,
  batchName?: string
): R {
  const isOuterBatch = !isBatchActive();
  const { subscriptionContext: context } = storeCtx.proxyContext;

  // Store the original suppressNotifications state
  const originalSuppressNotifications = context.suppressNotifications;

  // Start a new batch
  batchStack.push({
    changes: new Map(),
    storeName: batchName,
    storeCtx: new WeakRef(storeCtx),
  });

  // Enable suppressNotifications during batch operation
  context.suppressNotifications = true;

  let result!: R; // Use definite assignment assertion
  let error: unknown;

  try {
    // Execute the function that will make changes
    result = fn();

    // Ensure changes are applied immediately for inner batches for easier debugging
    if (!isOuterBatch && batchStack.length > 1) {
      // Force recomputing any computed properties that might depend on changed properties
      if (storeCtx.proxyContext.definedComputedKeys.size > 0) {
        markAllComputedDirty(
          storeCtx.storeProxy,
          storeCtx.proxyContext.definedComputedKeys
        );

        // Access all computed properties to force reevaluation
        for (const computedKey of storeCtx.proxyContext.definedComputedKeys) {
          try {
            // Force evaluation by accessing the property
            void (storeCtx.storeProxy as any)[computedKey];
          } catch (err) {
            console.error(
              `Error evaluating computed property ${computedKey}:`,
              err
            );
          }
        }
      }
    }
  } catch (e) {
    error = e;
  } finally {
    // Always handle the batch, even if an error occurs
    if (batchStack.length > 0) {
      const currentBatch = batchStack.pop()!;

      // If this is the outer batch or we're not in a nested batch context
      if (isOuterBatch && currentBatch.changes.size > 0) {
        const ctx = currentBatch.storeCtx.deref();
        if (ctx) {
          // Apply changes with suppressNotifications still true
          applyBatchedChanges(
            ctx,
            currentBatch.changes,
            currentBatch.storeName
          );
        }
      } else if (!isOuterBatch && currentBatch.changes.size > 0) {
        // For nested batches, merge changes into parent batch
        const parentBatch = batchStack[batchStack.length - 1];
        currentBatch.changes.forEach((value, key) => {
          parentBatch.changes.set(key, value);
        });
      }
    }

    // Force computation of all computed values after batch complete
    if (isOuterBatch) {
      try {
        if (storeCtx.proxyContext.definedComputedKeys.size > 0) {
          // Force dirty status on all computed properties
          markAllComputedDirty(
            storeCtx.storeProxy,
            storeCtx.proxyContext.definedComputedKeys
          );

          // Now access each computed property to trigger recalculation with current values
          for (const computedKey of storeCtx.proxyContext.definedComputedKeys) {
            try {
              // Force evaluation with a direct access
              const computedValue = (storeCtx.storeProxy as any)[computedKey];
              if (
                typeof computedValue === "function" &&
                isComputed(computedValue)
              ) {
                // If the computed property is a function, execute it directly
                computedValue.call(storeCtx.storeProxy);
              }
            } catch (err) {
              console.error(
                `Error evaluating computed property ${computedKey}:`,
                err
              );
            }
          }
        }
      } catch (err) {
        console.error("Error recomputing computed properties:", err);
      }
    }

    // Restore original suppressNotifications only on the outer batch
    if (isOuterBatch) {
      context.suppressNotifications = originalSuppressNotifications;
    }

    // Make sure to clear the batch stack in case of error
    if (error !== undefined) {
      clearBatchStack();

      // Important: Restore original suppressNotifications on error
      context.suppressNotifications = originalSuppressNotifications;

      throw error;
    }
  }

  return result;
}

/**
 * Begin a manual batch update sequence
 */
export function beginBatch<T extends StoreState>(
  storeCtx: BatchStoreContext<T>,
  batchName?: string
): void {
  const { subscriptionContext: context } = storeCtx.proxyContext;

  // Store the original suppressNotifications state
  if (batchStack.length === 0) {
    // Only store original value for outermost batch
    context.originalSuppressNotifications = context.suppressNotifications;
  }

  // Enable suppressNotifications during batch
  context.suppressNotifications = true;

  batchStack.push({
    changes: new Map(),
    storeName: batchName,
    storeCtx: new WeakRef(storeCtx),
  });
}

/**
 * Commit changes from a manual batch update
 */
export function commitBatch(): void {
  if (!isBatchActive()) {
    console.warn("commitBatch called without an active batch");
    return;
  }

  const currentBatch = batchStack.pop()!;
  const ctx = currentBatch.storeCtx.deref();

  if (ctx) {
    const { subscriptionContext: context } = ctx.proxyContext;

    // Apply changes with suppressNotifications handled inside
    if (currentBatch.changes.size > 0) {
      applyBatchedChanges(ctx, currentBatch.changes, currentBatch.storeName);
    }

    // Restore original suppressNotifications value if this is the last batch
    if (
      batchStack.length === 0 &&
      context.originalSuppressNotifications !== undefined
    ) {
      context.suppressNotifications = context.originalSuppressNotifications;
      delete context.originalSuppressNotifications;
    }
  }
}

/**
 * Apply all batched changes and notify subscribers once
 */
function applyBatchedChanges<T extends StoreState>(
  storeCtx: BatchStoreContext<T>,
  changes: Map<string, any>,
  batchName?: string
): void {
  const { proxyContext, storeProxy } = storeCtx;
  const { subscriptionContext: context } = proxyContext;

  debug.log(
    "batch" as DebugCategory,
    `Applying batch${batchName ? ` '${batchName}'` : ""} with ${
      changes.size
    } changes: ${Array.from(changes.keys()).join(", ")}`
  );

  // Capture state before any changes
  const previousState = { ...proxyContext.previousStateContainer.value };

  // Make sure notifications are suppressed during changes
  const originalSuppressNotifications = context.suppressNotifications;
  context.suppressNotifications = true;

  try {
    // Step 1: Apply all direct value changes
    for (const [key, value] of changes.entries()) {
      // Skip computed properties for now - we'll handle them in the next step
      if (proxyContext.definedComputedKeys.has(key)) {
        continue;
      }

      if (value === undefined) {
        // Handle property deletion (marked by undefined value)
        try {
          delete (storeProxy as any)[key];
        } catch (err) {
          // If delete operation failed, try an alternative approach
          console.warn(
            `Error deleting property ${key}, trying alternative approach:`,
            err
          );
          // Remove from signals and definedComputedKeys directly
          if (proxyContext.signals.has(key)) {
            proxyContext.signals.delete(key);
          }
          if (proxyContext.definedComputedKeys.has(key)) {
            proxyContext.definedComputedKeys.delete(key);
          }
        }
      } else {
        // Regular property
        (storeProxy as any)[key] = value;
      }
    }

    // Step 2: Now handle computed properties
    for (const [key, value] of changes.entries()) {
      if (proxyContext.definedComputedKeys.has(key)) {
        // It's a settable computed property
        const computedDefinition = Reflect.get(storeProxy, key);
        if (
          isComputed(computedDefinition) &&
          typeof (computedDefinition as any).set === "function"
        ) {
          (computedDefinition as any).set.call(storeProxy, value);
        }
      }
    }

    // Step 3: Mark all computed properties as dirty to force recalculation
    if (proxyContext.definedComputedKeys.size > 0) {
      markAllComputedDirty(storeProxy, proxyContext.definedComputedKeys);
    }

    // Step 4: Ensure all computed properties are up-to-date by accessing them
    for (const computedKey of proxyContext.definedComputedKeys) {
      try {
        // Force direct access to the computed property to trigger evaluation
        const computedValue = (storeProxy as any)[computedKey];
        if (typeof computedValue === "function" && isComputed(computedValue)) {
          computedValue.call(storeProxy); // Execute the computed function directly
        }
      } catch (err) {
        console.error(
          `Error evaluating computed property ${computedKey}:`,
          err
        );
      }
    }

    // Capture the final state after all changes and computed reevaluations
    const currentState = { ...storeProxy };

    // Clean state objects for subscriber notifications
    const cleanCurrentState = { ...currentState };
    const cleanPreviousState = { ...previousState };

    // Remove batch methods from state objects
    delete (cleanCurrentState as any).batch;
    delete (cleanCurrentState as any).beginBatch;
    delete (cleanCurrentState as any).commitBatch;
    delete (cleanPreviousState as any).batch;
    delete (cleanPreviousState as any).beginBatch;
    delete (cleanPreviousState as any).commitBatch;

    // Temporarily restore suppressNotifications to allow notification
    context.suppressNotifications = false;

    // Notify subscribers of all changes at once
    notifyBatchSubscribers(
      context,
      cleanCurrentState as T,
      cleanPreviousState as T,
      Array.from(changes.keys())
    );
  } finally {
    // Restore the original suppressNotifications state
    context.suppressNotifications = originalSuppressNotifications;
  }
}

/**
 * Notify subscribers after a batch update
 */
function notifyBatchSubscribers<T extends StoreState>(
  context: SubscriptionContext<T>,
  currentState: T,
  previousState: T,
  changedKeys: string[]
): void {
  // Skip if notifications are still suppressed
  if (context.suppressNotifications) {
    console.warn(
      "Attempted to notify subscribers while notifications are suppressed"
    );
    return;
  }

  const notifiedSubscribers = new Set<Subscriber<T>>();

  // Track subscribers to notify based on dependencies
  changedKeys.forEach((key) => {
    context.subscriberDeps.forEach((deps, sub) => {
      if (
        deps.has(key) &&
        context.activeSubscriptions.has(sub) &&
        !context.trackingInProgress.has(sub) &&
        !notifiedSubscribers.has(sub)
      ) {
        notifiedSubscribers.add(sub);
      }
    });
  });

  // Add global subscribers that haven't been marked for notification yet
  context.allSubscribers.forEach((sub) => {
    if (
      context.activeSubscriptions.has(sub) &&
      !context.trackingInProgress.has(sub) &&
      !notifiedSubscribers.has(sub)
    ) {
      notifiedSubscribers.add(sub);
    }
  });

  // Get latest state before notifying subscribers
  const finalState = { ...currentState };

  // First do a synchronous notification for non-React subscribers
  notifiedSubscribers.forEach((sub) => {
    const callback = context.subscriberCallbacks.get(sub);
    // For non-React contexts or direct function subscribers, notify synchronously
    if (callback && !isReactContext) {
      try {
        // Execute the callback with tracking temporarily disabled
        context.trackingInProgress.add(sub);
        callback();
      } finally {
        context.trackingInProgress.delete(sub);
      }
    } else if (typeof sub === "function") {
      // Direct call for function subscribers (common in tests)
      sub(finalState, previousState);
    }
  });

  // For React contexts, use the microtask queue for batched updates
  if (isReactContext) {
    // Delay notification to ensure all state updates are complete
    Promise.resolve().then(() => {
      // Notify React subscribers through the microtask queue
      notifiedSubscribers.forEach((sub) => {
        const callback = context.subscriberCallbacks.get(sub);
        if (callback) {
          try {
            // Execute the callback with tracking temporarily disabled
            context.trackingInProgress.add(sub);
            callback();
          } finally {
            context.trackingInProgress.delete(sub);
          }
        }
      });
    });
  }
}
