// Unified Screenshot Script
// This script combines the functionality of screenshot-component.mjs,
// homepage-sections.mjs, and remix-section.mjs into a single script with different modes

import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  COMPONENTS,
  findRemixSection,
  getComponentByName,
  getAllComponentNames,
} from "./screenshot-selectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsBaseDir = path.join(__dirname, "../static/screenshots");

// Create screenshot directories
const directories = {
  unified: path.join(screenshotsBaseDir, "unified"),
};

// Create directories if they don't exist
Object.values(directories).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Base URL of the site
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

// Theme modes to capture
const THEMES = ["light", "dark"];

// Generate a timestamp in the format YYYYMMDD-HHMMSS
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Take screenshots in unified mode
 * @param {string} mode - The screenshot mode: 'all', 'components', 'sections', or a specific component name
 * @param {string} timestamp - Timestamp to use for filenames
 * @param {boolean} saveBaseline - Whether to save as baseline (no timestamp)
 * @param {string[]} specificComponents - Array of specific component names to screenshot (optional)
 */
async function takeUnifiedScreenshots(
  mode = "all",
  timestamp = getTimestamp(),
  saveBaseline = false,
  specificComponents = []
) {
  // If saving baselines, clear the timestamp
  timestamp = saveBaseline ? null : timestamp;

  console.log(
    `🚀 Taking unified screenshots in ${mode} mode from ${BASE_URL}${PATH_PREFIX}`
  );
  console.log(`📂 Saving to ${directories.unified}`);
  console.log(`🎨 Capturing themes: ${THEMES.join(", ")}`);

  // Determine which components to capture based on mode
  let componentsToCapture = [];

  if (specificComponents && specificComponents.length > 0) {
    // Specific named components - this should take priority over mode
    console.log(
      `Filtering to specific components: ${specificComponents.join(", ")}`
    );
    componentsToCapture = COMPONENTS.filter((component) =>
      specificComponents.includes(component.name)
    );
  } else if (mode === "all" || mode === "components") {
    // Capture all components (both "all" and "components" modes do the same thing)
    componentsToCapture = COMPONENTS;
  } else if (mode === "sections") {
    // Sections mode - filter only homepage sections
    componentsToCapture = COMPONENTS.filter(
      (component) =>
        component.page === "/" &&
        !component.name.includes("framework-") &&
        component.name !== "footer-section"
    );
  } else if (mode === "remix") {
    // Only the Remix section
    componentsToCapture = COMPONENTS.filter(
      (component) => component.name === "remix-section"
    );
  } else {
    // Try to interpret mode as a specific component name
    const component = getComponentByName(mode);
    if (component) {
      componentsToCapture = [component];
    } else {
      console.error(`Unknown mode or component: ${mode}`);
      console.log(`Available modes: all, components, sections, remix`);
      console.log(`Available components: ${getAllComponentNames().join(", ")}`);
      return;
    }
  }

  if (componentsToCapture.length === 0) {
    console.error("No components to capture based on the specified mode");
    return;
  }

  console.log(
    `📸 Will capture ${
      componentsToCapture.length
    } components: ${componentsToCapture.map((c) => c.name).join(", ")}`
  );

  // Group components by page to minimize browser navigation
  const componentsByPage = {};
  for (const component of componentsToCapture) {
    if (!componentsByPage[component.page]) {
      componentsByPage[component.page] = [];
    }
    componentsByPage[component.page].push(component);
  }

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 2000 }, // Increased height from 1600 to 2000
  });

  const page = await context.newPage();

  // Process each page and its components
  for (const [pagePath, pageComponents] of Object.entries(componentsByPage)) {
    const url = `${BASE_URL}${PATH_PREFIX}${pagePath}`;
    console.log(`\n📄 Navigating to ${url}`);

    // Go to the page and wait for it to be fully loaded
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait additional time for animations and dynamic content
    await page.waitForTimeout(2000);

    // Capture screenshots for each theme
    for (const theme of THEMES) {
      console.log(`\n🎨 Capturing ${theme} theme`);

      // Set the theme if needed
      await setTheme(page, theme);

      // Take screenshots of each component on this page
      for (const component of pageComponents) {
        try {
          console.log(`\n📸 Capturing ${component.name} component...`);

          // Wait for specific selector if provided
          if (component.waitForSelector) {
            try {
              await page.waitForSelector(component.waitForSelector, {
                timeout: 5000,
                state: "attached",
              });
            } catch (e) {
              console.log(
                `Warning: Could not find wait selector for ${component.name}: ${e.message}`
              );
            }
          }

          // Special handling for framework tabs if needed
          if (component.captureFrameworkTabs && component.frameworkTabs) {
            await captureFrameworkTabs(
              page,
              component,
              theme,
              timestamp,
              saveBaseline
            );
            continue; // Skip normal screenshot handling
          }

          // Special handling for Remix section
          if (component.name === "remix-section") {
            const remixElement = await findRemixSection(page);
            if (remixElement) {
              await captureSpecificElement(
                page,
                remixElement,
                component,
                theme,
                timestamp,
                saveBaseline
              );
              continue; // Skip normal screenshot handling
            }
          }

          // Special treatment for compare section to ensure bottom rows are visible
          if (component.name === "compare-section") {
            // First scroll to the top of the section
            await page.evaluate(() => {
              // Find the compare section using standard DOM methods
              const compareHeadings = Array.from(
                document.querySelectorAll("h2")
              ).filter(
                (h) =>
                  h.textContent.includes("Compare") ||
                  h.textContent.includes("How jods compares")
              );

              let section = null;
              if (compareHeadings.length > 0) {
                // Find parent section
                let current = compareHeadings[0];
                while (
                  current &&
                  current.tagName !== "SECTION" &&
                  current !== document.body
                ) {
                  current = current.parentElement;
                }
                if (current && current.tagName === "SECTION") {
                  section = current;
                }
              }

              // Fallback to data-testid
              if (!section) {
                section = document.querySelector(
                  '[data-testid="jods-compare-section"]'
                );
              }

              if (section) {
                // Scroll to the section first
                section.scrollIntoView({ block: "start" });
              }
            });

            // Wait for the first scroll to complete
            await page.waitForTimeout(500);

            // Then scroll down to see the bottom content
            await page.evaluate(() => {
              window.scrollBy(0, 300); // Scroll down 300px to reveal bottom content
            });

            await page.waitForTimeout(500); // Wait for second scroll
          }

          // Special handling for remix-section in light mode to ensure proper positioning
          if (component.name === "remix-section" && theme === "light") {
            // For light mode, we need to ensure the section is properly positioned
            await page.evaluate(() => {
              // Scroll to top first to ensure consistent positioning
              window.scrollTo(0, 0);

              // Find the remix section
              const section = document.querySelector(
                "section#remix-integration"
              );
              if (section) {
                // Calculate a good scroll position to see the header and some content above
                const rect = section.getBoundingClientRect();
                const targetY = Math.max(0, rect.top - 350); // Increased from 300 to 350px
                window.scrollTo(0, targetY);
              }
            });
            await page.waitForTimeout(1000); // Increased from 800 to 1000ms
          }

          // Special handling for remix-section in dark mode
          if (component.name === "remix-section" && theme === "dark") {
            await page.evaluate(() => {
              // Find the remix section
              const section = document.querySelector(
                "section#remix-integration"
              );
              if (section) {
                // Calculate a good scroll position for dark mode
                const rect = section.getBoundingClientRect();
                const targetY = Math.max(0, rect.top - 350); // Increased from 300 to 350px
                window.scrollTo(0, targetY);
              }
            });
            await page.waitForTimeout(1000); // Increased from 800 to 1000ms
          }

          // Find the element using the selector or fallback strategies
          const elementHandle = await findElementForComponent(page, component);

          if (elementHandle) {
            // Capture HTML debug info for the component
            if (component.captureHtmlDebug !== false) {
              await captureComponentHtml(page, component, elementHandle, theme);
            }

            await captureSpecificElement(
              page,
              elementHandle,
              component,
              theme,
              timestamp,
              saveBaseline
            );
          } else {
            console.log(
              `Could not find element for ${component.name}, taking viewport screenshot as fallback`
            );

            // Take viewport screenshot as fallback
            const screenshotPath = path.join(
              directories.unified,
              `${component.name}-${theme}-fallback${
                saveBaseline ? "" : "-" + timestamp
              }.png`
            );

            await page.screenshot({
              path: screenshotPath,
              fullPage: false,
            });

            console.log(`Fallback screenshot saved: ${screenshotPath}`);
          }
        } catch (error) {
          console.error(`Error capturing ${component.name}:`, error);
        }
      }
    }
  }

  await browser.close();
  console.log("\n✅ All screenshots completed!");
  if (!saveBaseline) {
    console.log(`🏷️ Timestamp for this batch: ${timestamp}`);
  }

  return timestamp;
}

