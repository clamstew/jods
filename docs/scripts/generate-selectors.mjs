import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const selectorsPath = path.join(__dirname, "../static/selectors");
const selectorsFile = path.join(selectorsPath, "homepage-selectors.json");

// Create selectors directory if it doesn't exist
if (!fs.existsSync(selectorsPath)) {
  fs.mkdirSync(selectorsPath, { recursive: true });
}

// Base URL of the site
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

// Section definitions with text-based locators (same as in homepage-sections.mjs)
const HOMEPAGE_SECTIONS = [
  {
    name: "hero",
    locator: {
      strategy: "text",
      value: "Zero dependency JSON store",
      contextSelector: 'section, div.hero, [class*="hero"]',
      fallback: "h1",
    },
    testId: "jods-hero-section",
    padding: 40,
  },
  {
    name: "features",
    locator: {
      strategy: "heading",
      value: "Features",
      contextSelector: 'section, div.features, [class*="features"]',
    },
    testId: "jods-features-section",
    padding: 40,
  },
  {
    name: "try-jods-live",
    locator: {
      strategy: "heading",
      value: "Try jods live",
      contextSelector: "section, div.container",
    },
    testId: "jods-try-live-section",
    padding: 40,
  },
  {
    name: "framework-integration",
    locator: {
      strategy: "heading",
      value: "Framework Integration",
      contextSelector: "section, div.container",
    },
    testId: "jods-framework-section",
    padding: 40,
  },
  {
    name: "compare",
    locator: {
      strategy: "heading",
      value: "Compare",
      contextSelector: "section, div.container",
    },
    testId: "jods-compare-section",
    padding: 40,
  },
  {
    name: "remix-integration",
    locator: {
      strategy: "text",
      value: "Remix Integration",
      contextSelector: "div.container, section",
    },
    testId: "jods-remix-section",
    padding: 40,
  },
  {
    name: "footer",
    locator: {
      strategy: "element",
      value: "footer",
    },
    testId: "jods-footer",
    padding: 20,
  },
];

async function findSelectors() {
  console.log(`Finding selectors from ${BASE_URL}${PATH_PREFIX}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Navigate to homepage
  await page.goto(`${BASE_URL}${PATH_PREFIX}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000); // Give extra time for animations to complete

  // Find and store selectors for each section
  const selectors = {};

  for (const section of HOMEPAGE_SECTIONS) {
    console.log(`Finding selector for ${section.name} section...`);

    try {
      // First add data-testid to help with finding elements
      await page.evaluate((sectionData) => {
        let element = null;
        const { strategy, value, contextSelector, fallback } =
          sectionData.locator;

        if (strategy === "text") {
          if (contextSelector) {
            const containers = Array.from(
              document.querySelectorAll(contextSelector)
            );
            element = containers.find((el) => el.textContent.includes(value));
          } else {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_ELEMENT,
              {
                acceptNode: (node) =>
                  node.textContent.includes(value)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP,
              }
            );
            element = walker.nextNode();
          }
        } else if (strategy === "heading") {
          const headings = Array.from(
            document.querySelectorAll("h1, h2, h3, h4, h5, h6")
          );
          const heading = headings.find((h) => h.textContent.trim() === value);

          if (heading && contextSelector) {
            let current = heading.parentElement;
            while (current && current !== document.body) {
              if (current.matches(contextSelector)) {
                element = current;
                break;
              }
              current = current.parentElement;
            }
          } else if (heading) {
            element = heading.parentElement;
          }
        } else if (strategy === "element") {
          element = document.querySelector(value);
        }

        if (element) {
          element.setAttribute("data-testid", sectionData.testId);
          return true;
        } else if (fallback) {
          const fallbackEl = document.querySelector(fallback);
          if (fallbackEl) {
            fallbackEl.setAttribute("data-testid", sectionData.testId);
            return true;
          }
        }

        return false;
      }, section);

      // Now try to get a unique CSS selector for each element with data-testid
      const selector = await page.evaluate((testId) => {
        const element = document.querySelector(`[data-testid="${testId}"]`);
        if (!element) return null;

        // Function to generate a unique CSS selector
        function getUniqueSelector(el) {
          // If element has an ID, use it
          if (el.id) return `#${el.id}`;

          // If element has a class, try using the first few classes
          if (el.classList.length) {
            const classSelector = Array.from(el.classList)
              .slice(0, 2)
              .map((c) => `.${c}`)
              .join("");

            // Check if this selector uniquely identifies the element
            if (document.querySelectorAll(classSelector).length === 1) {
              return classSelector;
            }
          }

          // Try to use tag + class(es)
          if (el.classList.length) {
            const tagClassSelector = `${el.tagName.toLowerCase()}${Array.from(
              el.classList
            )
              .slice(0, 2)
              .map((c) => `.${c}`)
              .join("")}`;

            if (document.querySelectorAll(tagClassSelector).length === 1) {
              return tagClassSelector;
            }
          }

          // Try using nth-child with parent
          const parent = el.parentElement;
          if (parent) {
            const index = Array.from(parent.children).indexOf(el);
            const parentSelector = getUniqueSelector(parent);
            return `${parentSelector} > ${el.tagName.toLowerCase()}:nth-child(${
              index + 1
            })`;
          }

          // Fallback to tag name + attributes if any distinctive ones exist
          const attributeSelector = el.tagName.toLowerCase();
          return attributeSelector;
        }

        const cssSelector = getUniqueSelector(element);

        // Make sure the selector actually works and is unique
        if (
          cssSelector &&
          document.querySelectorAll(cssSelector).length === 1
        ) {
          return cssSelector;
        }

        // If we couldn't generate a useful selector, return data-testid as fallback
        return `[data-testid="${testId}"]`;
      }, section.testId);

      console.log(
        `  Found selector for ${section.name}: ${selector || "Not found"}`
      );

      // Store the selector with metadata
      if (selector) {
        selectors[section.name] = {
          selector: selector,
          testId: section.testId,
          padding: section.padding,
          originalLocator: section.locator,
        };
      }
    } catch (error) {
      console.error(`  Error finding selector for ${section.name}:`, error);
    }
  }

  await browser.close();

  return selectors;
}

async function saveSelectors() {
  try {
    const selectors = await findSelectors();

    // Save to JSON file
    if (Object.keys(selectors).length > 0) {
      fs.writeFileSync(
        selectorsFile,
        JSON.stringify(selectors, null, 2),
        "utf8"
      );
      console.log(`Selectors saved to ${selectorsFile}`);
      return selectors;
    } else {
      console.error("No selectors found to save");
    }
  } catch (error) {
    console.error("Error saving selectors:", error);
  }
}

// Run the script
saveSelectors().catch((error) => {
  console.error("Script execution error:", error);
  process.exit(1);
});

export { saveSelectors, findSelectors };
