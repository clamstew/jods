import { ComputeFunction } from "../types";
import { getCurrentSubscriber, setCurrentSubscriber } from "./store";

/**
 * Symbol for identifying computed properties
 */
export const COMPUTED_SYMBOL = Symbol("computed");

/**
 * Symbol for accessing isDirty flag on computed
 */
export const COMPUTED_IS_DIRTY = Symbol("computedIsDirty");

/**
 * Brand symbol for computed values (compile-time identification)
 * @internal
 */
declare const ComputedBrand: unique symbol;

/**
 * Interface for computed value object.
 * 
 * IMPORTANT: This type extends T so that ComputedValue<number> is assignable to number,
 * enabling excellent DX where computed properties can be used like regular values:
 * 
 * @example
 * ```ts
 * interface State { doubled?: ComputedValue<number>; }
 * const s = store<State>({ count: 5 });
 * s.doubled = computed(() => s.count * 2);
 * console.log(s.doubled + 10);  // ✅ Works! TypeScript sees this as number
 * ```
 */
export type ComputedValue<T = any, S = any> = T & {
  /** Call signature - computed values are callable */
  (storeInstance?: S): T;
  /** @internal Runtime symbol for identifying computed properties */
  [COMPUTED_SYMBOL]?: true;
  /** @internal Runtime symbol for dirty tracking */
  [COMPUTED_IS_DIRTY]?: boolean;
  /** @internal Method to mark the computed as needing recalculation */
  markDirty?: () => void;
  /** @internal Debug name for development */
  __debugName?: string;
  /** @internal Brand for type identification */
  readonly [ComputedBrand]?: true;
};

/**
 * Creates a computed property that will recalculate its value
 * only when accessed and any of its dependencies have changed
 *
 * @param fn - The function to compute the value
 * @returns A function that returns the computed value
 */
