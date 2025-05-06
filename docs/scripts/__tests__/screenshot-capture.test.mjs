import { test, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  copyFileSync: vi.fn(),
}));

vi.mock("path", () => ({
  join: (...args) => args.join("/"),
  dirname: vi.fn().mockReturnValue("/mocked/path"),
}));

vi.mock("url", () => ({
  fileURLToPath: vi.fn().mockReturnValue("/mocked/file/url"),
}));

// Import after mocking
import fs from "fs";
import { captureManager } from "../screenshot-capture.mjs";

// Helper to create a mock Playwright page
function createMockPage() {
  return {
    // Basic page functions
    waitForTimeout: vi.fn().mockResolvedValue(),
    waitForSelector: vi.fn().mockResolvedValue(),
    click: vi.fn().mockResolvedValue(),
    evaluate: vi.fn(),
    screenshot: vi.fn().mockResolvedValue(),
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 800 }),

    // Element selectors
    $: vi.fn(),
    $$: vi.fn(),
  };
}

// Helper to create a mock element handle
function createMockElement(config = {}) {
  return {
    boundingBox: vi.fn().mockResolvedValue({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      ...config.boundingBox,
    }),
    scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(),
    isVisible: vi.fn().mockResolvedValue(config.isVisible !== false),
    getAttribute: vi.fn().mockImplementation((attr) => {
      return config.attributes?.[attr] || null;
    }),
    evaluate: vi.fn().mockImplementation((fn) => {
      if (config.evaluateImplementation) {
        return config.evaluateImplementation(fn);
      }
      return undefined;
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("setTheme should set the correct theme", async () => {
  const page = createMockPage();

  // First test: dark mode is already set
  page.evaluate.mockResolvedValueOnce("dark"); // Current theme check

  await captureManager.setTheme(page, "dark");

  // Should not try to toggle since already in dark mode
  expect(page.click).not.toHaveBeenCalled();

  // Second test: toggle to dark mode
  page.evaluate.mockResolvedValueOnce("light"); // Current theme check

  await captureManager.setTheme(page, "dark");

  // Should try to toggle theme
  expect(page.click).toHaveBeenCalled();

  // Third test: verify theme change
  page.evaluate
    .mockResolvedValueOnce("light") // Current theme check
    .mockResolvedValueOnce("light"); // Theme after toggle (didn't change)

  // Reset click mock
  page.click.mockReset();

  await captureManager.setTheme(page, "dark");

  // Should try to toggle theme
  expect(page.click).toHaveBeenCalled();
  // Should use evaluate for alternative approach when toggle fails
  expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), "dark");
});

test("findElementForComponent should find element with primary selector", async () => {
  const page = createMockPage();
  const mockElement = createMockElement();

  // Mock successful element find via primary selector
  page.$.mockResolvedValueOnce(mockElement);

  const component = {
    name: "test-component",
    selector: ".test-selector",
  };

  const result = await captureManager.findElementForComponent(page, component);

  expect(page.$).toHaveBeenCalledWith(".test-selector");
  expect(result).toBe(mockElement);
});

test("findElementForComponent should try alternative selectors when primary fails", async () => {
  const page = createMockPage();
  const mockElement = createMockElement();

  // Primary selector fails, first alternative succeeds
  page.$.mockResolvedValueOnce(null).mockResolvedValueOnce(mockElement);

  const component = {
    name: "test-component",
    selector: ".test-selector",
    alternativeSelectors: [".alt-selector-1", ".alt-selector-2"],
  };

  const result = await captureManager.findElementForComponent(page, component);

  expect(page.$).toHaveBeenCalledWith(".test-selector");
  expect(page.$).toHaveBeenCalledWith(".alt-selector-1");
  expect(result).toBe(mockElement);
});

test("findElementForComponent should try fallback strategies when all selectors fail", async () => {
  const page = createMockPage();
  const mockElement = createMockElement();

  // All selectors fail
  page.$.mockResolvedValue(null);

  // Fallback heading succeeds
  page.$.mockResolvedValueOnce(null).mockResolvedValueOnce(mockElement); // h1 selector succeeds

  const component = {
    name: "test-component",
    selector: ".test-selector",
    fallbackStrategy: "first-heading",
  };

  const result = await captureManager.findElementForComponent(page, component);

  expect(page.$).toHaveBeenCalledWith("h1");
  expect(result).toBe(mockElement);
});

test("findElementForComponent should handle section-index strategy", async () => {
  const page = createMockPage();
  const mockSection = createMockElement();

  // All selectors fail
  page.$.mockResolvedValue(null);

  // Mock sections
  page.$$.mockResolvedValueOnce([
    createMockElement(), // section 0
    mockSection, // section 1
    createMockElement(), // section 2
  ]);

  const component = {
    name: "test-component",
    selector: ".test-selector",
    fallbackStrategy: "section-index",
    sectionIndex: 1, // Select second section
  };

  const result = await captureManager.findElementForComponent(page, component);

  expect(page.$$).toHaveBeenCalledWith("section");
  expect(result).toBe(mockSection);
});

test("findElementForComponent should handle keyword-context strategy", async () => {
  const page = createMockPage();

  // All selectors fail
  page.$.mockResolvedValue(null);

  // Mock keyword-context strategy
  page.evaluateHandle = vi.fn().mockResolvedValue("keyword-element");

  const component = {
    name: "test-component",
    selector: ".test-selector",
    fallbackStrategy: "keyword-context",
    keywords: ["feature", "highlight"],
  };

  const result = await captureManager.findElementForComponent(page, component);

  expect(page.evaluateHandle).toHaveBeenCalled();
  expect(result).toBe("keyword-element");
});

test("manageAnimations should add/remove styles to control animations", async () => {
  const page = createMockPage();

  // Test pausing animations
  await captureManager.manageAnimations(page, "pause", {
    pauseAnimations: true,
  });

  expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), true);
  expect(page.waitForTimeout).toHaveBeenCalledWith(200);

  // Test resuming animations
  await captureManager.manageAnimations(page, "resume", {
    pauseAnimations: true,
  });

  expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), false);
  expect(page.waitForTimeout).toHaveBeenCalledWith(200);

  // Test with pauseAnimations: false
  vi.clearAllMocks();
  await captureManager.manageAnimations(page, "pause", {
    pauseAnimations: false,
  });

  // Should not call evaluate when pauseAnimations is false
  expect(page.evaluate).not.toHaveBeenCalled();
});

