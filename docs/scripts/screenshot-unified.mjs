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

// Add code to import generated selectors if they exist and the flag is set
let componentsToUse = COMPONENTS;

try {
  // Check if the generated selectors file exists and if the --use-generated-selectors flag is used
  if (process.argv.includes("--use-generated-selectors")) {
    // Try to import the generated selectors
    const { GENERATED_COMPONENTS, mergeWithExisting } = await import(
      "./screenshot-selectors.generated.mjs"
    );

    console.log(
      `🔄 Loading ${GENERATED_COMPONENTS.length} generated selectors from data-testids`
    );

    // Decide if we should merge or replace
    if (process.argv.includes("--merge-selectors")) {
      // Merge with existing selectors
      componentsToUse = mergeWithExisting(COMPONENTS);
      console.log(
        `🔄 Merged with existing selectors - ${componentsToUse.length} total components`
      );
    } else {
      // Just use the generated selectors
      componentsToUse = GENERATED_COMPONENTS;
      console.log(
        `🔄 Using ${componentsToUse.length} generated selectors exclusively`
      );
    }
  }
} catch (error) {
  console.warn(
    `⚠️ No generated selectors found or error loading them: ${error.message}`
  );
  console.log(`ℹ️ Using default component selectors`);
}

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

// Debug mode flag - can be enabled with DEBUG=true environment variable
const DEBUG = process.env.DEBUG === "true";

