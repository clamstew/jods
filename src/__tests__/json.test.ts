import { describe, it, expect } from "vitest";
import { json } from "../json";
import { store } from "../store";
import { computed } from "../computed";

describe("json", () => {
  it("should return a copy of the store state", () => {
    const testStore = store({ count: 0, name: "test" });
    const result = json(testStore);

    expect(result).toEqual({ count: 0, name: "test" });
    expect(result).not.toBe(testStore.getState()); // Should be a new object
  });

  it("should evaluate computed properties", () => {
    const testStore = store({
      firstName: "John",
      lastName: "Doe",
    });

    testStore.fullName = computed(
      () => `${testStore.firstName} ${testStore.lastName}`
    );

    const result = json(testStore);
    expect(result).toEqual({
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
    });
  });

  it("should handle nested objects", () => {
    const testStore = store({
      user: {
        profile: {
          name: "John",
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
          name: "John",
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
      users: [{ name: "John" }, { name: "Jane" }],
    });

    const result = json(testStore);
    expect(result).toEqual({
      items: [1, 2, 3],
      users: [{ name: "John" }, { name: "Jane" }],
    });
  });

  it("should handle computed values in nested objects", () => {
    const testStore = store({
      user: {
        firstName: "John",
        lastName: "Doe",
      },
    });

    testStore.user.fullName = computed(
      () => `${testStore.user.firstName} ${testStore.user.lastName}`
    );

    const result = json(testStore);
    expect(result).toEqual({
      user: {
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
      },
    });
  });
});