test("captureComponentHtml should save HTML debug information", async () => {
  const page = createMockPage();
  const elementHandle = createMockElement();

  // Mock evaluate to return HTML content
  page.evaluate.mockResolvedValueOnce({
    html: '<div class="test">Test content</div>',
    buttons: [{ text: "Test Button", html: "<button>Test Button</button>" }],
    headings: [{ level: "H2", text: "Test Heading" }],
  });

  const component = {
    name: "test-component",
  };

  await captureManager.captureComponentHtml(
    page,
    component,
    elementHandle,
    "light"
  );

  expect(fs.writeFileSync).toHaveBeenCalled();
  const writeCall = fs.writeFileSync.mock.calls[0];
  expect(writeCall[0]).toContain("test-component-light-debug.html");
  expect(writeCall[1]).toContain("Test content");
  expect(writeCall[1]).toContain("Test Button");
  expect(writeCall[1]).toContain("Test Heading");
});

test("highlightElementsForDiff should add highlight markers for diffing", async () => {
  const page = createMockPage();
  const selectors = [".diff-element-1", ".diff-element-2"];

  await captureManager.highlightElementsForDiff(page, selectors, "add");

  expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), {
    selectors,
    action: "add",
  });

  // Test removing highlights
  await captureManager.highlightElementsForDiff(page, selectors, "remove");

  expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), {
    selectors,
    action: "remove",
  });
});

test("captureSpecificElement should take a screenshot with appropriate dimensions", async () => {
  const page = createMockPage();
  const elementHandle = createMockElement({
    boundingBox: { x: 50, y: 100, width: 500, height: 300 },
  });

  // Mock header height
  page.evaluate.mockResolvedValueOnce(60); // Header height

  const component = {
    name: "test-component",
    padding: 20,
  };

  await captureManager.captureSpecificElement(
    page,
    elementHandle,
    component,
    "light",
    "20230101-123456",
    false,
    "/output/dir"
  );

  // Check scrolling and timing
  expect(elementHandle.scrollIntoViewIfNeeded).toHaveBeenCalled();
  expect(page.waitForTimeout).toHaveBeenCalled();

  // Check screenshot call
  expect(page.screenshot).toHaveBeenCalledWith({
    path: "/output/dir/test-component-light-20230101-123456.png",
    clip: expect.objectContaining({
      x: 30, // 50 - 20 padding
      y: 20, // 100 - (20 padding + 60 header height)
      width: 540, // 500 + 2*20 padding
      height: 380, // 300 + (20 padding + 60 header height) + 20 padding
    }),
  });
});

