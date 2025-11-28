import { StoreState } from "../types";
import { debug, DebugCategory } from "../../../utils/debug";
import { getCurrentSubscriber } from "../signal";
import { getState_impl } from "../state";
import { isComputed, COMPUTED_SYMBOL, ComputedValue } from "../../computed";
import { subscribe_impl } from "../subscription";
import { setState_impl } from "../state";
import {
  ExtendedProxyContext,
  getRawValue,
  isPlainObject,
  arrayMutatorMethods,
} from "./helpers";

// Create reactive objects for nested properties
export function makeReactive<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  value: any,
  notifyParent?: () => void
): any {
  const rawValue = getRawValue(value);

  if (
    typeof rawValue !== "object" ||
    rawValue === null ||
    (rawValue as any)[COMPUTED_SYMBOL] === true ||
    (rawValue as any).__isProxy === true
  ) {
    return rawValue;
  }

  if (context.proxiedCache.has(rawValue)) {
    return context.proxiedCache.get(rawValue);
  }

  if (!isPlainObject(rawValue) && !Array.isArray(rawValue)) {
    return rawValue;
  }

  // Create a placeholder to prevent infinite recursion with circular references
  const proxyPlaceholder = {};
  context.proxiedCache.set(rawValue, proxyPlaceholder);

  const nestedSignals = new Map<string | symbol, any>();

  const getSignalForProp = (target: any, prop: string | symbol): any => {
    let signal = nestedSignals.get(prop);
    if (!signal) {
      const initialPropValue = prop in target ? target[prop as any] : undefined;
      signal = [
        () => getRawValue(initialPropValue),
        (newVal: any) => {
          target[prop as any] = newVal;
        },
      ];
      nestedSignals.set(prop, signal);
    }
    return signal;
  };

  const handler: ProxyHandler<any> = {
    get(target, prop, _receiver) {
      if (prop === "__isProxy") return true;
      if (prop === "__raw") return target;

      if (
        Array.isArray(target) &&
        typeof prop === "string" &&
        arrayMutatorMethods.includes(prop)
      ) {
        const originalMethod = target[prop as any];
        return function (...args: any[]) {
          const rawArgs = args.map(getRawValue);
          const result = originalMethod.apply(target, rawArgs);
          if (notifyParent) notifyParent();
          return result;
        };
      }

      const localSignal = getSignalForProp(target, prop);
      const valueFromLocalSignal = localSignal[0]();

      if (isComputed(valueFromLocalSignal)) {
        return valueFromLocalSignal;
      }

      return context.makeReactive(valueFromLocalSignal, () => {
        const currentVal = localSignal[0]();
        localSignal[1](
          Array.isArray(currentVal)
            ? [...currentVal]
            : typeof currentVal === "object" && currentVal !== null
            ? { ...currentVal }
            : currentVal
        );
      });
    },
    set(target, prop, newValue, _receiver) {
      const rawNewValue = getRawValue(newValue);
      const localSignal = getSignalForProp(target, prop);
      const currentValue = localSignal[0]();

      if (!Object.is(currentValue, rawNewValue)) {
        localSignal[1](rawNewValue);
        Reflect.set(target, prop, rawNewValue);
        if (notifyParent) notifyParent();
      } else {
        Reflect.set(target, prop, rawNewValue);
      }
      return true;
    },
    deleteProperty(target, prop) {
      if (Reflect.deleteProperty(target, prop)) {
        nestedSignals.delete(prop);
        if (notifyParent) {
          notifyParent();
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
        descriptor.configurable = true;
      }
      return descriptor;
    },
  };

  const thisProxy = new Proxy(rawValue, handler);
  // Replace the placeholder with the actual proxy
  context.proxiedCache.set(rawValue, thisProxy);

  // Initialize signals for existing properties
  if (isPlainObject(rawValue)) {
    for (const key in rawValue) {
      if (Object.prototype.hasOwnProperty.call(rawValue, key)) {
        getSignalForProp(rawValue, key);
      }
    }
  }

  return thisProxy;
}

// The get trap implementation
export function getTrap<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  target: T,
  prop: string | symbol,
  receiver: any
): any {
  const {
    signals,
    definedComputedKeys,
    subscriberDeps,
    previousStateContainer,
    storeInstance,
    subscriptionContext,
  } = context;

  // Ensure storeInstance is set
  if (!storeInstance) {
    // This check should only happen during initialization
    // For standard property access that's not one of our special methods
    // we return the value from the target directly
    const key = String(prop);
    if (
      key === "getState" ||
      key === "subscribe" ||
      key === "setState" ||
      key === "toJSON"
    ) {
      // These will be called once storeInstance is properly set
      return () => undefined;
    }
    return Reflect.get(target, prop, receiver);
  }

  const {
    allSubscribers,
    trackingInProgress,
    subscriberCallbacks,
    activeSubscriptions,
    callbackToSubscriber,
  } = subscriptionContext;

  const key = String(prop);
  const currentSub = getCurrentSubscriber();

  if (key === "getState")
    return () => getState_impl(signals, definedComputedKeys, storeInstance);

  if (key === "subscribe")
    return (subscriber: any, options: any) =>
      subscribe_impl(subscriber, subscriptionContext, options);

  if (key === "setState")
    return (partialState: any) =>
      setState_impl(
        partialState,
        signals,
        definedComputedKeys,
        storeInstance,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );

  if (key === "toJSON")
    return () =>
      JSON.parse(
        JSON.stringify(
          getState_impl(signals, definedComputedKeys, storeInstance)
        )
      );

  if (definedComputedKeys.has(key)) {
    const computedFnDefinition = Reflect.get(target, prop, receiver);
    if (isComputed(computedFnDefinition)) {
      // Track dependency on the computed key itself for the current subscriber
      if (currentSub !== null) {
        const actualSubscriber = callbackToSubscriber.get(currentSub!);
        if (actualSubscriber) {
          const deps =
            subscriberDeps.get(actualSubscriber) || new Set<string>();
          deps.add(key); // Add the computed property's key
          subscriberDeps.set(actualSubscriber, deps);
          debug.log(
            "store" as DebugCategory,
            `Subscriber for ${key} (computed key) now tracking: YES`
          );
        }
      }

      // Call the computed function to get the actual value
      return (computedFnDefinition as ComputedValue<any, any>)(storeInstance);
    } else {
      // This implies definedComputedKeys has a key for something not actually a computed function.
      return computedFnDefinition;
    }
  }

  let signal = signals.get(key);
  if (!signal) {
    if (key in target) {
      if (
        typeof target[key as keyof T] === "function" &&
        !Object.prototype.hasOwnProperty.call(target, key)
      ) {
        // Likely a prototype method on the initial state object
        return target[key as keyof T];
      }
      // If not in signals, but in target, it's a non-reactive property
      return getRawValue(Reflect.get(target, prop, receiver));
    }
    return undefined;
  }

  const valueFromSignal = signal[0](); // This is a raw value

  // Special handling for computed values stored in signals
  if (isComputed(valueFromSignal)) {
    // Track computed key dependency
    if (currentSub !== null) {
      const actualSubscriber = callbackToSubscriber.get(currentSub!);
      if (actualSubscriber) {
        const deps = subscriberDeps.get(actualSubscriber) || new Set<string>();
        deps.add(key); // Add the computed property's key
        subscriberDeps.set(actualSubscriber, deps);
      }
    }

    // Call the computed function to get the actual value
    return (valueFromSignal as ComputedValue<any, any>)(storeInstance);
  }

  const currentActiveSubscriberForDeps = getCurrentSubscriber();
  if (currentActiveSubscriberForDeps !== null) {
    const actualSubscriber = callbackToSubscriber.get(
      currentActiveSubscriberForDeps
    );
    if (actualSubscriber) {
      const deps = subscriberDeps.get(actualSubscriber) || new Set<string>();
      deps.add(key);
      subscriberDeps.set(actualSubscriber, deps);
      debug.log(
        "store" as DebugCategory,
        `Subscriber for ${key} now tracking: YES (via proxy get signal)`
      );
    }
  }

  // When a top-level property (which might be an object/array) is read,
  // return it wrapped in makeReactive.
  // Pass the property key as the path so nested computed properties can be tracked correctly
  return context.makeReactive(valueFromSignal, () => {
    const topLevelSignal = signals.get(key);
    if (topLevelSignal) {
      const rawCurrentVal = topLevelSignal[0](); // Get current raw value from signal
      // Create a new shallow clone to trigger reactivity for dependents of this top-level signal
      topLevelSignal[1](
        Array.isArray(rawCurrentVal)
          ? [...rawCurrentVal]
          : typeof rawCurrentVal === "object" && rawCurrentVal !== null
          ? { ...rawCurrentVal }
          : rawCurrentVal
      );
    }
  }, key); // Pass the property key as the starting path for nested computed tracking
}