/**
 * Helper: Set the theme (light/dark)
 */
async function setTheme(page, theme) {
  // Check current theme
  const isDarkMode = await page.evaluate(() => {
    return document.documentElement.dataset.theme === "dark";
  });

  if ((theme === "dark" && !isDarkMode) || (theme === "light" && isDarkMode)) {
    console.log(`Toggling theme to ${theme} mode...`);

    // Try multiple selectors for the theme toggle button
    try {
      await page.click("button.toggleButton_e_pL");
    } catch (e) {
      try {
        await page.click(".colorModeToggle_AEMF button");
      } catch (e2) {
        try {
          await page.click("[data-theme-toggle]");
        } catch (e3) {
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const themeButton = buttons.find((button) => {
              const attrs = Array.from(button.attributes);
              return (
                attrs.some(
                  (attr) =>
                    attr.value.toLowerCase().includes("theme") ||
                    attr.value.toLowerCase().includes("mode") ||
                    attr.name.toLowerCase().includes("theme") ||
                    attr.name.toLowerCase().includes("mode")
                ) ||
                button.textContent.toLowerCase().includes("theme") ||
                button.textContent.includes("🌙") ||
                button.textContent.includes("☀️")
              );
            });
            if (themeButton) themeButton.click();
            else console.warn("Could not find theme toggle button");
          });
        }
      }
    }

    // Wait longer for theme transition
    await page.waitForTimeout(1200);

    // Verify the theme changed
    const themeAfterToggle = await page.evaluate(() => {
      return document.documentElement.dataset.theme;
    });

    console.log(`Theme after toggle: ${themeAfterToggle}`);

    // If theme didn't change, try alternative approach
    if (
      (theme === "dark" && themeAfterToggle !== "dark") ||
      (theme === "light" && themeAfterToggle !== "light")
    ) {
      console.log(
        "Theme didn't change as expected, using alternative method..."
      );

      await page.evaluate((targetTheme) => {
        // Force set the theme via dataset
        document.documentElement.dataset.theme = targetTheme;

        // Also try to trigger theme change events
        document.dispatchEvent(
          new CustomEvent("themeChange", {
            detail: { theme: targetTheme },
          })
        );
      }, theme);

      await page.waitForTimeout(500);
    }
  }
}