test("captureSpecificElement should handle component with excludeElements", async () => {
  const page = createMockPage();
  const elementHandle = createMockElement({
    boundingBox: { x: 50, y: 100, width: 500, height: 400 },
  });

  // Mock header height
  page.evaluate.mockResolvedValueOnce(60); // Header height

  // Mock excluded elements
  const topExclude = createMockElement({
    boundingBox: { x: 50, y: 110, width: 500, height: 50 },
    isVisible: true,
  });

  const bottomExclude = createMockElement({
    boundingBox: { x: 50, y: 400, width: 500, height: 50 },
    isVisible: true,
  });

  page.$$.mockImplementation((selector) => {
    if (selector === ".top-exclude") return [topExclude];
    if (selector === ".bottom-exclude") return [bottomExclude];
    return [];
  });

  const component = {
    name: "test-component",
    padding: 20,
    excludeElements: [".top-exclude", ".bottom-exclude"],
  };

  await captureManager.captureSpecificElement(
    page,
    elementHandle,
    component,
    "light",
    "20230101-123456",
    false,
    "/output/dir"
  );

  // Should have adjusted clip to exclude the excluded elements
  const screenshotCall = page.screenshot.mock.calls[0][0];

  // The clip should start after the top excluded element
  expect(screenshotCall.clip.y).toBeGreaterThan(160); // 100 + 50 + 10

  // The clip height should be reduced to exclude the bottom element
  expect(screenshotCall.clip.y + screenshotCall.clip.height).toBeLessThan(400); // Bottom element starts at 400
});

test("captureSpecificElement should handle case where clip dimensions exceed viewport", async () => {
  const page = createMockPage();
  const elementHandle = createMockElement({
    boundingBox: { x: 50, y: 100, width: 500, height: 2000 }, // Very tall element
  });

  // Mock header height
  page.evaluate.mockResolvedValueOnce(60); // Header height

  // Viewport size is 1280x800
  page.viewportSize.mockReturnValue({ width: 1280, height: 800 });

  const component = {
    name: "test-component",
    padding: 20,
  };

  await captureManager.captureSpecificElement(
    page,
    elementHandle,
    component,
    "light",
    "20230101-123456",
    false,
    "/output/dir"
  );

  // Check that clip height was adjusted to fit viewport
  const screenshotCall = page.screenshot.mock.calls[0][0];
  expect(screenshotCall.clip.height).toBeLessThanOrEqual(790); // 800 - 10
});

test("captureSpecificElement should handle beforeScreenshot hook", async () => {
  const page = createMockPage();
  const elementHandle = createMockElement();
  const newElementHandle = createMockElement({
    boundingBox: { x: 60, y: 120, width: 600, height: 400 }, // Different dimensions
  });

  // Mock header height
  page.evaluate.mockResolvedValueOnce(60); // Header height

  // For re-selecting element after hook
  page.$.mockResolvedValueOnce(newElementHandle);

  const beforeScreenshotMock = vi.fn().mockResolvedValue();

  const component = {
    name: "test-component",
    selector: ".test-selector",
    padding: 20,
    beforeScreenshot: beforeScreenshotMock,
  };

  await captureManager.captureSpecificElement(
    page,
    elementHandle,
    component,
    "light",
    "20230101-123456",
    false,
    "/output/dir"
  );

  // Should have called the beforeScreenshot hook
  expect(beforeScreenshotMock).toHaveBeenCalledWith(
    page,
    elementHandle,
    "light"
  );

  // Should have re-selected the element after hook
  expect(page.$).toHaveBeenCalledWith(".test-selector");

  // Should use updated element bounds for screenshot
  const screenshotCall = page.screenshot.mock.calls[0][0];
  expect(screenshotCall.clip.x).toBe(40); // 60 - 20 padding
  expect(screenshotCall.clip.y).toBe(40); // 120 - (20 padding + 60 header)
});