// Logger utility for consistent logging with optional debugging
const logger = {
  info: (message) => console.log(`ℹ️ ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  warn: (message) => console.log(`⚠️ ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  debug: (message) => {
    if (DEBUG) console.log(`🔍 DEBUG: ${message}`);
  },
};

// Retry utility for operations that might fail
async function retry(operation, options = {}) {
  const {
    retries = 3,
    delay = 500,
    name = "operation",
    onRetry = null,
    onSuccess = null,
    onFailure = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await operation();

      if (onSuccess) {
        onSuccess(result, attempt);
      } else if (attempt > 1) {
        logger.success(`${name} succeeded on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        if (onRetry) {
          onRetry(error, attempt);
        } else {
          logger.warn(
            `${name} failed (attempt ${attempt}/${retries}): ${error.message}`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay * attempt)); // Exponential backoff
      }
    }
  }

  if (onFailure) {
    onFailure(lastError);
  } else {
    logger.error(
      `${name} failed after ${retries} attempts: ${lastError.message}`
    );
  }

  throw lastError;
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

  logger.info(
    `Taking unified screenshots in ${mode} mode from ${BASE_URL}${PATH_PREFIX}`
  );
  logger.info(`Saving to ${directories.unified}`);
  logger.info(`Capturing themes: ${THEMES.join(", ")}`);

  // Determine which components to capture based on mode
  let componentsToCapture = [];

  if (specificComponents && specificComponents.length > 0) {
    // Specific named components take priority
    componentsToCapture = componentsToUse.filter((component) =>
      specificComponents.includes(component.name)
    );
  } else if (mode === "all" || mode === "components") {
    // Capture all components
    componentsToCapture = componentsToUse;
  } else if (mode === "sections") {
    // Sections mode - filter only homepage sections
    componentsToCapture = componentsToUse.filter(
      (component) =>
        component.page === "/" &&
        !component.name.includes("framework-") &&
        component.name !== "footer-section"
    );
  } else if (mode === "remix") {
    // Only the Remix section
    componentsToCapture = componentsToUse.filter(
      (component) => component.name === "remix-section"
    );
  } else {
    // Try to interpret mode as a specific component name
    const component = getComponentByName(mode, componentsToUse);
    if (component) {
      componentsToCapture = [component];
    } else {
      logger.error(`Unknown mode or component: ${mode}`);
      logger.info(`Available modes: all, components, sections, remix`);
      logger.info(
        `Available components: ${getAllComponentNames(componentsToUse).join(
          ", "
        )}`
      );
      return;
    }
  }

  if (componentsToCapture.length === 0) {
    logger.error("No components to capture based on the specified mode");
    return;
  }

  logger.info(
    `Will capture ${
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
  const browser = await chromium.launch().catch((error) => {
    logger.error(`Failed to launch browser: ${error.message}`);
    throw error;
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 2000 },
  });

  const page = await context.newPage();

  // Set up error handling for page events
  page.on("pageerror", (exception) =>
    logger.warn(`Page error: ${exception.message}`)
  );
  page.on("console", (msg) => {
    if (msg.type() === "error") logger.debug(`Console error: ${msg.text()}`);
    else if (DEBUG) logger.debug(`Console ${msg.type()}: ${msg.text()}`);
  });

  // Track overall statistics
  const stats = {
    total: componentsToCapture.length * THEMES.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    componentResults: {},
  };

  try {
    // Process each page and its components
    for (const [pagePath, pageComponents] of Object.entries(componentsByPage)) {
      const url = `${BASE_URL}${PATH_PREFIX}${pagePath}`;
      logger.info(`\n📄 Navigating to ${url}`);

      // Go to the page with retry
      try {
        await retry(
          () => page.goto(url, { waitUntil: "networkidle", timeout: 30000 }),
          {
            name: "Page navigation",
            retries: 3,
            onSuccess: () => logger.success(`Successfully loaded ${url}`),
          }
        );

        // Wait for page to stabilize
        await page.waitForTimeout(2000);
      } catch (error) {
        logger.error(
          `Failed to navigate to ${url} after multiple attempts. Skipping components on this page.`
        );

        // Mark components as skipped
        for (const component of pageComponents) {
          stats.skipped += THEMES.length;
          stats.componentResults[component.name] = {
            status: "skipped",
            reason: "navigation_failed",
          };
        }
        continue; // Skip to next page
      }

      // Capture screenshots for each theme
      for (const theme of THEMES) {
        logger.info(`\n🎨 Capturing ${theme} theme`);

        // Set the theme
        try {
          await retry(() => setTheme(page, theme, pageComponents[0]), {
            name: `Theme setting (${theme})`,
            retries: 2,
          });
        } catch (error) {
          logger.error(
            `Failed to set ${theme} theme after multiple attempts. Using current theme.`
          );
        }

        // Take screenshots of each component on this page
        for (const component of pageComponents) {
          try {
            logger.info(`\n📸 Capturing ${component.name} component...`);
            stats.componentResults[component.name] =
              stats.componentResults[component.name] || {};

            // Wait for component selector if specified
            if (component.waitForSelector) {
              try {
                await page.waitForSelector(component.waitForSelector, {
                  timeout: 5000,
                  state: "attached",
                });
              } catch (e) {
                logger.warn(
                  `Could not find wait selector for ${component.name}: ${e.message}`
                );
              }
            }

            // Handle framework tabs (React/Remix) if needed
            if (component.captureFrameworkTabs && component.frameworkTabs) {
              const result = await captureFrameworkTabs(
                page,
                component,
                theme,
                timestamp,
                saveBaseline
              );

              if (result) {
                stats.successful++;
                stats.componentResults[component.name][theme] = "success";
              } else {
                stats.failed++;
                stats.componentResults[component.name][theme] = "failed";
              }
              continue; // Skip to next component
            }

            // Special handling for Remix section
            if (component.name === "remix-section") {
              const remixElement = await findRemixSection(page);
              if (remixElement) {
                const result = await captureSpecificElement(
                  page,
                  remixElement,
                  component,
                  theme,
                  timestamp,
                  saveBaseline
                );

                if (result) {
                  stats.successful++;
                  stats.componentResults[component.name][theme] = "success";
                } else {
                  stats.failed++;
                  stats.componentResults[component.name][theme] = "failed";
                }
                continue; // Skip to next component
              }
            }

            // Handle special positioning for compare section
            if (component.name === "compare-section") {
              await page.evaluate(() => {
                const compareHeadings = Array.from(
                  document.querySelectorAll("h2")
                ).filter(
                  (h) =>
                    h.textContent.includes("Compare") ||
                    h.textContent.includes("How jods compares")
                );

                if (compareHeadings.length > 0) {
                  let current = compareHeadings[0];
                  while (
                    current &&
                    current.tagName !== "SECTION" &&
                    current !== document.body
                  ) {
                    current = current.parentElement;
                  }
                  if (current && current.tagName === "SECTION") {
                    current.scrollIntoView({ block: "start" });
                  }
                }
              });
              await page.waitForTimeout(500);
              await page.evaluate(() => window.scrollBy(0, 300));
              await page.waitForTimeout(500);
            }

            // Find the element to screenshot
            const elementHandle = await findElementForComponent(
              page,
              component
            );

            if (elementHandle) {
              // Capture HTML debug info
              if (component.captureHtmlDebug !== false) {
                await captureComponentHtml(
                  page,
                  component,
                  elementHandle,
                  theme
                );
              }

              // Take the screenshot
              const result = await captureSpecificElement(
                page,
                elementHandle,
                component,
                theme,
                timestamp,
                saveBaseline
              );

              if (result) {
                stats.successful++;
                stats.componentResults[component.name][theme] = "success";
              } else {
                stats.failed++;
                stats.componentResults[component.name][theme] = "failed";
              }
            } else {
              // Take fallback screenshot if element not found
              logger.warn(
                `Could not find element for ${component.name}, taking viewport screenshot as fallback`
              );

              try {
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

                logger.success(`Fallback screenshot saved: ${screenshotPath}`);
                stats.successful++;
                stats.componentResults[component.name][theme] = "fallback";
              } catch (error) {
                logger.error(
                  `Error taking fallback screenshot for ${component.name}: ${error.message}`
                );
                stats.failed++;
                stats.componentResults[component.name][theme] = "failed";
              }
            }
          } catch (error) {
            // Handle component errors
            logger.error(
              `Error capturing ${component.name} in ${theme} theme: ${error.message}`
            );
            stats.failed++;
            stats.componentResults[component.name][theme] = "error";

            // Take error screenshot
            try {
              const errorScreenshotPath = path.join(
                directories.unified,
                `${component.name}-${theme}-error${
                  saveBaseline ? "" : "-" + timestamp
                }.png`
              );

              await page.screenshot({
                path: errorScreenshotPath,
                fullPage: false,
              });

              logger.info(
                `Error state screenshot saved: ${errorScreenshotPath}`
              );
            } catch (e) {
              logger.debug(`Could not take error screenshot: ${e.message}`);
            }
          }
        }
      }
    }
  } catch (error) {
    // Handle fatal errors
    logger.error(`Fatal error in screenshot process: ${error.message}`);

    try {
      if (page) {
        const errorScreenshotPath = path.join(
          directories.unified,
          `fatal-error-${timestamp || "baseline"}.png`
        );

        await page.screenshot({
          path: errorScreenshotPath,
          fullPage: true,
        });

        logger.info(`Fatal error screenshot saved: ${errorScreenshotPath}`);
      }
    } catch (e) {
      logger.debug(`Could not take fatal error screenshot: ${e.message}`);
    }
  } finally {
    // Clean up
    await browser.close();

    // Print summary
    logger.info("\n📊 Screenshot Results Summary:");
    logger.info(`Total components: ${stats.total}`);
    logger.info(`✅ Successful: ${stats.successful}`);
    logger.info(`❌ Failed: ${stats.failed}`);
    logger.info(`⏭️ Skipped: ${stats.skipped}`);

    if (stats.failed > 0) {
      logger.info("\nFailed components:");
      for (const [component, results] of Object.entries(
        stats.componentResults
      )) {
        for (const [theme, status] of Object.entries(results)) {
          if (status === "failed" || status === "error") {
            logger.info(`  - ${component} (${theme}): ${status}`);
          }
        }
      }
    }

    logger.success(
      `\nScreenshot process complete! Timestamp: ${timestamp || "baseline"}`
    );
  }

  return timestamp;
}

/**
 * Helper: Set the theme (light/dark)
 */
async function setTheme(page, theme, component) {
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

    // Add extra wait time for dark mode if specified in component config
    if (theme === "dark" && component?.darkModeExtraWait) {
      console.log(
        `Adding extra wait time for dark mode: ${component.darkModeExtraWait}ms`
      );
      await page.waitForTimeout(component.darkModeExtraWait);
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
 * Helper: Manage animations on the page for consistent screenshots
 * @param {Page} page - Playwright page object
 * @param {string} action - 'pause' or 'resume'
 * @param {Object} component - Component configuration (optional)
 */
async function manageAnimations(page, action = "pause", component = null) {
  // Skip if animations shouldn't be paused for this component
  if (component && !component.pauseAnimations) return;

  logger.debug(`${action === "pause" ? "Pausing" : "Resuming"} animations...`);

  // Apply a stylesheet to control animations
  await page.evaluate((pausing) => {
    // Create or get the style element
    let style = document.getElementById("animation-control-for-screenshots");
    if (!style) {
      style = document.createElement("style");
      style.id = "animation-control-for-screenshots";
      document.head.appendChild(style);
    }

    // Simple CSS to freeze all animations and transitions
    const css = pausing
      ? `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
        /* Hide particles and sparkle effects */
        canvas[class*="particles"], [class*="sparkle"], [class*="twinkle"] {
          opacity: 0 !important; 
        }
      `
      : "";

    // Apply or remove style
    style.textContent = css;
  }, action === "pause");

  // Give time for style to take effect
  await page.waitForTimeout(200);
}

/**
 * Helper: Capture a specific element with appropriate clipping
 * @returns {boolean} Whether the capture was successful
 */
async function captureSpecificElement(
  page,
  elementHandle,
  component,
  theme,
  timestamp,
  saveBaseline
) {
  try {
    // Pause animations if specified
    await manageAnimations(page, "pause", component);

    // Create the screenshot filename
    const screenshotPath = path.join(
      directories.unified,
      `${component.name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
    );

    // Get element's bounding box
    const boundingBox = await elementHandle.boundingBox();
    if (!boundingBox) {
      logger.warn(`Could not get bounding box for ${component.name}`);
      return false;
    }

    // Get header height for padding calculations
    const headerHeight = await page.evaluate(() => {
      const header = document.querySelector(
        'header, .navbar, [class*="navbar_"]'
      );
      return header ? header.offsetHeight : 0;
    });

    // Make sure element is in view
    await elementHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Handle click operations if needed
    if (component.clickSelector) {
      logger.info(
        `Clicking element matching selector: ${component.clickSelector}`
      );
      try {
        await retry(() => page.click(component.clickSelector), {
          name: "Element click",
          retries: 2,
        });

        const waitTime = component.clickWaitTime || 1000;
        await page.waitForTimeout(waitTime);

        // Re-scroll after clicking
        await elementHandle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
      } catch (error) {
        logger.error(`Error clicking element: ${error.message}`);
      }
    }

    // Get updated position after scrolling/clicking
    const updatedBoundingBox = await elementHandle.boundingBox();
    if (!updatedBoundingBox) {
      logger.warn(`Element disappeared after scrolling for ${component.name}`);
      return false;
    }

    // Calculate padding
    const padding = component.padding || 40;
    const topPadding = padding + headerHeight;

    // Set initial clip area
    let adjustedClip = {
      x: Math.max(0, updatedBoundingBox.x - padding),
      y: Math.max(0, updatedBoundingBox.y - topPadding),
      width: Math.min(
        page.viewportSize().width - Math.max(0, updatedBoundingBox.x - padding),
        updatedBoundingBox.width + padding * 2
      ),
      height: Math.max(
        updatedBoundingBox.height + topPadding + padding,
        component.minHeight || 0
      ),
    };

    // Handle element exclusions if specified
    if (component.excludeElements && component.excludeElements.length > 0) {
      // Get all elements to exclude that are visible
      const elements = await Promise.all(
        component.excludeElements.map((selector) => page.$$(selector))
      );
      const visibleElements = [];

      // Get bounding boxes for visible elements to exclude
      for (const elementList of elements.flat()) {
        try {
          const box = await elementList.boundingBox();
          const isVisible = await elementList.isVisible();
          if (box && isVisible) {
            visibleElements.push({ box });
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Adjust clip area to exclude elements at top/bottom if needed
      if (visibleElements.length > 0) {
        // Find elements at top and bottom
        const topElements = visibleElements.filter(
          (el) =>
            el.box.y < adjustedClip.y + 100 &&
            el.box.y + el.box.height < adjustedClip.y + adjustedClip.height / 2
        );

        const bottomElements = visibleElements.filter(
          (el) =>
            el.box.y > adjustedClip.y + adjustedClip.height / 2 &&
            el.box.y + el.box.height <=
              adjustedClip.y + adjustedClip.height + 50
        );

        // Adjust top if needed
        if (topElements.length > 0) {
          const maxBottom = Math.max(
            ...topElements.map((el) => el.box.y + el.box.height)
          );
          const newY = maxBottom + 10;

          if (
            newY > adjustedClip.y &&
            newY < adjustedClip.y + adjustedClip.height / 2
          ) {
            adjustedClip.height -= newY - adjustedClip.y;
            adjustedClip.y = newY;
          }
        }

        // Adjust bottom if needed
        if (bottomElements.length > 0) {
          const minTop = Math.min(...bottomElements.map((el) => el.box.y));
          const newHeight = minTop - adjustedClip.y - 10;

          if (newHeight > adjustedClip.height / 2) {
            adjustedClip.height = newHeight;
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
      logger.warn(
        `Invalid clip dimensions, taking full viewport screenshot instead`
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });
    } else {
      // Take the screenshot with the calculated clip area
      logger.info(
        `Taking screenshot with clip: x=${adjustedClip.x}, y=${adjustedClip.y}, width=${adjustedClip.width}, height=${adjustedClip.height}`
      );
      await page.screenshot({ path: screenshotPath, clip: adjustedClip });
    }

    logger.success(`Screenshot saved to: ${screenshotPath}`);
    await manageAnimations(page, "resume", component);
    return true;
  } catch (error) {
    logger.error(`Error capturing ${component.name}: ${error.message}`);
    await manageAnimations(page, "resume", component);
    return false;
  }
}

// Create a tab manager namespace with helper functions
const tabManager = {
  /**
   * Find all framework tabs in a section
   * @param {Page} page - Playwright page
   * @returns {Promise<Array<{name: string, element: ElementHandle, emoji: string}>>}
   */
  findAllTabs: function (page) {
    return (async () => {
      logger.debug("Searching for framework tabs...");

      // Find tabs using multiple strategies
      const tabs = await page.evaluate(() => {
        const results = [];

        // First try data-testid (most reliable approach)
        const testIdTabs = document.querySelectorAll(
          '[data-testid^="jods-framework-tab-"]'
        );
        if (testIdTabs.length > 0) {
          console.log(
            `Found ${testIdTabs.length} framework tabs by data-testid`
          );
          for (const tab of testIdTabs) {
            const name = tab
              .getAttribute("data-testid")
              .replace("jods-framework-tab-", "");
            const emoji =
              name === "react" ? "⚛️" : name === "remix" ? "💿" : "";
            results.push({
              selector: `[data-testid="jods-framework-tab-${name}"]`,
              name,
              emoji,
              isTestId: true,
            });
          }
          return results;
        }

        // Try framework cards
        const frameworkCards = document.querySelectorAll(".framework-card");
        if (frameworkCards.length > 0) {
          console.log(`Found ${frameworkCards.length} framework cards`);
          for (const card of frameworkCards) {
            const cardText = card.textContent;
            let name = "",
              emoji = "";

            if (cardText.includes("React") && !cardText.includes("Preact")) {
              name = "react";
              emoji = "⚛️";
            } else if (cardText.includes("Preact")) {
              name = "preact";
              emoji = "⚛️";
            } else if (cardText.includes("Remix") || cardText.includes("💿")) {
              name = "remix";
              emoji = "💿";
            } else {
              continue; // Unrecognized framework
            }

            results.push({
              selector: `.framework-card:has-text("${
                name === "remix"
                  ? "Remix"
                  : name === "react"
                  ? "React"
                  : "Preact"
              }")`,
              name,
              emoji,
              isCard: true,
            });
          }

          if (results.length > 0) return results;
        }

        // Find by emoji and text
        const buttons = document.querySelectorAll("button");
        for (const button of buttons) {
          const buttonText = button.textContent;
          let name = "",
            emoji = "";

          if (
            (buttonText.includes("React") && !buttonText.includes("Preact")) ||
            buttonText.includes("⚛️")
          ) {
            name = "react";
            emoji = "⚛️";
          } else if (buttonText.includes("Preact")) {
            name = "preact";
            emoji = "⚛️";
          } else if (
            buttonText.includes("Remix") ||
            buttonText.includes("💿")
          ) {
            name = "remix";
            emoji = "💿";
          } else {
            continue;
          }

          results.push({
            selector: `button:has-text("${emoji}")`,
            name,
            emoji,
            isButton: true,
          });
        }

        return results;
      });

      if (tabs.length === 0) {
        logger.warn("No framework tabs could be found on the page");
        return [];
      }

      logger.debug(
        `Found ${tabs.length} framework tabs: ${tabs
          .map((t) => t.name)
          .join(", ")}`
      );
      return tabs;
    })();
  },

  /**
   * Select a specific framework tab by name
   * @param {Page} page - Playwright page
   * @param {string} tabName - Name of the tab to select (react, remix, preact)
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<boolean>} Whether the tab was successfully selected
   */
  selectTab: function (page, tabName, maxRetries = 3) {
    return (async () => {
      logger.info(`Attempting to select ${tabName} tab...`);

      // Find all tabs first
      const tabs = await this.findAllTabs(page);
      const targetTab = tabs.find((tab) => tab.name === tabName.toLowerCase());

      if (!targetTab) {
        logger.warn(`Could not find ${tabName} tab among available tabs`);
        return false;
      }

      // Try to click the tab with retry
      return await retry(
        async () => {
          // First check if already selected
          const isSelected = await this.isTabSelected(page, tabName);
          if (isSelected) {
            logger.success(`${tabName} tab is already selected`);
            return true;
          }

          logger.debug(
            `Clicking ${tabName} tab using selector: ${targetTab.selector}`
          );

          // Use evaluate for more reliable clicking
          const clickResult = await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (!element) return { success: false, error: "Element not found" };

            try {
              element.click();
              return { success: true };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }, targetTab.selector);

          if (!clickResult.success) {
            logger.warn(
              `Failed to click tab in DOM: ${
                clickResult.error || "unknown error"
              }`
            );

            // Fall back to Playwright click
            await page.click(targetTab.selector);
          }

          // Wait for tab change to take effect
          await page.waitForTimeout(1500);

          // Verify tab selection
          const selected = await this.isTabSelected(page, tabName);
          if (!selected) {
            throw new Error(`${tabName} tab still not selected after clicking`);
          }

          logger.success(`Successfully selected ${tabName} tab`);
          return true;
        },
        {
          name: `${tabName} tab selection`,
          retries: maxRetries,
          delay: 800,
        }
      ).catch((error) => {
        logger.error(
          `Failed to select ${tabName} tab after ${maxRetries} attempts: ${error.message}`
        );
        return false;
      });
    })();
  },

  /**
   * Check if a specific tab is currently selected
   * @param {Page} page - Playwright page
   * @param {string} tabName - Name of the tab to check
   * @returns {Promise<boolean>} Whether the tab is selected
   */
  isTabSelected: function (page, tabName) {
    return page.evaluate((name) => {
      // First check by data-testid with aria-selected
      const dataTestIdSelector = `[data-testid='framework-tab-${name.toLowerCase()}'][aria-selected='true'], [data-testid='framework-tab-${name.toLowerCase()}'].active`;
      const selectedByTestId = document.querySelector(dataTestIdSelector);
      if (selectedByTestId) {
        console.log(
          `Tab selected via data-testid: ${selectedByTestId.getAttribute(
            "data-testid"
          )}`
        );
        return true;
      }

      // Method 1: Check for aria-selected attribute
      const buttons = Array.from(
        document.querySelectorAll('button[role="tab"], [role="tab"], button')
      );
      const tabButtons = buttons.filter(
        (btn) =>
          btn.textContent.includes(name) ||
          (name === "Remix" && btn.textContent.includes("💿"))
      );

      for (const btn of tabButtons) {
        // Check aria-selected attribute
        if (btn.getAttribute("aria-selected") === "true") {
          console.log("Tab selected via aria-selected");
          return true;
        }

        // Check for common "selected" classes
        const selectedClasses = [
          "selected",
          "active",
          "current",
          "tabs__item--active",
          "active-tab",
        ];
        if (selectedClasses.some((cls) => btn.className.includes(cls))) {
          console.log("Tab selected via CSS class");
          return true;
        }

        // Check for parent with role="tablist" and child with aria-selected
        const tablist = btn.closest('[role="tablist"]');
        if (tablist) {
          const selectedTab = tablist.querySelector('[aria-selected="true"]');
          if (selectedTab && selectedTab.textContent.includes(name)) {
            console.log("Tab selected via parent tablist");
            return true;
          }
        }

        // Special case: Check if button visually appears selected (has different background color)
        if (name === "Remix") {
          // Get computed style to check if background has changed
          const style = window.getComputedStyle(btn);
          const hasDistinctBackground =
            style.backgroundColor &&
            style.backgroundColor !== "transparent" &&
            style.backgroundColor !== "rgba(0, 0, 0, 0)";

          if (hasDistinctBackground) {
            console.log("Remix tab appears visually selected via background");
            return true;
          }

          // Check if within a visually distinct container (like the magenta square)
          const parent = btn.closest("div, li, span");
          if (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (
              parentStyle.backgroundColor &&
              parentStyle.backgroundColor !== "transparent" &&
              parentStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
            ) {
              console.log("Remix tab appears in visually selected container");
              return true;
            }
          }
        }
      }

      // Method 2: Check for framework card layout with the "active" class
      const frameworkCards = Array.from(
        document.querySelectorAll("div.framework-card")
      );

      // Look for active framework card that matches the tab name
      for (const card of frameworkCards) {
        // Check if this card contains the tab name
        if (
          card.textContent.includes(name) ||
          (name === "Remix" && card.textContent.includes("💿"))
        ) {
          // Check if it has the active class or appears visually selected
          if (card.classList.contains("active")) {
            console.log("Tab selected via framework-card.active class");
            return true;
          }

          // Check if it has a distinct visual style (transformed or elevated)
          const style = window.getComputedStyle(card);
          if (
            style.transform &&
            style.transform !== "none" &&
            style.transform.includes("translate")
          ) {
            console.log("Tab selected via framework card transform style");
            return true;
          }

          // Check if it has a background gradient that looks like selection
          if (
            style.background &&
            (style.background.includes("gradient") ||
              style.background.includes("rgb(184, 29, 91)") ||
              style.background.includes("rgb(233, 30, 99)"))
          ) {
            console.log("Tab selected via framework card background style");
            return true;
          }
        }
      }

      // If we got here, no clear indication of selection
      return false;
    }, tabName);
  },
};

