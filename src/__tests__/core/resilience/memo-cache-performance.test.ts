import { describe, it, expect, vi } from "vitest";
import { store } from "../../../core/store";
import { computed } from "../../../core/computed";

// Define an interface for the store used in the first test
interface IMemoStore {
  numbers: number[];
  filter: string;
  filteredNumbers?: any; // Computed property - no longer need ComputedValue type
}

describe("Performance: Computed Function Memoization", () => {
  it("should effectively memoize computed results", () => {
    const computeSpy = vi.fn((numbers: number[], filter: string) => {
      if (filter === "even") {
        return numbers.filter((n) => n % 2 === 0).map((n) => n * 2);
      } else if (filter === "odd") {
        return numbers.filter((n) => n % 2 === 1).map((n) => n * 3);
      } else {
        return numbers;
      }
    });

    // Reset spy before creating store to get accurate counts
    computeSpy.mockClear();

    const testStore = store<IMemoStore>({
      numbers: Array.from({ length: 1000 }, (_, i) => i),
      filter: "even",
      filteredNumbers: computed(function (this: IMemoStore) {
        // Access store properties using 'this'
        return computeSpy(this.numbers, this.filter);
      }),
    });

    // The computed is evaluated immediately when the store is created
    // Reset the counter to start fresh
    computeSpy.mockClear();

    const startInitial = performance.now();
    // Access the computed property directly to get its value
    const result1 = testStore.filteredNumbers;
    const initialDuration = performance.now() - startInitial;

    // First access after creation should trigger computation
    expect(computeSpy).toHaveBeenCalledTimes(1);
    expect(result1.length).toBe(500);

    const startSecond = performance.now();
    const result2 = testStore.filteredNumbers;
    const secondDuration = performance.now() - startSecond;

    // Second access should use cached value
    expect(computeSpy).toHaveBeenCalledTimes(1);
    expect(result2).toBe(result1);
    expect(secondDuration).toBeLessThan(initialDuration);

    testStore.filter = "odd";

    const startThird = performance.now();
    const result3 = testStore.filteredNumbers;
    const thirdDuration = performance.now() - startThird;

    // This is the crucial assertion that was failing
    expect(computeSpy).toHaveBeenCalledTimes(2);
    expect(result3.length).toBe(500);
    expect(result3[0]).toBe(3);
    expect(thirdDuration).toBeGreaterThan(secondDuration);
  });

  it("should optimize dependent computed values", () => {
    interface IDependentStore {
      numbers: number[];
      multiplier: number;
      filteredNumbers?: any;
      multipliedNumbers?: any;
    }

    // Spy for the actual computation of filtered numbers
    const filteredNumbersComputation = vi.fn((numbers: number[]) => {
      if (!Array.isArray(numbers)) return [];
      return numbers.filter((n: number) => n % 2 === 0);
    });

    // Spy for the actual computation of multiplied numbers
    const multipliedNumbersComputation = vi.fn(
      (filtered: number[], multiplier: number) => {
        if (!Array.isArray(filtered)) return [];
        return filtered.map((n: number) => n * multiplier);
      }
    );

    // Reset spies before creating store
    filteredNumbersComputation.mockClear();
    multipliedNumbersComputation.mockClear();

    const testStore = store<IDependentStore>({
      numbers: Array.from({ length: 1000 }, (_, i) => i),
      multiplier: 2,
      filteredNumbers: computed(function (this: IDependentStore) {
        return filteredNumbersComputation(this.numbers);
      }),
      multipliedNumbers: computed(function (this: IDependentStore) {
        // Access the computed property directly
        const filtered = this.filteredNumbers;
        return multipliedNumbersComputation(filtered, this.multiplier);
      }),
    });

    // Computed values are evaluated when the store is created
    // Reset counters to start fresh
    filteredNumbersComputation.mockClear();
    multipliedNumbersComputation.mockClear();

    // Initial computation of both levels by accessing the final computed value
    const initialValue = testStore.multipliedNumbers;
    expect(filteredNumbersComputation).toHaveBeenCalledTimes(1);
    expect(multipliedNumbersComputation).toHaveBeenCalledTimes(1);

    // Calling again should use memoized values for both
    const secondValue = testStore.multipliedNumbers;
    expect(filteredNumbersComputation).toHaveBeenCalledTimes(1); // Still 1
    expect(multipliedNumbersComputation).toHaveBeenCalledTimes(1); // Still 1
    expect(secondValue).toBe(initialValue);

    const filtered1stRunCalls = filteredNumbersComputation.mock.calls.length; // Should be 1
    const multiplied1stRunCalls =
      multipliedNumbersComputation.mock.calls.length; // Should be 1

    // Change multiplier - should only recompute second level (multipliedNumbers)
    testStore.multiplier = 3;
    const thirdValue = testStore.multipliedNumbers;
    expect(thirdValue).not.toBe(secondValue);

    // filteredNumbersComputation should NOT have been called again
    expect(filteredNumbersComputation.mock.calls.length).toBe(
      filtered1stRunCalls
    );
    // multipliedNumbersComputation SHOULD have been called again
    expect(multipliedNumbersComputation.mock.calls.length).toBeGreaterThan(
      multiplied1stRunCalls
    ); // Now 2

    const filtered2ndRunCalls = filteredNumbersComputation.mock.calls.length; // Still 1
    const multiplied2ndRunCalls =
      multipliedNumbersComputation.mock.calls.length; // Now 2

    // Change source data (numbers) - should recompute both levels
    testStore.numbers = testStore.numbers.map((n: number) => n + 1); // New array instance
    const fourthValue = testStore.multipliedNumbers;
    expect(fourthValue).not.toBe(thirdValue);

    // filteredNumbersComputation SHOULD have been called again
    expect(filteredNumbersComputation.mock.calls.length).toBeGreaterThan(
      filtered2ndRunCalls
    ); // Now 2
    // multipliedNumbersComputation SHOULD have been called again
    expect(multipliedNumbersComputation.mock.calls.length).toBeGreaterThan(
      multiplied2ndRunCalls
    ); // Now 3
  });

  it("should efficiently handle many dependent computed values", () => {
    // Simpler approach for testing memoization with a chain
    interface SimpleChainStore {
      baseValue: number;
      computed0?: any;
      computed1?: any;
      computed2?: any;
      computed3?: any;
      computed4?: any;
    }

    // Create spies for each computation
    const c0Spy = vi.fn((value: number) => value * 2);
    const c1Spy = vi.fn((value: number) => value + 1);
    const c2Spy = vi.fn((value: number) => value + 1);
    const c3Spy = vi.fn((value: number) => value + 1);
    const c4Spy = vi.fn((value: number) => value + 1);

    // Reset spies before creating store
    c0Spy.mockClear();
    c1Spy.mockClear();
    c2Spy.mockClear();
    c3Spy.mockClear();
    c4Spy.mockClear();

    // Create the store with computed properties directly
    const chainStore = store<SimpleChainStore>({
      baseValue: 1,
      computed0: computed(function (this: SimpleChainStore) {
        return c0Spy(this.baseValue);
      }),
      computed1: computed(function (this: SimpleChainStore) {
        return c1Spy(this.computed0);
      }),
      computed2: computed(function (this: SimpleChainStore) {
        return c2Spy(this.computed1);
      }),
      computed3: computed(function (this: SimpleChainStore) {
        return c3Spy(this.computed2);
      }),
      computed4: computed(function (this: SimpleChainStore) {
        return c4Spy(this.computed3);
      }),
    });

    // Computed values are evaluated when the store is created
    // Reset counters to start fresh
    c0Spy.mockClear();
    c1Spy.mockClear();
    c2Spy.mockClear();
    c3Spy.mockClear();
    c4Spy.mockClear();

    // Initial computation - all spies should be called
    const result1 = chainStore.computed4;

    expect(c0Spy).toHaveBeenCalledTimes(1);
    expect(c1Spy).toHaveBeenCalledTimes(1);
    expect(c2Spy).toHaveBeenCalledTimes(1);
    expect(c3Spy).toHaveBeenCalledTimes(1);
    expect(c4Spy).toHaveBeenCalledTimes(1);

    // Expected value: baseValue(1) * 2 + 1 + 1 + 1 + 1 = 6
    expect(result1).toBe(6);

    // Second computation - none of the spies should be called again (using memoized value)
    const result2 = chainStore.computed4;

    expect(c0Spy).toHaveBeenCalledTimes(1); // Still 1
    expect(c1Spy).toHaveBeenCalledTimes(1); // Still 1
    expect(c2Spy).toHaveBeenCalledTimes(1); // Still 1
    expect(c3Spy).toHaveBeenCalledTimes(1); // Still 1
    expect(c4Spy).toHaveBeenCalledTimes(1); // Still 1

    // Same result as before (memoized)
    expect(result2).toBe(result1);

    // Update the base value - all computed values should recalculate
    chainStore.baseValue = 2;

    // Get computed value again
    const result3 = chainStore.computed4;

    // All computations should have run again
    expect(c0Spy).toHaveBeenCalledTimes(2); // Now 2
    expect(c1Spy).toHaveBeenCalledTimes(2); // Now 2
    expect(c2Spy).toHaveBeenCalledTimes(2); // Now 2
    expect(c3Spy).toHaveBeenCalledTimes(2); // Now 2
    expect(c4Spy).toHaveBeenCalledTimes(2); // Now 2

    // New expected value: baseValue(2) * 2 + 1 + 1 + 1 + 1 = 8
    expect(result3).toBe(8);
  });
});
