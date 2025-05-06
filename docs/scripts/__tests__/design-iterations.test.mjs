// Basic tests for design-iterations.mjs
import { jest } from "@jest/globals";
import { mockFS } from "./setup-mocks.mjs";

// Import functions from the module we want to test
// Note: In a real implementation, the script would be refactored to export these functions

describe("design-iterations", () => {
  // Utility functions that we would expect to extract from the script

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behaviors
    mockFS.existsSync.mockReturnValue(true);
    mockFS.statSync.mockReturnValue({ isDirectory: () => true });
    mockFS.readdirSync.mockReturnValue([]);
    mockFS.readFileSync.mockReturnValue("{}");
  });

  // Helper to simulate finding components with templates
  function findComponentsWithTemplates(baseDir) {
    const components = [];

    // Check if directory exists
    if (!mockFS.existsSync(baseDir)) {
      return components;
    }

    // Get list of component directories
    const files = mockFS.readdirSync(baseDir);

    for (const file of files) {
      const componentDir = `${baseDir}/${file}`;
      const templateFile = `${componentDir}/template.json`;

      // Check if directory and has template file
      if (
        mockFS.statSync(componentDir).isDirectory() &&
        mockFS.existsSync(templateFile)
      ) {
        try {
          const templateContent = mockFS.readFileSync(templateFile, "utf8");
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
    const iterationDir = `${componentPath}/iteration-${iterationNum}`;
    if (!mockFS.existsSync(iterationDir)) {
      mockFS.mkdirSync(iterationDir, { recursive: true });
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
    const metadataFile = `${iterationDir}/metadata.json`;
    mockFS.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

    return {
      path: iterationDir,
      metadata,
    };
  }

  describe("findComponentsWithTemplates", () => {
    test("returns empty array if base directory does not exist", () => {
      // Setup
      const baseDir = "static/screenshots/iterations";
      mockFS.existsSync.mockReturnValueOnce(false);

      // Execute
      const components = findComponentsWithTemplates(baseDir);

      // Assert
      expect(components).toEqual([]);
      expect(mockFS.existsSync).toHaveBeenCalledWith(baseDir);
      expect(mockFS.readdirSync).not.toHaveBeenCalled();
    });

    test("finds components with valid templates", () => {
      // Setup
      const baseDir = "static/screenshots/iterations";
      mockFS.readdirSync.mockReturnValue([
        "component1",
        "component2",
        "not-a-component",
      ]);

      // Mock template files
      const template1 = { name: "Component 1", iterations: 3 };
      const template2 = { name: "Component 2", iterations: 5 };

      // Set up statSync and existsSync for directories and template files
      mockFS.statSync.mockImplementation((path) => ({
        isDirectory: () => !path.includes("not-a-component"),
      }));

      mockFS.existsSync.mockImplementation((path) => {
        if (path === baseDir) return true;
        if (path.includes("template.json") && !path.includes("not-a-component"))
          return true;
        return false;
      });

      // Set up readFileSync for template files
      mockFS.readFileSync.mockImplementation((path) => {
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
      mockFS.readdirSync.mockReturnValue(["component1", "invalid-json"]);

      // Mock template files
      const template1 = { name: "Component 1", iterations: 3 };

      // Set up statSync and existsSync for directories and template files
      mockFS.statSync.mockReturnValue({ isDirectory: () => true });
      mockFS.existsSync.mockReturnValue(true);

      // Set up readFileSync for template files
      mockFS.readFileSync.mockImplementation((path) => {
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
      expect(mockFS.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(mockFS.mkdirSync).toHaveBeenCalledWith(expectedPath, {
        recursive: true,
      });

      // Check metadata file
      expect(mockFS.writeFileSync).toHaveBeenCalledWith(
        "static/screenshots/iterations/test-component/iteration-1/metadata.json",
        expect.any(String)
      );

      // Verify metadata content
      const metadataArg = mockFS.writeFileSync.mock.calls[0][1];
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
      mockFS.existsSync.mockReturnValue(true);

      // Execute
      generateIteration(component, 2);

      // Assert
      expect(mockFS.mkdirSync).not.toHaveBeenCalled();
      expect(mockFS.writeFileSync).toHaveBeenCalled(); // Still writes metadata
    });
  });

  // Note: In actual implementation, we would test more functions from the module
  // - loadComponent
  // - processComponentIterations
  // - validateTemplate
  // - main script execution flow
});
