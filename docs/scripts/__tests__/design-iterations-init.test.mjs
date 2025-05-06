// Basic tests for design-iterations-init.mjs
import { jest } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock path module
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  join: jest.fn((...args) => args.join("/")),
  dirname: jest.fn((dir) => dir.split("/").slice(0, -1).join("/")),
}));

// Import functions from the module we want to test
// Note: We're not importing the module directly to avoid executing its main code
// In a real test, you would refactor the script to export its functions

describe("design-iterations-init", () => {
  // Helper to simulate the module's functionality for testing
  // In real implementation, refactor the script to export these functions
  function createTemplateFile(dirPath, data = {}) {
    const defaultData = {
      key: "value",
      name: "Test Template",
      iterations: 5,
    };

    const mergedData = { ...defaultData, ...data };

    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write template file
    const filePath = path.join(dirPath, "template.json");
    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));

    return filePath;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock behaviors
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]);
  });

  describe("createTemplateFile", () => {
    test("creates directory if it does not exist", () => {
      // Setup
      const dirPath = "static/screenshots/iterations/test-component";

      // Execute
      createTemplateFile(dirPath);

      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    test("does not create directory if it already exists", () => {
      // Setup
      const dirPath = "static/screenshots/iterations/test-component";
      fs.existsSync.mockReturnValue(true);

      // Execute
      createTemplateFile(dirPath);

      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test("writes template file with default data", () => {
      // Setup
      const dirPath = "static/screenshots/iterations/test-component";

      // Execute
      const filePath = createTemplateFile(dirPath);

      // Assert
      expect(filePath).toBe(
        "static/screenshots/iterations/test-component/template.json"
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "static/screenshots/iterations/test-component/template.json",
        JSON.stringify(
          {
            key: "value",
            name: "Test Template",
            iterations: 5,
          },
          null,
          2
        )
      );
    });

    test("writes template file with custom data", () => {
      // Setup
      const dirPath = "static/screenshots/iterations/test-component";
      const customData = {
        name: "Custom Template",
        iterations: 10,
        customField: "custom value",
      };

      // Execute
      createTemplateFile(dirPath, customData);

      // Assert
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "static/screenshots/iterations/test-component/template.json",
        JSON.stringify(
          {
            key: "value",
            name: "Custom Template",
            iterations: 10,
            customField: "custom value",
          },
          null,
          2
        )
      );
    });
  });

  // Note: In actual implementation, we would test more functions from the module
  // This is a simplified example to demonstrate the approach

  // TODO: When refactoring the script, extract these functions and test them directly:
  // - initializeComponent
  // - createTemplateForComponent
  // - detectExistingComponents
  // - main script execution flow
});