/**
 * Helper: Capture framework tabs
 * @returns {boolean} Whether capturing was successful
 */
async function captureFrameworkTabs(
  page,
  component,
  theme,
  timestamp,
  saveBaseline
) {
  logger.info("Capturing framework tabs...");

  // Find the framework section
  const frameworkSection = await page.$(component.selector);

  if (!frameworkSection) {
    logger.error("Could not find framework section");
    return false;
  }

  // If component has forceReactTabOnly flag, only capture React tab
  if (component.forceReactTabOnly) {
    logger.info("Capturing only React tab due to forceReactTabOnly setting");

    // Select React tab
    const reactTabSelected = await tabManager.selectTab(page, "React", 3);

    if (!reactTabSelected) {
      logger.warn(
        "Could not select React tab, but will attempt to capture anyway"
      );
    }

    // Capture React tab
    return await captureTabScreenshot(
      page,
      frameworkSection,
      null, // No need for tabButton anymore
      "react",
      component,
      theme,
      timestamp,
      saveBaseline
    );
  }

  // Default behavior: capture multiple tabs
  // Get available tabs
  const tabsInfo = await tabManager.findAllTabs(page);

  if (tabsInfo.length === 0) {
    logger.error("No framework tabs found on page");
    return false;
  }

  // Determine which tabs to capture
  let tabsToCaptureNames = [];

  if (component.captureTabs) {
    // Specific tabs requested in component config
    tabsToCaptureNames = component.captureTabs;
  } else {
    // Default: capture all tabs found
    tabsToCaptureNames = tabsInfo.map((tab) => tab.name);
  }

  logger.info(`Will capture tabs: ${tabsToCaptureNames.join(", ")}`);

  // Track success
  let capturedAny = false;

  // Prioritize Remix tab first if requested
  if (component.captureRemixFirst && tabsToCaptureNames.includes("remix")) {
    // Move Remix to the beginning
    tabsToCaptureNames = [
      "remix",
      ...tabsToCaptureNames.filter((name) => name !== "remix"),
    ];
  }

  // Capture each tab
  for (const tabName of tabsToCaptureNames) {
    try {
      // Select the tab
      const tabSelected = await tabManager.selectTab(page, tabName, 3);

      if (!tabSelected) {
        logger.warn(`Could not select ${tabName} tab, skipping`);
        continue;
      }

      // Determine final tab ID for filename
      let finalTabId = tabName;

      // Apply special handling based on component config
      if (component.forceSaveAsReact) {
        finalTabId = "react";
      } else if (component.name === "framework-section") {
        // For framework section, always use 'react' as the identifier
        finalTabId = "react";
      }

      // Capture screenshot for this tab
      const tabSuccess = await captureTabScreenshot(
        page,
        frameworkSection,
        null, // No need for tabButton anymore
        finalTabId,
        component,
        theme,
        timestamp,
        saveBaseline
      );

      if (tabSuccess) {
        capturedAny = true;
      }

      // If this is the Remix tab and React tab couldn't be found, create a React file too
      if (finalTabId === "remix" && component.simulateReactTab) {
        const reactPath = path.join(
          directories.unified,
          `${component.name}-react-${theme}${
            saveBaseline ? "" : "-" + timestamp
          }.png`
        );

        const screenshotPath = path.join(
          directories.unified,
          `${component.name}-${finalTabId}-${theme}${
            saveBaseline ? "" : "-" + timestamp
          }.png`
        );

        try {
          // Copy the file to create a React version
          fs.copyFileSync(screenshotPath, reactPath);
          logger.success(
            `Created simulated React tab screenshot: ${reactPath}`
          );
        } catch (error) {
          logger.error(`Error creating simulated React tab: ${error.message}`);
        }
      }
    } catch (error) {
      logger.error(`Error capturing ${tabName} tab: ${error.message}`);
    }
  }

  // Return true if we captured at least one tab successfully
  return capturedAny;
}

