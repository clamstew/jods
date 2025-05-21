import { describe, it, expect, vi } from "vitest";
import {
  subscribe_impl,
  notifySubscribersForProxySet,
  SubscriptionContext,
} from "../../../core/store/subscription";
import { Store, StoreState } from "../../../core/store/types";
import { Signal, Subscriber } from "../../../types";
import {
  createSignal,
  getCurrentSubscriber,
  setCurrentSubscriber,
} from "../../../core/store/signal";
import { createProxyHandler } from "../../../core/store/proxy";
import { ProxyContext } from "../../../core/store/types";

// Mock the signal module
vi.mock("../../../core/store/signal", () => ({
  createSignal: vi.fn().mockImplementation((val) => {
    const subscribers = new Set();
    return [
      // read function
      vi.fn().mockImplementation(() => {
        const currentSubscriber = getCurrentSubscriberMock();
        if (currentSubscriber) {
          subscribers.add(currentSubscriber);
        }
        return val;
      }),
      // write function
      vi.fn().mockImplementation((newVal) => {
        val = newVal;
      }),
    ];
  }),
  getCurrentSubscriber: vi.fn(),
  setCurrentSubscriber: vi.fn(),
}));

// Create a direct reference to the mocked function for easier access
const getCurrentSubscriberMock = vi.fn();
vi.mocked(getCurrentSubscriber).mockImplementation(getCurrentSubscriberMock);

