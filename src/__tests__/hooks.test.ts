import { describe, it, expect, vi } from "vitest";
import { store } from "../store";
import { onUpdate } from "../hooks";
import { computed } from "../computed";
import { json } from "../json";

describe("onUpdate", () => {
  it("should call callback when store properties change", () => {
    const testStore = store({
      firstName: "John",
      lastName: "Doe",
      mood: "calm",
    });

    // With signal-based reactivity, the callback may be called during setup
    // to track dependencies
    const callback = vi.fn();

    // Call onUpdate - this might immediately call callback once for initial setup
    onUpdate(testStore, callback);

    // Clear mock to ignore initial setup call
    callback.mockClear();

    // Update property
    testStore.firstName = "Jane";

    // Callback should be called with new state
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jane",
        lastName: "Doe",
        mood: "calm",
      })
    );
  });

  it("should trigger callback for each individual property change", () => {
    const testStore = store({
      firstName: "John",
      lastName: "Doe",
      mood: "calm",
    });

    const callback = vi.fn();
    onUpdate(testStore, callback);

    // Clear mock to ignore initial call
    callback.mockClear();

    // First update
    testStore.firstName = "Jane";
    // With signal-based store, expect callback to be called
    expect(callback).toHaveBeenCalled();

    // Clear mock between updates
    callback.mockClear();

    // Second update
    testStore.mood = "happy";
    // With signal-based store, expect callback to be called again
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jane",
        lastName: "Doe",
        mood: "happy",
      })
    );
  });

  it("should handle computed properties correctly", () => {
    const testStore = store({
      firstName: "John",
      lastName: "Doe",
    });

    const callback = vi.fn();
    onUpdate(testStore, callback);

    // Clear mock to ignore initial call
    callback.mockClear();

    // Add computed property
    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    // With signal-based store, callback might be called differently
    // Clear between operations
    callback.mockClear();

    // Update underlying property
    testStore.firstName = "Jane";

    // Expect callback to have been called with updated state
    expect(callback).toHaveBeenCalled();

    // Verify computed property is included in the callback
    const lastCallArg = json(
      callback.mock.calls[callback.mock.calls.length - 1][0]
    );
    expect(lastCallArg).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      fullName: "Jane Doe",
    });
  });

  it("should match the README example behavior", () => {
    const user = store({
      firstName: "Burt",
      lastName: "Macklin",
      mood: "curious",
    });

    const callback = vi.fn((state) => {
      // Just access properties to establish dependencies
      // We're intentionally accessing these properties to create dependencies
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { firstName, lastName, mood } = state;

      // Accessing fullName if it exists
      if ("fullName" in state) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const fullName = state.fullName;
      }
    });

    // Subscribe to changes
    onUpdate(user, callback);

    // Clear mock to ignore initial call that tracks dependencies
    callback.mockClear();

    // Mutate existing fields - should trigger the callback
    user.firstName = "Burt Macklin";

    // With signal-based reactivity, the callback may be called multiple times
    // but we just want to verify it was called at least once
    expect(callback).toHaveBeenCalled();

    callback.mockClear();
    user.mood = "sneaky";
    expect(callback).toHaveBeenCalled();

    // Add computed field
    callback.mockClear();
    user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

    // Verify final state matches expected JSON output
    const finalState = json(user);
    expect(finalState).toEqual({
      firstName: "Burt Macklin",
      lastName: "Macklin",
      mood: "sneaky",
      fullName: "Burt Macklin Macklin",
    });
  });

  it("should return an unsubscribe function that stops updates", () => {
    const testStore = store({
      count: 0,
      name: "test",
    });

    const callback = vi.fn((state) => {
      // Access properties to track dependencies
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { count, name } = state;
    });

    // Subscribe and get unsubscribe function
    const unsubscribe = onUpdate(testStore, callback);

    // Clear mock after initial dependency tracking call
    callback.mockClear();

    // Update state - callback should be called
    testStore.count = 1;

    // With signal-based reactivity, the callback may be called multiple times
    // but we just want to verify it was called at least once
    expect(callback).toHaveBeenCalled();

    // Unsubscribe from updates
    unsubscribe();

    // Clear mock again
    callback.mockClear();

    // Update state again - callback should NOT be called
    testStore.count = 2;
    testStore.name = "updated";

    // Verify callback wasn't called after unsubscribe
    expect(callback).not.toHaveBeenCalled();
  });
});
