// Basic tests for testid-helpers.mjs
import { jest } from "@jest/globals";

// Import the module being tested
import {
  findByTestId,
  clickByTestId,
  convertComponentToTestIdFirst,
  convertAllComponentsToTestIdFirst,
} from "../testid-helpers.mjs";

// Define mock data and setup
describe("testid-helpers", () => {
  // Mock page object
  const mockPage = {
    $: jest.fn(),
    click: jest.fn(),
    evaluate: jest.fn(),
    waitForTimeout: jest.fn(),
  };

  // Mock element
  const mockElement = {
    click: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Console methods are used in the actual module
    console.log = jest.fn();
  });

  describe("findByTestId", () => {
    test("finds element by testId", async () => {
      // Setup
      mockPage.$.mockResolvedValueOnce(mockElement);

      // Execute
      const result = await findByTestId(mockPage, "test-id");

      // Assert
      expect(mockPage.$).toHaveBeenCalledWith('[data-testid="test-id"]');
      expect(result).toBe(mockElement);
    });

    test("tries variants if base testId not found", async () => {
      // Setup
      mockPage.$.mockResolvedValueOnce(null);
      mockPage.$.mockResolvedValueOnce(mockElement);

      // Execute
      const result = await findByTestId(mockPage, "test-id", ["variant"]);

      // Assert
      expect(mockPage.$).toHaveBeenCalledWith('[data-testid="test-id"]');
      expect(mockPage.$).toHaveBeenCalledWith(
        '[data-testid="test-id-variant"]'
      );
      expect(result).toBe(mockElement);
    });
  });

  describe("clickByTestId", () => {
    test("clicks element found by testId", async () => {
      // Setup
      mockPage.$.mockResolvedValueOnce(mockElement);

      // Execute
      const result = await clickByTestId(mockPage, "test-id", [], [], 100);

      // Assert
      expect(mockPage.$).toHaveBeenCalledWith('[data-testid="test-id"]');
      expect(mockElement.click).toHaveBeenCalled();
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(100);
      expect(result).toBe(true);
    });
  });

  describe("convertComponentToTestIdFirst", () => {
    test("converts component to use testId selectors", () => {
      // Setup
      const component = {
        name: "button-section",
        selector: ".button-component",
      };

      // Execute
      const result = convertComponentToTestIdFirst(component);

      // Assert
      expect(result.testId).toBe("jods-button-section");
      expect(result.alternativeSelectors[0]).toBe(
        '[data-testid="jods-button-section"]'
      );
    });
  });

  describe("convertAllComponentsToTestIdFirst", () => {
    test("converts all components in array", () => {
      // Setup
      const components = [{ name: "button-section" }, { name: "card-section" }];

      // Execute
      const result = convertAllComponentsToTestIdFirst(components);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].testId).toBe("jods-button-section");
      expect(result[1].testId).toBe("jods-card-section");
    });
  });
});
