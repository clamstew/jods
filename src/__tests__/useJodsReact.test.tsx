/// <reference types="react/jsx-runtime" />
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { useJods } from "../hooks/useJods";
import { store } from "../store";
import { computed, ComputedValue } from "../computed";
import * as React from "react";
import { Store } from "../store";

// Define interfaces for our test stores
interface CounterTestStore {
  count: number;
}

interface ComputedTestStore {
  firstName: string;
  lastName: string;
  fullName?: ComputedValue<string>;
}

// Define a special interface for testing signal-based reactivity
interface SignalTestStore {
  accessed: number;
  unaccessed: number;
  renderCount: number;
}

// Create a controlled test component that avoids infinite loops
// Key point: No button click handlers or action callbacks
function SafeCounterComponent({
  testStore,
}: {
  testStore: CounterTestStore & Store<CounterTestStore>;
}) {
  const state = useJods(testStore);
  return <div data-testid="count">{state.count}</div>;
}

// Component that only accesses one property
function SignalTestComponent({
  testStore,
  onRender,
}: {
  testStore: SignalTestStore & Store<SignalTestStore>;
  onRender: () => void;
}) {
  // Call onRender immediately during render instead of using useEffect
  onRender();

  const state = useJods(testStore);

  // Only access the 'accessed' property, not 'unaccessed'
  return (
    <div>
      <div data-testid="accessed">{state.accessed}</div>
      <div data-testid="render-count">{testStore.renderCount}</div>
    </div>
  );
}

describe("useJods", () => {
  // Add stores collection to ensure proper cleanup
  let stores: Array<any> = [];

  beforeEach(() => {
    cleanup();
    vi.resetAllMocks();
    // Clear stores array for the next test
    stores = [];
  });

  afterEach(() => {
    // Help clean up any lingering reactivity
    stores.forEach((s) => {
      // Attempt to break circular references/subscriptions
      if (s.subscribe && typeof s.subscribe === "function") {
        const listeners = s.subscribe(() => {});
        if (typeof listeners === "function") listeners();
      }
    });
  });

  // Safe test that doesn't use interactive elements
  it("should render the initial state", () => {
    const testStore = store<CounterTestStore>({ count: 0 });
    stores.push(testStore);

    render(<SafeCounterComponent testStore={testStore} />);
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  // Controlled update test
  it("should update when the store changes", async () => {
    const testStore = store<CounterTestStore>({ count: 0 });
    stores.push(testStore);

    render(<SafeCounterComponent testStore={testStore} />);
    expect(screen.getByTestId("count").textContent).toBe("0");

    // Directly update store - no button clicks
    await act(async () => {
      testStore.count = 42;
    });

    expect(screen.getByTestId("count").textContent).toBe("42");
  });

  // Test computed values
  it("should handle computed properties", async () => {
    // Create store with basic properties first
    const testStore = store<ComputedTestStore>({
      firstName: "John",
      lastName: "Doe",
    });
    stores.push(testStore);

    // Add a computed property
    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    // Simple component with no side effects
    function ComputedComponent() {
      const state = useJods<ComputedTestStore>(testStore);
      return <div data-testid="full-name">{state.fullName}</div>;
    }

    render(<ComputedComponent />);
    expect(screen.getByTestId("full-name").textContent).toBe("John Doe");

    // Controlled update
    await act(async () => {
      testStore.firstName = "Jane";
    });

    expect(screen.getByTestId("full-name").textContent).toBe("Jane Doe");
  });

  // This test is known to work reliably
  it("should handle signal-based reactivity with React components", () => {
    // Create a test store with multiple properties
    const testStore = store<SignalTestStore>({
      accessed: 1,
      unaccessed: 1,
      renderCount: 0,
    });
    stores.push(testStore);

    let renderCount = 0;
    const handleRender = () => {
      renderCount++;
      testStore.renderCount = renderCount;
    };

    // Render the component (this will call handleRender once)
    render(
      <SignalTestComponent testStore={testStore} onRender={handleRender} />
    );

    // Initial render should happen
    expect(renderCount).toBe(1);
    expect(screen.getByTestId("accessed").textContent).toBe("1");

    // Update the unaccessed property - should NOT cause a re-render
    act(() => {
      testStore.unaccessed = 2;
    });

    // Render count should still be 1 since we didn't access 'unaccessed'
    expect(renderCount).toBe(1);

    // Update the accessed property - should cause a re-render
    act(() => {
      testStore.accessed = 2;
    });

    // Render count should increase to 2
    expect(renderCount).toBe(2);
    expect(screen.getByTestId("accessed").textContent).toBe("2");
  });

  // Simple validation test
  it("should only update components when relevant properties change", () => {
    // Create a test store
    const testStore = store({ value: 1, unused: 0 });
    stores.push(testStore);

    // Simple render count tracking
    let renders = 0;

    // Component that only uses one property
    function TestComponent() {
      renders++;
      const state = useJods(testStore);
      return <div data-testid="value">{state.value}</div>;
    }

    render(<TestComponent />);
    expect(renders).toBe(1);

    // Update unused property - should not trigger render
    act(() => {
      testStore.unused = 100;
    });
    expect(renders).toBe(1);

    // Update used property - should trigger render
    act(() => {
      testStore.value = 42;
    });
    expect(renders).toBe(2);
  });

  // Replace the lifecycle test with a safer version
  it("should properly integrate with React component lifecycle", () => {
    const testStore = store({ count: 1 });
    stores.push(testStore);

    let renderCount = 0;

    // Simple component with render counting
    function LifecycleTestComponent() {
      renderCount++;
      const state = useJods(testStore);
      return <div data-testid="count">{state.count}</div>;
    }

    // Mount
    const { unmount } = render(<LifecycleTestComponent />);
    expect(renderCount).toBe(1);

    // Update
    act(() => {
      testStore.count = 2;
    });
    expect(renderCount).toBe(2);

    // Unmount should stop reactions
    unmount();

    // Update after unmount
    act(() => {
      testStore.count = 3;
    });

    // Should not have increased
    expect(renderCount).toBe(2);
  });

  // Replace memoization test with safer implementation
  it("should optimize performance with selective property access", () => {
    const testStore = store({
      a: 1,
      b: 2,
      c: 3,
    });
    stores.push(testStore);

    let renderCount = 0;

    // Component that only accesses property 'a'
    function SelectiveComponent() {
      renderCount++;
      const state = useJods(testStore);
      // Only read property 'a'
      return <div data-testid="a">{state.a}</div>;
    }

    render(<SelectiveComponent />);
    expect(renderCount).toBe(1);

    // Update non-observed property - should NOT cause render
    act(() => {
      testStore.b = 20;
      testStore.c = 30;
    });
    expect(renderCount).toBe(1);

    // Update observed property - should trigger render
    act(() => {
      testStore.a = 10;
    });
    expect(renderCount).toBe(2);
  });
});
