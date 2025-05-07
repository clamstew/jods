import { test, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@playwright/test", () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          on: vi.fn(),
          goto: vi.fn().mockResolvedValue(),
          waitForTimeout: vi.fn().mockResolvedValue(),
          waitForSelector: vi.fn().mockResolvedValue(),
          evaluate: vi.fn().mockResolvedValue(),
          screenshot: vi.fn().mockResolvedValue(),
          $: vi.fn().mockImplementation((sel) => {
            return sel === ".success-selector"
              ? { isVisible: () => true }
              : null;
          }),
          $$: vi
            .fn()
            .mockResolvedValue([
              { boundingBox: () => ({ x: 0, y: 0, width: 100, height: 100 }) },
            ]),
        }),
      }),
      close: vi.fn().mockResolvedValue(),
    }),
  },
}));

vi.mock("path", () => ({
  join: (...args) => args.join("/"),
}));

// Mock selector modules
vi.mock("../screenshot-selectors.mjs", () => ({
  COMPONENTS: [
    { name: "test-component", page: "/", selector: ".test-selector" },
    { name: "section-component", page: "/", selector: ".section-selector" },
  ],
  findRemixSection: vi.fn().mockResolvedValue({ isVisible: () => true }),
  getComponentByName: vi.fn((name, components) =>
    components.find((c) => c.name === name)
  ),
  getAllComponentNames: vi.fn((components) => components.map((c) => c.name)),
}));

// Mock utils
vi.mock("../screenshot-utils.mjs", () => ({
  setupEnvironment: vi.fn().mockReturnValue({
    directories: {
      unified: "test-output-dir",
    },
    BASE_URL: "http://localhost:3000",
    PATH_PREFIX: "",
    THEMES: ["light", "dark"],
    getTimestamp: vi.fn().mockReturnValue("20230101-123456"),
    DEBUG: false,
  }),
  setupLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  }),
  setupRetry: vi.fn().mockImplementation(() => async (fn) => await fn()),
}));

// Mock capture manager
vi.mock("../screenshot-capture.mjs", () => ({
  captureManager: {
    captureFrameworkTabs: vi.fn().mockResolvedValue(true),
    captureSpecificElement: vi.fn().mockResolvedValue(true),
    findElementForComponent: vi
      .fn()
      .mockResolvedValue({ isVisible: () => true }),
    captureComponentHtml: vi.fn().mockResolvedValue(),
    setTheme: vi.fn().mockResolvedValue(),
  },
}));

// Import the module under test
let screenshotUnified;

test("should import module correctly", async () => {
  screenshotUnified = await import("../screenshot-unified.mjs");
  expect(screenshotUnified).toBeDefined();
  expect(typeof screenshotUnified.takeUnifiedScreenshots).toBe("function");
});

// Test parseCliArgs function by using a private implementation since it's not exported
function parseCliArgs(args) {
  const processedArgs = ["node", "script.mjs", ...args];

  // Save original argv
  const originalArgv = process.argv;

  // Replace with our test args
  process.argv = processedArgs;

  try {
    return {
      saveBaseline: args.includes("--baseline"),
      useGeneratedSelectors: args.includes("--use-generated-selectors"),
      mergeSelectors: args.includes("--merge-selectors"),
      mode:
        args.find((arg) => arg.startsWith("--mode="))?.split("=")[1] || "all",
      specificComponents: args.find((arg) => arg.startsWith("--components="))
        ? args
            .find((arg) => arg.startsWith("--components="))
            .split("=")[1]
            .split(",")
        : [],
      baseUrl: process.env.BASE_URL || "http://localhost:3000",
    };
  } finally {
    // Restore original argv
    process.argv = originalArgv;
  }
}

test("parseCliArgs should parse command line arguments correctly", () => {
  const args = [
    "--baseline",
    "--mode=components",
    "--components=header,footer",
  ];
  const result = parseCliArgs(args);

  expect(result.saveBaseline).toBe(true);
  expect(result.mode).toBe("components");
  expect(result.specificComponents).toEqual(["header", "footer"]);
  expect(result.useGeneratedSelectors).toBe(false);
});