/**
 * Helper: Find the DOM element for a component
 */
async function findElementForComponent(page, component) {
  let elementHandle = null;

  // First try the primary selector
  try {
    elementHandle = await page.$(component.selector);
    if (elementHandle) {
      console.log(`Found ${component.name} with primary selector`);
      return elementHandle;
    }
  } catch (error) {
    console.log(`Error using primary selector: ${error.message}`);
  }

  // If we have alternativeSelectors, try those one by one
  if (
    component.alternativeSelectors &&
    component.alternativeSelectors.length > 0
  ) {
    console.log(`Trying alternative selectors for ${component.name}...`);

    // First try each alternative selector individually
    for (const altSelector of component.alternativeSelectors) {
      try {
        elementHandle = await page.$(altSelector);
        if (elementHandle) {
          console.log(
            `Found ${component.name} with alternative selector: ${altSelector}`
          );
          return elementHandle;
        }
      } catch (error) {
        console.log(
          `Error with alternative selector "${altSelector}": ${error.message}`
        );
      }
    }

    // If individual selectors didn't work, try triangulation approach
    // by finding common parent of multiple matched elements
    try {
      const matchedElements = [];

      for (const altSelector of component.alternativeSelectors) {
        const elements = await page.$$(altSelector);
        if (elements.length > 0) {
          matchedElements.push({
            selector: altSelector,
            elements,
          });
        }
      }

      if (matchedElements.length >= 2) {
        console.log(
          `Found ${matchedElements.length} alternative elements for triangulation`
        );

        // Try to find common parent for the first two successful matches
        const el1 = matchedElements[0].elements[0];
        const el2 = matchedElements[1].elements[0];

        elementHandle = await page.evaluateHandle(
          (e1, e2) => {
            // Convert element handles to DOM elements
            const element1 = e1;
            const element2 = e2;

            // Find all parents of element1
            const getParents = (element) => {
              const parents = [];
              let current = element;
              while (current && current !== document.documentElement) {
                parents.push(current.parentElement);
                current = current.parentElement;
              }
              return parents;
            };

            const parents1 = getParents(element1);

            // Find common parent (lowest/closest one)
            for (const parent1 of parents1) {
              if (!parent1) continue;
              // Check if this parent contains element2
              if (parent1.contains(element2)) {
                // Found common parent
                // If it's too broad (e.g., body), try to find a more specific container
                if (parent1.tagName === "BODY" || parent1.tagName === "MAIN") {
                  // Look for a more specific container like a section
                  let current = element1;
                  while (current && current !== parent1) {
                    if (
                      current.tagName === "SECTION" ||
                      current.tagName === "ARTICLE" ||
                      (current.tagName === "DIV" &&
                        (current.className.includes("section") ||
                          current.className.includes("container")))
                    ) {
                      if (current.contains(element2)) {
                        return current;
                      }
                    }
                    current = current.parentElement;
                  }
                }
                return parent1;
              }
            }

            // If no common parent found, return the first element's parent
            return element1.parentElement;
          },
          el1,
          el2
        );

        if (elementHandle) {
          console.log(
            `Found ${component.name} via triangulation of multiple elements`
          );
          return elementHandle;
        }
      }
    } catch (error) {
      console.log(`Error during triangulation: ${error.message}`);
    }
  }

  // Wait for the selector if specified
  if (component.waitForSelector) {
    try {
      await page.waitForSelector(component.waitForSelector, {
        timeout: 5000,
      });
      elementHandle = await page.$(
        component.selector || component.waitForSelector
      );
      if (elementHandle) {
        console.log(`Found ${component.name} after waiting for selector`);
        return elementHandle;
      }
    } catch (e) {
      console.log(`Timeout waiting for selector: ${component.waitForSelector}`);
    }
  }

  // If component has a testId, try that
  if (component.testId) {
    try {
      elementHandle = await page.$(`[data-testid="${component.testId}"]`);
      if (elementHandle) {
        console.log(
          `Found ${component.name} using testId: ${component.testId}`
        );
        return elementHandle;
      }
    } catch (e) {
      console.log(`Error finding element by testId: ${e.message}`);
    }
  }

  console.log(`Element not found with selector: ${component.selector}`);
  console.log(`Trying fallback strategy: ${component.fallbackStrategy}`);

  // If not found, try fallback strategies
  if (component.fallbackStrategy === "first-heading") {
    // Get the first main heading on the page
    elementHandle = await page.$("h1");
    if (!elementHandle) {
      elementHandle = await page.$("h2");
    }
  } else if (
    component.fallbackStrategy === "section-index" &&
    component.sectionIndex !== undefined
  ) {
    // Try to get the nth section on the page
    const sections = await page.$$("section");
    if (sections.length > component.sectionIndex) {
      elementHandle = sections[component.sectionIndex];
      console.log(`Using section at index ${component.sectionIndex}`);
    } else if (sections.length > 0) {
      // If specified index is out of bounds but we have sections, take the last one
      elementHandle = sections[sections.length - 1];
      console.log(
        `Section index ${component.sectionIndex} out of bounds, using last section`
      );
    }
  } else if (
    component.fallbackStrategy === "keyword-context" &&
    component.keywords
  ) {
    // Custom strategy for finding elements containing keywords
    elementHandle = await page.evaluateHandle((kws) => {
      // First try to find sections containing the keywords
      for (const keyword of kws) {
        const elementsWithText = Array.from(
          document.querySelectorAll(
            'section, div.container, [class*="container_"]'
          )
        ).filter(
          (el) =>
            el.textContent.includes(keyword) &&
            !["SCRIPT", "STYLE"].includes(el.tagName)
        );

        if (elementsWithText.length > 0) {
          // Find the smallest element that contains the text
          return elementsWithText.reduce((smallest, current) => {
            if (!smallest) return current;
            return current.textContent.length < smallest.textContent.length
              ? current
              : smallest;
          }, null);
        }
      }

      // If not found in sections, try paragraphs or heading containers
      for (const keyword of kws) {
        const heading = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ).find((el) => el.textContent.includes(keyword));

        if (heading) {
          // Return the parent of the heading to get more context
          return heading.parentElement;
        }
      }

      return null;
    }, component.keywords);
  } else if (component.fallbackStrategy === "last-element") {
    // Get the footer or last main element on the page
    elementHandle = await page.$("footer");
    if (!elementHandle) {
      const mainElements = await page.$$("main > *");
      if (mainElements.length > 0) {
        elementHandle = mainElements[mainElements.length - 1];
      }
    }
  }

  return elementHandle;
}

