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
      strategy: "element",
      value: "div.hero-container, .hero, [class*='hero_']",
      fallback: "h1",
    },
    testId: "jods-hero-section",
    padding: 40,
  },
  {
    name: "features",
    locator: {
      strategy: "element",
      value: "section#features, .featuresContainer_bzYo, [class*='features']",
      contextSelector: null,
    },
    testId: "jods-features-section",
    padding: 40,
  },
  {
    name: "try-jods-live",
    locator: {
      strategy: "text",
      value: "Try jods live",
      contextSelector: "section, div.container, [class*='container_']",
      fallback: "section#try-jods-live",
    },
    testId: "jods-try-live-section",
    padding: 40,
  },
  {
    name: "framework-integration",
    locator: {
      strategy: "text",
      value: "Works with your favorite frameworks",
      contextSelector: "section, div.container, [class*='container_']",
      fallback: "section#framework-showcase",
    },
    testId: "jods-framework-section",
    padding: 40,
  },
  {
    name: "compare",
    locator: {
      strategy: "text",
      value: "How jods compares",
      contextSelector: "section, div.container, [class*='container_']",
      fallback: "section#compare",
    },
    testId: "jods-compare-section",
    padding: 40,
  },
  {
    name: "remix-integration",
    locator: {
      strategy: "heading",
      value: "Remix Integration",
      contextSelector: "section, div.container, [class*='container_']",
    },
    testId: "jods-remix-section",
    padding: 40,
  },
  {
    name: "footer",
    locator: {
      strategy: "element",
      value: "footer.footer, footer",
      contextSelector: null,
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

        // Function to find a full-width parent container
        function findFullWidthParent(el) {
          // Don't go beyond these container elements
          if (
            el.tagName === "BODY" ||
            el.tagName === "MAIN" ||
            el.tagName === "HTML"
          ) {
            return null;
          }

          // Check if this is a full-width container by comparing width
          const rect = el.getBoundingClientRect();
          const parentRect = el.parentElement?.getBoundingClientRect();
          const viewportWidth = window.innerWidth;

          // Consider an element "full width" if it's at least 90% of viewport width
          // or at least 95% of its parent's width (when parent is a significant portion of viewport)
          const isFullWidth =
            rect.width >= viewportWidth * 0.9 ||
            (parentRect &&
              parentRect.width >= viewportWidth * 0.6 &&
              rect.width >= parentRect.width * 0.95);

          // If this is a full-width container with semantic meaning, use it
          if (
            isFullWidth &&
            (el.tagName === "SECTION" ||
              el.tagName === "FOOTER" ||
              el.tagName === "HEADER" ||
              el.tagName === "ARTICLE" ||
              (el.tagName === "DIV" &&
                (el.classList.length > 0 ||
                  el.id ||
                  Array.from(el.children).some(
                    (c) =>
                      c.tagName === "H1" ||
                      c.tagName === "H2" ||
                      c.tagName === "H3"
                  ))))
          ) {
            return el;
          }

          // If we have a parent, check if it's a better candidate
          if (el.parentElement && el.parentElement !== document.body) {
            const parent = findFullWidthParent(el.parentElement);
            if (parent) return parent;
          }

          // If we didn't find a better container, but this is full width, use it anyway
          if (isFullWidth) {
            return el;
          }

          return el; // Fallback to the original element
        }

        // Try to find a better full-width container parent
        const containerElement = findFullWidthParent(element);
        const targetElement = containerElement || element;

        // Function to generate a unique CSS selector
        function getUniqueSelector(el) {
          // If element has an ID, use it
          if (el.id) return `#${el.id}`;

          // Check for container class patterns
          if (el.classList.length) {
            const containerClasses = Array.from(el.classList).filter(
              (c) =>
                c.toLowerCase().includes("container") ||
                c.toLowerCase().includes("section") ||
                c.toLowerCase().includes("hero") ||
                c.toLowerCase().includes("wrapper") ||
                c.toLowerCase().includes("block")
            );

            if (containerClasses.length) {
              const containerSelector = `${el.tagName.toLowerCase()}.${
                containerClasses[0]
              }`;
              if (document.querySelectorAll(containerSelector).length === 1) {
                return containerSelector;
              }
            }
          }

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

        const cssSelector = getUniqueSelector(targetElement);

        // Make sure the selector actually works and is unique
        if (
          cssSelector &&
          document.querySelectorAll(cssSelector).length === 1
        ) {
          // Store the inner HTML summary for debugging
          const elementSummary =
            targetElement.innerText.substring(0, 100) +
            (targetElement.innerText.length > 100 ? "..." : "");

          // Return selector and debug info
          return {
            selector: cssSelector,
            elementTagName: targetElement.tagName,
            elementWidth: targetElement.getBoundingClientRect().width,
            viewportWidth: window.innerWidth,
            isSameAsOriginal: targetElement === element,
            textSummary: elementSummary,
          };
        }

        // If we couldn't generate a useful selector, return data-testid as fallback
        return {
          selector: `[data-testid="${testId}"]`,
          elementTagName: element.tagName,
          elementWidth: element.getBoundingClientRect().width,
          viewportWidth: window.innerWidth,
          isSameAsOriginal: true,
          textSummary:
            element.innerText.substring(0, 100) +
            (element.innerText.length > 100 ? "..." : ""),
        };
      }, section.testId);

      // Display more info about what we found
      if (selector) {
        console.log(
          `  Found selector for ${section.name}: ${selector.selector}`
        );
        console.log(
          `    Element: ${selector.elementTagName}, Width: ${selector.elementWidth}px/${selector.viewportWidth}px`
        );
        console.log(`    Text: ${selector.textSummary}`);

        // Store the selector and its metadata
        selectors[section.name] = {
          selector: selector.selector,
          testId: section.testId,
          padding: section.padding,
          originalLocator: section.locator,
          debug: {
            elementTagName: selector.elementTagName,
            width: selector.elementWidth,
            isSameAsOriginal: selector.isSameAsOriginal,
            textSummary: selector.textSummary,
          },
        };
      } else {
        console.log(`  No selector found for ${section.name}`);
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

    // If Remix Integration section wasn't found, add it manually
    if (!selectors["remix-integration"]) {
      console.log(
        "Remix integration section not found, attempting to add it manually..."
      );

      // Launch a new browser and find it directly
      const browser = await chromium.launch();
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
      const page = await context.newPage();

      // Navigate to homepage
      await page.goto(`${BASE_URL}${PATH_PREFIX}/`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(1000);

      try {
        // Try to find by text content directly
        const remixElement = await page.evaluateHandle(() => {
          // Search for "Remix Integration" heading
          const headingWithText = Array.from(
            document.querySelectorAll("h1, h2, h3, h4, h5, h6")
          ).find((h) => h.textContent.trim() === "Remix Integration");

          if (headingWithText) {
            // Find containing section or container div
            let element = headingWithText;
            let parent = element.parentElement;

            // Look up the DOM tree for a section or substantial container
            while (parent && parent !== document.body) {
              if (
                parent.tagName === "SECTION" ||
                (parent.tagName === "DIV" &&
                  (parent.classList.length > 0 ||
                    parent.id ||
                    parent.getAttribute("data-testid") ||
                    parent.style.display === "block"))
              ) {
                // Check if this is a substantial container
                const rect = parent.getBoundingClientRect();
                if (
                  rect.width > window.innerWidth * 0.75 &&
                  rect.height > 100
                ) {
                  element = parent;
                  break;
                }
              }
              parent = parent.parentElement;
            }

            // Add testId to make it easier to find
            element.setAttribute("data-testid", "jods-remix-section");

            // Get textContent for verification
            const textContent =
              element.textContent.substring(0, 100) +
              (element.textContent.length > 100 ? "..." : "");

            // Return selector info
            const id = element.id ? `#${element.id}` : null;

            // If element has classes, create a class selector
            let classSelector = null;
            if (element.classList.length > 0) {
              classSelector =
                element.tagName.toLowerCase() +
                "." +
                Array.from(element.classList)[0];
            }

            // Create a data-testid selector as fallback
            const testIdSelector = '[data-testid="jods-remix-section"]';

            return {
              selector: id || classSelector || testIdSelector,
              elementTagName: element.tagName,
              width: element.getBoundingClientRect().width,
              text: textContent,
            };
          }

          // If not found by heading, try searching for text
          const elementsWithRemixText = Array.from(
            document.querySelectorAll("*")
          ).filter(
            (el) =>
              el.textContent.includes("Remix Integration") &&
              !["SCRIPT", "STYLE", "META", "LINK"].includes(el.tagName)
          );

          // Skip heading elements, get first substantial element
          const elementWithText =
            elementsWithRemixText.find(
              (el) => !["H1", "H2", "H3", "H4", "H5", "H6"].includes(el.tagName)
            ) || elementsWithRemixText[0];

          if (elementWithText) {
            elementWithText.setAttribute("data-testid", "jods-remix-section");
            const textContent =
              elementWithText.textContent.substring(0, 100) +
              (elementWithText.textContent.length > 100 ? "..." : "");
            return {
              selector: '[data-testid="jods-remix-section"]',
              elementTagName: elementWithText.tagName,
              width: elementWithText.getBoundingClientRect().width,
              text: textContent,
            };
          }

          return null;
        });

        if (remixElement) {
          const selectorInfo = await remixElement.evaluate((info) => info);

          if (selectorInfo) {
            console.log(
              `  Found remix section manually: ${selectorInfo.selector}`
            );
            console.log(
              `  Element: ${selectorInfo.elementTagName}, Width: ${selectorInfo.width}px`
            );
            console.log(`  Text: ${selectorInfo.text}`);

            // Add to selectors
            selectors["remix-integration"] = {
              selector: selectorInfo.selector,
              testId: "jods-remix-section",
              padding: 40,
              originalLocator: {
                strategy: "heading",
                value: "Remix Integration",
                contextSelector:
                  "section, div.container, [class*='container_']",
              },
              debug: {
                elementTagName: selectorInfo.elementTagName,
                width: selectorInfo.width,
                isSameAsOriginal: true,
                textSummary: selectorInfo.text,
              },
            };
          }
        }
      } catch (error) {
        console.error("  Error finding Remix section manually:", error);
      }

      await browser.close();
    }

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