test("parseCliArgs should handle missing arguments with defaults", () => {
  const args = [];
  const result = parseCliArgs(args);

  expect(result.saveBaseline).toBe(false);
  expect(result.mode).toBe("all");
  expect(result.specificComponents).toEqual([]);
});

// Helper function to test component selection - recreating the same logic from screenshot-unified.mjs
function selectComponents(components, mode, specificComponents = []) {
  let componentsToCapture = [];

  if (specificComponents && specificComponents.length > 0) {
    // Specific named components take priority
    componentsToCapture = components.filter((component) =>
      specificComponents.includes(component.name)
    );
  } else if (mode === "all" || mode === "components") {
    // Capture all components
    componentsToCapture = components;
  } else if (mode === "sections") {
    // Sections mode - filter only homepage sections
    componentsToCapture = components.filter(
      (component) =>
        component.page === "/" &&
        !component.name.includes("framework-") &&
        component.name !== "footer-section"
    );
  } else {
    // Try to interpret mode as a specific component name
    const component = components.find((c) => c.name === mode);
    if (component) {
      componentsToCapture = [component];
    }
  }

  return componentsToCapture;
}

test("selectComponents should select all components in all mode", () => {
  const components = [
    { name: "comp1", page: "/" },
    { name: "comp2", page: "/docs" },
  ];

  const result = selectComponents(components, "all");
  expect(result).toEqual(components);
});

test("selectComponents should select specific components when provided", () => {
  const components = [
    { name: "comp1", page: "/" },
    { name: "comp2", page: "/docs" },
    { name: "comp3", page: "/" },
  ];

  const result = selectComponents(components, "all", ["comp1", "comp3"]);
  expect(result).toHaveLength(2);
  expect(result[0].name).toBe("comp1");
  expect(result[1].name).toBe("comp3");
});

test("selectComponents should select homepage sections in sections mode", () => {
  const components = [
    { name: "hero-section", page: "/" },
    { name: "framework-section", page: "/" },
    { name: "footer-section", page: "/" },
    { name: "other-section", page: "/" },
    { name: "docs-section", page: "/docs" },
  ];

  const result = selectComponents(components, "sections");
  expect(result).toHaveLength(2);
  expect(result[0].name).toBe("hero-section");
  expect(result[1].name).toBe("other-section");
});

// Helper function to test grouping components by page
function groupComponentsByPage(components) {
  const componentsByPage = {};
  for (const component of components) {
    if (!componentsByPage[component.page]) {
      componentsByPage[component.page] = [];
    }
    componentsByPage[component.page].push(component);
  }
  return componentsByPage;
}

test("groupComponentsByPage should group components correctly", () => {
  const components = [
    { name: "comp1", page: "/" },
    { name: "comp2", page: "/docs" },
    { name: "comp3", page: "/" },
    { name: "comp4", page: "/docs" },
    { name: "comp5", page: "/api" },
  ];

  const result = groupComponentsByPage(components);

  expect(Object.keys(result)).toHaveLength(3);
  expect(result["/"]).toHaveLength(2);
  expect(result["/docs"]).toHaveLength(2);
  expect(result["/api"]).toHaveLength(1);
});

// Integration test for takeUnifiedScreenshots - this will be limited since we're mocking most dependencies
test("takeUnifiedScreenshots should execute without errors", async () => {
  // First ensure the module is imported
  if (!screenshotUnified) {
    screenshotUnified = await import("../screenshot-unified.mjs");
  }

  // Execute with minimal parameters
  const result = await screenshotUnified.takeUnifiedScreenshots(
    "all",
    "20230101-123456",
    false
  );

  // Since most functionality is mocked, we're primarily testing that the function completes without throwing
  expect(result).toBe("20230101-123456");
});
