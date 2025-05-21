/// <reference types="react/jsx-runtime" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { useJods } from "../../../frameworks/react/useJods";
import { store } from "../../../core/store";
import { computed, ComputedValue } from "../../../core/computed";
import * as React from "react";
import { Store } from "../../../core/store";

// Define interfaces for our test stores
interface CounterTestStore {
  count: number;
}

interface ComputedTestStore {
  firstName: string;
  lastName: string;
  fullName?: ComputedValue<string>;
}

// Mock React component using the hook
function CounterTestComponent({
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

describe("useJods", () => {
  beforeEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("should render the initial state", () => {
    const testStore = store<CounterTestStore>({ count: 0 });
    render(<CounterTestComponent testStore={testStore} />);

    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("should update when the store changes", async () => {
    const testStore = store<CounterTestStore>({ count: 0 });
    render(<CounterTestComponent testStore={testStore} />);

    // Use fireEvent within act for the button click
    await act(async () => {
      fireEvent.click(screen.getByTestId("increment"));
    });
    expect(screen.getByTestId("count").textContent).toBe("1");

    // Update store directly within act
    await act(async () => {
      testStore.count = 42;
    });
    expect(screen.getByTestId("count").textContent).toBe("42");
  });

  it("should handle computed properties", async () => {
    // Create store with computed property defined at initialization
    const testStore = store<ComputedTestStore>({
      firstName: "Burt",
      lastName: "Macklin",
      fullName: computed(function (this: ComputedTestStore) {
        return `${this.firstName} ${this.lastName}`;
      }),
    });

    function ComputedComponent() {
      const state = useJods<ComputedTestStore>(testStore);
      return <div data-testid="full-name">{String(state.fullName)}</div>;
    }

    render(<ComputedComponent />);
    expect(screen.getByTestId("full-name").textContent).toBe("Burt Macklin");

    await act(async () => {
      testStore.firstName = "Michael";
      testStore.lastName = "Scarn";
    });
    expect(screen.getByTestId("full-name").textContent).toBe("Michael Scarn");
  });
});
