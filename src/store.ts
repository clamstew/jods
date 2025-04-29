import { Signal, Subscriber, Unsubscribe } from "./types";

// Store type definitions
export type StoreState = Record<string, any>;

export interface Store<T extends StoreState = StoreState> {
  [key: string]: any;
  getState: () => T;
  setState: (partial: Partial<T>) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
}

/**
 * Creates a signal with the given initial value
 * @param initialValue - The initial value of the signal
 * @returns A tuple of [read, write] functions
 */
function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  function read(): T {
    // Track the current subscriber if one is active
    if (currentSubscriber !== null) {
      subscribers.add(currentSubscriber);
    }
    return value;
  }

  function write(newValue: T): void {
    if (value === newValue) return;
    value = newValue;

    // Notify all subscribers for this signal
    const callbacksToRun = [...subscribers];
    for (const callback of callbacksToRun) {
      callback();
    }
  }

  return [read, write];
}

// Current subscriber being tracked
let currentSubscriber: (() => void) | null = null;

/**
 * Creates a reactive store for state management with fine-grained updates.
 * Uses signals under the hood for improved performance.
 *
 * Each property in the store is backed by a signal, allowing for automatic
 * dependency tracking. Subscribers only receive updates for properties they
 * actually use, which optimizes performance especially in larger applications.
 *
 * @param initialState - The initial state of the store
 * @returns A proxy object that can be mutated directly
 */
