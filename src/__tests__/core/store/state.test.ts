import { describe, it, expect, vi } from "vitest";
import {
  initializeStateAndSignals,
  getState_impl,
  setState_impl,
  getStateWithComputedUnwrapped_impl,
} from "../../../core/store/state";
import { createSignal } from "../../../core/store/signal";
import { computed, ComputedValue } from "../../../core/computed";
import type { StoreState, Store } from "../../../core/store/types";
import type { Signal } from "../../../types";
import { isComputed } from "../../../core/computed";

describe("State Management (state.ts)", () => {
  describe("initializeStateAndSignals", () => {
    it("should initialize signals for all properties in initialState", () => {
      const initialState = { count: 0, name: "test" };
      const signals = new Map<string, Signal<any>>();
      const definedComputedKeys = new Set<string>();

      initializeStateAndSignals(initialState, signals, definedComputedKeys);

      expect(signals.has("count")).toBe(true);
      expect(signals.has("name")).toBe(true);
      expect(signals.get("count")![0]()).toBe(0);
      expect(signals.get("name")![0]()).toBe("test");
      expect(definedComputedKeys.size).toBe(0);
    });

    it("should identify and initialize computed properties", () => {
      const signals = new Map<string, Signal<any>>();
      const definedComputedKeys = new Set<string>();

      interface TestState {
        a: number;
        b: ComputedValue<number>;
      }

      const initialState: TestState = {
        a: 1,
        b: computed<number>(() => initialState.a + 1),
      };
      initializeStateAndSignals(initialState, signals, definedComputedKeys);

      expect(definedComputedKeys.has("b")).toBe(true);
      expect(signals.has("b")).toBe(true);

      const computedSignalContent = signals.get("b")![0]();
      expect(typeof computedSignalContent).toBe("function");
      expect(isComputed(computedSignalContent)).toBe(true);

      const compFunction = signals.get("b")![0]() as ComputedValue<number>;
      expect(compFunction()).toBe(2);
    });

    // TODO: Add test for activeTestHooks.onComputedPropertyAdded when it's implemented/mockable
  });

  describe("getState_impl", () => {
    it("should return the current state from signals", () => {
      const signals = new Map<string, Signal<any>>();
      signals.set("count", createSignal(10));
      signals.set("name", createSignal("example"));
      const definedComputedKeys = new Set<string>();
      const mockStoreProxy = {} as Store<StoreState>;

      const state = getState_impl(signals, definedComputedKeys, mockStoreProxy);
      expect(state).toEqual({ count: 10, name: "example" });
    });

    it("should return evaluated computed values if they are accessed via storeProxy", () => {
      const signals = new Map<string, Signal<any>>();
      signals.set("a", createSignal(5));
      const definedComputedKeys = new Set<string>(["b"]);

      const mockStoreInstance = {
        a: 5,
        get b() {
          return this.a * 2;
        },
        getState: () => ({ a: mockStoreInstance.a, b: mockStoreInstance.b }),
        subscribe: vi.fn(),
        toJSON: vi.fn(),
        batch: vi.fn(),
        beginBatch: vi.fn(),
        commitBatch: vi.fn(),
      } as { a: number; b: number } & Store<{ a: number; b: number }>;

      const state = getState_impl(
        signals,
        definedComputedKeys,
        mockStoreInstance
      );
      expect(state.a).toBe(5);
      expect(state.b).toBe(10);
      expect(state).toEqual({ a: 5, b: 10 });
    });
  });

  describe("getStateWithComputedUnwrapped_impl", () => {
    it("should return state with computed values unwrapped from signals", () => {
      const signals = new Map<string, Signal<any>>();
      signals.set("a", createSignal(3));
      signals.set(
        "b",
        createSignal(computed(() => signals.get("a")![0]() * 3))
      ); // b depends on a
      const definedComputedKeys = new Set<string>(); // b is in signals here

      const mockStoreProxy = {} as Store<StoreState>; // Simpler mock

      const state = getStateWithComputedUnwrapped_impl(
        signals,
        definedComputedKeys,
        mockStoreProxy
      );
      expect(state).toEqual({ a: 3, b: 9 });
    });

    it("should return state with computed values from proxy getters unwrapped", () => {
      const signals = new Map<string, Signal<any>>();
      signals.set("a", createSignal(4));
      const definedComputedKeys = new Set<string>(["b"]);

      const mockStoreInstance = {
        a: 4,
        get b() {
          return this.a * 2;
        },
        getState: () => ({ a: mockStoreInstance.a, b: mockStoreInstance.b }),
        subscribe: vi.fn(),
        toJSON: vi.fn(),
        batch: vi.fn(),
        beginBatch: vi.fn(),
        commitBatch: vi.fn(),
      } as { a: number; b: number } & Store<{ a: number; b: number }>;

      const state = getStateWithComputedUnwrapped_impl(
        signals,
        definedComputedKeys,
        mockStoreInstance
      );
      expect(state).toEqual({ a: 4, b: 8 });
    });
  });

  describe("setState_impl", () => {
    let signals: Map<string, Signal<any>>;
    let definedComputedKeys: Set<string>;
    let mockStoreProxy: Store<any>;
    let previousStateContainer: { value: any };
    let subscriberDeps: Map<any, Set<string>>;
    let allSubscribers: Set<any>;
    let trackingInProgress: Set<any>;
    let activeSubscriptions: Set<any>;
    let subscriberCallbacks: Map<any, () => void>;

    beforeEach(() => {
      signals = new Map<string, Signal<any>>();
      signals.set("count", createSignal(0));
      signals.set("name", createSignal("initial"));
      definedComputedKeys = new Set<string>();
      mockStoreProxy = {
        getState: () =>
          getState_impl(signals, definedComputedKeys, mockStoreProxy as any),
      } as Store<any>;
      for (const [key, signal] of signals.entries()) {
        (mockStoreProxy as any)[key] = signal[0]();
      }
      previousStateContainer = { value: { count: 0, name: "initial" } };
      subscriberDeps = new Map();
      allSubscribers = new Set();
      trackingInProgress = new Set();
      activeSubscriptions = new Set();
      subscriberCallbacks = new Map();
    });

    it("should update existing properties and return changedKeys, prevState, and currentState", () => {
      const partialUpdate = { count: 1 };
      const result = setState_impl(
        partialUpdate,
        signals,
        definedComputedKeys,
        mockStoreProxy,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );

      expect(result).not.toBeNull();
      expect(result!.changedKeys).toEqual(new Set(["count"]));
      expect(result!.prevState).toEqual({ count: 0, name: "initial" });
      expect(result!.currentState).toEqual({ count: 1, name: "initial" });
      expect(signals.get("count")![0]()).toBe(1);
      expect(previousStateContainer.value).toEqual({
        count: 0,
        name: "initial",
      });
    });

    it("should add new properties if they do not exist and return changes", () => {
      const partialUpdate = { newProp: "test" };
      const result = setState_impl(
        partialUpdate as any,
        signals,
        definedComputedKeys,
        mockStoreProxy,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );

      expect(result).not.toBeNull();
      expect(result!.changedKeys).toEqual(new Set(["newProp"]));
      expect(result!.prevState).toEqual({ count: 0, name: "initial" });
      expect(result!.currentState).toEqual({
        count: 0,
        name: "initial",
        newProp: "test",
      });
      expect(signals.has("newProp")).toBe(true);
      expect(signals.get("newProp")![0]()).toBe("test");
    });

    it("should return null if no values were changed", () => {
      const partialUpdate = { count: 0 };
      const result = setState_impl(
        partialUpdate,
        signals,
        definedComputedKeys,
        mockStoreProxy,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );
      expect(result).toBeNull();
      expect(signals.get("count")![0]()).toBe(0);
    });

    it("should notify global subscribers if state changes", () => {
      const mockSubscriber = vi.fn();
      allSubscribers.add(mockSubscriber);
      activeSubscriptions.add(mockSubscriber);

      const partialUpdate = { count: 5 };
      setState_impl(
        partialUpdate,
        signals,
        definedComputedKeys,
        mockStoreProxy,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );
      expect(mockSubscriber).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledWith(
        { count: 5, name: "initial" },
        { count: 0, name: "initial" }
      );
    });

    it("should use subscriberCallbacks if available for global subscribers", () => {
      const mockCallback = vi.fn();
      const mockSubscriber = () => {};
      allSubscribers.add(mockSubscriber);
      activeSubscriptions.add(mockSubscriber);
      subscriberCallbacks.set(mockSubscriber, mockCallback);

      const partialUpdate = { name: "updated" };
      setState_impl(
        partialUpdate,
        signals,
        definedComputedKeys,
        mockStoreProxy,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should not notify inactive global subscribers", () => {
      const mockSubscriber = vi.fn();
      allSubscribers.add(mockSubscriber);

      const partialUpdate = { count: 10 };
      setState_impl(
        partialUpdate,
        signals,
        definedComputedKeys,
        mockStoreProxy,
        previousStateContainer,
        subscriberDeps,
        allSubscribers,
        trackingInProgress,
        activeSubscriptions,
        subscriberCallbacks
      );
      expect(mockSubscriber).not.toHaveBeenCalled();
    });
  });
});
