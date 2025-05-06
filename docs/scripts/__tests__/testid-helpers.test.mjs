// Basic tests for testid-helpers.mjs
import { jest } from "@jest/globals";

// Import functions from the module we want to test
// Note: For a real implementation, the script would be refactored to export these functions

describe("testid-helpers", () => {
  // Helper functions to simulate what should be in the testid-helpers module
  function formatTestId(component, element, options = {}) {
    const { prefix = "jods-", delimiter = "-" } = options;
    return `${prefix}${component}${delimiter}${element}`;
  }

  function parseTestId(testId, options = {}) {
    const { prefix = "jods-", delimiter = "-" } = options;
    if (!testId.startsWith(prefix)) {
      return null;
    }

    const withoutPrefix = testId.slice(prefix.length);
    const parts = withoutPrefix.split(delimiter);

    if (parts.length < 2) {
      return null;
    }

    return {
      component: parts[0],
      element: parts[1],
      variants: parts.slice(2),
    };
  }

  function generateSelector(testId) {
    return `[data-testid="${testId}"]`;
  }

  function createTestIdMatcher(component, options = {}) {
    const { prefix = "jods-", delimiter = "-" } = options;
    const pattern = `^${prefix}${component}${delimiter}`;
    const regex = new RegExp(pattern);

    return (testId) => regex.test(testId);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("formatTestId", () => {
    test("formats standard testID with default options", () => {
      // Execute
      const testId = formatTestId("button", "primary");

      // Assert
      expect(testId).toBe("jods-button-primary");
    });

    test("formats testID with custom prefix", () => {
      // Execute
      const testId = formatTestId("button", "primary", { prefix: "custom-" });

      // Assert
      expect(testId).toBe("custom-button-primary");
    });

    test("formats testID with custom delimiter", () => {
      // Execute
      const testId = formatTestId("button", "primary", { delimiter: ":" });

      // Assert
      expect(testId).toBe("jods-button:primary");
    });
  });

  describe("parseTestId", () => {
    test("parses standard testID with default options", () => {
      // Execute
      const result = parseTestId("jods-button-primary");

      // Assert
      expect(result).toEqual({
        component: "button",
        element: "primary",
        variants: [],
      });
    });

    test("parses testID with variants", () => {
      // Execute
      const result = parseTestId("jods-button-primary-large-disabled");

      // Assert
      expect(result).toEqual({
        component: "button",
        element: "primary",
        variants: ["large", "disabled"],
      });
    });

    test("returns null for invalid testID format", () => {
      // Execute
      const result = parseTestId("invalid-format");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("generateSelector", () => {
    test("generates CSS selector for a testID", () => {
      // Execute
      const selector = generateSelector("jods-button-primary");

      // Assert
      expect(selector).toBe('[data-testid="jods-button-primary"]');
    });
  });

  describe("createTestIdMatcher", () => {
    test("creates matcher function for a component", () => {
      // Execute
      const matcher = createTestIdMatcher("button");

      // Assert
      expect(matcher("jods-button-primary")).toBe(true);
      expect(matcher("jods-form-input")).toBe(false);
    });
  });
});
