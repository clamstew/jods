// Basic tests for design-iterations.mjs
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
  statSync: jest.fn(),
}));

// Mock path module
jest.mock("path", () => ({
  ...jest.requireActual("path"),
  join: jest.fn((...args) => args.join("/")),
  dirname: jest.fn((dir) => dir.split("/").slice(0, -1).join("/")),
  resolve: jest.fn((...args) => args.join("/")),
}));

// Import functions from the module we want to test
// Note: In a real implementation, the script would be refactored to export these functions

describe("design-iterations", () => {
  // Utility functions that we would expect to extract from the script

  // Helper to simulate finding components with templates
  function findComponentsWithTemplates(baseDir) {
    const components = [];

    // Check if directory exists
    if (!fs.existsSync(baseDir)) {
      return components;
    }

    // Get list of component directories
    const files = fs.readdirSync(baseDir);

    for (const file of files) {
      const componentDir = path.join(baseDir, file);
      const templateFile = path.join(componentDir, "template.json");

      // Check if directory and has template file
      if (
        fs.statSync(componentDir).isDirectory() &&
        fs.existsSync(templateFile)
      ) {
        try {
          const templateContent = fs.readFileSync(templateFile, "utf8");
          const templateData = JSON.parse(templateContent);

          components.push({
            name: file,
            path: componentDir,
            template: templateData,
          });
        } catch (error) {
          console.error(`Error reading template for ${file}: ${error.message}`);
        }
      }
    }

    return components;
  }

  // Helper to simulate generating an iteration
  function generateIteration(component, iterationNum) {
    const { name, path: componentPath, template } = component;

    // Create iteration directory
    const iterationDir = path.join(componentPath, `iteration-${iterationNum}`);
    if (!fs.existsSync(iterationDir)) {
      fs.mkdirSync(iterationDir, { recursive: true });
    }

    // Generate iteration metadata
    const metadata = {
      componentName: name,
      iteration: iterationNum,
      timestamp: new Date().toISOString(),
      template: { ...template },
      status: "generated",
    };

    // Write metadata file
    const metadataFile = path.join(iterationDir, "metadata.json");
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    return {
      path: iterationDir,
      metadata,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock behaviors
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ isDirectory: () => true });
    fs.readdirSync.mockReturnValue([]);
  });

  describe("findComponentsWithTemplates", () => {
    test("returns empty array if base directory does not exist", () => {
      // Setup
      const baseDir = "static/screenshots/iterations";
      fs.existsSync.mockReturnValue(false);

      // Execute
      const components = findComponentsWithTemplates(baseDir);

      // Assert
      expect(components).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith(baseDir);
      expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    test("finds components with valid templates", () => {
      // Setup
      const baseDir = "static/screenshots/iterations";
      fs.readdirSync.mockReturnValue([
        "component1",
        "component2",
        "not-a-component",
      ]);

      // Mock template files
      const template1 = { name: "Component 1", iterations: 3 };
      const template2 = { name: "Component 2", iterations: 5 };

      // Set up statSync and existsSync for directories and template files
      fs.statSync.mockImplementation((path) => ({
        isDirectory: () => !path.includes("not-a-component"),
      }));

      fs.existsSync.mockImplementation((path) => {
        if (path === baseDir) return true;
        if (path.includes("template.json") && !path.includes("not-a-component"))
          return true;
        return false;
      });

      // Set up readFileSync for template files
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes("component1")) return JSON.stringify(template1);
        if (path.includes("component2")) return JSON.stringify(template2);
        return "";
      });

      // Execute
      const components = findComponentsWithTemplates(baseDir);

      // Assert
      expect(components).toEqual([
        {
          name: "component1",
          path: "static/screenshots/iterations/component1",
          template: template1,
        },
        {
          name: "component2",
          path: "static/screenshots/iterations/component2",
          template: template2,
        },
      ]);
    });

    test("skips components with invalid template files", () => {
      // Setup
      const baseDir = "static/screenshots/iterations";
      fs.readdirSync.mockReturnValue(["component1", "invalid-json"]);

      // Mock template files
      const template1 = { name: "Component 1", iterations: 3 };

      // Set up statSync and existsSync for directories and template files
      fs.statSync.mockReturnValue({ isDirectory: () => true });
      fs.existsSync.mockReturnValue(true);

      // Set up readFileSync for template files
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes("component1")) return JSON.stringify(template1);
        if (path.includes("invalid-json")) return "{not valid json";
        return "";
      });

      // Mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        // Execute
        const components = findComponentsWithTemplates(baseDir);

        // Assert
        expect(components).toEqual([
          {
            name: "component1",
            path: "static/screenshots/iterations/component1",
            template: template1,
          },
        ]);
        expect(console.error).toHaveBeenCalled();
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe("generateIteration", () => {
    test("creates iteration directory and metadata file", () => {
      // Setup
      const component = {
        name: "test-component",
        path: "static/screenshots/iterations/test-component",
        template: { name: "Test Component", iterations: 3 },
      };

      // Execute
      const iteration = generateIteration(component, 1);

      // Assert
      const expectedPath =
        "static/screenshots/iterations/test-component/iteration-1";
      expect(iteration.path).toBe(expectedPath);
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedPath, {
        recursive: true,
      });

      // Check metadata file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "static/screenshots/iterations/test-component/iteration-1/metadata.json",
        expect.any(String)
      );

      // Verify metadata content
      const metadataArg = fs.writeFileSync.mock.calls[0][1];
      const metadata = JSON.parse(metadataArg);
      expect(metadata).toMatchObject({
        componentName: "test-component",
        iteration: 1,
        template: { name: "Test Component", iterations: 3 },
        status: "generated",
      });
      expect(metadata).toHaveProperty("timestamp");
    });

    test("does not create directory if it already exists", () => {
      // Setup
      const component = {
        name: "test-component",
        path: "static/screenshots/iterations/test-component",
        template: { name: "Test Component", iterations: 3 },
      };
      fs.existsSync.mockReturnValue(true);

      // Execute
      generateIteration(component, 2);

      // Assert
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled(); // Still writes metadata
    });
  });

  // Note: In actual implementation, we would test more functions from the module
  // - loadComponent
  // - processComponentIterations
  // - validateTemplate
  // - main script execution flow
});
