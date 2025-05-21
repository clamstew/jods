import { describe, it, expect, vi } from "vitest";
import { createProxyHandler } from "../../../core/store/proxy";
import { ProxyContext, StoreState, Store } from "../../../core/store/types";
import { SubscriptionContext } from "../../../core/store/subscription";
import { Signal, Subscriber } from "../../../types";
import {
  createSignal,
  getCurrentSubscriber,
  setCurrentSubscriber,
} from "../../../core/store/signal";
import { computed } from "../../../core/computed";
import { getState_impl, setState_impl } from "../../../core/store/state";
import {
  notifySubscribersForProxySet,
  subscribe_impl,
} from "../../../core/store/subscription";
import { COMPUTED_SYMBOL } from "../../../core/computed";
import { ComputedValue } from "../../../core/computed";

vi.mock("../../../core/store/state", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../../core/store/state")
  >();
  return {
    ...actual,
    getState_impl: vi.fn(),
    setState_impl: vi.fn(),
  };
});

vi.mock("../../../core/store/subscription", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../../core/store/subscription")
  >();
  return {
    ...actual,
    notifySubscribersForProxySet: vi.fn(),
    subscribe_impl: vi.fn(),
  };
});

vi.mock("../../../core/store/signal", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../../core/store/signal")
  >();
  return {
    ...actual,
    getCurrentSubscriber: vi.fn(),
    setCurrentSubscriber: vi.fn(),
    createSignal: vi.fn((val) => actual.createSignal(val)), // Use actual createSignal but allow spying
  };
});

