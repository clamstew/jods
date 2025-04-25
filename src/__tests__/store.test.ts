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
});
