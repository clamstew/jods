import { describe, it, expect } from "vitest";
import { computed, isComputed } from "../computed";
import { store } from "../store";

describe("computed", () => {
  it("should create a computed value", () => {
    const fn = () => 42;
    const computedValue = computed(fn);

    expect(typeof computedValue).toBe("function");
    expect(computedValue()).toBe(42);
  });

  it("should correctly mark computed values with a symbol", () => {
    const fn = () => 42;
    const computedValue = computed(fn);

    expect(isComputed(computedValue)).toBe(true);
  });

  it("should identify non-computed values correctly", () => {
    expect(isComputed(() => {})).toBe(false);
    expect(isComputed(null)).toBe(false);
    expect(isComputed(undefined)).toBe(false);
    expect(isComputed(42)).toBe(false);
    expect(isComputed("test")).toBe(false);
    expect(isComputed({})).toBe(false);
  });

  it("should work with store properties", () => {
    const testStore = store({
      firstName: "Burt",
      lastName: "Macklin",
    });

    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    expect(testStore.fullName()).toBe("Burt Macklin");

    // Change underlying values and check that computed updates
    testStore.firstName = "Michael";
    testStore.lastName = "Scarn";
    expect(testStore.fullName()).toBe("Michael Scarn");
  });
});
