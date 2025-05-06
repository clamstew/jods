import { test, expect, vi } from "vitest";

// Import the module under test
import {
  COMPONENTS,
  findRemixSection,
  getComponentsForPage,
  getComponentByName,
  getAllComponentNames,
} from "../screenshot-selectors.mjs";

// Mock Playwright page object
const createMockPage = () => {
  return {
    $: vi.fn(),
    evaluateHandle: vi.fn(),
  };
};

test("COMPONENTS should be an array with component definitions", () => {
  expect(Array.isArray(COMPONENTS)).toBe(true);
  expect(COMPONENTS.length).toBeGreaterThan(0);

  // Check structure of the first component
  const firstComponent = COMPONENTS[0];
  expect(firstComponent).toHaveProperty("name");
  expect(firstComponent).toHaveProperty("page");
  expect(firstComponent).toHaveProperty("selector");
});

test("All components should have required properties", () => {
  for (const component of COMPONENTS) {
    expect(component).toHaveProperty("name");
    expect(component).toHaveProperty("page");
    expect(component).toHaveProperty("selector");

    // Name should follow the pattern
    expect(component.name).toMatch(/^\d{2}-[a-z-]+$/);

    // Page should be a string starting with '/'
    expect(component.page).toMatch(/^\//);
  }
});

test("getComponentsForPage should filter components by page", () => {
  const homepageComponents = getComponentsForPage("/");
  expect(Array.isArray(homepageComponents)).toBe(true);
  expect(homepageComponents.length).toBeGreaterThan(0);

  // All returned components should have page === '/'
  expect(homepageComponents.every((component) => component.page === "/")).toBe(
    true
  );

  // Test with a non-existent page
  const nonExistentPageComponents = getComponentsForPage("/non-existent");
  expect(Array.isArray(nonExistentPageComponents)).toBe(true);
  expect(nonExistentPageComponents.length).toBe(0);
});

test("getComponentByName should return the correct component", () => {
  // Check first component by name
  const firstComponent = COMPONENTS[0];
  const retrievedComponent = getComponentByName(firstComponent.name);
  expect(retrievedComponent).toEqual(firstComponent);

  // Test with a non-existent component name
  const nonExistentComponent = getComponentByName("non-existent-component");
  expect(nonExistentComponent).toBeUndefined();
});

test("getAllComponentNames should return all component names", () => {
  const allNames = getAllComponentNames();
  expect(Array.isArray(allNames)).toBe(true);
  expect(allNames.length).toBe(COMPONENTS.length);

  // Each name should be a string
  expect(allNames.every((name) => typeof name === "string")).toBe(true);

  // Test with a subset of components
  const subset = COMPONENTS.slice(0, 2);
  const subsetNames = getAllComponentNames(subset);
  expect(subsetNames.length).toBe(2);
  expect(subsetNames[0]).toBe(subset[0].name);
  expect(subsetNames[1]).toBe(subset[1].name);
});

test("findRemixSection should handle various scenarios", async () => {
  // Test case 1: Direct ID match
  const page1 = createMockPage();
  page1.$.mockResolvedValueOnce({
    /* element handle */
  });

  const result1 = await findRemixSection(page1);
  expect(page1.$).toHaveBeenCalledWith("section#remix-integration");
  expect(result1).toBeDefined();

  // Test case 2: Heading text match when ID fails
  const page2 = createMockPage();
  page2.$.mockResolvedValueOnce(null); // ID selector fails
  page2.$.mockResolvedValueOnce({
    // Heading selector succeeds
    evaluateHandle: vi.fn().mockResolvedValue("section-element"),
  });

  const result2 = await findRemixSection(page2);
  expect(page2.$).toHaveBeenCalledWith("section#remix-integration");
  expect(page2.$).toHaveBeenCalledWith(
    'h2:has-text("Remix Integration"), h3:has-text("Remix Integration")'
  );
  expect(result2).toBe("section-element");

  // Test case 3: All lookups fail
  const page3 = createMockPage();
  page3.$.mockResolvedValue(null); // All selectors fail
  page3.evaluateHandle.mockRejectedValue(new Error("Not found"));

  const result3 = await findRemixSection(page3);
  expect(result3).toBeNull();
});

test("Component structure should follow all guidelines", () => {
  // Verify all framework section components have the right properties
  const frameworkComponents = COMPONENTS.filter((c) =>
    c.name.includes("framework-section")
  );

  expect(frameworkComponents.length).toBeGreaterThan(0);

  for (const component of frameworkComponents) {
    // Framework components should have specific properties
    expect(component).toHaveProperty("sectionIndex");
    expect(component).toHaveProperty("waitForSelector");
    expect(component).toHaveProperty("padding");

    // Framework sections should have proper fallback strategy
    expect(component.fallbackStrategy).toBe("keyword-context");
  }

  // Verify remix section has proper properties
  const remixSection = getComponentByName("05-remix-section");
  expect(remixSection).toBeDefined();
  expect(remixSection.keywords).toContain("Remix");
  expect(remixSection.keywords).toContain("Integration");

  // Verify compare section
  const compareSection = getComponentByName("06-compare-section");
  expect(compareSection).toBeDefined();
  expect(compareSection.waitForSelector).toContain("Compare");
});