export function computed<T, S = any>(
  fn: ComputeFunction<T>
): ComputedValue<T, S> {
  // Cache for memoization
  let cachedValue: T;
  let isDirty = true;
  let lastThisContext: any = undefined;
  let storeRef: any = undefined; // Store reference to maintain context

  // Set of subscribers to notify when this computed value should update
  const subscribers = new Set<() => void>();

  // Function to mark the computed as dirty when dependencies change
  const markDirty = () => {
    // console.log(
    //  `Marking computed ${(getter as any).__debugName || "unknown"} as dirty`
    // );

    // Set the dirty flag to true to force reevaluation on next access
    isDirty = true;

    // Notify subscribers that depend on this computed value
    if (subscribers.size > 0) {
      subscribers.forEach((subscriber) => {
        try {
          subscriber();
        } catch (err) {
          console.error("Error in computed subscriber:", err);
        }
      });
    }
  };

  // Create getter function
  const getter = function (this: any, storeInstance?: S) {
    // Use 'this' as context if available, otherwise use provided storeInstance or stored reference
    const context =
      this !== undefined && this !== window && this !== globalThis
        ? this
        : storeInstance || storeRef;

    // Store the context for future calls if it's an object
    if (context && typeof context === "object") {
      storeRef = context;
    }

    // If the context has changed, mark as dirty
    if (lastThisContext !== context) {
      isDirty = true;
      lastThisContext = context;
    }

    // Track the current subscriber if one exists
    // This is for the computed function itself to be a dependency of another computed/subscriber
    const currentOuterSubscriber = getCurrentSubscriber();
    if (currentOuterSubscriber) {
      subscribers.add(currentOuterSubscriber);
    }

    // For debugging only
    // console.log(
    //   `Accessing computed ${
    //     (getter as any).__debugName || "unknown"
    //   }, isDirty: ${isDirty}, context:`,
    //   context
    // );

    // Recalculate value if dirty or first access
    if (isDirty) {
      let recomputeLoopCounter = 0;
      const MAX_RECOMPUTE_LOOPS = 5; // Safety break for potential infinite loops

      // Loop while dirty and within safety limits
      // This handles cases where the computed function itself modifies its dependencies mid-execution
      while (isDirty && recomputeLoopCounter < MAX_RECOMPUTE_LOOPS) {
        recomputeLoopCounter++;
        // console.log(
        //   `Recomputing ${
        //     (getter as any).__debugName || "unknown"
        //   } (loop ${recomputeLoopCounter})`
        // );

        // Assume we will successfully compute and clear dirty flag, unless fn() makes it dirty again
        // Temporarily set isDirty to false before calling fn, so we can detect if fn() itself causes it to become dirty again.
        isDirty = false;

        const prevInnerSubscriber = getCurrentSubscriber();
        setCurrentSubscriber(markDirty); // markDirty is for *this* computed instance to track its own deps

        try {
          cachedValue = fn.call(context);
          // console.log(
          //   `Computed ${(getter as any).__debugName || "unknown"} result:`,
          //   cachedValue
          // );
          // If fn() changed a signal that this computed depends on (via markDirty),
          // 'isDirty' will now be true again. The loop will continue if so.
        } finally {
          setCurrentSubscriber(prevInnerSubscriber);
        }
      }
      if (recomputeLoopCounter === MAX_RECOMPUTE_LOOPS && isDirty) {
        console.warn(
          `Computed property re-evaluation limit (${MAX_RECOMPUTE_LOOPS}) reached. ` +
            `Check for unstable computed functions that might be causing infinite recalculations.`
        );
        // In this state, isDirty might still be true, but we break the loop.
        // The currently cachedValue will be returned.
      }
    } else {
      // console.log(
      //   `Using cached value for ${(getter as any).__debugName || "unknown"}:`,
      //   cachedValue
      // );
    }

    return cachedValue;
  };

  // Make the subscribers set accessible for cleanup
  (getter as any).subscribers = subscribers;

  // Add a markDirty method that can be called directly to force recomputation
  (getter as any).markDirty = markDirty;

  // Add a getter/setter for isDirty that can be used for direct access
  Object.defineProperty(getter, COMPUTED_IS_DIRTY, {
    get: () => isDirty,
    set: (value: boolean) => {
      console.log(
        `Setting isDirty to ${value} for ${
          (getter as any).__debugName || "unknown"
        }`
      );
      isDirty = value;
    },
    enumerable: false,
    configurable: true,
  });

  // Mark the function as computed
  Object.defineProperty(getter, COMPUTED_SYMBOL, {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return getter as ComputedValue<T, S>;
}

/**
 * Checks if a value is a computed property
 * @param value - The value to check
 * @returns True if the value is a computed property
 */
export function isComputed(value: any): value is ComputedValue<any, any> {
  if (!value) return false;
  return typeof value === "function" && value[COMPUTED_SYMBOL] === true;
}

/**
 * Marks a computed property as dirty to force reevaluation on next access
 * @param computed - The computed property to mark dirty
 */
export function markComputedDirty(computed: ComputedValue<any, any>): void {
  if (isComputed(computed)) {
    // console.log(
    //  `Marking computed ${
    //    computed.__debugName || "unknown"
    //  } dirty via markComputedDirty`
    // );

    // First try to use the markDirty method if available
    if (typeof computed.markDirty === "function") {
      computed.markDirty();
    } else {
      // Fallback: set the isDirty property directly if available
      computed[COMPUTED_IS_DIRTY] = true;

      // If the computed has subscribers, notify them
      if ((computed as any).subscribers?.size > 0) {
        (computed as any).subscribers.forEach((subscriber: () => void) => {
          try {
            subscriber();
          } catch (err) {
            console.error("Error in computed subscriber:", err);
          }
        });
      }
    }
  }
}

/**
 * Force all computed properties in a store to be reevaluated on next access
 * @param storeProxy - The store proxy containing computed properties
 * @param definedComputedKeys - Set of keys that are computed properties
 */
export function markAllComputedDirty<T extends object>(
  storeProxy: T,
  definedComputedKeys: Set<string>
): void {
  // console.log(
  //   `Marking all computed properties dirty: ${Array.from(
  //     definedComputedKeys
  //   ).join(", ")}`
  // );

  // First mark all computed properties as dirty
  for (const key of definedComputedKeys) {
    try {
      const computed = (storeProxy as any)[key];
      if (isComputed(computed)) {
        // Set debug name for easier identification
        (computed as any).__debugName = key;

        // Mark the computed property as dirty
        if (typeof computed.markDirty === "function") {
          computed.markDirty();
        } else if (computed[COMPUTED_IS_DIRTY] !== undefined) {
          computed[COMPUTED_IS_DIRTY] = true;
        }
      }
    } catch (error) {
      console.warn(`Error marking computed property ${key} dirty:`, error);
    }
  }

  // Then force evaluation of all computed properties to ensure they're up-to-date
  // This separate loop ensures all properties are marked dirty before any are evaluated
  for (const key of definedComputedKeys) {
    try {
      // Access the property to trigger reevaluation
      const computed = (storeProxy as any)[key];
      if (isComputed(computed)) {
        // Call the computed function directly to force evaluation
        computed.call(storeProxy);
      } else {
        // Access the property to trigger getter
        void (storeProxy as any)[key];
      }
    } catch (error) {
      console.warn(`Error evaluating computed property ${key}:`, error);
    }
  }
}
