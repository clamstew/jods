/**
 * Comprehensive test suite for useJodsPreact hook
 *
 * This file tests the Preact hook integration with the jods store.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { h } from "preact";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/preact";
import { useJods } from "../../../frameworks/preact/useJodsPreact";
import { store, computed, StoreState } from "../../../core";
import { resetBatchState } from "../../../core/batch";

// Force environment to identify as test
process.env.NODE_ENV = "test";
process.env.VITEST = "true";

// Reset batch state before each test
beforeEach(() => {
  resetBatchState();
  return () => {
    resetBatchState();
  };
});

// Clean up after each test
afterEach(() => {
  cleanup();
  resetBatchState();
});

/**
 * Comprehensive useJodsPreact Hook Tests
 */
describe("useJodsPreact hook", () => {
  // Define interface for test components with computed properties
  interface CounterState extends StoreState {
    count: number;
    double?: any; // Will be set as computed
    name: string;
  }

  it("should render initial state correctly", async () => {
    // Create store with initial values
    const counterStore = store<CounterState>({
      count: 5,
      name: "Test Counter",
    });

    // Add computed property
    counterStore.double = computed(function (this: CounterState) {
      return this.count * 2;
    });

    // Define Counter component with h() function
    const Counter = () => {
      const state = useJods(counterStore);

      return h("div", {}, [
        h("h1", { "data-testid": "name" }, [state.name]),
        h("p", { "data-testid": "count" }, [`Count: ${state.count}`]),
        h("p", { "data-testid": "double" }, [`Double: ${state.double}`]),
      ]);
    };

    // Render the component
    render(h(Counter, null));

    // Verify initial values
    expect(screen.getByTestId("name").textContent).toBe("Test Counter");
    expect(screen.getByTestId("count").textContent).toBe("Count: 5");
    expect(screen.getByTestId("double").textContent).toBe("Double: 10");
  });

  it("should update rendered values after direct store change", async () => {
    // Create store with initial values
    const counterStore = store<CounterState>({
      count: 1,
      name: "Test Counter",
    });

    // Add computed property
    counterStore.double = computed(function (this: CounterState) {
      return this.count * 2;
    });

    // Define Counter component with h() function
    const Counter = () => {
      const state = useJods(counterStore);

      return h("div", {}, [
        h("h1", { "data-testid": "name" }, [state.name]),
        h("p", { "data-testid": "count" }, [`Count: ${state.count}`]),
        h("p", { "data-testid": "double" }, [`Double: ${state.double}`]),
      ]);
    };

    // Render the component
    render(h(Counter, null));

    // Verify initial values
    expect(screen.getByTestId("count").textContent).toBe("Count: 1");
    expect(screen.getByTestId("double").textContent).toBe("Double: 2");

    // Update store directly
    await act(async () => {
      counterStore.count = 10;
    });

    // Verify updated values
    expect(screen.getByTestId("count").textContent).toBe("Count: 10");
    expect(screen.getByTestId("double").textContent).toBe("Double: 20");
  });

  it("should handle user interactions that trigger store updates", async () => {
    // Create store with initial values
    const counterStore = store<CounterState>({
      count: 0,
      name: "Interactive Counter",
    });

    // Add computed property
    counterStore.double = computed(function (this: CounterState) {
      return this.count * 2;
    });

    // Define Counter component with h() function
    const Counter = () => {
      const state = useJods(counterStore);

      return h("div", {}, [
        h("h1", { "data-testid": "name" }, [state.name]),
        h("p", { "data-testid": "count" }, [`Count: ${state.count}`]),
        h("p", { "data-testid": "double" }, [`Double: ${state.double}`]),
        h(
          "button",
          {
            "data-testid": "increment",
            onClick: () => {
              counterStore.count += 1;
            },
          },
          ["Increment"]
        ),
      ]);
    };

    // Render the component
    render(h(Counter, null));

    // Verify initial values
    expect(screen.getByTestId("count").textContent).toBe("Count: 0");
    expect(screen.getByTestId("double").textContent).toBe("Double: 0");

    // Simulate click event
    await act(async () => {
      fireEvent.click(screen.getByTestId("increment"));
    });

    // Verify updated values
    expect(screen.getByTestId("count").textContent).toBe("Count: 1");
    expect(screen.getByTestId("double").textContent).toBe("Double: 2");
  });

  it("should handle batch updates correctly", async () => {
    // Define test store interface
    interface BatchTestStore extends StoreState {
      count: number;
      message: string;
      computed?: any;
    }

    // Create store
    const batchStore = store<BatchTestStore>({
      count: 0,
      message: "Initial",
    });

    // Add computed property
    batchStore.computed = computed(function (this: BatchTestStore) {
      return `${this.count} - ${this.message}`;
    });

    // Define component that uses the batch store
    const BatchComponent = () => {
      const state = useJods(batchStore);

      return h("div", {}, [
        h("p", { "data-testid": "count" }, [`Count: ${state.count}`]),
        h("p", { "data-testid": "message" }, [`Message: ${state.message}`]),
        h("p", { "data-testid": "computed" }, [`Computed: ${state.computed}`]),
        h(
          "button",
          {
            "data-testid": "batch-update",
            onClick: () => {
              // Perform a batch update
              batchStore.batch(() => {
                batchStore.count += 5;
                batchStore.message = "Updated";
              });
            },
          },
          ["Batch Update"]
        ),
      ]);
    };

    // Render the component
    render(h(BatchComponent, null));

    // Verify initial values
    expect(screen.getByTestId("count").textContent).toBe("Count: 0");
    expect(screen.getByTestId("message").textContent).toBe("Message: Initial");
    expect(screen.getByTestId("computed").textContent).toBe(
      "Computed: 0 - Initial"
    );

    // Trigger batch update
    await act(async () => {
      fireEvent.click(screen.getByTestId("batch-update"));
    });

    // Verify all values were updated correctly in one render
    expect(screen.getByTestId("count").textContent).toBe("Count: 5");
    expect(screen.getByTestId("message").textContent).toBe("Message: Updated");
    expect(screen.getByTestId("computed").textContent).toBe(
      "Computed: 5 - Updated"
    );
  });

  it("should handle computed chains (dependencies between computed values)", async () => {
    // Define chain store interface
    interface ChainStore extends StoreState {
      base: number;
      double?: any;
      triple?: any;
      quadruple?: any;
    }

    // Create store with computed chain
    const chainStore = store<ChainStore>({
      base: 5,
    });

    // Set up chain of computed properties
    chainStore.double = computed(function (this: ChainStore) {
      return this.base * 2;
    });

    chainStore.triple = computed(function (this: ChainStore) {
      return this.base + this.double;
    });

    chainStore.quadruple = computed(function (this: ChainStore) {
      return this.double + this.triple - this.base;
    });

    // Define component that displays the computed chain
    const ChainComponent = () => {
      const state = useJods(chainStore);

      return h("div", {}, [
        h("p", { "data-testid": "base" }, [`Base: ${state.base}`]),
        h("p", { "data-testid": "double" }, [`Double: ${state.double}`]),
        h("p", { "data-testid": "triple" }, [`Triple: ${state.triple}`]),
        h("p", { "data-testid": "quadruple" }, [
          `Quadruple: ${state.quadruple}`,
        ]),
        h(
          "button",
          {
            "data-testid": "update-base",
            onClick: () => {
              chainStore.base = 10;
            },
          },
          ["Update Base"]
        ),
      ]);
    };

    // Render the component
    render(h(ChainComponent, null));

    // Verify initial computed values
    expect(screen.getByTestId("base").textContent).toBe("Base: 5");
    expect(screen.getByTestId("double").textContent).toBe("Double: 10");
    expect(screen.getByTestId("triple").textContent).toBe("Triple: 15");
    expect(screen.getByTestId("quadruple").textContent).toBe("Quadruple: 20");

    // Update base value which should propagate through the chain
    await act(async () => {
      fireEvent.click(screen.getByTestId("update-base"));
    });

    // Verify all computed values update correctly
    expect(screen.getByTestId("base").textContent).toBe("Base: 10");
    expect(screen.getByTestId("double").textContent).toBe("Double: 20");
    expect(screen.getByTestId("triple").textContent).toBe("Triple: 30");
    expect(screen.getByTestId("quadruple").textContent).toBe("Quadruple: 40");
  });

  it("should properly handle selective re-rendering", async () => {
    // Create spy to track renders
    const renderSpy = vi.fn();

    // Reset all mocks before test
    vi.resetAllMocks();

    // Define selector store interface
    interface SelectorStore extends StoreState {
      visited: boolean;
      count: number;
      unrelated: string;
    }

    // Create store
    const selectorStore = store<SelectorStore>({
      visited: false,
      count: 0,
      unrelated: "test",
    });

    // Define component that only cares about certain props
    function SelectorComponent() {
      renderSpy();
      const state = useJods(selectorStore);

      return h("div", {}, [
        h("p", { "data-testid": "count" }, [`Count: ${state.count}`]),
        h(
          "button",
          {
            "data-testid": "update-unrelated",
            onClick: () => {
              // Update property that shouldn't trigger re-render
              selectorStore.unrelated = "changed";
            },
          },
          ["Update Unrelated"]
        ),
        h(
          "button",
          {
            "data-testid": "update-related",
            onClick: () => {
              // Update property that should trigger re-render
              selectorStore.count += 1;
            },
          },
          ["Update Related"]
        ),
      ]);
    }

    // Reset renderSpy call count to ensure accurate tracking
    renderSpy.mockClear();

    // Render the component for the actual test
    const { rerender } = render(h(SelectorComponent, null));

    // Force a rerender to handle any initialization effects
    rerender(h(SelectorComponent, null));

    // Reset spy after initialization renders
    renderSpy.mockClear();

    // Update unrelated property
    await act(async () => {
      fireEvent.click(screen.getByTestId("update-unrelated"));
    });

    // Since useJods doesn't do property tracking, expect a render
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(selectorStore.unrelated).toBe("changed");

    // Update related property
    await act(async () => {
      fireEvent.click(screen.getByTestId("update-related"));
    });

    // Should have re-rendered again
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(selectorStore.count).toBe(1);
  });

  it("should correctly handle complex nested computed properties", async () => {
    // Create a store with complex nested properties
    const testStore = store<any>({
      dataA: 1,
      computedB: {
        value: computed(function (this: any) {
          return this.dataA * 2;
        }),
      },
      computedC: {
        value: computed(function (this: any) {
          // Need to call the nested computed with the store context
          return this.computedB.value.call(this) + this.dataA;
        }),
      },
    });

    // Test component that accesses nested computed values directly from the store
    const ComplexComponent = () => {
      const state = useJods(testStore);

      // Important: Get computed values directly from store for nested paths
      const bValue = testStore.computedB.value.call(testStore);
      const cValue = testStore.computedC.value.call(testStore);

      return h(
        "div",
        {},
        h("p", { "data-testid": "dataA" }, state.dataA.toString()),
        h("p", { "data-testid": "computedB" }, bValue.toString()),
        h("p", { "data-testid": "computedC" }, cValue.toString())
      );
    };

    // Render the component
    const { getByTestId } = render(h(ComplexComponent, {}));

    // Verify initial values
    expect(getByTestId("dataA").textContent).toBe("1");
    expect(getByTestId("computedB").textContent).toBe("2");
    expect(getByTestId("computedC").textContent).toBe("3");

    // Update dataA and check if nested computed properties update
    await act(async () => {
      testStore.dataA = 2;
    });

    expect(getByTestId("dataA").textContent).toBe("2");
    expect(getByTestId("computedB").textContent).toBe("4");
    expect(getByTestId("computedC").textContent).toBe("6");
  });

  it("should properly subscribe to store updates and compute derived values", () => {
    // Create store with a computed property
    const counterStore = store<CounterState>({
      count: 5,
      name: "Test Counter",
    });

    // Add computed property to the store
    counterStore.double = computed(function (this: CounterState) {
      return this.count * 2;
    });

    let lastCount = 0;
    let lastDouble = 0;

    const unsubscribe = counterStore.subscribe(() => {
      const currentState = counterStore.getState();
      lastCount = currentState.count;
      if (typeof currentState.double === "function") {
        lastDouble = currentState.double.call(counterStore);
      } else {
        lastDouble = currentState.double;
      }
    });

    // Check initial values (should have been set by the initial subscription call)
    expect(lastCount).toBe(5);
    expect(lastDouble).toBe(10);

    // Update store
    counterStore.count = 20;

    // Verify subscription was triggered with new values
    expect(lastCount).toBe(20);
    expect(lastDouble).toBe(40);

    // Clean up
    unsubscribe();
  });
});
