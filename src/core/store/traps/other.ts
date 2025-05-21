import { StoreState } from "../types";
import { isComputed } from "../../computed";
import { ExtendedProxyContext } from "./helpers";

// The has trap implementation
export function hasTrap<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  target: T,
  prop: string | symbol
): boolean {
  const { signals, definedComputedKeys } = context;
  const key = String(prop);

  return (
    signals.has(key) ||
    definedComputedKeys.has(key) ||
    Reflect.has(target, prop)
  );
}

// The ownKeys trap implementation
export function ownKeysTrap<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  target: T
): Array<string | symbol> {
  const { signals, definedComputedKeys } = context;

  const signalKeys = Array.from(signals.keys());
  const targetKeys: Array<string | symbol> = Reflect.ownKeys(target);
  const definedKeys = Array.from(definedComputedKeys);
  const allKeys = new Set([...signalKeys, ...targetKeys, ...definedKeys]);

  return Array.from(allKeys);
}

// The getOwnPropertyDescriptor trap implementation
export function getOwnPropertyDescriptorTrap<T extends StoreState>(
  context: ExtendedProxyContext<T>,
  target: T,
  prop: string | symbol
): PropertyDescriptor | undefined {
  const { signals, definedComputedKeys, storeInstance } = context;
  const key = String(prop);

  if (signals.has(key)) {
    const rawValue = signals.get(key)![0]();
    return {
      configurable: true,
      enumerable: true,
      writable: true, // All signal-backed properties are writable via proxy set
      value: context.makeReactive(rawValue, () => {
        // Return reactive wrapper for descriptor value
        const topLevelSignal = signals.get(key);
        if (topLevelSignal) {
          const currentRawVal = topLevelSignal[0]();
          topLevelSignal[1](
            Array.isArray(currentRawVal)
              ? [...currentRawVal]
              : typeof currentRawVal === "object" && currentRawVal !== null
              ? { ...currentRawVal }
              : currentRawVal
          );
        }
      }),
    };
  }

  if (definedComputedKeys.has(key)) {
    const computedFn = Reflect.get(target, prop);
    if (isComputed(computedFn)) {
      return {
        configurable: true,
        enumerable: true,
        get: () => (computedFn as any).call(storeInstance),
        set:
          typeof (computedFn as any).set === "function"
            ? (newValue) =>
                (computedFn as any).set.call(storeInstance, newValue)
            : undefined,
      };
    }
  }

  return Reflect.getOwnPropertyDescriptor(target, prop);
}
