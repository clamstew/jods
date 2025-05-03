import { describe, it, expect } from "vitest";
import { diff } from "../diff";
import { store } from "../store";
import { computed } from "../computed";

describe("diff", () => {
  it("should return undefined for identical objects", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    expect(diff(obj1, obj2)).toBeUndefined();
  });

  it("should detect simple property changes", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    expect(diff(obj1, obj2)).toEqual({
      b: { __old: 2, __new: 3 },
    });
  });

  it("should detect added properties", () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 1, b: 2 };
    expect(diff(obj1, obj2)).toEqual({
      b: { __added: 2 },
    });
  });

  it("should detect removed properties", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };
    expect(diff(obj1, obj2)).toEqual({
      b: { __removed: 2 },
    });
  });

  it("should handle nested objects", () => {
    const obj1 = { user: { name: "Burt", age: 30 } };
    const obj2 = { user: { name: "Burt", age: 31 } };
    expect(diff(obj1, obj2)).toEqual({
      user: {
        age: { __old: 30, __new: 31 },
      },
    });
  });

  it("should handle arrays", () => {
    const obj1 = { items: [1, 2, 3] };
    const obj2 = { items: [1, 2, 4] };
    expect(diff(obj1, obj2)).toEqual({
      items: {
        "2": { __old: 3, __new: 4 },
      },
    });
  });

  it("should handle added array items", () => {
    const obj1 = { items: [1, 2] };
    const obj2 = { items: [1, 2, 3] };
    expect(diff(obj1, obj2)).toEqual({
      items: {
        "2": { __added: 3 },
      },
    });
  });

  it("should handle removed array items", () => {
    const obj1 = { items: [1, 2, 3] };
    const obj2 = { items: [1, 2] };
    expect(diff(obj1, obj2)).toEqual({
      items: {
        "2": { __removed: 3 },
      },
    });
  });

  it("should work with store objects", () => {
    const testStore1 = store({ count: 0, name: "test" });
    const testStore2 = store({ count: 1, name: "test" });

    expect(diff(testStore1, testStore2)).toEqual({
      count: { __old: 0, __new: 1 },
    });
  });

  it("should evaluate computed properties before diffing", () => {
    const testStore1 = store({
      firstName: "Burt",
      lastName: "Macklin",
    });

    const testStore2 = store({
      firstName: "Michael",
      lastName: "Scarn",
    });

    testStore1.fullName = computed(
      () => `${testStore1.firstName} ${testStore1.lastName}`
    );
    testStore2.fullName = computed(
      () => `${testStore2.firstName} ${testStore2.lastName}`
    );

    expect(diff(testStore1, testStore2)).toEqual({
      firstName: { __old: "Burt", __new: "Michael" },
      lastName: { __old: "Macklin", __new: "Scarn" },
      fullName: { __old: "Burt Macklin", __new: "Michael Scarn" },
    });
  });
});
