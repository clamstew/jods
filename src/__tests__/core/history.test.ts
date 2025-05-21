import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { store } from "../../core/store";
import { history, History } from "../../core/history";

describe("history", () => {
  beforeEach(() => {
    // Mock process.env.NODE_ENV to "development" for testing
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a history instance", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    expect(historyTracker).toBeInstanceOf(History);
    expect(historyTracker.getEntries().length).toBe(1); // Initial state entry
    expect(historyTracker.getCurrentIndex()).toBe(0);
  });

  it("should track store changes", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    testStore.count = 1;
    testStore.count = 2;

    expect(historyTracker.getEntries().length).toBe(3); // Initial + 2 changes
    expect(historyTracker.getCurrentIndex()).toBe(2);
  });

  it("should allow time traveling to past states", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    testStore.count = 1;
    testStore.count = 2;

    // Travel to initial state
    historyTracker.travelTo(0);
    expect(testStore.count).toBe(0);

    // Travel forward
    historyTracker.forward();
    expect(testStore.count).toBe(1);
  });

  it("should allow going backward in history", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    testStore.count = 1;
    testStore.count = 2;

    historyTracker.back();
    expect(testStore.count).toBe(1);
    historyTracker.back();
    expect(testStore.count).toBe(0);
  });

  it("should respect maxEntries option", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore, { maxEntries: 2 });

    testStore.count = 1;
    testStore.count = 2; // This should push out the initial state

    expect(historyTracker.getEntries().length).toBe(2);
    expect(historyTracker.getCurrentIndex()).toBe(1);
    expect(historyTracker.getEntries()[0].state.count).toBe(1);
    expect(historyTracker.getEntries()[1].state.count).toBe(2);
  });

  it("should clear history", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    testStore.count = 1;
    testStore.count = 2;

    historyTracker.clear();
    expect(historyTracker.getEntries().length).toBe(1);
    expect(historyTracker.getCurrentIndex()).toBe(0);
  });

  it("should create diff objects with state changes", () => {
    const testStore = store({ count: 0, name: "test" });
    const historyTracker = history(testStore);

    testStore.count = 1;

    const entries = historyTracker.getEntries();
    expect(entries[1].diff).toBeDefined();
    // The diff should show that count changed from 0 to 1
    expect(entries[1].diff?.count).toBeDefined();
  });
});
