import { describe, it, expect } from "vitest";
import { json } from "../../core/json";
import { store } from "../../core/store";
import { computed } from "../../core/computed";

// Define interface with index signature
interface UserWithDynamicProps {
  firstName: string;
  lastName: string;
  // any is essential for the computed properties pattern
  [key: string]: any;
}

describe("json", () => {
  it("should return a copy of the store state", () => {
    const testStore = store({ count: 0, name: "test" });
    const result = json(testStore);

    expect(result).toEqual({ count: 0, name: "test" });
    expect(result).not.toBe(testStore.getState()); // Should be a new object
  });

  it("should evaluate computed properties", () => {
    const testStore = store({
      firstName: "Burt",
      lastName: "Macklin",
    });

    // @ts-expect-error - Dynamic property addition for test purposes
    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    const result = json(testStore);
    expect(result).toEqual({
      firstName: "Burt",
      lastName: "Macklin",
      fullName: "Burt Macklin",
    });
  });

  it("should handle nested objects", () => {
    const testStore = store({
      user: {
        profile: {
          name: "Burt",
          age: 30,
        },
        settings: {
          theme: "dark",
        },
      },
    });

    const result = json(testStore);
    expect(result).toEqual({
      user: {
        profile: {
          name: "Burt",
          age: 30,
        },
        settings: {
          theme: "dark",
        },
      },
    });
  });

  it("should handle arrays", () => {
    const testStore = store({
      items: [1, 2, 3],
      users: [{ name: "Burt" }, { name: "Michael" }],
    });

    const result = json(testStore);
    expect(result).toEqual({
      items: [1, 2, 3],
      users: [{ name: "Burt" }, { name: "Michael" }],
    });
  });

  it("should handle computed values in nested objects", () => {
    const testStore = store<{ user: UserWithDynamicProps }>({
      user: {
        firstName: "Burt",
        lastName: "Macklin",
      },
    });

    testStore.user.fullName = computed(
      () => `${testStore.user.firstName} ${testStore.user.lastName}`
    );

    const result = json(testStore);
    expect(result).toEqual({
      user: {
        firstName: "Burt",
        lastName: "Macklin",
        fullName: "Burt Macklin",
      },
    });
  });
});
