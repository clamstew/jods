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
    // Specific named components - this should take priority over mode
    logger.info(
      `Filtering to specific components: ${specificComponents.join(", ")}`
    );
    componentsToCapture = componentsToUse.filter((component) =>
      specificComponents.includes(component.name)
    );
  } else if (mode === "all" || mode === "components") {
    // Capture all components (both "all" and "components" modes do the same thing)
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

  // Launch browser with error handling
  let browser;
  let context;
  let page;

  try {
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: { width: 1280, height: 2000 }, // Increased height from 1600 to 2000
    });

    page = await context.newPage();

    // Set up error handling for page events
    page.on("pageerror", (exception) => {
      logger.warn(`Page error: ${exception.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logger.debug(`Console error: ${msg.text()}`);
      } else if (DEBUG) {
        logger.debug(`Console ${msg.type()}: ${msg.text()}`);
      }
    });
  } catch (error) {
    logger.error(`Failed to launch browser: ${error.message}`);
    throw error;
  }

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

      // Go to the page with retry for better reliability
      try {
        await retry(
          () => page.goto(url, { waitUntil: "networkidle", timeout: 30000 }),
          {
            name: "Page navigation",
            retries: 3,
            onSuccess: () => logger.success(`Successfully loaded ${url}`),
          }
        );

        // Wait additional time for animations and dynamic content
        await page.waitForTimeout(2000);
      } catch (error) {
        logger.error(
          `Failed to navigate to ${url} after multiple attempts. Skipping components on this page.`
        );

        // Mark all components on this page as skipped
        for (const component of pageComponents) {
          stats.skipped += THEMES.length;
          stats.componentResults[component.name] = {
            status: "skipped",
            reason: "navigation_failed",
          };
        }

        continue; // Skip to the next page
      }

      // Capture screenshots for each theme
      for (const theme of THEMES) {
        logger.info(`\n🎨 Capturing ${theme} theme`);

        // Set the theme with retry
        try {
          await retry(() => setTheme(page, theme, pageComponents[0]), {
            name: `Theme setting (${theme})`,
            retries: 2,
          });
        } catch (error) {
          logger.error(
            `Failed to set ${theme} theme after multiple attempts. Using whatever theme is currently active.`
          );
        }

        // Take screenshots of each component on this page
        for (const component of pageComponents) {
          try {
            logger.info(`\n📸 Capturing ${component.name} component...`);
            stats.componentResults[component.name] =
              stats.componentResults[component.name] || {};

            // Wait for specific selector if provided
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

            // Special handling for framework tabs if needed
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
              continue; // Skip normal screenshot handling
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
            const elementHandle = await findElementForComponent(
              page,
              component
            );

            if (elementHandle) {
              // Capture HTML debug info for the component
              if (component.captureHtmlDebug !== false) {
                await captureComponentHtml(
                  page,
                  component,
                  elementHandle,
                  theme
                );
              }

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
              logger.warn(
                `Could not find element for ${component.name}, taking viewport screenshot as fallback`
              );

              // Take viewport screenshot as fallback
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
            logger.error(
              `Error capturing ${component.name} in ${theme} theme: ${error.message}`
            );
            stats.failed++;
            stats.componentResults[component.name][theme] = "error";

            // Create error screenshot to help with debugging if possible
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
    logger.error(`Fatal error in screenshot process: ${error.message}`);

    // Try to save an error screenshot if possible
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
    // Close browser
    if (browser) {
      await browser.close();
    }

    // Generate summary report
    logger.info("\n📊 Screenshot Results Summary:");
    logger.info(`Total components: ${stats.total}`);
    logger.info(`✅ Successful: ${stats.successful}`);
    logger.info(`❌ Failed: ${stats.failed}`);
    logger.info(`⏭️ Skipped: ${stats.skipped}`);

    // Generate detailed report of failed components
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
  // Skip if no action needed
  if (action !== "pause" && action !== "resume") return;

  // Determine if we should proceed based on component settings
  const shouldPause =
    action === "pause" && (!component || component.pauseAnimations);
  const shouldResume =
    action === "resume" && (!component || component.pauseAnimations);

  if (!shouldPause && !shouldResume) return;

  console.log(
    `${
      action === "pause" ? "Pausing" : "Resuming"
    } animations for consistent screenshots...`
  );

  // Component-specific animation handling
  const options = {
    particleBackground: component?.particleBackground || false,
    sparkleEffects: component?.name?.includes("remix") || false,
    transitionEffects: true, // Always handle transitions
  };

  await page.evaluate(
    (params) => {
      const { action, options } = params;
      const pausing = action === "pause";

      // Create or find the style element
      let style = document.getElementById("animation-control-for-screenshots");
      if (!style) {
        style = document.createElement("style");
        style.id = "animation-control-for-screenshots";
        document.head.appendChild(style);
      }

      // Build CSS based on options
      let css = "";

      // Base animation and transition freezing
      if (pausing) {
        css += `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      }

      // Handle particle backgrounds
      if (options.particleBackground) {
        css += `
        canvas.particles-js-canvas-el,
        canvas.tsparticles-canvas-el, 
        canvas[id^="tsparticles"],
        .particles-container canvas {
          opacity: ${pausing ? "0" : "1"} !important;
        }
      `;
      }

      // Handle sparkle effects (common in Remix sections)
      if (options.sparkleEffects) {
        css += `
        [class*="sparkle"],
        [class*="glitter"],
        [class*="shine"],
        [class*="twinkle"],
        [data-effect="sparkle"] {
          opacity: ${pausing ? "0" : "1"} !important;
        }
      `;
      }

      // Update the style
      style.textContent = pausing ? css : "";
    },
    { action, options }
  );

  // Wait for style changes to take effect
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
    // Pause animations if specified in the component config
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

    // Debug element position
    logger.debug(
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
      logger.info(
        `Clicking element matching selector: ${component.clickSelector}`
      );
      try {
        // Try to find and click the element
        const clickResult = await page.evaluate((tabName) => {
          // First try by data-testid (most reliable)
          const testIdSelector = `[data-testid='framework-tab-${tabName.toLowerCase()}']`;
          const elementByTestId = document.querySelector(testIdSelector);
          if (elementByTestId) {
            console.log(`Found element by data-testid: ${testIdSelector}`);
            elementByTestId.click();
            return { success: true, method: "data-testid-click" };
          }

          // Then try to find the Remix card by its specific styles and content
          const frameworkCards = Array.from(
            document.querySelectorAll(
              'div.framework-card, div[style*="cursor: pointer"][style*="padding"][style*="gradient"]'
            )
          );

          // Look for the card with Remix content or CD emoji
          for (const card of frameworkCards) {
            if (
              card.textContent.includes(tabName) ||
              (tabName === "Remix" && card.textContent.includes("💿"))
            ) {
              console.log(`Found ${tabName} card with gradient styling`);
              // Click the card
              card.click();
              return { success: true, method: "direct-card-click" };
            }
          }

          // If we couldn't find it by style, try by emoji
          const emojiSelector =
            tabName === "Remix"
              ? 'div:has(div:has-text("💿"))'
              : tabName === "React"
              ? 'div:has(div:has-text("⚛️"))'
              : "";

          if (emojiSelector) {
            const emojis = Array.from(document.querySelectorAll(emojiSelector));
            if (emojis.length > 0) {
              const closestCard = emojis[0].closest(
                'div[style*="cursor: pointer"]'
              );
              if (closestCard) {
                console.log(`Found ${tabName} card via emoji`);
                closestCard.click();
                return { success: true, method: "emoji-parent-click" };
              }

              // Try clicking the emoji container itself
              console.log(`Clicking directly on ${tabName} emoji container`);
              emojis[0].click();
              return { success: true, method: "emoji-click" };
            }
          }

          // Couldn't find it with any method
          return { success: false };
        }, component.verifyTabName || "Remix");

        // If the direct DOM click didn't work, fall back to traditional click
        if (!clickResult || !clickResult.success) {
          logger.warn(
            "Direct DOM click didn't succeed, falling back to traditional click"
          );

          // Use retry for more reliability
          await retry(() => page.click(component.clickSelector), {
            name: "Element click",
            retries: 2,
            onSuccess: () => logger.success("Traditional click succeeded"),
          });
        } else {
          logger.success(`Successfully clicked tab via ${clickResult.method}`);
        }

        // Wait for content to update after clicking
        const waitTime = component.clickWaitTime || 1000;
        logger.debug(
          `Waiting ${waitTime}ms for content to update after click...`
        );
        await page.waitForTimeout(waitTime);

        // Verify tab selection if required
        if (component.verifyTabSelected) {
          logger.info(
            `Verifying ${component.verifyTabName} tab is selected...`
          );

          // Verify the tab is selected
          let isTabSelected = await verifyTabIsSelected(page, component);
          let retryCount = 0;
          const maxRetries = component.retryTabSelection || 2;

          // Retry clicking the tab if not selected
          while (!isTabSelected && retryCount < maxRetries) {
            logger.warn(
              `Tab not selected, retrying click (${
                retryCount + 1
              }/${maxRetries})...`
            );

            // Try a more direct clicking approach with retry
            await retry(
              () =>
                page.evaluate((tabName) => {
                  // First try by data-testid (most reliable)
                  const testIdSelector = `[data-testid='framework-tab-${tabName.toLowerCase()}']`;
                  const elementByTestId =
                    document.querySelector(testIdSelector);
                  if (elementByTestId) {
                    console.log(
                      `Found element by data-testid: ${testIdSelector}, clicking it`
                    );
                    elementByTestId.click();
                    return true;
                  }

                  // Then try specific Remix card with active class
                  const frameworkCards = Array.from(
                    document.querySelectorAll(
                      'div.framework-card, div[style*="cursor: pointer"][style*="padding"][style*="gradient"]'
                    )
                  );
                  const targetCard = frameworkCards.find(
                    (card) =>
                      card.textContent.includes(tabName) ||
                      (tabName === "Remix" && card.textContent.includes("💿"))
                  );

                  if (targetCard) {
                    console.log(`Found ${tabName} card, attempting click`);
                    targetCard.click();
                    return true;
                  }

                  // Try finding by emoji
                  const emojiSelector =
                    tabName === "Remix"
                      ? 'div:has-text("💿")'
                      : tabName === "React"
                      ? 'div:has-text("⚛️")'
                      : "";
                  if (emojiSelector) {
                    const emojiElement = document.querySelector(emojiSelector);
                    if (emojiElement) {
                      const cardParent = emojiElement.closest(
                        'div[style*="cursor: pointer"]'
                      );
                      if (cardParent) {
                        console.log(
                          `Found ${tabName} card via emoji, clicking parent`
                        );
                        cardParent.click();
                        return true;
                      }

                      // Click on emoji itself
                      console.log(`Clicking directly on ${tabName} emoji`);
                      emojiElement.click();
                      return true;
                    }
                  }

                  // Try original approach as fallback
                  const buttons = Array.from(
                    document.querySelectorAll("button")
                  );
                  const targetButtons = buttons.filter(
                    (btn) =>
                      btn.textContent.includes(tabName) ||
                      (tabName === "Remix" && btn.textContent.includes("💿")) ||
                      (tabName === "React" && btn.textContent.includes("⚛️"))
                  );

                  if (targetButtons.length > 0) {
                    console.log(
                      `Found ${targetButtons.length} ${tabName} buttons, clicking the first one...`
                    );
                    targetButtons[0].click();
                    return true;
                  }

                  return false;
                }, component.verifyTabName || "Remix"),
              { name: "Tab selection", retries: 2 }
            );

            await page.waitForTimeout(1000); // Wait after retry click

            // Check again
            isTabSelected = await verifyTabIsSelected(page, component);
            retryCount++;
          }

          if (isTabSelected) {
            logger.success(
              `${component.verifyTabName} tab successfully selected!`
            );
          } else {
            logger.warn(
              `Could not verify ${component.verifyTabName} tab selection after ${maxRetries} retries`
            );
          }
        }

        // Special handling for Remix tab to ensure proper scrolling
        if (component.name === "framework-section-remix") {
          logger.debug("Special handling for Remix tab...");
          await page.evaluate(() => {
            // Find the framework section
            const sections = Array.from(document.querySelectorAll("section"));
            const frameworkSection = sections.find((section) => {
              // Look for headings in this section
              const headings = Array.from(section.querySelectorAll("h2"));
              return headings.some(
                (h) =>
                  h.textContent.includes(
                    "Works with your favorite frameworks"
                  ) || h.textContent.includes("Framework Integration")
              );
            });

            if (frameworkSection) {
              // Calculate position to show the entire section
              const rect = frameworkSection.getBoundingClientRect();
              // Scroll to show from the top of the section with just enough room for the fixed header
              const headerHeight =
                document.querySelector("header")?.offsetHeight || 70;
              window.scrollTo(0, window.scrollY + rect.top - headerHeight - 50);
            }
          });

          // Wait for scroll to complete
          await page.waitForTimeout(800);
        }

        // Re-scroll to ensure element is still in view after click
        await elementHandle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
      } catch (error) {
        logger.error(`Error clicking element: ${error.message}`);
      }
    }

    // Get updated position after scrolling
    const updatedBoundingBox = await elementHandle.boundingBox();

    if (!updatedBoundingBox) {
      logger.warn(`Element disappeared after scrolling for ${component.name}`);
      return false;
    }

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
      logger.debug(
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
            logger.debug(
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
        logger.debug(
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
            logger.debug(
              `Adjusted top of clip to exclude elements, new y=${adjustedClip.y}`
            );
          }
        }

        if (bottomExclusions.length > 0) {
          // Find the highest top edge of bottom exclusions
          const minTop = Math.min(
            ...bottomExclusions.map((item) => item.box.y)
          );

          // Adjust clip area from the bottom
          const newHeight = minTop - adjustedClip.y - 10; // Subtract small gap
          if (newHeight > adjustedClip.height / 2) {
            // Ensure we don't cut off too much
            adjustedClip.height = newHeight;
            logger.debug(
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
      logger.error(
        `Invalid clip dimensions: width=${adjustedClip.width}, height=${adjustedClip.height}`
      );
      logger.info(`Taking full viewport screenshot instead`);

      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
      });
    } else {
      // Take the screenshot with the calculated clip area
      logger.info(
        `Taking screenshot with clip: x=${adjustedClip.x}, y=${adjustedClip.y}, width=${adjustedClip.width}, height=${adjustedClip.height}`
      );

      await page.screenshot({
        path: screenshotPath,
        clip: adjustedClip,
      });
    }

    logger.success(`Screenshot saved to: ${screenshotPath}`);

    // Resume animations if they were paused
    await manageAnimations(page, "resume", component);

    return true;
  } catch (error) {
    logger.error(`Error capturing ${component.name}: ${error.message}`);

    // Resume animations even if the screenshot failed
    try {
      await manageAnimations(page, "resume", component);
    } catch (e) {
      // Ignore errors in animation resuming
    }

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
      const testIdSelector = `[data-testid="jods-framework-tab-${name.toLowerCase()}"]`;
      const elementByTestId = document.querySelector(testIdSelector);
      if (
        elementByTestId &&
        elementByTestId.getAttribute("aria-selected") === "true"
      ) {
        console.log(`Tab selected via data-testid and aria-selected`);
        return true;
      }

      // Next, check for selected class or gradient background
      const possibleTabs = [];

      // Collect all possible elements
      if (name.toLowerCase() === "react") {
        possibleTabs.push(
          ...Array.from(
            document.querySelectorAll(
              '.framework-card:has-text("React"), button:has-text("React"), button:has-text("⚛️")'
            )
          )
        );
      } else if (name.toLowerCase() === "remix") {
        possibleTabs.push(
          ...Array.from(
            document.querySelectorAll(
              '.framework-card:has-text("Remix"), button:has-text("Remix"), button:has-text("💿")'
            )
          )
        );
      } else if (name.toLowerCase() === "preact") {
        possibleTabs.push(
          ...Array.from(
            document.querySelectorAll(
              '.framework-card:has-text("Preact"), button:has-text("Preact")'
            )
          )
        );
      }

      // Check if any of these tabs appears to be selected
      for (const tab of possibleTabs) {
        // Check active class
        if (
          tab.classList.contains("active") ||
          tab.classList.contains("selected") ||
          tab.getAttribute("aria-selected") === "true"
        ) {
          console.log(`Tab selected via active/selected class`);
          return true;
        }

        // Check for gradient background (common in styled components)
        const style = window.getComputedStyle(tab);
        if (
          style.background.includes("gradient") ||
          style.background.includes("rgba")
        ) {
          console.log(`Tab selected via background style`);
          return true;
        }

        // Check for transform
        if (style.transform && style.transform !== "none") {
          console.log(`Tab selected via transform`);
          return true;
        }
      }

      // Not clearly selected
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

// New helper function to verify tab selection
async function verifyTabIsSelected(page, component) {
  // Try multiple approaches to verify tab selection
  const tabName = component.verifyTabName || "Remix";

  try {
    return await page.evaluate((name) => {
      // Method 0: Check for data-testid first (most reliable)
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
  } catch (error) {
    console.log(`Error verifying tab selection: ${error.message}`);
    return false;
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