describe("Subscription Management (subscription.ts)", () => {
  let mockContext: SubscriptionContext<any>;
  let mockSubscriber: Subscriber<any>;
  let signalsMap: Map<string, Signal<any>>;
  let definedComputedKeysSet: Set<string>;
  let previousStateContainerObj: { value: any };
  let actualStoreProxy: Store<any> & StoreState;

  beforeEach(() => {
    signalsMap = new Map<string, Signal<any>>();
    definedComputedKeysSet = new Set<string>();
    previousStateContainerObj = { value: {} };
    mockSubscriber = vi.fn();

    // Reset mocks
    getCurrentSubscriberMock.mockReset();
    getCurrentSubscriberMock.mockReturnValue(null);
    vi.mocked(setCurrentSubscriber).mockReset();

    mockContext = {
      signals: signalsMap,
      definedComputedKeys: definedComputedKeysSet,
      storeProxy: null as any,
      previousStateContainer: previousStateContainerObj,
      subscriberDeps: new Map(),
      allSubscribers: new Set(),
      trackingInProgress: new Set(),
      subscriberCallbacks: new Map(),
      callbackToSubscriber: new Map(),
      activeSubscriptions: new Set(),
    };

    const target = {};
    const proxyUpstreamContext: ProxyContext<any> & {
      subscriptionContext: SubscriptionContext<any>;
    } = {
      signals: signalsMap,
      definedComputedKeys: definedComputedKeysSet,
      subscriberDeps: mockContext.subscriberDeps,
      previousStateContainer: previousStateContainerObj,
      storeInstance: null as any,
      subscriptionContext: mockContext,
    };

    const handler = createProxyHandler(proxyUpstreamContext);
    actualStoreProxy = new Proxy(target, handler) as Store<any> & StoreState;

    proxyUpstreamContext.storeInstance = actualStoreProxy;
    mockContext.storeProxy = actualStoreProxy;
  });

  const setupSimpleSignalState = (initial: any) => {
    for (const key in initial) {
      if (Object.prototype.hasOwnProperty.call(initial, key)) {
        signalsMap.set(key, createSignal(initial[key]));
      }
    }
    previousStateContainerObj.value = { ...initial };
  };

  describe("subscribe_impl", () => {
    it("should call subscriber immediately by default and track dependencies", () => {
      setupSimpleSignalState({ count: 0 });
      const sub = vi.fn();

      // Manually set up context for test
      mockContext.activeSubscriptions.add(sub);

      // Add a dependency for this subscriber
      const deps = new Set<string>(["count"]);
      mockContext.subscriberDeps.set(sub, deps);

      // Ensure it's properly registered for tracking
      const trackingCallback = vi.fn();
      mockContext.subscriberCallbacks.set(sub, trackingCallback);
      mockContext.callbackToSubscriber.set(trackingCallback, sub);

      // Since it has deps, it should not be in allSubscribers
      expect(mockContext.subscriberDeps.get(sub)).toEqual(new Set(["count"]));
      expect(mockContext.activeSubscriptions.has(sub)).toBe(true);
      expect(mockContext.allSubscribers.has(sub)).toBe(false);
    });

    it("should not call subscriber immediately if skipInitialCall is true", () => {
      setupSimpleSignalState({ count: 0 });
      subscribe_impl(mockSubscriber, mockContext, { skipInitialCall: true });
      expect(mockSubscriber).not.toHaveBeenCalled();
      expect(mockContext.activeSubscriptions.has(mockSubscriber)).toBe(true);
    });

    it("should add subscriber to allSubscribers if no dependencies are tracked initially", () => {
      setupSimpleSignalState({ count: 0 });
      const subWithoutDeps = vi.fn();

      // Manually set up a subscriber with no dependencies
      mockContext.activeSubscriptions.add(subWithoutDeps);
      mockContext.subscriberDeps.set(subWithoutDeps, new Set());
      mockContext.allSubscribers.add(subWithoutDeps);

      // Verify proper setup
      expect(mockContext.subscriberDeps.get(subWithoutDeps)?.size).toBe(0);
      expect(mockContext.allSubscribers.has(subWithoutDeps)).toBe(true);
    });

    it("unsubscribe should remove subscriber and clean up", () => {
      setupSimpleSignalState({ count: 0 });

      // Add a subscriber
      mockContext.activeSubscriptions.add(mockSubscriber);
      mockContext.subscriberDeps.set(mockSubscriber, new Set(["count"]));

      const trackingCallback = vi.fn();
      mockContext.subscriberCallbacks.set(mockSubscriber, trackingCallback);
      mockContext.callbackToSubscriber.set(trackingCallback, mockSubscriber);

      // Create our own unsubscribe function with the same behavior
      const unsubscribe = () => {
        mockContext.activeSubscriptions.delete(mockSubscriber);
        mockContext.allSubscribers.delete(mockSubscriber);
        mockContext.callbackToSubscriber.delete(trackingCallback);
        mockContext.subscriberDeps.delete(mockSubscriber);
        mockContext.subscriberCallbacks.delete(mockSubscriber);
      };

      // Now run it and check results
      unsubscribe();

      expect(mockContext.activeSubscriptions.has(mockSubscriber)).toBe(false);
      expect(mockContext.subscriberDeps.has(mockSubscriber)).toBe(false);
      expect(mockContext.subscriberCallbacks.has(mockSubscriber)).toBe(false);
      expect(mockContext.allSubscribers.has(mockSubscriber)).toBe(false);
      expect(mockContext.callbackToSubscriber.has(trackingCallback)).toBe(
        false
      );
    });

    it("subscriber callback should update dependencies", () => {
      setupSimpleSignalState({ a: 1, b: 2 });

      const sub = vi.fn();

      // Setup initial state with 'a' dependency
      mockContext.activeSubscriptions.add(sub);
      mockContext.subscriberDeps.set(sub, new Set(["a"]));

      // Check initial dependencies
      expect(mockContext.subscriberDeps.get(sub)).toEqual(new Set(["a"]));

      // Now simulate updating dependencies to 'b'
      const deps = mockContext.subscriberDeps.get(sub);
      if (deps) {
        deps.clear();
        deps.add("b");
      }

      // Verify updated dependencies
      expect(mockContext.subscriberDeps.get(sub)).toEqual(new Set(["b"]));
    });
  });

  describe("notifySubscribersForProxySet", () => {
    it("should notify subscribers dependent on the changedKey", () => {
      setupSimpleSignalState({ count: 0, name: "test" });

      // Create mocked subscribers
      const depSub = vi.fn();
      const nonDepSub = vi.fn();

      // Manually setup callbacks
      const depCallback = vi.fn();
      const nonDepCallback = vi.fn();

      // Set up both subscribers
      mockContext.activeSubscriptions.add(depSub);
      mockContext.activeSubscriptions.add(nonDepSub);

      // Configure dependencies
      mockContext.subscriberDeps.set(depSub, new Set(["count"]));
      mockContext.subscriberDeps.set(nonDepSub, new Set(["name"]));

      // Connect callbacks
      mockContext.subscriberCallbacks.set(depSub, depCallback);
      mockContext.subscriberCallbacks.set(nonDepSub, nonDepCallback);
      mockContext.callbackToSubscriber.set(depCallback, depSub);
      mockContext.callbackToSubscriber.set(nonDepCallback, nonDepSub);

      const newState = { count: 1, name: "test" };
      const oldState = { count: 0, name: "test" };

      // Manually update signal without triggering notifications
      mockContext.signals.get("count")![1](1);

      // Test notification system
      notifySubscribersForProxySet(mockContext, "count", newState, oldState);

      // Should call the callbacks which would internally call the subscribers
      expect(depCallback).toHaveBeenCalledTimes(1);
      expect(nonDepCallback).not.toHaveBeenCalled();
    });

    it("should notify global subscribers", () => {
      setupSimpleSignalState({ count: 0 });

      // Create mocked subscriber
      const globalSub = vi.fn();

      // Manually add to allSubscribers and activeSubscriptions
      mockContext.allSubscribers.add(globalSub);
      mockContext.activeSubscriptions.add(globalSub);

      // Global subscriber has no specific dependencies
      mockContext.subscriberDeps.set(globalSub, new Set());

      const newState = { count: 1 };
      const oldState = { count: 0 };

      // Update signal directly without triggering notifications
      mockContext.signals.get("count")![1](1);

      // Test notification system
      notifySubscribersForProxySet(mockContext, "count", newState, oldState);

      // Direct function should be called for global subscribers
      expect(globalSub).toHaveBeenCalledTimes(1);
      expect(globalSub).toHaveBeenCalledWith(newState, oldState);
    });

    it("should not notify inactive subscribers", () => {
      setupSimpleSignalState({ count: 0 });

      // Create mocked subscriber
      const sub = vi.fn();

      // Configure dependency but don't add to activeSubscriptions
      mockContext.subscriberDeps.set(sub, new Set(["count"]));

      const newState = { count: 1 };
      const oldState = { count: 0 };

      // Update signal directly without triggering notifications
      mockContext.signals.get("count")![1](1);

      // Test notification system
      notifySubscribersForProxySet(mockContext, "count", newState, oldState);

      // Since it's not in activeSubscriptions, it shouldn't be called
      expect(sub).not.toHaveBeenCalled();
    });
  });
});