export function store<T extends StoreState>(initialState: T): T & Store<T> {
  // Map of property names to signals
  const signals = new Map<string, Signal<any>>();
  // Map of subscribers to their dependency maps
  const subscriberDeps = new Map<Subscriber<T>, Set<string>>();
  // Global subscribers to be notified of any change
  const allSubscribers = new Set<Subscriber<T>>();
  // Flag to prevent calling subscribers during initial tracking
  const trackingInProgress = new Set<Subscriber<T>>();

  // Initialize signals for each property in the initial state
  for (const key of Object.keys(initialState)) {
    signals.set(key, createSignal(initialState[key]));
  }

  /**
   * Get the current state by reading all signals
   */
  const getState = (): T => {
    const state: Record<string, any> = {};
    for (const [key, signal] of signals.entries()) {
      state[key] = signal[0](); // Call read function
    }
    return state as T;
  };

  /**
   * Update multiple properties at once
   */
  const setState = (partial: Partial<T>): void => {
    // Track which keys were modified to notify subscribers
    const changedKeys = new Set<string>();

    // Update each property
    for (const [key, value] of Object.entries(partial)) {
      let signal = signals.get(key);
      if (!signal) {
        signal = createSignal(value);
        signals.set(key, signal);
      }

      const currentValue = signal[0]();
      if (currentValue !== value) {
        signal[1](value); // Call write function
        changedKeys.add(key);
      }
    }

    // If nothing changed, don't notify anyone
    if (changedKeys.size === 0) return;

    // Build the current state once for subscribers
    const currentState = getState();

    // Notify targeted subscribers based on dependency tracking
    subscriberDeps.forEach((deps, subscriber) => {
      // Skip subscribers that are currently being tracked
      if (trackingInProgress.has(subscriber)) return;

      // Check if this subscriber depends on any changed keys
      for (const key of changedKeys) {
        if (deps.has(key)) {
          subscriber(currentState);
          break;
        }
      }
    });

    // Always notify global subscribers
    allSubscribers.forEach((subscriber) => {
      // Skip subscribers that are currently being tracked
      if (trackingInProgress.has(subscriber)) return;
      subscriber(currentState);
    });
  };

  /**
   * Subscribe to store changes with automatic dependency tracking
   */
  const subscribe = (subscriber: Subscriber<T>): Unsubscribe => {
    // Initialize an empty set for this subscriber's dependencies
    if (!subscriberDeps.has(subscriber)) {
      subscriberDeps.set(subscriber, new Set());
    }

    // Mark tracking as in progress to prevent notification during initialization
    trackingInProgress.add(subscriber);

    // Collect dependencies by running the subscriber once
    const deps = subscriberDeps.get(subscriber)!;
    const trackingCallback = () => {
      currentSubscriber = () => {
        // This will be called when any accessed signal changes
        // Only notify if we're not currently tracking dependencies
        if (!trackingInProgress.has(subscriber)) {
          subscriber(getState());
        }
      };

      // Clear old dependencies before tracking new ones
      deps.clear();

      // Run the subscriber to track accessed properties
      subscriber(getState());

      currentSubscriber = null;
    };

    // Initial tracking run
    trackingCallback();

    // If no dependencies were tracked, make it a global subscriber
    if (deps.size === 0) {
      allSubscribers.add(subscriber);
    }

    // Done tracking
    trackingInProgress.delete(subscriber);

    // Return unsubscribe function
    return () => {
      // Remove from dependency tracking
      subscriberDeps.delete(subscriber);

      // Remove from global subscribers
      allSubscribers.delete(subscriber);
    };
  };

  // Create handler for the proxy
  const handler: ProxyHandler<T & Store<T>> = {
    // Intercept property access to track dependencies and read from signals
    get(target, prop, receiver) {
      if (prop === "getState") return getState;
      if (prop === "setState") return setState;
      if (prop === "subscribe") return subscribe;

      // Special properties
      if (
        typeof prop === "symbol" ||
        prop === "__proto__" ||
        prop === "constructor" ||
        prop === "prototype"
      ) {
        return Reflect.get(target, prop, receiver);
      }

      // Get or create signal for this property
      const key = prop.toString();
      const signal = signals.get(key);

      if (!signal) {
        // Property doesn't exist, return undefined
        return undefined;
      }

      // If we're tracking dependencies, record this access
      if (currentSubscriber !== null) {
        const subscriber = subscriberDeps.get(currentSubscriber);
        if (subscriber) {
          subscriber.add(key);
        }
      }

      // Return the signal's current value
      return signal[0]();
    },

    // Intercept property writes to update signals
    set(target, prop, value, receiver) {
      if (
        typeof prop === "symbol" ||
        prop === "getState" ||
        prop === "setState" ||
        prop === "subscribe" ||
        prop === "__proto__" ||
        prop === "constructor" ||
        prop === "prototype"
      ) {
        return Reflect.set(target, prop, value, receiver);
      }

      const key = prop.toString();
      let signal = signals.get(key);

      if (!signal) {
        // Create a new signal for this property
        signal = createSignal(value);
        signals.set(key, signal);
      }

      const oldValue = signal[0]();
      if (oldValue === value) return true;

      // Update the signal
      signal[1](value);

      // Collect subscribers that depend on this property
      const affectedSubscribers = new Set<Subscriber<T>>();

      // Find subscribers that depend on this key
      subscriberDeps.forEach((deps, subscriber) => {
        if (trackingInProgress.has(subscriber)) return;
        if (deps.has(key)) {
          affectedSubscribers.add(subscriber);
        }
      });

      // Add global subscribers
      allSubscribers.forEach((subscriber) => {
        if (trackingInProgress.has(subscriber)) return;
        affectedSubscribers.add(subscriber);
      });

      // Notify affected subscribers
      if (affectedSubscribers.size > 0) {
        const currentState = getState();
        affectedSubscribers.forEach((subscriber) => {
          subscriber(currentState);
        });
      }

      return true;
    },

    // Handle property existence checks
    has(target, prop) {
      if (prop === "getState" || prop === "setState" || prop === "subscribe") {
        return true;
      }

      if (typeof prop === "symbol") {
        return Reflect.has(target, prop);
      }

      return signals.has(prop.toString());
    },

    // Support Object.keys() and similar operations
    ownKeys() {
      return [...signals.keys(), "getState", "setState", "subscribe"];
    },

    // Make properties enumerable
    getOwnPropertyDescriptor(target, prop) {
      if (prop === "getState" || prop === "setState" || prop === "subscribe") {
        return {
          value: target[prop as keyof typeof target],
          enumerable: false,
          configurable: true,
          writable: true,
        };
      }

      if (typeof prop === "symbol") {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      }

      const key = prop.toString();
      if (signals.has(key)) {
        return {
          value: signals.get(key)![0](),
          enumerable: true,
          configurable: true,
          writable: true,
        };
      }

      return undefined;
    },
  };

  // Create the proxy with minimal initial shape
  return new Proxy(
    {
      getState,
      setState,
      subscribe,
    } as unknown as T & Store<T>,
    handler
  );
}
