import { describe, it, expect, vi } from "vitest";
import { store } from "../store";
import { onUpdate } from "../hooks";
import { computed } from "../computed";
import { json } from "../json";
import { StoreState } from "../store";
import { ComputedValue } from "../computed";

describe("onUpdate", () => {
  it("should call callback when store properties change", () => {
    const testStore = store({
      firstName: "Burt",
      lastName: "Macklin",
      mood: "calm",
    });

    const callback = vi.fn();
    onUpdate(testStore, callback);

    // No update yet
    expect(callback).not.toHaveBeenCalled();

    // Update property
    testStore.firstName = "Michael";

    // Callback should be called once with new state and old state
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Michael",
        lastName: "Macklin",
        mood: "calm",
      }),
      expect.objectContaining({
        firstName: "Burt",
        lastName: "Macklin",
        mood: "calm",
      })
    );
  });

  it("should trigger callback for each individual property change", () => {
    const testStore = store({
      firstName: "Burt",
      lastName: "Macklin",
      mood: "calm",
    });

    const callback = vi.fn();
    onUpdate(testStore, callback);

    // First update
    testStore.firstName = "Michael";
    expect(callback).toHaveBeenCalledTimes(1);

    // Second update
    testStore.mood = "happy";
    expect(callback).toHaveBeenCalledTimes(2);

    // The second call should have both updates
    expect(callback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        firstName: "Michael",
        lastName: "Macklin",
        mood: "happy",
      }),
      expect.objectContaining({
        firstName: "Michael",
        lastName: "Macklin",
        mood: "calm",
      })
    );
  });

  it("should handle computed properties correctly", () => {
    const testStore = store({
      firstName: "Burt",
      lastName: "Macklin",
    });

    const callback = vi.fn();
    onUpdate(testStore, callback);

    // Add computed property and check if callback is triggered
    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );
    expect(callback).toHaveBeenCalledTimes(1);

    // Update underlying property and check if callback is triggered again
    testStore.firstName = "Michael";
    testStore.lastName = "Scarn";
    expect(callback).toHaveBeenCalledTimes(3);

    // Verify computed property is included in the callback
    const lastCallArg = json(callback.mock.calls[2][0]);
    expect(lastCallArg).toEqual({
      firstName: "Michael",
      lastName: "Scarn",
      fullName: "Michael Scarn",
    });
  });

  it("should match the README example behavior", () => {
    interface UserState extends StoreState {
      firstName: string;
      lastName: string;
      mood: string;
      fullName?: ComputedValue<string>;
    }

    const user = store<UserState>({
      firstName: "Burt",
      lastName: "Macklin",
      mood: "curious",
    });

    const updates: Record<string, any>[] = [];
    onUpdate(user, (newUserState) => {
      updates.push(json(newUserState));
    });

    // Perform the exact sequence from the README
    user.firstName = "Burt Macklin";
    user.mood = "sneaky";
    user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

    // Check how many updates were triggered (should be 3 if granular)
    expect(updates.length).toBe(3);

    // First update should only have firstName changed
    expect(updates[0]).toEqual({
      firstName: "Burt Macklin",
      lastName: "Macklin",
      mood: "curious",
    });

    // Second update should have mood changed
    expect(updates[1]).toEqual({
      firstName: "Burt Macklin",
      lastName: "Macklin",
      mood: "sneaky",
    });

    // Third update should include the computed property
    expect(updates[2]).toEqual({
      firstName: "Burt Macklin",
      lastName: "Macklin",
      mood: "sneaky",
      fullName: "Burt Macklin Macklin",
    });
  });

  it("should return an unsubscribe function that stops updates", () => {
    const testStore = store({
      value: 0,
    });

    const callback = vi.fn();
    const unsubscribe = onUpdate(testStore, callback);

    // Update once before unsubscribing
    testStore.value = 1;
    expect(callback).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // Updates after unsubscribing shouldn't trigger the callback
    testStore.value = 2;
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
