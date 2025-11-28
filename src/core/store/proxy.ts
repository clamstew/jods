// This file will contain proxy-related logic from core.ts

import { StoreState, ProxyContext } from "./types";
import { createSignal } from "./signal";
import { SubscriptionContext } from "./subscription";
import {
  getRawValue,
  isPlainObject,
  arrayMutatorMethods,
  getTrap,
  setTrap,
  deletePropertyTrap,
  hasTrap,
  ownKeysTrap,
  getOwnPropertyDescriptorTrap,
} from "./traps";
import { isComputed } from "../computed";
import {
  registerComputedDefinition,
  registerNestedObject,
} from "../computed-registry";

/**
 * Creates the proxy handler for the store instance.
 * The handler delegates to specialized trap functions for each proxy trap.
 */
export function createProxyHandler<T extends StoreState>(
  context: ProxyContext<T> & { subscriptionContext: SubscriptionContext<T> }
) {
  // Create a proxiedCache WeakMap to store references to already proxied objects
  const proxiedCache = new WeakMap<object, any>();

  // Track paths for nested objects (for computed registry)
  // Key: raw object, Value: path string
  const objectToPath = new WeakMap<object, string>();

  // Create the makeReactive function for nested objects
  // Now accepts optional path for computed property tracking
  function makeReactiveImpl(
    value: any,
    notifyParent?: () => void,
    currentPath?: string
  ): any {
    const rawValue = getRawValue(value);

    if (
      typeof rawValue !== "object" ||
      rawValue === null ||
      (rawValue as any).__isProxy === true
    ) {
      return rawValue;
    }

    // Always update the path for this object (important for computed registration)
    if (currentPath && rawValue) {
      objectToPath.set(rawValue, currentPath);
    }

    // Check if we have a cached proxy for this raw value
    if (proxiedCache.has(rawValue)) {
      return proxiedCache.get(rawValue);
    }

    if (!isPlainObject(rawValue) && !Array.isArray(rawValue)) {
      return rawValue;
    }

    // IMPORTANT: Create and cache the proxy FIRST to handle circular dependencies
    const nestedSignals = new Map<string | symbol, any>();

    const getSignalForProp = (
      target: any, // raw target
      prop: string | symbol
    ): any => {
      let signal = nestedSignals.get(prop);
      if (!signal) {
        const initialPropValue =
          prop in target ? target[prop as any] : undefined;
        // Signal stores raw value
        signal = createSignal(getRawValue(initialPropValue));
        nestedSignals.set(prop, signal);
      }
      return signal;
    };

    const handler: ProxyHandler<any> = {
      get(target, prop, _receiver) {
        // target is rawValue
        if (prop === "__isProxy") return true;
        if (prop === "__raw") return target;

        if (
          Array.isArray(target) &&
          typeof prop === "string" &&
          arrayMutatorMethods.includes(prop)
        ) {
          const originalMethod = target[prop as any];
          return function (...args: any[]) {
            // Args to array mutators should also be raw if they are objects/proxies
            const rawArgs = args.map(getRawValue);
            const result = originalMethod.apply(target, rawArgs);
            // After mutation, the array (target) has changed structurally.
            if (notifyParent) notifyParent();
            return result;
          };
        }

        const localSignal = getSignalForProp(target, prop);
        const valueFromLocalSignal = localSignal[0](); // This is a raw value

        // Build the nested path for this property (use dynamically looked up parent path)
        const parentPath = objectToPath.get(target);
        const nestedPath = parentPath
          ? `${parentPath}.${String(prop)}`
          : String(prop);

        // Check if the value is a computed property - auto-invoke it
        if (isComputed(valueFromLocalSignal)) {
          // Get the store instance for 'this' context
          const storeInstance = context.storeInstance;
          return (valueFromLocalSignal as any).call(storeInstance);
        }

        // Recursively make the raw value reactive for return.
        // The notifyParent for this level is a function that triggers the current signal
        // indicating that the object ITSELF (valueFromLocalSignal) has changed internally.
        return makeReactiveImpl(
          valueFromLocalSignal,
          () => {
            const currentVal = localSignal[0](); // Get current raw value
            // Create a new shallow clone to trigger reactivity for dependents of this signal
            localSignal[1](
              Array.isArray(currentVal)
                ? [...currentVal]
                : typeof currentVal === "object" && currentVal !== null
                ? { ...currentVal }
                : currentVal
            );
          },
          nestedPath
        );
      },
      set(target, prop, newValue, _receiver) {
        // target is rawValue
        const key = String(prop);

        // Check if this is a computed value being assigned
        if (isComputed(newValue)) {
          // Get the path for this object from the WeakMap (dynamically looked up)
          const parentPath = objectToPath.get(target);
          const nestedPath = parentPath ? `${parentPath}.${key}` : key;

          // Get the root store from context
          const rootStore = context.storeInstance;
          if (rootStore) {
            registerComputedDefinition(rootStore, nestedPath, newValue);
          }

          // Store the computed function on the target (not the raw value)
          Reflect.set(target, prop, newValue);
          return true;
        }

        const rawNewValue = getRawValue(newValue);
        const localSignal = getSignalForProp(target, prop);
        const currentValue = localSignal[0]();

        if (!Object.is(currentValue, rawNewValue)) {
          localSignal[1](rawNewValue); // Update signal with new raw value
          Reflect.set(target, prop, rawNewValue); // Update raw target with raw value
        } else {
          // If value is same, still ensure raw target is also up-to-date
          // (e.g. if it held a proxy before and now we're confirming raw value)
          Reflect.set(target, prop, rawNewValue);
        }
        return true;
      },
      deleteProperty(target, prop) {
        // target is rawValue
        if (Reflect.deleteProperty(target, prop)) {
          nestedSignals.delete(prop);
          if (notifyParent) {
            notifyParent(); // Structural change
          }
          return true;
        }
        return false;
      },
      has(target, prop) {
        if (prop === "__isProxy" || prop === "__raw") return true;
        return prop in target;
      },
      ownKeys(target) {
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, prop) {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
        if (descriptor) {
          descriptor.configurable = true; // Ensure properties can be reconfigured for reactivity
        }
        return descriptor;
      },
    };

    const thisProxy = new Proxy(rawValue, handler);
    proxiedCache.set(rawValue, thisProxy);

    // Initialize signals for existing properties AFTER caching the proxy
    if (isPlainObject(rawValue)) {
      for (const key in rawValue) {
        if (Object.prototype.hasOwnProperty.call(rawValue, key)) {
          getSignalForProp(rawValue, key);
        }
      }
    }

    return thisProxy;
  }

  // Create extended context to include makeReactive and proxiedCache
  const extendedContext = {
    ...context,
    proxiedCache,
    makeReactive: makeReactiveImpl,
    storeInstance: context.storeInstance || {},
  };

  // Return the proxy handler with all traps delegating to specialized functions
  return {
    get: (target: T, prop: string | symbol, receiver: any) => {
      // For any methods that need storeInstance, we need to resolve the circularity
      if (
        prop === "getState" ||
        prop === "setState" ||
        prop === "subscribe" ||
        prop === "toJSON"
      ) {
        const storeInstance = receiver; // Use the receiver (the proxy itself) as storeInstance
        extendedContext.storeInstance = storeInstance;
      }
      return getTrap(extendedContext, target, prop, receiver);
    },

    set: (target: T, prop: string | symbol, value: any, receiver: any) => {
      extendedContext.storeInstance = receiver;
      return setTrap(extendedContext, target, prop, value, receiver);
    },

    deleteProperty: (target: T, prop: string | symbol) => {
      return deletePropertyTrap(extendedContext, target, prop);
    },

    has: (target: T, prop: string | symbol) => {
      return hasTrap(extendedContext, target, prop);
    },

    ownKeys: (target: T) => {
      return ownKeysTrap(extendedContext, target);
    },

    getOwnPropertyDescriptor: (target: T, prop: string | symbol) => {
      return getOwnPropertyDescriptorTrap(extendedContext, target, prop);
    },
  };
}