/**
 * Helper: Capture a single framework tab screenshot
 * @returns {boolean} Whether the capture was successful
 */
async function captureTabScreenshot(
  page,
  frameworkSection,
  tabButton, // This is now optional as tabManager handles selection
  tabIdentifier,
  component,
  theme,
  timestamp,
  saveBaseline
) {
  try {
    logger.info(`Capturing ${tabIdentifier} tab screenshot...`);

    // Pause animations if specified in the component config
    await manageAnimations(page, "pause", component);

    // Extra wait for dark mode if needed
    if (theme === "dark" && component.darkModeExtraWait) {
      logger.debug(
        `Adding extra wait time for ${tabIdentifier} tab in dark mode: ${component.darkModeExtraWait}ms`
      );
      await page.waitForTimeout(component.darkModeExtraWait);
    }

    // Special handling for Remix tab in light mode
    const isRemixTab = tabIdentifier.includes("remix");

    if (isRemixTab && theme === "light") {
      logger.debug("Special handling for Remix tab in light mode");

      // Special positioning for Remix tab
      await page.evaluate(() => {
        // Find the heading
        const frameworkHeading = Array.from(
          document.querySelectorAll("h2")
        ).find(
          (h) =>
            h.textContent.includes("Works with your favorite frameworks") ||
            h.textContent.includes("Framework Integration")
        );

        if (frameworkHeading) {
          console.log(
            "Found framework heading, scrolling to position it at top"
          );
          // Calculate position to show heading at top with more margin
          const rect = frameworkHeading.getBoundingClientRect();
          const scrollOffset = window.scrollY + rect.top - 250;
          window.scrollTo(0, scrollOffset);
          return true;
        }
        return false;
      });
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

    if (!updatedBoundingBox) {
      logger.warn("Could not get framework section bounding box");
      return false;
    }

    // Calculate clip area
    const padding = component.padding || 40;
    const clip = {
      x: Math.max(0, updatedBoundingBox.x - padding),
      y: Math.max(0, updatedBoundingBox.y - padding * 2),
      width: Math.min(
        page.viewportSize().width - Math.max(0, updatedBoundingBox.x - padding),
        updatedBoundingBox.width + padding * 2
      ),
      height: Math.max(
        updatedBoundingBox.height + padding * 3,
        component.minHeight || 0
      ),
    };

    // Make sure we don't exceed the page dimensions
    if (clip.y + clip.height > page.viewportSize().height) {
      clip.height = page.viewportSize().height - clip.y - 10;
    }

    // Verify clip dimensions are positive
    if (clip.width <= 0 || clip.height <= 0) {
      logger.error(
        `Invalid clip dimensions: width=${clip.width}, height=${clip.height}`
      );
      return false;
    }

    // Take the screenshot
    const screenshotPath = path.join(
      directories.unified,
      `${component.name}-${tabIdentifier}-${theme}${
        saveBaseline ? "" : "-" + timestamp
      }.png`
    );

    await page.screenshot({
      path: screenshotPath,
      clip,
    });

    logger.success(`Framework tab screenshot saved to: ${screenshotPath}`);

    // Resume animations if they were paused
    await manageAnimations(page, "resume", component);

    return true;
  } catch (error) {
    logger.error(`Error capturing ${tabIdentifier} tab: ${error.message}`);

    // Resume animations even if the screenshot failed
    try {
      await manageAnimations(page, "resume", component);
    } catch (e) {
      // Ignore errors in animation resuming
    }

    return false;
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

// Update the CLI argument parsing logic for a cleaner interface
// Parse command line arguments
function parseCliArgs() {
  const args = process.argv.slice(2);

  return {
    saveBaseline: args.includes("--baseline"),
    useGeneratedSelectors: args.includes("--use-generated-selectors"),
    mergeSelectors: args.includes("--merge-selectors"),
    mode: args.find((arg) => arg.startsWith("--mode="))?.split("=")[1] || "all",
    specificComponents: args.find((arg) => arg.startsWith("--components="))
      ? args
          .find((arg) => arg.startsWith("--components="))
          .split("=")[1]
          .split(",")
      : [],
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  };
}

// Use the CLI args at the bottom of the file
const cliArgs = parseCliArgs();

// Run the screenshot function
takeUnifiedScreenshots(
  cliArgs.mode,
  getTimestamp(),
  cliArgs.saveBaseline,
  cliArgs.specificComponents
).catch((error) => {
  console.error("Error taking screenshots:", error);
  process.exit(1);
});

export { takeUnifiedScreenshots };
