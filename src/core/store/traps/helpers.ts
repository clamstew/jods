import { StoreState, ProxyContext } from "../types";
import { SubscriptionContext } from "../subscription";
import { COMPUTED_SYMBOL } from "../../computed";

// Extended context with shared state and functionality
export interface ExtendedProxyContext<T extends StoreState>
  extends ProxyContext<T> {
  subscriptionContext: SubscriptionContext<T>;
  proxiedCache: WeakMap<object, any>;
  makeReactive: (
    value: any,
    notifyParent?: () => void,
    currentPath?: string
  ) => any;
}

// Helper function to get raw value from a potentially proxied value
export function getRawValue(value: any): any {
  return value && typeof value === "object" && value.__isProxy === true
    ? value.__raw
    : value;
}

// Helper to check if a value is a plain object
export function isPlainObject(value: unknown): value is Record<string, any> {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  let ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof ctor === "function" &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) ===
      Function.prototype.toString.call(Object)
  );
}

// Array methods that modify the array
export const arrayMutatorMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

// Create a computed wrapper for consistent handling
export function createComputedWrapper(result: any, computedFn: any): any {
  // For Jest/Vitest equality tests, we need to short-circuit and return primitive values directly
  const isPrimitive =
    typeof result === "string" ||
    typeof result === "number" ||
    typeof result === "boolean" ||
    result === null ||
    result === undefined;

  if (isPrimitive) {
    return result; // Return primitive values directly
  }

  // Otherwise, create a wrapper function for objects/arrays that gives more flexibility
  const computedWrapper = function () {
    return result;
  };

  // Mark it as a computed wrapper
  Object.defineProperty(computedWrapper, COMPUTED_SYMBOL, {
    value: true,
    enumerable: false,
    configurable: false,
  });

  // Add subscribers if needed
  if (computedFn.subscribers) {
    computedWrapper.subscribers = computedFn.subscribers;
  }

  return computedWrapper;
}
