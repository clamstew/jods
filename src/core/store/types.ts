// Define StoreState here as the single source of truth
export type StoreState = Record<string, any>;

/**
 * Store interface for interacting with jods store
 */
export interface Store<T extends StoreState> {
  /**
   * Get a JSON-serializable snapshot of the current state
   */
  getState(): T;

  /**
   * Subscribe to store changes with automatic dependency tracking
   * @param subscriber Callback function that receives current and previous state
   * @param options Subscription options (skipInitialCall)
   * @returns Unsubscribe function
   */
  subscribe(
    subscriber: Subscriber<T>,
    options?: { skipInitialCall?: boolean }
  ): Unsubscribe;

  /**
   * Batch multiple updates into a single notification
   * @param fn Function that performs multiple updates
   * @param batchName Optional name for debugging
   */
  batch<R>(fn: () => R, batchName?: string): R;

  /**
   * Begin a manual batch update sequence
   * @param batchName Optional name for the batch operation
   */
  beginBatch(batchName?: string): void;

  /**
   * Commit changes from a manual batch update
   */
  commitBatch(): void;
}

/**
 * Options for store context/framework detection
 */
export interface StoreContextOptions {
  context?: "react" | "remix" | "preact" | null;
}

// No need for a separate export type { StoreState } if defined with export type directly.

// Added ProxyContext
import { Signal, Subscriber, Unsubscribe } from "../../types"; // For types used in ProxyContext

export interface ProxyContext<T extends StoreState> {
  signals: Map<string, Signal<any>>;
  definedComputedKeys: Set<string>;
  subscriberDeps: Map<Subscriber<T>, Set<string>>; // From SubscriptionContext, needed for dep tracking in get
  previousStateContainer: { value: T };
  storeInstance: T & Store<T>; // The proxy instance itself, for internal calls like getState
  reactContext?: boolean;
  pendingChanges?: Map<string, any>;
  scheduleReactUpdate?: () => void;
  // Reference to the fuller subscription context for calling subscribe/unsubscribe on the main store instance
  // This creates a circular dependency if SubscriptionContext also holds ProxyContext.
  // Better: The main createStore function will have access to both contexts.
  // The proxy handler will be created with references to specific functions or smaller contexts if needed.
  // For now, let subscriptionContext be passed separately to createProxyHandler.
}
