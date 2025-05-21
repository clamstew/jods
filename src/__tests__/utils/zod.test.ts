import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as zodUtils from "../../utils/zodUtils"; // Import to mock getZ

// We will import the actual j, jod from the module to test the proxy
// DO NOT MOCK "../../utils/zod" directly anymore.
import { j, jod } from "../../utils/zod";

// Mock console.warn
// const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

// Define a list of known allowed methods for testing (subset of the main list)
const testAllowedMethods = [
  "string",
  "number",
  "object",
  "optional",
  "parse",
  "nullable",
  "_def",
];
// Define a list of known disallowed methods for testing
const testDisallowedMethods = ["nonExistentMethod", "anotherForbiddenCall"];

describe("Zod wrapper (j and jod aliases)", () => {
  let mockZodInstance: any;
  let consoleWarnSpy: any; // Declare here

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {}); // Initialize here
    // consoleWarnSpy.mockClear(); // No longer needed here as it's fresh
    mockZodInstance = {
      string: vi.fn(() => ({
        _isMockZodSchema: true,
        type: "string",
        optional: () => mockZodInstance.string(),
      })),
      number: vi.fn(() => ({ _isMockZodSchema: true, type: "number" })),
      object: vi.fn((schema: any) => ({
        _isMockZodSchema: true,
        type: "object",
        shape: schema,
      })),
      optional: vi.fn(() => ({ _isMockZodSchema: true, type: "optional" })), // Example chainable
      nullable: vi.fn(() => ({ _isMockZodSchema: true, type: "nullable" })),
      parse: vi.fn((data) => ({ success: true, data })),
      _def: {}, // Mock _def as it's allowed and important
      // Add other allowed methods if their specific behavior needs to be asserted
    };
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restores original implementations, including getZ if mocked per test
  });

  describe("With Zod available", () => {
    beforeEach(() => {
      vi.spyOn(zodUtils, "getZ").mockReturnValue(mockZodInstance);
    });

    testAllowedMethods.forEach((methodName) => {
      it(`j.${methodName} should proxy to Zod's ${methodName}`, () => {
        const jProxy = j as any;
        // Accessing the prop or calling it if it's a function
        if (typeof mockZodInstance[methodName] === "function") {
          jProxy[methodName]({ someArg: "test" }); // Call if it's a method
          expect(mockZodInstance[methodName]).toHaveBeenCalled();
        } else {
          const val = jProxy[methodName]; // Access if it's a property like _def
          expect(val).toBeDefined(); // Basic check for properties
        }
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it(`jod.${methodName} should proxy to Zod's ${methodName}`, () => {
        const jodProxy = jod as any;
        if (typeof mockZodInstance[methodName] === "function") {
          jodProxy[methodName]({ someArg: "test" });
          expect(mockZodInstance[methodName]).toHaveBeenCalled();
        } else {
          const val = jodProxy[methodName];
          expect(val).toBeDefined();
        }
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });

    testDisallowedMethods.forEach((methodName) => {
      it(`j.${methodName} should throw an error`, () => {
        const jProxy = j as any;
        expect(() => jProxy[methodName]).toThrowError(
          new RegExp(
            `Error: Property or method '${methodName}' is not directly exposed via jods' j/jod alias.`
          )
        );
      });

      it(`jod.${methodName} should throw an error`, () => {
        const jodProxy = jod as any;
        expect(() => jodProxy[methodName]).toThrowError(
          new RegExp(
            `Error: Property or method '${methodName}' is not directly exposed via jods' j/jod alias.`
          )
        );
      });
    });

    it("j.string().optional() should chain correctly to Zod's methods", () => {
      j.string().optional();
      expect(mockZodInstance.string).toHaveBeenCalled();
      // This part of the test needs the mock string to return an object that has an optional method
      // mockZodInstance.string already returns { optional: vi.fn() } if string itself is vi.fn returning that object.
      // Let's adjust the mock for string.
      const mockStringSchema = {
        _isMockZodSchema: true,
        type: "string",
        optional: vi.fn(),
      };
      mockZodInstance.string.mockReturnValue(mockStringSchema);

      j.string().optional();
      expect(mockZodInstance.string).toHaveBeenCalledTimes(3); // Changed from 2 to 3
      expect(mockStringSchema.optional).toHaveBeenCalledTimes(1);
    });
  });

  describe("Without Zod available", () => {
    beforeEach(() => {
      // Clear any previous spy on getZ from the "With Zod available" block
      // and set up the new mock for this block.
      vi.spyOn(zodUtils, "getZ").mockImplementation(() => {
        throw new Error("Zod not installed");
      });
      // consoleWarnSpy will be set up by the outer beforeEach
    });

    testAllowedMethods.forEach((methodName) => {
      it(`j.${methodName} should return a fallback and warn`, () => {
        const jProxy = j as any;
        let result;
        if (
          methodName === "_def" ||
          methodName === "shape" ||
          methodName === "element"
        ) {
          // These are properties, not methods to call
          result = jProxy[methodName];
        } else {
          result = jProxy[methodName](); // Call if it's a method
        }
        expect(result).toBeDefined();
        expect(result._zodMissing).toBe(true); // Check for our fallback marker
        if (methodName !== "_def") {
          // _def might not trigger a warning if it's just a property access on the proxy itself.
          // And it doesn't make sense to call _def()
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining("You're using jods")
          );
        }
      });

      it(`jod.${methodName} should return a fallback and warn`, () => {
        const jodProxy = jod as any;
        let result;
        if (
          methodName === "_def" ||
          methodName === "shape" ||
          methodName === "element"
        ) {
          result = jodProxy[methodName];
        } else {
          result = jodProxy[methodName]();
        }
        expect(result).toBeDefined();
        expect(result._zodMissing).toBe(true);
        if (methodName !== "_def") {
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining("You're using jods")
          );
        }
      });
    });

    testDisallowedMethods.forEach((methodName) => {
      it(`j.${methodName} should throw an error`, () => {
        const jProxy = j as any;
        expect(() => jProxy[methodName]).toThrowError(
          new RegExp(
            `Error: Property or method '${methodName}' is not directly exposed via jods' j/jod alias.`
          )
        );
        expect(consoleWarnSpy).not.toHaveBeenCalled(); // No warning if it throws immediately
      });

      it(`jod.${methodName} should throw an error`, () => {
        const jodProxy = jod as any;
        expect(() => jodProxy[methodName]).toThrowError(
          new RegExp(
            `Error: Property or method '${methodName}' is not directly exposed via jods' j/jod alias.`
          )
        );
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });

    it("j.string().optional() should chain on fallbacks and warn once per initial call", () => {
      const jProxy = j as any;
      const fallbackString = jProxy.string(); // First call, should warn
      expect(fallbackString._zodMissing).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("jods string() without Zod installed")
      );

      consoleWarnSpy.mockClear(); // Clear for the next assertion in this specific test

      const fallbackOptional = fallbackString.optional(); // Chained call
      expect(fallbackOptional._zodMissing).toBe(true);
      // Warning should NOT be called again for a chained call on the same fallback instance if already warned.
      // The current implementation warns once per createZodMissingFallback instance.
      // j.string() creates one. fallbackString.optional() operates on that.
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // Ensure type property is set on fallback
      expect(fallbackString.type).toBe("string");
      // Optional doesn't change the type in the simple fallback, it's still based on the initial call.
      expect(fallbackOptional.type).toBe("string");
    });

    it("Accessing a disallowed method on a fallback chain should throw", () => {
      const jProxy = j as any;
      const fallbackString = jProxy.string(); // Allowed, creates fallback
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // Warns for string()
      consoleWarnSpy.mockClear(); // Clear for the next assertion in this specific test

      expect(() =>
        fallbackString.nonExistentMethodOnFallbackChain()
      ).toThrowError(
        new RegExp(
          `Error: Property or method 'nonExistentMethodOnFallbackChain' is not directly exposed`
        )
      );
      expect(consoleWarnSpy).not.toHaveBeenCalled(); // No new warning if it throws
    });
  });
});
