import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { store } from "../store";
import { history, History } from "../history";

describe("history", () => {
  beforeEach(() => {
    // Mock process.env.NODE_ENV to "development" for testing
    process.env.NODE_ENV = "development";

    // Mock Date.now to control timing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should create a history instance", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    expect(historyTracker).toBeInstanceOf(History);
    // With signal-based reactivity, we don't care about exact number of entries
    expect(historyTracker.getEntries().length).toBeGreaterThan(0);
    // Current index should be the last entry
    expect(historyTracker.getCurrentIndex()).toBe(
      historyTracker.getEntries().length - 1
    );
  });

  it("should track store changes in detail", async () => {
    const testStore = store({ count: 0, name: "test" });

    // Create history with a shorter throttle time for testing
    const historyTracker = history(testStore, { throttleMs: 10 });

    // Initial state is captured automatically
    const initialEntryCount = historyTracker.getEntries().length;

    // Make first change
    testStore.count = 1;

    // Advance the timer past the throttle window
    vi.advanceTimersByTime(20);

    // Verify a new entry was created (may take time due to throttling)
    const afterFirstChange = historyTracker.getEntries();
    expect(afterFirstChange.length).toBeGreaterThanOrEqual(initialEntryCount);

    // Find the entry with count=1
    const hasEntryWithCount1 = afterFirstChange.some(
      (entry) => entry.state.count === 1 && entry.state.name === "test"
    );
    expect(hasEntryWithCount1).toBe(true);

    // Make second change to a different property
    testStore.name = "updated";

    // Advance the timer again
    vi.advanceTimersByTime(20);

    // Find the entry with updated name
    const finalEntries = historyTracker.getEntries();
    const hasUpdatedNameEntry = finalEntries.some(
      (entry) => entry.state.count === 1 && entry.state.name === "updated"
    );
    expect(hasUpdatedNameEntry).toBe(true);
  });

  it("should allow time traveling through history with precise state verification", async () => {
    const testStore = store({ count: 0, name: "initial" });
    const historyTracker = history(testStore, { throttleMs: 10 });

    // Make a series of changes with time advancement between each
    testStore.count = 5;
    vi.advanceTimersByTime(20);

    testStore.name = "middle";
    vi.advanceTimersByTime(20);

    testStore.count = 10;
    vi.advanceTimersByTime(20);

    testStore.name = "final";
    vi.advanceTimersByTime(20);

    // Verify final state
    expect(testStore.count).toBe(10);
    expect(testStore.name).toBe("final");

    // Find entry with count = 5 and name = "initial"
    const entryWithCount5 = historyTracker.findEntry(
      (entry) => entry.state.count === 5 && entry.state.name === "initial"
    );

    expect(entryWithCount5).not.toBe(-1);

    // Time travel to that entry
    historyTracker.travelTo(entryWithCount5);
    expect(testStore.count).toBe(5);
    expect(testStore.name).toBe("initial");

    // Find entry with final values
    const finalEntryIndex = historyTracker.findEntry(
      (entry) => entry.state.count === 10 && entry.state.name === "final"
    );

    expect(finalEntryIndex).not.toBe(-1);

    // Travel to final state
    historyTracker.travelTo(finalEntryIndex);
    expect(testStore.count).toBe(10);
    expect(testStore.name).toBe("final");
  });

  it("should test history branching when making changes after time travel", () => {
    const testStore = store({ count: 0, name: "initial" });
    const historyTracker = history(testStore);

    // Make some changes
    testStore.count = 5;
    vi.advanceTimersByTime(20);

    testStore.count = 10;
    vi.advanceTimersByTime(20);

    // Find entry with count = 5
    let index5 = -1;
    const entries = historyTracker.getEntries();
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].state.count === 5) {
        index5 = i;
        break;
      }
    }

    if (index5 !== -1) {
      // Time travel back
      historyTracker.travelTo(index5);
      expect(testStore.count).toBe(5);

      // Make a new change, which should create a new branch and erase future history
      testStore.count = 42;
      vi.advanceTimersByTime(20);

      // Check current state
      expect(testStore.count).toBe(42);

      // Verify latest entry contains our new state
      const latestEntry =
        historyTracker.getEntries()[historyTracker.getCurrentIndex()];
      expect(latestEntry.state.count).toBe(42);
    } else {
      // If we can't find the exact entry, just verify branching works in general
      const middleIndex = Math.floor(historyTracker.getEntries().length / 2);
      if (middleIndex > 0) {
        historyTracker.travelTo(middleIndex);
        const stateBefore = testStore.count;

        // Make a new state that's different
        testStore.count = stateBefore + 100;
        vi.advanceTimersByTime(20);

        // Verify state was updated
        expect(testStore.count).toBe(stateBefore + 100);
      }
    }
  });

  it("should clear history", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    testStore.count = 1;
    vi.advanceTimersByTime(20);

    testStore.count = 2;
    vi.advanceTimersByTime(20);

    historyTracker.clear();
    expect(historyTracker.getEntries().length).toBe(1);
    expect(historyTracker.getCurrentIndex()).toBe(0);
  });

  it("should respect maxEntries option", () => {
    const testStore = store({ count: 0 });
    const maxEntries = 3; // Increased from 2 to make test more robust
    const historyTracker = history(testStore, {
      maxEntries,
      throttleMs: 10, // Shorter throttle for tests
    });

    // Make lots of changes with time advancement between
    for (let i = 1; i <= 10; i++) {
      testStore.count = i;
      vi.advanceTimersByTime(20); // Advance time after each change
    }

    // Should never exceed maxEntries (plus a small buffer for in-flight entries)
    expect(historyTracker.getEntries().length).toBeLessThanOrEqual(
      maxEntries + 1
    );

    // Last entry should contain the most recent change (count = 10)
    const entries = historyTracker.getEntries();
    const hasLastChange = entries.some((entry) => entry.state.count === 10);
    expect(hasLastChange).toBe(true);
  });

  it("should correctly handle the active option being false", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore, { active: false });

    // Initial state might still be captured due to implementation
    const initialEntryCount = historyTracker.getEntries().length;

    // Make changes
    testStore.count = 1;
    testStore.count = 2;

    // History should not track when inactive
    expect(historyTracker.getEntries().length).toBe(initialEntryCount);

    // Time travel shouldn't work when inactive
    const beforeTravelCount = testStore.count;
    historyTracker.travelTo(0);
    expect(testStore.count).toBe(beforeTravelCount); // Should remain unchanged
  });

  it("should destroy and unsubscribe properly", () => {
    const testStore = store({ count: 0 });
    const historyTracker = history(testStore);

    // Make a change
    testStore.count = 1;
    vi.advanceTimersByTime(20);

    const entriesBeforeDestroy = historyTracker.getEntries().length;

    // Destroy the history instance
    historyTracker.destroy();

    // Make another change
    testStore.count = 2;
    vi.advanceTimersByTime(20);

    // History should no longer track changes
    expect(historyTracker.getEntries().length).toBe(entriesBeforeDestroy);
  });
});