describe("Proxy Handler (proxy.ts)", () => {
  let signals: Map<string, Signal<any>>;
  let definedComputedKeys: Set<string>;
  let subscriberDeps: Map<Subscriber<any>, Set<string>>;
  let previousStateContainer: { value: any };
  let mockStoreInstance: Store<any> & StoreState;
  let mockSubscriptionContext: SubscriptionContext<any>;
  let proxyContext: ProxyContext<any> & {
    subscriptionContext: SubscriptionContext<any>;
  };
  let handler: ProxyHandler<any>;
  let target: any;
  let proxy: any;

  const mockSubscriberFn = vi.fn();

  beforeEach(() => {
    signals = new Map<string, Signal<any>>();
    definedComputedKeys = new Set<string>();
    subscriberDeps = new Map<Subscriber<any>, Set<string>>();
    previousStateContainer = { value: {} };

    // Mock the store instance that the proxy handler might interact with
    mockStoreInstance = {
      getState: vi.fn(),
      setState: vi.fn(),
      subscribe: vi.fn(),
      toJSON: vi.fn(),
      // any other methods or properties accessed by proxy
    } as any;

    mockSubscriptionContext = {
      signals,
      definedComputedKeys,
      storeProxy: mockStoreInstance, // This will be the proxy itself, set later
      previousStateContainer,
      subscriberDeps,
      allSubscribers: new Set(),
      trackingInProgress: new Set(),
      subscriberCallbacks: new Map(),
      callbackToSubscriber: new Map(),
      activeSubscriptions: new Set(),
    };

    proxyContext = {
      signals,
      definedComputedKeys,
      subscriberDeps,
      previousStateContainer,
      storeInstance: mockStoreInstance, // This will be the proxy itself, set later
      subscriptionContext: mockSubscriptionContext,
      // reactContext, pendingChanges, scheduleReactUpdate (if needed for tests)
    };

    target = {}; // Start with an empty target object
    handler = createProxyHandler(proxyContext);
    proxy = new Proxy(target, handler);

    // After creating proxy, assign it to contexts where storeInstance/storeProxy is needed
    proxyContext.storeInstance = proxy;
    mockSubscriptionContext.storeProxy = proxy;

    // Reset mocks
    vi.mocked(getState_impl).mockReset();
    vi.mocked(setState_impl).mockReset();
    vi.mocked(notifySubscribersForProxySet).mockReset();
    vi.mocked(subscribe_impl).mockReset();
    vi.mocked(getCurrentSubscriber).mockReset();
    vi.mocked(setCurrentSubscriber).mockReset();
    vi.mocked(createSignal).mockClear(); // Clear calls for createSignal, but it still uses actual implementation
  });

  describe("get trap", () => {
    it("should return value from signal if property exists in signals", () => {
      const countSignal = createSignal(10);
      signals.set("count", countSignal);
      expect(proxy.count).toBe(10);
    });

    it("should return evaluated computed value if property is a defined computed key", () => {
      const computedFn = computed(() => 20);
      target.doubled = computedFn; // Computed defined on target
      definedComputedKeys.add("doubled");
      expect(proxy.doubled).toBe(20);
    });

    it("should return methods like getState, setState, subscribe, toJSON from storeInstance", () => {
      expect(typeof proxy.getState).toBe("function");
      expect(typeof proxy.setState).toBe("function");
      expect(typeof proxy.subscribe).toBe("function");
      expect(typeof proxy.toJSON).toBe("function");

      // Test that the correct implementations are returned/called via proxy
      const mockGetStateResult = { a: 1 };
      vi.mocked(getState_impl).mockReturnValue(mockGetStateResult);
      expect(proxy.getState()).toBe(mockGetStateResult);
      expect(getState_impl).toHaveBeenCalledWith(
        signals,
        definedComputedKeys,
        proxyContext.storeInstance
      );

      const testPayload = { b: 2 };
      proxy.setState(testPayload);
      expect(setState_impl).toHaveBeenCalledWith(
        testPayload,
        signals,
        definedComputedKeys,
        proxyContext.storeInstance,
        previousStateContainer,
        subscriberDeps,
        mockSubscriptionContext.allSubscribers,
        mockSubscriptionContext.trackingInProgress,
        mockSubscriptionContext.activeSubscriptions,
        mockSubscriptionContext.subscriberCallbacks
      );

      const subFn = vi.fn();
      const subOptions = { skipInitialCall: true };
      proxy.subscribe(subFn, subOptions);
      expect(subscribe_impl).toHaveBeenCalledWith(
        subFn,
        proxyContext.subscriptionContext,
        subOptions
      );

      // For toJSON, it should use getState_impl and then stringify/parse
      // The mock of getState_impl is already set up
      // We expect a deep clone essentially
      const stateForToJSON = { data: "test" };
      vi.mocked(getState_impl).mockReturnValue(stateForToJSON);
      const jsonResult = proxy.toJSON();
      expect(jsonResult).toEqual(stateForToJSON);
      expect(jsonResult).not.toBe(stateForToJSON); // Ensure it's a clone
      expect(getState_impl).toHaveBeenCalledWith(
        signals,
        definedComputedKeys,
        proxyContext.storeInstance
      );
    });

    it("should track dependency if a subscriber is active", () => {
      const countSignal = createSignal(5);
      signals.set("count", countSignal);
      const mockSubCallback = vi.fn();
      vi.mocked(getCurrentSubscriber).mockReturnValue(mockSubCallback);
      mockSubscriptionContext.callbackToSubscriber.set(
        mockSubCallback,
        mockSubscriberFn
      );

      void proxy.count; // Access to track

      expect(subscriberDeps.has(mockSubscriberFn)).toBe(true);
      expect(subscriberDeps.get(mockSubscriberFn)).toContain("count");
    });

    it("should track dependency for computed property if a subscriber is active", () => {
      target.myComputed = computed(() => 100);
      definedComputedKeys.add("myComputed");
      const mockSubCallback = vi.fn();
      vi.mocked(getCurrentSubscriber).mockReturnValue(mockSubCallback);
      mockSubscriptionContext.callbackToSubscriber.set(
        mockSubCallback,
        mockSubscriberFn
      );

      void proxy.myComputed; // Access to track

      expect(subscriberDeps.has(mockSubscriberFn)).toBe(true);
      expect(subscriberDeps.get(mockSubscriberFn)).toContain("myComputed");
    });

    it("should return undefined for non-existent properties", () => {
      expect(proxy.nonExistent).toBeUndefined();
    });

    it("should return functions from target prototype if not in signals", () => {
      class TestTarget {
        protoMethod() {
          return "from proto";
        }
      }
      target = new TestTarget();
      handler = createProxyHandler(proxyContext); // Recreate with new target
      proxy = new Proxy(target, handler);
      proxyContext.storeInstance = proxy; // Update contexts
      mockSubscriptionContext.storeProxy = proxy;

      expect(typeof proxy.protoMethod).toBe("function");
      expect(proxy.protoMethod()).toBe("from proto");
    });
  });

  describe("set trap", () => {
    beforeEach(() => {
      // Ensure getState_impl returns a consistent object for prev/current state checks
      vi.mocked(getState_impl).mockImplementation((s, d, p) => {
        const state: Record<string, any> = {};
        s.forEach((sig, key) => (state[key] = sig[0]()));
        // For computed keys in definedComputedKeys (d), try to get from proxy (p)
        // This simulates how getState_impl would access them via the proxy.
        d.forEach((key) => {
          if (p && typeof p[key] !== "undefined") {
            state[key] = p[key];
          } else if (s.has(key)) {
            // Fallback if not on proxy (e.g. raw computed in signal)
            const val = s.get(key)![0]();
            if (typeof val === "function" && (val as any)[COMPUTED_SYMBOL]) {
              state[key] = (val as ComputedValue<any>)();
            } else {
              state[key] = val;
            }
          }
        });
        return state;
      });
    });

    it("should update signal value and notify subscribers", () => {
      const initialSignalValue = 0;
      const countSignal = createSignal(initialSignalValue); // Uses actual createSignal due to mock setup
      signals.set("count", countSignal);
      // target.count = initialSignalValue; // Not strictly needed if getState_impl reads from signals

      // Set previousStateContainer.value explicitly for this test, as it's used by some internal logic
      // though for notifySubscribersForProxySet, the relevant previous state is what getState_impl returns before modification.
      previousStateContainer.value = { count: initialSignalValue };

      proxy.count = 1; // Update from 0 to 1

      expect(countSignal[0]()).toBe(1); // Signal value itself should be updated
      expect(notifySubscribersForProxySet).toHaveBeenCalledTimes(1);

      const expectedCurrentState = { count: 1 };
      const expectedPreviousState = { count: initialSignalValue }; // This should be { count: 0 }

      expect(notifySubscribersForProxySet).toHaveBeenCalledWith(
        mockSubscriptionContext,
        "count",
        expectedCurrentState, // Current state: { count: 1 }
        expectedPreviousState // Previous state: { count: 0 }
      );
    });

    it("should create a new signal if property does not exist and notify", () => {
      previousStateContainer.value = {}; // Empty initial
      proxy.newProp = "hello";

      expect(signals.has("newProp")).toBe(true);
      expect(signals.get("newProp")![0]()).toBe("hello");
      expect(notifySubscribersForProxySet).toHaveBeenCalledTimes(1);
      const expectedCurrentState = { newProp: "hello" };
      expect(notifySubscribersForProxySet).toHaveBeenCalledWith(
        mockSubscriptionContext,
        "newProp",
        expect.objectContaining(expectedCurrentState),
        {}
      );
      expect(previousStateContainer.value).toEqual(expectedCurrentState);
    });

    it("should not notify if value is same (Object.is comparison)", () => {
      const countSignal = createSignal(0);
      signals.set("count", countSignal);
      proxy.count = 0; // Set to same value
      expect(notifySubscribersForProxySet).not.toHaveBeenCalled();
    });

    it("should call set on a settable computed property and notify", () => {
      const getterValue = { value: 30 }; // Use an object to allow mutation by setter
      const setter = vi.fn((newValue) => {
        getterValue.value = newValue; // Simulate setter updating underlying state
      });
      const computedFn = computed(() => getterValue.value);
      // Manually attach a .set method to the computed function object
      (computedFn as any).set = setter;

      target.mySettableComputed = computedFn;
      definedComputedKeys.add("mySettableComputed");

      // Mock initial state: getState_impl will be called by proxy to get previous and current state
      // Call 1 (before set): Previous state
      vi.mocked(getState_impl).mockReturnValueOnce({ mySettableComputed: 30 });
      // Call 2 (after set, for notification): Current state
      // This mock should reflect the state *after* the setter has conceptually run
      vi.mocked(getState_impl).mockReturnValueOnce({ mySettableComputed: 35 });

      // Set previousStateContainer explicitly for this test case, as it's used by the proxy handler.
      previousStateContainer.value = { mySettableComputed: 30 };

      proxy.mySettableComputed = 35;

      expect(setter).toHaveBeenCalledWith(35);
      expect(notifySubscribersForProxySet).toHaveBeenCalledTimes(1);
      // Note: The actual value change of the computed depends on the setter's implementation
      // and how getState_impl fetches it. For this test, we focus on setter call and notification.
      // Assuming setter updates some underlying signal that getState_impl would pick up.
      const expectedCurrentStateAfterSet = { mySettableComputed: 35 }; // Idealized state
      vi.mocked(getState_impl)
        .mockReturnValueOnce(previousStateContainer.value) // Before set call internal to proxy
        .mockReturnValueOnce(expectedCurrentStateAfterSet); // After set call internal to proxy

      // Re-trigger for assertion with updated mock
      previousStateContainer.value = { mySettableComputed: 30 }; // Reset for this call path if necessary
      proxy.mySettableComputed = 35;

      expect(notifySubscribersForProxySet).toHaveBeenCalledWith(
        mockSubscriptionContext,
        "mySettableComputed",
        expectedCurrentStateAfterSet, // State after computed set
        { mySettableComputed: 30 } // State before computed set
      );
      expect(previousStateContainer.value).toEqual(
        expectedCurrentStateAfterSet
      );
    });
  });

  describe("deleteProperty trap", () => {
    beforeEach(() => {
      // Copied from "set trap" describe block to ensure getState_impl is properly mocked
      vi.mocked(getState_impl).mockImplementation((s, d, p) => {
        const state: Record<string, any> = {};
        s.forEach((sig, key) => (state[key] = sig[0]()));
        d.forEach((key) => {
          if (p && typeof p[key] !== "undefined") {
            state[key] = p[key];
          } else if (s.has(key)) {
            const val = s.get(key)![0]();
            if (typeof val === "function" && (val as any)[COMPUTED_SYMBOL]) {
              state[key] = (val as ComputedValue<any>)();
            } else {
              state[key] = val;
            }
          }
        });
        return state;
      });
    });

    it("should delete signal and notify subscribers", () => {
      signals.set("toBeDeleted", createSignal("value"));
      previousStateContainer.value = { toBeDeleted: "value" };

      const success = delete proxy.toBeDeleted;

      expect(success).toBe(true);
      expect(signals.has("toBeDeleted")).toBe(false);
      expect(definedComputedKeys.has("toBeDeleted")).toBe(false); // Ensure also removed from defined keys if it was
      expect(notifySubscribersForProxySet).toHaveBeenCalledTimes(1);
      expect(notifySubscribersForProxySet).toHaveBeenCalledWith(
        mockSubscriptionContext,
        "toBeDeleted",
        {}, // Current state after deletion
        { toBeDeleted: "value" } // Previous state
      );
      expect(previousStateContainer.value).toEqual({});
    });

    it("should return Reflect.deleteProperty result for non-signal properties", () => {
      target.plainProp = "abc";
      const success = delete proxy.plainProp;
      expect(success).toBe(true);
      expect(target.hasOwnProperty("plainProp")).toBe(false);
      expect(notifySubscribersForProxySet).not.toHaveBeenCalled();
    });
  });

  describe("has trap", () => {
    it("should return true if property is in signals", () => {
      signals.set("propInSignal", createSignal(1));
      expect("propInSignal" in proxy).toBe(true);
    });

    it("should return true if property is in definedComputedKeys", () => {
      definedComputedKeys.add("propIsComputed");
      target.propIsComputed = computed(() => 2);
      expect("propIsComputed" in proxy).toBe(true);
    });

    it("should return Reflect.has result for other properties", () => {
      target.regularProp = 3;
      expect("regularProp" in proxy).toBe(true);
      expect("nonExistentProp" in proxy).toBe(false);
    });
  });

  describe("ownKeys trap", () => {
    it("should return a unique set of keys from signals, target, and definedComputedKeys", () => {
      signals.set("signalKey", createSignal("s"));
      target.targetKey = "t";
      definedComputedKeys.add("computedKey");
      target.computedKey = computed(() => "c");

      // Add a key that exists in multiple places to test uniqueness
      signals.set("sharedKey", createSignal("s"));
      target.sharedKey = "t_val"; // Target might have it from initialState

      const keys = Reflect.ownKeys(proxy);
      expect(keys).toContain("signalKey");
      expect(keys).toContain("targetKey");
      expect(keys).toContain("computedKey");
      expect(keys).toContain("sharedKey");
      expect(new Set(keys).size).toBe(keys.length); // Check for uniqueness
      expect(keys.length).toBe(4); // signalKey, targetKey, computedKey, sharedKey
    });
  });

  describe("getOwnPropertyDescriptor trap", () => {
    it("should return a property descriptor for properties in signals", () => {
      signals.set("signalProp", createSignal("value"));
      const descriptor = Object.getOwnPropertyDescriptor(proxy, "signalProp");
      expect(descriptor).toEqual({
        configurable: true,
        enumerable: true,
        writable: true,
        value: "value",
      });
    });

    it("should return Reflect.getOwnPropertyDescriptor for other properties", () => {
      target.regularProp = "value";
      Object.defineProperty(target, "nonWritable", {
        value: "test",
        writable: false,
      });
      const descriptor = Object.getOwnPropertyDescriptor(proxy, "regularProp");
      expect(descriptor).toEqual(
        Object.getOwnPropertyDescriptor(target, "regularProp")
      );

      const nonWritableDesc = Object.getOwnPropertyDescriptor(
        proxy,
        "nonWritable"
      );
      expect(nonWritableDesc?.writable).toBe(false);
    });
  });
});
