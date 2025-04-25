/// <reference types="react/jsx-runtime" />
/** @jsx h */
/** @jsxFrag Fragment */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, Fragment } from "preact";
import { describe, it, expect, beforeEach } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { computed } from "../computed";
import { Store, store } from "../store";

// Import hook
import { useJods } from "../hooks/useJodsPreact";
import { ComputedValue } from "../computed";

// Define interfaces for our test stores
interface CounterTestStore {
  count: number;
}

interface ComputedTestStore {
  firstName: string;
  lastName: string;
  fullName?: ComputedValue<string>;
}

// Mock components for testing Preact
function CounterComponent({
  testStore,
}: {
  testStore: CounterTestStore & Store<CounterTestStore>;
}) {
  const state = useJods(testStore);

  return (
    <div>
      <div data-testid="count">{state.count}</div>
      <button
        data-testid="increment"
        onClick={() => {
          testStore.count += 1;
        }}
      >
        Increment
      </button>
    </div>
  );
}

function ComputedComponent({
  testStore,
}: {
  testStore: ComputedTestStore & Store<ComputedTestStore>;
}) {
  const state = useJods(testStore);

  return (
    <div>
      <div data-testid="full-name">{state.fullName}</div>
      <button
        data-testid="change-name"
        onClick={() => {
          testStore.firstName = "Jane";
        }}
      >
        Change Name
      </button>
    </div>
  );
}

// Preact Component integration tests
describe("useJods (Preact Component Integration)", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should render the initial state", () => {
    const testStore = store<CounterTestStore>({ count: 0 });
    render(<CounterComponent testStore={testStore} />);
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("should update when the store changes", async () => {
    const testStore = store<CounterTestStore>({ count: 0 });
    render(<CounterComponent testStore={testStore} />);

    await act(() => {
      fireEvent.click(screen.getByTestId("increment"));
    });
    expect(screen.getByTestId("count").textContent).toBe("1");

    await act(() => {
      testStore.count = 42;
    });
    expect(screen.getByTestId("count").textContent).toBe("42");
  });

  it("should handle computed properties in components", async () => {
    const testStore = store<ComputedTestStore>({
      firstName: "John",
      lastName: "Doe",
    });

    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    render(<ComputedComponent testStore={testStore} />);
    expect(screen.getByTestId("full-name").textContent).toBe("John Doe");

    await act(() => {
      fireEvent.click(screen.getByTestId("change-name"));
    });
    expect(screen.getByTestId("full-name").textContent).toBe("Jane Doe");

    await act(() => {
      testStore.lastName = "Smith";
    });
    expect(screen.getByTestId("full-name").textContent).toBe("Jane Smith");
  });
});
