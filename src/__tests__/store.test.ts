import { describe, it, expect, vi } from "vitest";
import { store } from "../store";

describe("store", () => {
  it("should create a store with initial state", () => {
    const testStore = store({ count: 0, name: "test" });
    expect(testStore.count).toBe(0);
    expect(testStore.name).toBe("test");
  });

  it("should update state when properties are changed", () => {
    const testStore = store({ count: 0, name: "test" });
    testStore.count = 1;
    expect(testStore.count).toBe(1);
  });

  it("should notify subscribers when state changes", () => {
    const testStore = store({ count: 0 });
    const mockSubscriber = vi.fn();
    testStore.subscribe(mockSubscriber);

    testStore.count = 1;
    expect(mockSubscriber).toHaveBeenCalledWith({ count: 1 });
  });

  it("should allow unsubscribing from state changes", () => {
    const testStore = store({ count: 0 });
    const mockSubscriber = vi.fn();
    const unsubscribe = testStore.subscribe(mockSubscriber);

    unsubscribe();
    testStore.count = 1;
    expect(mockSubscriber).not.toHaveBeenCalled();
  });

  it("should update state using setState method", () => {
    const testStore = store({ count: 0, name: "test" });
    testStore.setState({ count: 1 });
    expect(testStore.count).toBe(1);
    expect(testStore.name).toBe("test");
  });

  it("should get current state using getState method", () => {
    const initialState = { count: 0, name: "test" };
    const testStore = store(initialState);

    expect(testStore.getState()).toEqual(initialState);

    testStore.count = 1;
    expect(testStore.getState()).toEqual({ count: 1, name: "test" });
  });

  it("should not trigger subscribers if value has not changed", () => {
    const testStore = store({ count: 0 });
    const mockSubscriber = vi.fn();
    testStore.subscribe(mockSubscriber);

    testStore.count = 0;
    expect(mockSubscriber).not.toHaveBeenCalled();
  });

  // New signal-specific tests

  it("should only notify subscribers that depend on changed properties", () => {
    const testStore = store({ count: 0, name: "test" });

    // Subscriber that only accesses count
    const countSubscriber = vi.fn((state) => {
      const count = state.count;
      return count;
    });

    // Subscriber that only accesses name
    const nameSubscriber = vi.fn((state) => {
      const name = state.name;
      return name;
    });

    testStore.subscribe(countSubscriber);
    testStore.subscribe(nameSubscriber);

    // Reset mock counts after initial subscription calls
    countSubscriber.mockClear();
    nameSubscriber.mockClear();

    // Update count - should only trigger countSubscriber
    testStore.count = 1;
    expect(countSubscriber).toHaveBeenCalledTimes(1);
    expect(nameSubscriber).not.toHaveBeenCalled();

    // Reset mocks
    countSubscriber.mockClear();
    nameSubscriber.mockClear();

    // Update name - should only trigger nameSubscriber
    testStore.name = "updated";
    expect(nameSubscriber).toHaveBeenCalledTimes(1);
    expect(countSubscriber).not.toHaveBeenCalled();
  });

  it("should track dependencies when they change during subscription", () => {
    const testStore = store({ a: 1, b: 2, flag: false });

    // This subscriber will access different properties based on flag
    const conditionalSubscriber = vi.fn((state) => {
      if (state.flag) {
        return state.b;
      } else {
        return state.a;
      }
    });

    testStore.subscribe(conditionalSubscriber);
    conditionalSubscriber.mockClear(); // Reset after initial call

    // Initially depends on 'a', changing 'b' shouldn't trigger
    testStore.b = 3;
    expect(conditionalSubscriber).not.toHaveBeenCalled();

    // Change flag to true, now it should depend on 'b'
    testStore.flag = true;
    conditionalSubscriber.mockClear();

    // Now changing 'b' should trigger, but changing 'a' shouldn't
    testStore.b = 4;
    expect(conditionalSubscriber).toHaveBeenCalledTimes(1);

    conditionalSubscriber.mockClear();
    testStore.a = 5;
    expect(conditionalSubscriber).not.toHaveBeenCalled();
  });

  it("should handle new properties added after creation", () => {
    const testStore = store<Record<string, number>>({ a: 1 });

    // Add new property
    testStore.b = 2;
    expect(testStore.b).toBe(2);

    // Subscriber that depends on the new property
    const bSubscriber = vi.fn((state) => state.b);
    testStore.subscribe(bSubscriber);
    bSubscriber.mockClear();

    // Change new property
    testStore.b = 3;
    expect(bSubscriber).toHaveBeenCalledTimes(1);
    expect(testStore.b).toBe(3);
  });

  it("should handle subscribers that don't access any properties", () => {
    const testStore = store({ a: 1, b: 2 });

    // This subscriber doesn't access any specific properties
    const noAccessSubscriber = vi.fn(() => "constant");
    testStore.subscribe(noAccessSubscriber);
    noAccessSubscriber.mockClear();

    // It should be treated as a global subscriber
    testStore.a = 3;
    expect(noAccessSubscriber).toHaveBeenCalledTimes(1);

    noAccessSubscriber.mockClear();
    testStore.b = 4;
    expect(noAccessSubscriber).toHaveBeenCalledTimes(1);
  });

  it("should treat object methods as part of the store interface", () => {
    const testStore = store({ count: 0 });

    // These methods should not trigger signal tracking
    const hasGetState = "getState" in testStore;
    const hasSetState = "setState" in testStore;
    const hasSubscribe = "subscribe" in testStore;

    expect(hasGetState).toBe(true);
    expect(hasSetState).toBe(true);
    expect(hasSubscribe).toBe(true);
  });

  it("should have state properties enumerable for Object.keys", () => {
    const testStore = store({ a: 1, b: 2 });
    const keys = Object.keys(testStore);

    expect(keys).toContain("a");
    expect(keys).toContain("b");
    // Methods should be there but non-enumerable
    expect(keys).not.toContain("getState");
    expect(keys).not.toContain("setState");
    expect(keys).not.toContain("subscribe");
  });
});
