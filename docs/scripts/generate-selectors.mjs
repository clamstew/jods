#!/usr/bin/env node
/**
 * TestID-Driven Screenshot Selector Generator
 *
 * This script crawls the site and discovers elements with data-testid attributes,
 * then generates a configuration file for screenshot tests.
 */

import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, "./screenshot-selectors.generated.mjs");

// Base URL of the site to crawl
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

/**
 * Main function to discover and generate selectors
 */
async function generateScreenshotSelectors() {
  console.log(`🔍 Discovering testIDs on ${BASE_URL}${PATH_PREFIX}`);

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 2000 },
  });
  const page = await context.newPage();

  // Go to the site
  await page.goto(`${BASE_URL}${PATH_PREFIX}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  console.log(`📄 Page loaded, discovering testIDs...`);

  // Find all elements with jods-prefixed data-testid
  const elements = await page.$$('[data-testid^="jods-"]');
  console.log(`Found ${elements.length} elements with jods-prefixed testIDs`);

  // Get detailed info about each element
  const elementDetails = await Promise.all(
    elements.map(async (element) => {
      const testId = await element.getAttribute("data-testid");
      const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
      const rect = await element.boundingBox();
      const textContent = await element.evaluate((el) => el.textContent.trim());
      const classList = await element.evaluate((el) =>
        Array.from(el.classList)
      );
      const hasChildren = await element.evaluate(
        (el) => el.children.length > 0
      );
      const isInteractive = await element.evaluate((el) => {
        return (
          el.tagName === "BUTTON" ||
          el.tagName === "A" ||
          el.onclick !== null ||
          el.getAttribute("role") === "button" ||
          el.classList.contains("clickable") ||
          getComputedStyle(el).cursor === "pointer"
        );
      });

      return {
        testId,
        tagName,
        rect,
        textContent,
        classList,
        hasChildren,
        isInteractive,
      };
    })
  );

  console.log(`📊 Analyzed ${elementDetails.length} elements`);

  // Group elements by section
  const elementsBySection = {};

  for (const element of elementDetails) {
    const parts = element.testId.split("-");
    // Skip the "jods" prefix
    const sectionName = parts[1] || "unknown";

    if (!elementsBySection[sectionName]) {
      elementsBySection[sectionName] = [];
    }

    elementsBySection[sectionName].push(element);
  }

  console.log(`📋 Found ${Object.keys(elementsBySection).length} sections`);

  // Generate component configurations
  const components = [];

  // Process each section
  for (const [sectionName, sectionElements] of Object.entries(
    elementsBySection
  )) {
    // Find the main section container
    const sectionContainer = sectionElements.find(
      (el) =>
        el.testId === `jods-${sectionName}-section` ||
        el.testId.endsWith("-section")
    );

    if (sectionContainer) {
      console.log(`Processing section: ${sectionName}`);

      // Create the section component
      const sectionComponent = createComponent(
        sectionContainer,
        `${sectionName}-section`,
        true
      );

      components.push(sectionComponent);

      // Find interactive elements in this section that might be tabs/buttons
      const interactiveElements = sectionElements.filter(
        (el) =>
          el.isInteractive &&
          el.testId !== sectionContainer.testId &&
          (el.testId.includes("-tab-") || el.tagName === "button")
      );

      // Process tabs if we found any
      if (interactiveElements.length > 0) {
        console.log(
          `Found ${interactiveElements.length} interactive elements in ${sectionName} section`
        );

        for (const interactive of interactiveElements) {
          // Extract the tab name from the testId (e.g., "react" from "jods-framework-tab-react")
          const tabMatch = interactive.testId.match(/tab-([a-z0-9-]+)$/);
          if (tabMatch) {
            const tabName = tabMatch[1];
            console.log(`Creating component for ${sectionName}-${tabName} tab`);

            // Create a tab component
            const tabComponent = createComponent(
              interactive,
              `${sectionName}-tab-${tabName}`,
              false,
              {
                clickSelector: `[data-testid="${interactive.testId}"]`,
                clickWaitTime: 1500,
                verifyTabSelected: true,
                verifyTabName:
                  tabName.charAt(0).toUpperCase() + tabName.slice(1), // Capitalize
                retryTabSelection: 2,
              }
            );

            // For tab components, use the section as the main container
            tabComponent.selector = `[data-testid="${sectionContainer.testId}"]`;

            components.push(tabComponent);
          }
        }
      }
    }
  }

  // Generate the output file
  const code = generateCode(components);
  fs.writeFileSync(outputFile, code);

  console.log(
    `✅ Generated selector config with ${components.length} components`
  );
  console.log(`💾 Saved to: ${outputFile}`);

  await browser.close();
  return components;
}

/**
 * Create a component configuration object
 */
function createComponent(element, name, isSection, additionalProps = {}) {
  // Calculate padding based on element size and type
  const padding = isSection ? 50 : 20;

  // Calculate min height based on element size
  const minHeight = element.rect ? Math.max(element.rect.height, 500) : 500;

  // Basic component config
  const component = {
    page: "/",
    name,
    selector: `[data-testid="${element.testId}"]`,
    fallbackStrategy: isSection ? "keyword-context" : undefined,
    keywords: extractKeywords(element.textContent),
    padding,
    minHeight,
    testId: element.testId,
    alternativeSelectors: [
      `[data-testid="${element.testId}"]`,
      isSection
        ? `section:has(h2:has-text("${getHeadingText(element.textContent)}"))`
        : null,
    ].filter(Boolean),
  };

  // Add additional properties
  return {
    ...component,
    ...additionalProps,
  };
}

/**
 * Extract important keywords from text content
 */
function extractKeywords(text) {
  if (!text) return [];

  // Split by common separators and get words
  const words = text
    .split(/[\n\r\t,.]/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3)
    .slice(0, 5); // Limit to 5 keywords

  return words;
}

/**
 * Extract potential heading text from content
 */
function getHeadingText(text) {
  if (!text) return "";

  // Try to find a heading-like phrase
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Return the first line that seems like a heading (shorter than 50 chars)
  for (const line of lines) {
    if (line.length < 50) {
      return line;
    }
  }

  // Fallback to first 30 chars
  return text.substring(0, 30).trim();
}

/**
 * Generate the code for the output file
 */
function generateCode(components) {
  const timestamp = new Date().toISOString();

  const template = `// Generated screenshot selectors based on data-testid attributes
// Generated on: ${timestamp}
// DO NOT EDIT THIS FILE DIRECTLY

// Export the components array
export const GENERATED_COMPONENTS = ${JSON.stringify(components, null, 2)};

// Helper function to merge with existing components
export function mergeWithExisting(existingComponents) {
  const existing = new Map(existingComponents.map(c => [c.name, c]));
  
  // Replace or add generated components
  for (const component of GENERATED_COMPONENTS) {
    existing.set(component.name, component);
  }
  
  return Array.from(existing.values());
}

// Default export for directly using these components
export default GENERATED_COMPONENTS;
`;

  return template;
}

// Run the generator if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateScreenshotSelectors().catch((error) => {
    console.error("Error generating selectors:", error);
    process.exit(1);
  });
}

export { generateScreenshotSelectors };
