/// <reference types="react/jsx-runtime" />
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { useJods } from "../hooks/useJods";
import { store } from "../store";
import { computed, ComputedValue } from "../computed";

// Define test store types with computed properties
interface ComputedTestStore {
  firstName: string;
  lastName: string;
  fullName?: ComputedValue<string>;
}

interface NestedComputedTestStore extends ComputedTestStore {
  greeting?: ComputedValue<string>;
}

// Mock the useSyncExternalStore to avoid React rendering issues
vi.mock("react", async () => {
  const actual = await vi.importActual("react");

  // Create a controlled version of useSyncExternalStore that won't cause infinite loops
  const mockUseSyncExternalStore = vi.fn((subscribe, getSnapshot) => {
    // Just return the snapshot directly without setting up real subscriptions
    return getSnapshot();
  });

  return {
    ...(actual as any),
    useSyncExternalStore: mockUseSyncExternalStore,
    // For React <18 fallback
    unstable_useSyncExternalStore: mockUseSyncExternalStore,
  };
});

describe("useJods React Hook", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return the initial state from a store", () => {
    // Create a test store
    const testStore = store({ count: 0, name: "test" });

    // Call the hook directly - with our mock this won't trigger real React rendering
    const state = useJods(testStore);

    // Verify initial state is returned
    expect(state.count).toBe(0);
    expect(state.name).toBe("test");
  });

  it("should handle computed properties", () => {
    // Create a store with a computed property
    const testStore = store<ComputedTestStore>({
      firstName: "John",
      lastName: "Doe",
    });

    // Add a computed property
    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    // Call the hook
    const state = useJods(testStore);

    // Verify computed property works
    expect(state.fullName).toBe("John Doe");
  });

  it("should reflect store updates when called again", () => {
    // Create a test store
    const testStore = store({ count: 0 });

    // Initial state
    let state = useJods(testStore);
    expect(state.count).toBe(0);

    // Update the store
    testStore.count = 42;

    // Get updated state by calling hook again (simulating a re-render)
    state = useJods(testStore);
    expect(state.count).toBe(42);
  });

  it("should set up the correct subscription", () => {
    // Create a test store and spy on its subscribe method
    const testStore = store({ count: 0 });
    const subscribeSpy = vi.spyOn(testStore, "subscribe");

    // Call the hook, which should set up a subscription
    useJods(testStore);

    // Verify subscription was set up
    expect(subscribeSpy).toHaveBeenCalled();
  });

  it("should handle nested properties correctly", () => {
    // Create a store with nested data
    const testStore = store({
      user: {
        profile: {
          name: "Test User",
          age: 30,
        },
      },
    });

    // Call the hook
    const state = useJods(testStore);

    // Access nested properties
    expect(state.user.profile.name).toBe("Test User");
    expect(state.user.profile.age).toBe(30);
  });

  it("should work with computed properties that depend on other computed properties", () => {
    // Create a store with multiple computed properties
    const testStore = store<NestedComputedTestStore>({
      firstName: "John",
      lastName: "Doe",
    });

    // Add computed properties with dependencies
    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );
    testStore.greeting = computed(() => `Hello, ${testStore.fullName}!`);

    // Call the hook
    const state = useJods(testStore);

    // Verify computed chain works
    expect(state.greeting).toBe("Hello, John Doe!");
  });

  // This test verifies the signal-based reactivity pattern without causing infinite loops
  it("should update when accessed properties change", () => {
    const testStore = store({
      used: 123,
      unused: 456,
    });

    // Get initial state
    const initialState = useJods(testStore);
    expect(initialState.used).toBe(123);

    // Update a used property - in a real component this would trigger a re-render
    testStore.used = 789;

    // Simulate re-render by calling hook again
    const updatedState = useJods(testStore);
    expect(updatedState.used).toBe(789);
  });
});
