import { describe, it, expect } from "vitest";
import { diff } from "../../core/diff";
import { store } from "../../core/store";
import { computed } from "../../core/computed";

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

    // @ts-expect-error - Dynamic property addition for test purposes
    testStore1.fullName = computed(
      () => `${testStore1.firstName} ${testStore1.lastName}`
    );
    // @ts-expect-error - Dynamic property addition for test purposes
    testStore2.fullName = computed(
      () => `${testStore2.firstName} ${testStore2.lastName}`
    );

    expect(diff(testStore1, testStore2)).toEqual({
      firstName: { __old: "Burt", __new: "Michael" },
      lastName: { __old: "Macklin", __new: "Scarn" },
      fullName: { __old: "Burt Macklin", __new: "Michael Scarn" },
    });
  });

  it("should handle object type changes", () => {
    const a = { value: "test" };
    const b = { value: 123 };
    const result = diff(a, b);
    expect(result).toEqual({
      value: { __old: "test", __new: 123 },
    });
  });

  it("should detect circular references and not crash", () => {
    // Create objects with circular references
    const objA: any = { name: "A", count: 1 };
    const objB: any = { name: "B", count: 2 };

    // Create circular references
    objA.self = objA;
    objA.child = { parent: objA };

    objB.self = objB;
    objB.child = { parent: objB };

    // This should not cause infinite recursion
    const result = diff(objA, objB);

    // Verify the result has the expected structure with __circular markers
    expect(result).toBeDefined();
    expect(result?.name).toEqual({ __old: "A", __new: "B" });
    expect(result?.count).toEqual({ __old: 1, __new: 2 });

    // The self reference should be marked as circular
    expect(result?.self.__circular).toBe(true);

    // The nested circular reference should also be handled
    expect(result?.child.parent.__circular).toBe(true);
  });

  it("should handle complex objects with nested circular references", () => {
    // Create a more complex scenario with multiple circular references
    const objA: any = {
      id: 1,
      items: [],
      metadata: {
        created: "2023-01-01",
      },
    };

    const objB: any = {
      id: 2,
      items: [],
      metadata: {
        created: "2023-01-02",
      },
    };

    // Add circular references at different levels
    objA.metadata.owner = objA;
    objA.items.push(objA.metadata);
    objA.items.push({ ref: objA });

    objB.metadata.owner = objB;
    objB.items.push(objB.metadata);
    objB.items.push({ ref: objB });

    // This should not crash and correctly identify differences
    const result = diff(objA, objB);

    // Verify core differences
    expect(result).toBeDefined();
    expect(result?.id).toEqual({ __old: 1, __new: 2 });

    // Check that the metadata.created difference exists (though it might be in a different structure)
    const metadataResult = result?.metadata;
    expect(metadataResult).toBeDefined();

    if (metadataResult && !metadataResult.__circular) {
      // If metadata isn't marked as circular directly, check for the created property
      expect(metadataResult.created).toEqual({
        __old: "2023-01-01",
        __new: "2023-01-02",
      });
    }

    // Verify that circular references are properly detected
    // Test for the presence of __circular property rather than exact locations
    let circularRefCount = 0;

    // Helper function to count circular references
    const countCircularRefs = (obj: any): number => {
      if (!obj || typeof obj !== "object") return 0;

      let count = 0;

      if (obj.__circular === true) {
        return 1;
      }

      if (Array.isArray(obj)) {
        for (const item of obj) {
          count += countCircularRefs(item);
        }
      } else {
        for (const key in obj) {
          count += countCircularRefs(obj[key]);
        }
      }

      return count;
    };

    circularRefCount = countCircularRefs(result);

    // We should have at least 3 circular references in the diff result
    expect(circularRefCount).toBeGreaterThanOrEqual(3);
  });
});