/**
 * Helper: Capture a specific element with appropriate clipping
 */
async function captureSpecificElement(
  page,
  elementHandle,
  component,
  theme,
  timestamp,
  saveBaseline
) {
  // Create the screenshot filename
  const screenshotPath = path.join(
    directories.unified,
    `${component.name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
  );

  // Get element's bounding box
  const boundingBox = await elementHandle.boundingBox();

  if (!boundingBox) {
    console.log(`Could not get bounding box for ${component.name}`);
    return;
  }

  // Debug element position
  console.log(
    `Element ${component.name} found at y=${boundingBox.y}, height=${boundingBox.height}`
  );

  // Account for fixed header height
  const headerHeight = await page.evaluate(() => {
    const header = document.querySelector(
      'header, .navbar, [class*="navbar_"]'
    );
    return header ? header.offsetHeight : 0;
  });

  // Calculate padding
  const padding = component.padding || 40;
  const topPadding = padding + headerHeight;
  const bottomPadding = padding;

  // Make sure element is in view
  await elementHandle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // If this component has a clickSelector, click it
  if (component.clickSelector) {
    console.log(
      `Clicking element matching selector: ${component.clickSelector}`
    );
    try {
      // Try to find and click the element
      await page.click(component.clickSelector);

      // Wait for content to update after clicking
      const waitTime = component.clickWaitTime || 1000;
      console.log(`Waiting ${waitTime}ms for content to update after click...`);
      await page.waitForTimeout(waitTime);

      // Re-scroll to ensure element is still in view after click
      await elementHandle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    } catch (error) {
      console.log(`Error clicking element: ${error.message}`);
    }
  }

  // For tall sections, scroll up a bit to ensure full visibility
  if (component.name.includes("section") || boundingBox.height > 500) {
    // Apply extra scroll if specified in the component config
    const extraScroll = component.extraScroll || 0;
    const totalOffset = topPadding + extraScroll;

    await page.evaluate(
      (params) => {
        window.scrollBy(0, -params.offset);
      },
      { offset: totalOffset }
    );
    await page.waitForTimeout(500);
  }

  // Get updated position after scrolling
  const updatedBoundingBox = await elementHandle.boundingBox();

  // Handle element exclusions if specified
  let adjustedClip = {
    x: Math.max(0, updatedBoundingBox.x - padding),
    y: Math.max(0, updatedBoundingBox.y - topPadding),
    width: Math.min(
      page.viewportSize().width - Math.max(0, updatedBoundingBox.x - padding),
      updatedBoundingBox.width + padding * 2
    ),
    height: Math.max(
      updatedBoundingBox.height + topPadding + bottomPadding,
      component.minHeight || 0
    ),
  };

  // Process excluded elements if any
  if (component.excludeElements && component.excludeElements.length > 0) {
    console.log(
      `Processing ${component.excludeElements.length} excluded elements`
    );

    // Get bounding boxes of elements to exclude
    const excludeBoundingBoxes = await Promise.all(
      component.excludeElements.map(async (selector) => {
        try {
          const elements = await page.$$(selector);
          return Promise.all(
            elements.map(async (el) => {
              const box = await el.boundingBox();
              if (box) {
                return {
                  selector,
                  box,
                  isVisible: await el.isVisible(),
                };
              }
              return null;
            })
          );
        } catch (e) {
          console.log(
            `Error getting excluded element ${selector}: ${e.message}`
          );
          return [];
        }
      })
    );

    // Flatten and filter results
    const validExcludedBoxes = excludeBoundingBoxes
      .flat()
      .filter((item) => item !== null && item.isVisible);

    if (validExcludedBoxes.length > 0) {
      console.log(
        `Found ${validExcludedBoxes.length} visible elements to exclude`
      );

      // Check for elements that affect the top of the screenshot
      const topExclusions = validExcludedBoxes.filter(
        (item) =>
          item.box.y < adjustedClip.y + 100 && // Element is near the top
          item.box.y + item.box.height <
            adjustedClip.y + adjustedClip.height / 2 // Not spanning the whole element
      );

      // Check for elements that affect the bottom of the screenshot
      const bottomExclusions = validExcludedBoxes.filter(
        (item) =>
          item.box.y > adjustedClip.y + adjustedClip.height / 2 && // Element is in the bottom half
          item.box.y + item.box.height <=
            adjustedClip.y + adjustedClip.height + 50 // Within or just below the clip area
      );

      // Adjust clip area based on exclusions
      if (topExclusions.length > 0) {
        // Find the lowest bottom edge of top exclusions
        const maxBottom = Math.max(
          ...topExclusions.map((item) => item.box.y + item.box.height)
        );
        const newY = maxBottom + 10; // Add small gap

        // Adjust clip area from the top
        const heightReduction = newY - adjustedClip.y;
        if (heightReduction > 0 && heightReduction < adjustedClip.height) {
          adjustedClip.y = newY;
          adjustedClip.height -= heightReduction;
          console.log(
            `Adjusted top of clip to exclude elements, new y=${adjustedClip.y}`
          );
        }
      }

      if (bottomExclusions.length > 0) {
        // Find the highest top edge of bottom exclusions
        const minTop = Math.min(...bottomExclusions.map((item) => item.box.y));

        // Adjust clip area from the bottom
        const newHeight = minTop - adjustedClip.y - 10; // Subtract small gap
        if (newHeight > adjustedClip.height / 2) {
          // Ensure we don't cut off too much
          adjustedClip.height = newHeight;
          console.log(
            `Adjusted bottom of clip to exclude elements, new height=${adjustedClip.height}`
          );
        }
      }
    }
  }

  // Make sure we don't exceed the page dimensions
  if (adjustedClip.y + adjustedClip.height > page.viewportSize().height) {
    adjustedClip.height = page.viewportSize().height - adjustedClip.y - 10;
  }

  // Verify clip dimensions are positive
  if (adjustedClip.width <= 0 || adjustedClip.height <= 0) {
    console.log(
      `Invalid clip dimensions: width=${adjustedClip.width}, height=${adjustedClip.height}`
    );
    console.log(`Taking full viewport screenshot instead`);

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });
  } else {
    // Take the screenshot with the calculated clip area
    console.log(
      `Taking screenshot with clip: x=${adjustedClip.x}, y=${adjustedClip.y}, width=${adjustedClip.width}, height=${adjustedClip.height}`
    );

    await page.screenshot({
      path: screenshotPath,
      clip: adjustedClip,
    });
  }

  console.log(`Screenshot saved to: ${screenshotPath}`);
}

/**
 * Helper: Capture framework tabs
 */
async function captureFrameworkTabs(
  page,
  component,
  theme,
  timestamp,
  saveBaseline
) {
  console.log("Capturing framework tabs...");

  // Find the framework section
  const frameworkSection = await page.$(component.selector);

  if (!frameworkSection) {
    console.log("Could not find framework section");
    return;
  }

  // Debug: Save HTML content to file for inspection
  const htmlContent = await page.evaluate(() => {
    const sections = document.querySelectorAll("section");
    let frameworkSection = null;

    // Find section with framework-related content
    for (const section of sections) {
      if (
        section.textContent.includes("Works with your favorite frameworks") ||
        section.textContent.includes("Framework Integration")
      ) {
        frameworkSection = section;
        break;
      }
    }

    if (frameworkSection) {
      return {
        html: frameworkSection.outerHTML,
        buttons: Array.from(frameworkSection.querySelectorAll("button")).map(
          (btn) => btn.outerHTML
        ),
        tabs: Array.from(
          frameworkSection.querySelectorAll(
            '[role="tab"], [role="tablist"] button'
          )
        ).map((tab) => tab.outerHTML),
      };
    }
    return null;
  });

  if (htmlContent) {
    // Write to debug file in static/debug directory
    const debugDir = path.join(__dirname, "../static/debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const debugFilePath = path.join(
      debugDir,
      `framework-section-${theme}-debug.html`
    );
    let debugContent = `<h1>Framework Section Debug (${theme} theme)</h1>`;
    debugContent += `<h2>Full HTML</h2><pre>${htmlContent.html
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>`;
    debugContent += `<h2>Buttons (${htmlContent.buttons.length})</h2>`;
    htmlContent.buttons.forEach((btn, i) => {
      debugContent += `<h3>Button ${i + 1}</h3><pre>${btn
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`;
    });
    debugContent += `<h2>Tabs (${htmlContent.tabs.length})</h2>`;
    htmlContent.tabs.forEach((tab, i) => {
      debugContent += `<h3>Tab ${i + 1}</h3><pre>${tab
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`;
    });

    fs.writeFileSync(debugFilePath, debugContent);
    console.log(`Debug info saved to: ${debugFilePath}`);
  } else {
    console.log("Could not extract HTML content for debugging");
  }

  // Find all tab buttons
  const tabButtonsSelector =
    "button:has-text('React'), button:has-text('Preact'), button:has-text('Remix'), button:has-text('Traditional'), button:has-text('⚛️'), button:has-text('💿')";
  const tabButtons = await page.$$(tabButtonsSelector);

  if (!tabButtons || tabButtons.length === 0) {
    console.log("Could not find framework tabs, trying alternative selectors");

    // Get all buttons on the page for debugging
    const allButtons = await page.$$("button");
    console.log(`Found ${allButtons.length} total buttons on the page`);

    // Print the text of all buttons to help debug
    for (const button of allButtons) {
      try {
        const buttonText = await button.evaluate((el) => el.textContent.trim());
        console.log(`Button text: "${buttonText}"`);
      } catch (e) {
        console.log(`Error getting button text: ${e.message}`);
      }
    }

    // Try more specific selectors with emoji
    const emojiTabButtonsSelector =
      "button:has-text('⚛️'), button:has-text('💿')";
    const emojiTabButtons = await page.$$(emojiTabButtonsSelector);

    if (!emojiTabButtons || emojiTabButtons.length === 0) {
      console.log(
        "Could not find framework tabs with emoji either, trying general button search"
      );

      // Last resort - try to find buttons by their text content more broadly
      const allButtons = await page.$$("button");
      const frameworkButtons = [];

      for (const button of allButtons) {
        const buttonText = await button.evaluate((el) => el.textContent.trim());
        if (
          buttonText.includes("React") ||
          buttonText.includes("Preact") ||
          buttonText.includes("Remix") ||
          buttonText.includes("⚛️") ||
          buttonText.includes("💿")
        ) {
          frameworkButtons.push(button);
        }
      }

      if (frameworkButtons.length > 0) {
        console.log(
          `Found ${frameworkButtons.length} framework buttons through text content analysis`
        );

        for (const button of frameworkButtons) {
          const buttonText = await button.evaluate((el) =>
            el.textContent.trim()
          );
          let framework = "unknown";

          // Check if we should force React tab only
          if (component.forceReactTabOnly) {
            if (
              buttonText.includes("React") &&
              !buttonText.includes("Preact")
            ) {
              framework = "react";
            } else if (
              buttonText.includes("⚛️") &&
              !buttonText.includes("Preact")
            ) {
              framework = "react";
            } else {
              // Skip non-React tabs if forceReactTabOnly is true
              continue;
            }
          } else {
            // Standard framework determination
            if (
              buttonText.includes("React") &&
              !buttonText.includes("Preact")
            ) {
              framework = "react";
            } else if (buttonText.includes("Preact")) {
              framework = "preact";
            } else if (
              buttonText.includes("Remix") ||
              buttonText.includes("💿")
            ) {
              framework = "remix";
            }
          }

          if (framework !== "unknown") {
            // If forceSaveAsReact is true, always save as "react"
            if (component.forceSaveAsReact) {
              framework = "react";
            }

            await captureTabScreenshot(
              page,
              frameworkSection,
              button,
              framework,
              component,
              theme,
              timestamp,
              saveBaseline
            );

            // If we found a React tab and forceReactTabOnly is true, we're done
            if (component.forceReactTabOnly && framework === "react") {
              break;
            }
          }
        }
      } else {
        console.log("Could not find any framework buttons");
      }

      return;
    }

    console.log(`Found ${emojiTabButtons.length} framework tabs with emoji`);

    // Use the emoji buttons instead
    const allTabButtons = emojiTabButtons;

    // Group buttons by type based on their text content
    const reactButtons = [];
    const preactButtons = [];
    const remixButtons = [];

    for (const tabButton of allTabButtons) {
      const buttonText = await tabButton.evaluate((el) =>
        el.textContent.trim()
      );
      if (
        buttonText.includes("⚛️") &&
        buttonText.toLowerCase().includes("react") &&
        !buttonText.toLowerCase().includes("preact")
      ) {
        reactButtons.push(tabButton);
      } else if (
        buttonText.includes("⚛️") &&
        buttonText.toLowerCase().includes("preact")
      ) {
        preactButtons.push(tabButton);
      } else if (
        buttonText.includes("💿") ||
        buttonText.toLowerCase().includes("remix")
      ) {
        remixButtons.push(tabButton);
      }
    }

    // If forceReactTabOnly is true, only capture React tab
    if (component.forceReactTabOnly) {
      if (reactButtons.length > 0) {
        console.log(
          "Capturing only React tab due to forceReactTabOnly setting"
        );
        await captureTabScreenshot(
          page,
          frameworkSection,
          reactButtons[0],
          "react", // Always use "react" as the identifier
          component,
          theme,
          timestamp,
          saveBaseline
        );
      } else {
        console.log("Could not find React tab, but forceReactTabOnly is set");
      }
      return;
    }

    // Priority to capturing the Remix tab first
    if (remixButtons.length > 0) {
      console.log("Capturing Remix tab first (prioritized)");
      await captureTabScreenshot(
        page,
        frameworkSection,
        remixButtons[0],
        component.forceSaveAsReact ? "react" : "remix", // Use "react" if forceSaveAsReact is true
        component,
        theme,
        timestamp,
        saveBaseline
      );
    }

    // Then capture the other tabs
    if (reactButtons.length > 0) {
      await captureTabScreenshot(
        page,
        frameworkSection,
        reactButtons[0],
        "react",
        component,
        theme,
        timestamp,
        saveBaseline
      );
    }

    if (preactButtons.length > 0) {
      await captureTabScreenshot(
        page,
        frameworkSection,
        preactButtons[0],
        component.forceSaveAsReact ? "react" : "preact", // Use "react" if forceSaveAsReact is true
        component,
        theme,
        timestamp,
        saveBaseline
      );
    }

    return;
  }

  console.log(`Found ${tabButtons.length} framework tabs`);

  // Look for React tab first if forceReactTabOnly is true
  if (component.forceReactTabOnly) {
    console.log("Searching for React tab due to forceReactTabOnly setting");
    let reactButton = null;
    for (const button of tabButtons) {
      const buttonText = await button.evaluate((el) => el.textContent.trim());
      if (
        (buttonText.includes("React") && !buttonText.includes("Preact")) ||
        buttonText.includes("⚛️")
      ) {
        reactButton = button;
        break;
      }
    }

    if (reactButton) {
      console.log("Found React tab, capturing only this tab");
      await captureTabScreenshot(
        page,
        frameworkSection,
        reactButton,
        "react",
        component,
        theme,
        timestamp,
        saveBaseline
      );
    } else {
      console.log("Could not find React tab, but forceReactTabOnly is set");
    }
    return;
  }

  // Look for Remix/Traditional tab first and prioritize capturing it
  let remixButton = null;
  for (const button of tabButtons) {
    const buttonText = await button.evaluate((el) => el.textContent.trim());
    if (
      buttonText.includes("Remix") ||
      buttonText.includes("Traditional") ||
      buttonText.includes("💿")
    ) {
      remixButton = button;
      break;
    }
  }

  // Capture Remix tab first if found
  if (remixButton) {
    console.log("Capturing Remix tab first (prioritized)");
    await captureTabScreenshot(
      page,
      frameworkSection,
      remixButton,
      component.forceSaveAsReact ? "react" : "remix",
      component,
      theme,
      timestamp,
      saveBaseline
    );
  }

  // For each explicitly named tab in component config, try to find and capture it
  for (const tabName of component.frameworkTabs) {
    // Skip Remix tab if we already captured it
    if (
      remixButton &&
      (tabName.includes("Remix") ||
        tabName.includes("Traditional") ||
        tabName.includes("💿"))
    ) {
      console.log(`Skipping duplicate Remix tab: ${tabName}`);
      continue;
    }

    console.log(`Looking for tab: ${tabName}`);
    let matchingButton = null;

    // Try to find a button that contains this tab name
    for (const button of tabButtons) {
      const buttonText = await button.evaluate((el) => el.textContent.trim());
      if (buttonText.includes(tabName) || tabName.includes(buttonText)) {
        matchingButton = button;
        break;
      }
    }

    if (matchingButton) {
      let tabIdentifier = tabName.toLowerCase().replace(/[^a-z0-9]/g, "-");

      // If forceSaveAsReact is true, always use "react"
      if (component.forceSaveAsReact) {
        tabIdentifier = "react";
      }

      await captureTabScreenshot(
        page,
        frameworkSection,
        matchingButton,
        tabIdentifier,
        component,
        theme,
        timestamp,
        saveBaseline
      );
    } else {
      console.log(`Could not find tab button for: ${tabName}`);
    }
  }
}

/**
 * Helper: Capture a single framework tab screenshot
 */
async function captureTabScreenshot(
  page,
  frameworkSection,
  tabButton,
  tabIdentifier,
  component,
  theme,
  timestamp,
  saveBaseline
) {
  const tabName = await tabButton.evaluate((el) => el.textContent.trim());
  console.log(`Clicking on ${tabName} tab`);

  // Click the tab
  await tabButton.click();

  // Wait longer for tab content to fully load and render
  await page.waitForTimeout(1500);

  // Special handling for Remix tab in light mode
  const isRemixTab =
    tabName.includes("Remix") ||
    tabName.includes("💿") ||
    tabIdentifier.includes("remix");
  if (isRemixTab && theme === "light") {
    console.log("Special handling for Remix tab in light mode");

    // First, ensure "Works with your favorite frameworks" is visible at the top
    await page.evaluate(() => {
      // Find the heading
      const frameworkHeading = Array.from(document.querySelectorAll("h2")).find(
        (h) =>
          h.textContent.includes("Works with your favorite frameworks") ||
          h.textContent.includes("Framework Integration")
      );

      if (frameworkHeading) {
        console.log("Found framework heading, scrolling to position it at top");
        // Calculate position to show heading at top with more margin (increased from 100px to 250px)
        const rect = frameworkHeading.getBoundingClientRect();
        const scrollOffset = window.scrollY + rect.top - 250; // Increased from 100px to 250px
        window.scrollTo(0, scrollOffset);
        return true;
      }
      return false;
    });

    // Wait longer for scroll to complete (increased from 800ms to 1000ms)
    await page.waitForTimeout(1000);

    // Now try to find the Remix content but avoid scrolling too far
    const remixContent = await page.evaluate(() => {
      // Use standard DOM traversal instead of :has-text() selector
      const codeBlocks = document.querySelectorAll("pre code");
      let remixCodeBlock = null;

      // Look through all code blocks for Remix-specific content
      for (const codeBlock of codeBlocks) {
        if (
          codeBlock.textContent.includes("createCookieStore") ||
          codeBlock.textContent.includes("remix") ||
          codeBlock.textContent.includes("cookie")
        ) {
          remixCodeBlock = codeBlock.closest("pre");
          break;
        }
      }

      if (remixCodeBlock) {
        // Check if the code block is already in view
        const containerRect = remixCodeBlock.getBoundingClientRect();
        if (containerRect.top > 0 && containerRect.top < window.innerHeight) {
          console.log("Remix code block already in view");
          return true;
        }

        // Only scroll if necessary and don't scroll too far
        if (containerRect.top < 0 || containerRect.top > window.innerHeight) {
          const maxScroll = 200; // Limit how far we scroll
          const scrollOffset = Math.min(
            maxScroll,
            Math.max(0, containerRect.top - 300)
          );
          window.scrollBy(0, scrollOffset);
          return true;
        }
      }

      // Alternative approach - look for Remix headers
      const remixHeaders = Array.from(
        document.querySelectorAll("h2, h3, h4")
      ).filter(
        (el) =>
          el.textContent.includes("Remix") &&
          !el.textContent.includes("State") &&
          !el.textContent.includes("Reimagined")
      );

      if (remixHeaders.length > 0) {
        const header = remixHeaders[0];
        const headerRect = header.getBoundingClientRect();

        // Only scroll if needed and don't scroll too far
        if (headerRect.top < 0 || headerRect.top > window.innerHeight) {
          const maxScroll = 200; // Limit how far we scroll
          const scrollOffset = Math.min(
            maxScroll,
            Math.max(0, headerRect.top - 200)
          );
          window.scrollBy(0, scrollOffset);
          return true;
        }
      }

      return false;
    });

    if (remixContent) {
      console.log("Found Remix-specific content, adjusting position");
      await page.waitForTimeout(800);
    }
  }

  // Additional scroll for better positioning
  await page.evaluate(
    (params) => {
      window.scrollBy(0, -params.offset);
    },
    { offset: component.extraScroll || 0 }
  );
  await page.waitForTimeout(500);

  // Get position after scrolling
  const updatedBoundingBox = await frameworkSection.boundingBox();

  // Calculate clip area
  const padding = component.padding || 40;
  const clip = {
    x: Math.max(0, updatedBoundingBox.x - padding),
    y: Math.max(0, updatedBoundingBox.y - padding * 2), // Double the top padding
    width: Math.min(
      page.viewportSize().width - Math.max(0, updatedBoundingBox.x - padding),
      updatedBoundingBox.width + padding * 2
    ),
    height: Math.max(
      updatedBoundingBox.height + padding * 3, // Extra padding for the height
      component.minHeight || 0
    ),
  };

  // Make sure we don't exceed the page dimensions
  if (clip.y + clip.height > page.viewportSize().height) {
    clip.height = page.viewportSize().height - clip.y - 10;
  }

  // Clean up the tab identifier for the filename
  const safeTabId = tabIdentifier.replace(/[^\w-]/g, "").toLowerCase();

  // Simplify the filename for the Traditional Remix tab
  let finalTabId = safeTabId;

  // If forceSaveAsReact is true, always use "react" as the tab identifier
  if (component.forceSaveAsReact) {
    finalTabId = "react";
  } else {
    if (component.name === "framework-section") {
      // For framework section, always use 'react' as the identifier
      finalTabId = "react";
    } else if (
      safeTabId.includes("traditional") ||
      safeTabId.includes("remix") ||
      tabName.includes("💿")
    ) {
      finalTabId = "remix";
    }
  }

  // Take the screenshot
  const screenshotPath = path.join(
    directories.unified,
    `${component.name}-${finalTabId}-${theme}${
      saveBaseline ? "" : "-" + timestamp
    }.png`
  );

  await page.screenshot({
    path: screenshotPath,
    clip,
  });

  console.log(`Framework tab screenshot saved to: ${screenshotPath}`);

  // If this is the Remix tab and React tab couldn't be found, create a React file too
  if (finalTabId === "remix" && component.simulateReactTab) {
    const reactPath = path.join(
      directories.unified,
      `${component.name}-react-${theme}${
        saveBaseline ? "" : "-" + timestamp
      }.png`
    );

    // Copy the file to create a React version
    fs.copyFileSync(screenshotPath, reactPath);
    console.log(`Created simulated React tab screenshot: ${reactPath}`);
  }
}

/**
 * Helper: Capture HTML debug information for any component
 */
async function captureComponentHtml(page, component, elementHandle, theme) {
  try {
    // Create debug directory if it doesn't exist
    const debugDir = path.join(__dirname, "../static/debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    // Get HTML content of the component
    const htmlContent = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element) return null;

      return {
        html: element.outerHTML,
        buttons: Array.from(element.querySelectorAll("button")).map((btn) => ({
          text: btn.textContent.trim(),
          html: btn.outerHTML,
        })),
        headings: Array.from(
          element.querySelectorAll("h1, h2, h3, h4, h5, h6")
        ).map((h) => ({
          level: h.tagName,
          text: h.textContent.trim(),
        })),
      };
    });

    if (htmlContent) {
      const debugFilePath = path.join(
        debugDir,
        `${component.name}-${theme}-debug.html`
      );
      let debugContent = `<h1>${component.name} Debug (${theme} theme)</h1>`;
      debugContent += `<h2>Full HTML</h2><pre>${htmlContent.html
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`;

      debugContent += `<h2>Headings (${htmlContent.headings.length})</h2>`;
      htmlContent.headings.forEach((heading, _i) => {
        debugContent += `<p><strong>${heading.level}</strong>: ${heading.text}</p>`;
      });

      debugContent += `<h2>Buttons (${htmlContent.buttons.length})</h2>`;
      htmlContent.buttons.forEach((btn, _i) => {
        debugContent += `<h3>Button: "${btn.text}"</h3><pre>${btn.html
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>`;
      });

      fs.writeFileSync(debugFilePath, debugContent);
      console.log(`HTML debug info saved to: ${debugFilePath}`);
    }
  } catch (error) {
    console.log(`Error capturing HTML debug: ${error.message}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");
const modeArg = args.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "all";
const componentsArg = args.find((arg) => arg.startsWith("--components="));
const specificComponents = componentsArg
  ? componentsArg.split("=")[1].split(",")
  : [];

// Run the screenshot function
takeUnifiedScreenshots(
  mode,
  getTimestamp(),
  saveBaseline,
  specificComponents
).catch((error) => {
  console.error("Error taking screenshots:", error);
  process.exit(1);
});

export { takeUnifiedScreenshots };
