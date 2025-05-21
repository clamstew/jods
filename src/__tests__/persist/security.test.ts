import {
  // NEVER_PERSIST,
  // ALWAYS_PERSIST,
  shouldPersistProperty,
  applySecurityFiltering,
  filterNestedObject,
} from "../../persist/security";
import { store as createStore } from "../../core/store";
// import type { PersistOptions } from "../../persist/types";

describe("🔒 security API", () => {
  describe("shouldPersistProperty", () => {
    it("should be true by default", () => {
      expect(shouldPersistProperty("foo", "bar")).toBe(true);
    });

    // Add more tests for shouldPersistProperty
    it("should be false if the property is in the deny list", () => {
      expect(
        shouldPersistProperty("foo", "bar", [], { denyList: ["foo"] })
      ).toBe(false);
    });

    it("should be true if the property is in the allow list", () => {
      expect(
        shouldPersistProperty("foo", "bar", [], { allowList: ["foo"] })
      ).toBe(true);
    });

    it("should be false if property is in denyList, even if also in a differently targeted allowList", () => {
      expect(
        shouldPersistProperty("foo", "bar", [], {
          denyList: ["foo"],
          allowList: ["bar"],
        })
      ).toBe(false);
    });

    it("should be true if property is in allowList and not in denyList (when both lists present)", () => {
      expect(
        shouldPersistProperty("propA", "val", [], {
          allowList: ["propA"],
          denyList: ["propB"],
        })
      ).toBe(true);
    });

    it("should be false if property path is not in a specified allowList", () => {
      expect(
        shouldPersistProperty("foo", "bar", ["foo"], {
          allowList: ["bar"],
        })
      ).toBe(false);
    });

    it("should be false when allowList contains parent's name but not the specific nested path", () => {
      expect(
        shouldPersistProperty("foo", "bar", ["foo"], { allowList: ["foo"] })
      ).toBe(false);
    });
  });

  describe("applySecurityFiltering", () => {
    it("should return state as is by default", () => {
      const store = createStore({
        data: { a: 1, b: "hello" },
        version: 1,
      });
      expect(applySecurityFiltering(store, {})).toEqual(store);
    });

    it("should return state as is by default", () => {
      const store = createStore({
        data: { a: 1, b: "hello" },
        version: 1,
      });
      expect(applySecurityFiltering(store, {})).toEqual(store);
    });

    it("should return state as is by default", () => {
      const store = createStore({
        data: { a: 1, b: "hello" },
        version: 1,
      });
      expect(applySecurityFiltering(store, {})).toEqual(store);
    });
  });

  describe("filterNestedObject", () => {
    it("should return the original object if no filtering options are provided", () => {
      const state = { data: { a: 1, b: "hello" }, version: 1 };
      expect(filterNestedObject(state, [], {})).toEqual(state);
    });

    it("should correctly filter object using allowList with parent and child keys", () => {
      const state = { data: { a: 1, b: "hello" }, version: 1 };
      expect(
        filterNestedObject(state, [], { allowList: ["data", "data.a"] })
      ).toEqual({ data: { a: 1 } });
    });
  });
});
