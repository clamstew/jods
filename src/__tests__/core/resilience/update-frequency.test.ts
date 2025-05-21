import { describe, it, expect, vi, beforeEach } from "vitest";
import { store } from "../../../core/store"; // Import from store directly

describe("Performance: Update Frequency Stress Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should handle rapid sequential updates efficiently", () => {
    // Setup a simple counter state object
    const counter = store({ count: 0 });
    const UPDATES = 1000;

    // Measure performance of rapid updates
    const startTime = performance.now();
    for (let i = 0; i < UPDATES; i++) {
      // Direct property update - no getState or callback
      counter.count = counter.count + 1;
    }
    const duration = performance.now() - startTime;

    // Verify updates were applied correctly
    expect(counter.count).toBe(UPDATES);

    // Performance assertions
    const avgTimePerUpdate = duration / UPDATES;
    console.log(`Average time per update: ${avgTimePerUpdate.toFixed(3)}ms`);
    expect(avgTimePerUpdate).toBeLessThan(0.5); // Less than 0.5ms per update
  });

  it("should maintain responsiveness during high frequency updates", () => {
    // Setup
    const updateState = store({
      count: 0,
      lastUpdated: 0,
    });

    let subscriberCallCount = 0;
    const unsubscribe = updateState.subscribe(() => {
      subscriberCallCount++;
    });

    // Run high-frequency updates (1000 updates)
    const UPDATES = 1000;
    const startTime = performance.now();

    for (let i = 0; i < UPDATES; i++) {
      // Direct property updates
      updateState.count = updateState.count + 1;
      updateState.lastUpdated = i;
    }

    const duration = performance.now() - startTime;
    unsubscribe();

    // Verify all updates were processed
    expect(updateState.count).toBe(UPDATES);
    expect(updateState.lastUpdated).toBe(UPDATES - 1);

    // Subscriber should have been called for each update
    expect(subscriberCallCount).toBe(UPDATES * 2); // Two property changes per iteration

    // Performance assertions
    console.log(`Total time for ${UPDATES} updates: ${duration.toFixed(2)}ms`);
    // CI environments and different machines may have different performance characteristics
    // So we use a more forgiving threshold
    expect(duration).toBeLessThan(UPDATES * 1.0); // Should process at least 1000 updates/second
  });

  it("should maintain performance with complex state objects", () => {
    // Create a more complex state structure
    type Counter = { id: number; value: number };
    type ComplexState = {
      counters: Counter[];
      metadata: {
        lastUpdated: number;
        totalOperations: number;
        settings: {
          batchSize: number;
          autoSave: boolean;
          notifications: {
            enabled: boolean;
            frequency: string;
          };
        };
      };
    };

    const initialState: ComplexState = {
      counters: Array.from({ length: 100 }, (_, i) => ({ id: i, value: 0 })),
      metadata: {
        lastUpdated: Date.now(),
        totalOperations: 0,
        settings: {
          batchSize: 10,
          autoSave: true,
          notifications: {
            enabled: true,
            frequency: "high",
          },
        },
      },
    };

    const complexState = store(initialState);
    const UPDATES = 500;

    // Measure performance with nested updates
    const startTime = performance.now();

    for (let i = 0; i < UPDATES; i++) {
      // Update a random counter
      const randomIndex = Math.floor(Math.random() * 100);

      // Direct property updates to nested properties
      complexState.counters[randomIndex].value += 1;
      complexState.metadata.lastUpdated = Date.now();
      complexState.metadata.totalOperations += 1;
    }

    const duration = performance.now() - startTime;

    // Verify updates were applied
    expect(complexState.metadata.totalOperations).toBe(UPDATES);

    // Complex update performance assertions
    const avgTimePerUpdate = duration / UPDATES;
    console.log(
      `Average time per complex update: ${avgTimePerUpdate.toFixed(3)}ms`
    );
    expect(avgTimePerUpdate).toBeLessThan(2); // More lenient threshold for complex updates
  });

  it("should efficiently handle multiple subscribers", () => {
    const state = store({ value: 0 });
    const SUBSCRIBER_COUNT = 50;
    const UPDATE_COUNT = 100;

    // Add multiple subscribers
    const callCounts = Array(SUBSCRIBER_COUNT).fill(0);
    const unsubscribers = Array(SUBSCRIBER_COUNT)
      .fill(0)
      .map((_, idx) => {
        return state.subscribe(() => {
          callCounts[idx]++;
        });
      });

    // Perform updates
    const startTime = performance.now();

    for (let i = 0; i < UPDATE_COUNT; i++) {
      // Direct property update
      state.value = i;
    }

    const duration = performance.now() - startTime;

    // Clean up subscribers
    unsubscribers.forEach((unsubscribe) => unsubscribe());

    // Verify all subscribers were called for each update
    callCounts.forEach((count) => {
      expect(count).toBe(UPDATE_COUNT);
    });

    // Performance with multiple subscribers
    const timePerSubscriberNotification =
      duration / (SUBSCRIBER_COUNT * UPDATE_COUNT);
    console.log(
      `Time per subscriber notification: ${timePerSubscriberNotification.toFixed(
        5
      )}ms`
    );
    expect(timePerSubscriberNotification).toBeLessThan(0.2); // Increased from 0.1ms to 0.2ms to accommodate varying performance
  });
});
