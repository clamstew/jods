import { Subscriber, Unsubscribe } from "./types";

// Store type definitions
export type StoreState = Record<string, any>;

export interface Store<T extends StoreState = StoreState> {
  [key: string]: any;
  getState: () => T;
  setState: (partial: Partial<T>) => void;
  subscribe: (subscriber: Subscriber<T>) => Unsubscribe;
}

/**
 * Creates a reactive store for state management.
 * @param initialState - The initial state of the store
 * @returns A proxy object that can be mutated directly
 */
export function store<T extends StoreState>(initialState: T): T & Store<T> {
  let state = { ...initialState };
  const subscribers = new Set<Subscriber<T>>();

  const notifySubscribers = (newState: T) => {
    subscribers.forEach((subscriber) => {
      subscriber(newState);
    });
  };

  const getState = (): T => {
    return state;
  };

  const setState = (partial: Partial<T>): void => {
    const newState = { ...state, ...partial };
    state = newState;
    notifySubscribers(newState);
  };

  const subscribe = (subscriber: Subscriber<T>): Unsubscribe => {
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  };

  // Create handler for the proxy
  const handler: ProxyHandler<T & Store<T>> = {
    get(target, prop, receiver) {
      if (prop === "getState") return getState;
      if (prop === "setState") return setState;
      if (prop === "subscribe") return subscribe;
      return Reflect.get(state, prop, receiver);
    },
    set(target, prop, value) {
      if (
        typeof prop === "symbol" ||
        prop === "getState" ||
        prop === "setState" ||
        prop === "subscribe"
      ) {
        return Reflect.set(target, prop, value);
      }

      const oldValue = state[prop as keyof T];
      if (oldValue === value) return true;

      state = {
        ...state,
        [prop]: value,
      };

      notifySubscribers(state);
      return true;
    },
  };

  // Create the proxy
  return new Proxy(
    { ...state, getState, setState, subscribe } as T & Store<T>,
    handler
  );
}
