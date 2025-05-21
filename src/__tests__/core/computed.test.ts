import { describe, it, expect } from "vitest";
import { computed, isComputed, ComputedValue } from "../../core/computed";
import { store } from "../../core/store";

// Define an interface for the store state
interface ITestStore {
  firstName: string;
  lastName: string;
  fullName?: ComputedValue<string>; // Use ComputedValue type
}

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
    // Use the interface here
    const testStore = store<ITestStore>({
      firstName: "Burt",
      lastName: "Macklin",
      // Define fullName using 'this' to refer to store properties
      fullName: computed(function (this: ITestStore) {
        return `${this.firstName} ${this.lastName}`;
      }),
    });

    // Expect the value directly since computed values now return their result
    expect(testStore.fullName).toBe("Burt Macklin");

    // Change underlying values and check that computed updates
    testStore.firstName = "Michael";
    testStore.lastName = "Scarn";
    expect(testStore.fullName).toBe("Michael Scarn");
  });

  it("should prevent direct modification of computed properties", () => {
    interface TestStore {
      count: number;
      doubleCount?: ComputedValue<number>;
    }

    const testStore = store<TestStore>({
      count: 5,
      doubleCount: computed(function (this: TestStore) {
        return this.count * 2;
      }),
    });

    // Initial value
    expect(testStore.doubleCount).toBe(10);
    // Attempting to set a computed property should throw an error
    expect(() => {
      (testStore as any).doubleCount = 100;
    }).toThrow(TypeError);

    // Verify modifying the source property still updates the computed value
    testStore.count = 7;
    expect(testStore.doubleCount).toBe(14);
  });
});
