// Unified Screenshot Script
// This script combines the functionality of screenshot-component.mjs,
// homepage-sections.mjs, and remix-section.mjs into a single script with different modes

import { chromium } from "@playwright/test";
import path from "path";
import {
  COMPONENTS,
  findRemixSection,
  getComponentByName,
  getAllComponentNames,
} from "./screenshot-selectors.mjs";
import {
  setupEnvironment,
  setupLogger,
  setupRetry,
  getConfiguration,
  measureTime,
  safeFileOperation,
  ensureDirectoryExists,
} from "./screenshot-utils.mjs";
import { captureManager } from "./screenshot-capture.mjs";
import { fileURLToPath } from "url";
import fs from "fs";

// Initialize environment and utilities with memoization
const { directories, BASE_URL, PATH_PREFIX, THEMES, getTimestamp, DEBUG } =
  setupEnvironment();

// Initialize the logger
const logger = setupLogger(DEBUG);

// Setup retry utility
const retry = setupRetry(logger);

// Get configuration
const config = getConfiguration();

/**
 * Map simplified component names to their full names with numeric prefixes
 * @param {string} simpleName - Simplified component name (e.g., "try-jods-section")
 * @param {Array} components - Available components
 * @returns {string} Full component name with prefix or original if not found
 */
function mapSimplifiedName(simpleName, components) {
  // If the name already has a numeric prefix (e.g., "03-try-jods-section"), return it as is
  if (/^\d{2}-/.test(simpleName)) {
    return simpleName;
  }

  // Map of simplified names to their prefixed counterparts
  const knownMappings = {
    "hero-section": "01-hero-section",
    "features-section": "02-features-section",
    "try-jods-section": "03-try-jods-section",
    "framework-section-react": "04-framework-section-react",
    "framework-section-remix": "04-framework-section-remix",
    "remix-section": "05-remix-section",
    "compare-section": "06-compare-section",
    "footer-section": "07-footer-section",
  };

  // Check if we have a direct mapping
  if (knownMappings[simpleName]) {
    logger.info(
      `Mapped simplified name "${simpleName}" to "${knownMappings[simpleName]}"`
    );
    return knownMappings[simpleName];
  }

  // If no direct mapping, search through components for a match
  for (const component of components) {
    // Strip numeric prefix from component name
    const strippedName = component.name.replace(/^\d{2}-/, "");
    if (strippedName === simpleName) {
      logger.info(
        `Mapped simplified name "${simpleName}" to "${component.name}"`
      );
      return component.name;
    }
  }

  // If no mapping found, return original name
  logger.warn(
    `No mapping found for simplified name "${simpleName}", using as is`
  );
  return simpleName;
}

/**
 * Load components from available sources
 * @param {boolean} useGeneratedSelectors - Whether to use generated selectors
 * @param {boolean} mergeSelectors - Whether to merge with existing selectors
 * @returns {Array} Array of component configurations
 */
async function loadComponents(
  useGeneratedSelectors = false,
  mergeSelectors = false
) {
  // Track component loading time
  return await measureTime(
    async () => {
      let componentsToUse = COMPONENTS;

      try {
        // Check if the generated selectors file exists and if the flag is set
        if (useGeneratedSelectors) {
          // Try to import the generated selectors
          try {
            const { GENERATED_COMPONENTS, mergeWithExisting } = await import(
              "./screenshot-selectors.generated.mjs"
            ).catch((error) => {
              logger.warn(
                `Could not import generated selectors: ${error.message}`
              );
              return { GENERATED_COMPONENTS: [], mergeWithExisting: () => [] };
            });

            logger.info(
              `🔄 Loading ${GENERATED_COMPONENTS.length} generated selectors from data-testids`
            );

            // Decide if we should merge or replace
            if (mergeSelectors) {
              // Merge with existing selectors
              componentsToUse = mergeWithExisting(COMPONENTS);
              logger.info(
                `🔄 Merged with existing selectors - ${componentsToUse.length} total components`
              );
            } else {
              // Just use the generated selectors
              componentsToUse = GENERATED_COMPONENTS;
              logger.info(
                `🔄 Using ${componentsToUse.length} generated selectors exclusively`
              );
            }
          } catch (error) {
            logger.warn(
              `⚠️ No generated selectors found or error loading them: ${error.message}`
            );
            logger.info(`ℹ️ Using default component selectors`);
          }
        }
      } catch (error) {
        logger.warn(`⚠️ Error in component loading: ${error.message}`);
        logger.info(`ℹ️ Using default component selectors`);
      }

      // Cache component data for faster access
      if (config.memoizationEnabled) {
        componentsToUse.forEach((component) => {
          component._selectorCache = new Map();
        });
      }

      return componentsToUse;
    },
    logger,
    "Loading components"
  );
}

/**
 * Select components to capture based on mode and options
 * @param {Array} components - Available components
 * @param {string} mode - Capture mode
 * @param {Array} specificComponents - Specific component names to capture
 * @param {boolean} skipOtherSections - Whether to skip sections not specified
 * @returns {Array} Components to capture
 */
function selectComponents(
  components,
  mode,
  specificComponents = [],
  skipOtherSections = false
) {
  let componentsToCapture = [];

  if (specificComponents && specificComponents.length > 0) {
    // Map any simplified component names to their full names with prefixes
    const mappedComponents = specificComponents.map((name) =>
      mapSimplifiedName(name, components)
    );

    // Specific named components take priority
    componentsToCapture = components.filter((component) =>
      mappedComponents.includes(component.name)
    );

    // Check if any components weren't found
    const missingComponents = mappedComponents.filter(
      (name) => !componentsToCapture.some((comp) => comp.name === name)
    );

    if (missingComponents.length > 0) {
      logger.warn(
        `Could not find these components: ${missingComponents.join(", ")}`
      );
    }

    // If skipOtherSections is true, we're done - only return the specified components
    if (skipOtherSections) {
      return componentsToCapture;
    }
  }

  // Only continue to these other modes if we haven't found specific components or skipOtherSections is false
  if (componentsToCapture.length === 0) {
    if (mode === "all" || mode === "components") {
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
    } else if (mode === "remix") {
      // Only the Remix section
      componentsToCapture = components.filter(
        (component) => component.name === "remix-section"
      );
    } else {
      // Try to interpret mode as a specific component name (with prefix mapping)
      const mappedMode = mapSimplifiedName(mode, components);
      const component = getComponentByName(mappedMode, components);
      if (component) {
        componentsToCapture = [component];
      }
    }
  }

  return componentsToCapture;
}

/**
 * Group components by page for efficient navigation
 * @param {Array} components - Components to group
 * @returns {Object} Components grouped by page path
 */
function groupComponentsByPage(components) {
  return components.reduce((groups, component) => {
    const page = component.page || "/";
    groups[page] = groups[page] || [];
    groups[page].push(component);
    return groups;
  }, {});
}

/**
 * Initialize browser and page with enhanced error recovery
 * @returns {Object} Browser and page objects
 */
async function initBrowser() {
  // Create a more resilient browser launch process
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      logger.info(`Launching browser (attempt ${attempt}/${maxRetries})...`);

      // Launch browser with configurable options
      const browser = await chromium
        .launch({
          // Add optional Chrome arguments for better stability
          args: DEBUG ? ["--disable-gpu", "--no-sandbox"] : undefined,
        })
        .catch((error) => {
          throw new Error(`Browser launch failed: ${error.message}`);
        });

      // Create a context with larger viewport
      const context = await browser.newContext({
        viewport: { width: 1280, height: 2000 },
        // Increase default timeout for navigation
        navigationTimeout: config.navigationTimeout || 30000,
      });

      const page = await context.newPage();

      // Set up error handling for page events
      page.on("pageerror", (exception) =>
        logger.warn(`Page error: ${exception.message}`)
      );
      page.on("console", (msg) => {
        if (msg.type() === "error")
          logger.debug(`Console error: ${msg.text()}`);
        else if (DEBUG) logger.debug(`Console ${msg.type()}: ${msg.text()}`);
      });

      // Add additional recovery and instrumentation
      context.setDefaultTimeout(config.elementTimeout || 5000);

      logger.success("Browser initialized successfully");
      return { browser, page };
    } catch (error) {
      logger.error(
        `Browser initialization error (attempt ${attempt}): ${error.message}`,
        error
      );

      if (attempt < maxRetries) {
        // Wait before retrying with increasing backoff
        const waitTime = 1000 * Math.pow(2, attempt - 1);
        logger.info(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        logger.error(
          `Failed to initialize browser after ${maxRetries} attempts`
        );
        throw error;
      }
    }
  }
}

/**
 * Navigate to a page with retry and enhanced error handling
 * @param {Page} page - Playwright page
 * @param {string} url - URL to navigate to
 * @returns {boolean} Whether navigation was successful
 */
async function navigateToPage(page, url) {
  let navigationSuccess = false;

  try {
    await retry(
      () =>
        page.goto(url, {
          waitUntil: "networkidle",
          timeout: 60000,
        }),
      {
        name: "Page navigation",
        retries: 3,
        onSuccess: (_, attempt, duration) => {
          navigationSuccess = true;
          logger.success(
            `Successfully loaded ${url} (attempt ${attempt}, ${duration}ms)`
          );
        },
        onFailure: (error, duration) => {
          logger.error(
            `Failed to navigate to ${url} after multiple attempts (${duration}ms). Error: ${error.message}`,
            error
          );
        },
      }
    );

    if (navigationSuccess) {
      // Wait additional time for page to stabilize and render
      await page.waitForTimeout(3000);

      // Check for any critical error indicators on the page
      const hasPageError = await page.evaluate(() => {
        // Check for common error indicators
        const errorElements = document.querySelectorAll(
          '.error-page, .error-message, [data-testid="error-message"], [class*="error"]'
        );

        // Filter visible error elements
        return Array.from(errorElements).some(
          (el) =>
            el.offsetParent !== null &&
            (el.textContent.includes("Error") ||
              el.textContent.includes("Failed"))
        );
      });

      if (hasPageError) {
        logger.warn(`Possible error state detected on page: ${url}`);
        // Still continue as this might be a false positive
      }
    }

    return navigationSuccess;
  } catch (error) {
    logger.error(
      `Unhandled navigation error for ${url}: ${error.message}`,
      error
    );

    // Take screenshot of error state
    safeFileOperation(
      () =>
        page.screenshot({
          path: path.join(
            directories.debug,
            `navigation-error-${getTimestamp()}.png`
          ),
          fullPage: false,
        }),
      { description: "taking error screenshot", logger }
    );

    return false;
  }
}

/**
 * Process a component for a specific theme
 * @param {Page} page - Playwright page
 * @param {Object} component - Component to capture
 * @param {string} theme - Theme name
 * @param {string} timestamp - Timestamp for filename
 * @param {boolean} saveBaseline - Whether to save as baseline
 * @param {string} outputDir - Output directory for screenshots
 * @param {Object} stats - Statistics tracking object
 * @returns {boolean} Whether capture was successful
 */
async function processComponentForTheme(
  page,
  component,
  theme,
  timestamp,
  saveBaseline,
  outputDir,
  stats
) {
  logger.group(`Processing ${component.name} in ${theme} theme`);

  try {
    logger.info(`\n📸 Capturing ${component.name} component...`);
    stats.componentResults[component.name] =
      stats.componentResults[component.name] || {};

    // Track the time for this component's processing
    const timerId = logger.startTimer(`${component.name}-${theme}`);

    // Scroll to component to ensure it's in view
    try {
      await page.evaluate((componentName) => {
        // Try to find component by various means (data-testid, id, etc.)
        const selectors = [
          `[data-testid="${componentName}"]`,
          `[data-component="${componentName}"]`,
          `#${componentName}`,
          `.${componentName}`,
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            return true;
          }
        }

        return false;
      }, component.name);
    } catch (err) {
      logger.debug(`Error scrolling to component: ${err.message}`);
    }

    // Wait for any animations or transitions to complete
    await page.waitForTimeout(2000);

    // Wait for component selector if specified
    if (component.waitForSelector) {
      try {
        await page.waitForSelector(component.waitForSelector, {
          timeout: 8000,
          state: "attached",
        });
      } catch (e) {
        logger.warn(
          `Could not find wait selector for ${component.name}: ${e.message}`
        );
      }
    }

    // Record the outcome of the processing
    let processingResult = false;

    // Handle framework tabs (React/Remix) if needed
    if (component.captureFrameworkTabs && component.frameworkTabs) {
      processingResult = await captureManager.captureFrameworkTabs(
        page,
        component,
        theme,
        timestamp,
        saveBaseline,
        outputDir
      );
    }
    // Special handling for Remix section
    else if (component.name === "remix-section") {
      const remixElement = await findRemixSection(page);
      if (remixElement) {
        processingResult = await captureManager.captureSpecificElement(
          page,
          remixElement,
          component,
          theme,
          timestamp,
          saveBaseline,
          outputDir
        );
      }
    }
    // Handle special positioning for compare section
    else if (component.name === "compare-section") {
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
            current.scrollIntoView({ block: "start", behavior: "smooth" });
          }
        }
      });
      await page.waitForTimeout(1000);

      // Handle scrolling with better error handling
      try {
        await page.evaluate(() => window.scrollBy(0, 300));
        await page.waitForTimeout(1000);
      } catch (scrollError) {
        logger.warn(`Error during scrolling: ${scrollError.message}`);
        // Continue anyway
      }

      // Now find and screenshot the element
      const compareElement = await captureManager.findElementForComponent(
        page,
        component
      );
      if (compareElement) {
        processingResult = await captureManager.captureSpecificElement(
          page,
          compareElement,
          component,
          theme,
          timestamp,
          saveBaseline,
          outputDir
        );
      }
    }
    // Regular component processing
    else {
      // Find the element to screenshot
      const elementHandle = await captureManager.findElementForComponent(
        page,
        component
      );

      if (elementHandle) {
        // Capture HTML debug info if enabled
        if (component.captureHtmlDebug !== false && config.captureHtmlDebug) {
          await captureManager.captureComponentHtml(
            page,
            component,
            elementHandle,
            theme
          );
        }

        // Take the screenshot
        processingResult = await captureManager.captureSpecificElement(
          page,
          elementHandle,
          component,
          theme,
          timestamp,
          saveBaseline,
          outputDir
        );

        // Verify the screenshot was saved properly
        const screenshotPath = path.join(
          outputDir,
          `${component.name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
        );

        try {
          if (fs.existsSync(screenshotPath)) {
            const stats = fs.statSync(screenshotPath);
            logger.info(
              `Screenshot saved: ${screenshotPath} (${stats.size} bytes)`
            );

            if (stats.size < 1000) {
              logger.warn(
                `Screenshot file is unusually small (${stats.size} bytes), might be corrupted`
              );
            }
          } else {
            logger.warn(`Expected screenshot not found at ${screenshotPath}`);
          }
        } catch (err) {
          logger.warn(`Error verifying screenshot: ${err.message}`);
        }
      } else {
        // Take fallback screenshot if element not found
        logger.warn(
          `Could not find element for ${component.name}, taking viewport screenshot as fallback`
        );

        try {
          const screenshotPath = path.join(
            outputDir,
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
          processingResult = true;
        } catch (error) {
          logger.error(
            `Error taking fallback screenshot for ${component.name}: ${error.message}`,
            error
          );
          stats.failed++;
          stats.componentResults[component.name][theme] = "failed";
          processingResult = false;
        }
      }
    }

    // Update stats based on processing outcome
    if (
      processingResult &&
      stats.componentResults[component.name][theme] !== "fallback"
    ) {
      stats.successful++;
      stats.componentResults[component.name][theme] = "success";
    } else if (!processingResult) {
      stats.failed++;
      stats.componentResults[component.name][theme] = "failed";
    }

    // End the timer for this component
    logger.endTimer(timerId);
    logger.groupEnd();

    return processingResult;
  } catch (error) {
    // Handle component errors
    logger.error(
      `Error capturing ${component.name} in ${theme} theme: ${error.message}`,
      error
    );
    stats.failed++;
    stats.componentResults[component.name][theme] = "error";

    // Take error screenshot
    safeFileOperation(
      () =>
        page.screenshot({
          path: path.join(
            outputDir,
            `${component.name}-${theme}-error${
              saveBaseline ? "" : "-" + timestamp
            }.png`
          ),
          fullPage: false,
        }),
      {
        description: `taking error screenshot for ${component.name}`,
        logger,
      }
    );

    logger.groupEnd();
    return false;
  }
}

/**
 * Take screenshots in unified mode with enhanced performance and error handling
 * @param {string} mode - The screenshot mode: 'all', 'components', 'sections', or a specific component name
 * @param {string} timestamp - Timestamp to use for filenames
 * @param {boolean} saveBaseline - Whether to save as baseline (no timestamp)
 * @param {string[]} specificComponents - Array of specific component names to screenshot (optional)
 * @param {boolean} skipOtherSections - Whether to skip sections not specified in specificComponents
 * @param {boolean} useGeneratedSelectors - Whether to use generated selectors
 * @param {boolean} mergeSelectors - Whether to merge selectors with existing ones
 * @returns {Promise<string|null>} Timestamp used or null if failed
 */
async function takeUnifiedScreenshots(
  mode = "all",
  timestamp = getTimestamp(),
  saveBaseline = false,
  specificComponents = [],
  skipOtherSections = false,
  useGeneratedSelectors = false,
  mergeSelectors = false
) {
  // If saving baselines, clear the timestamp
  timestamp = saveBaseline ? null : timestamp;
  let browser = null;
  let page = null;

  // Ensure output directory exists
  ensureDirectoryExists(directories.unified, {
    recursive: true,
    fallbackDir: path.join(
      path.dirname(directories.unified),
      "temp-screenshots"
    ),
    logger,
  });

  logger.info(
    `Taking unified screenshots in ${mode} mode from ${BASE_URL}${PATH_PREFIX}`
  );
  logger.info(`Saving to ${directories.unified}`);
  logger.info(`Capturing themes: ${THEMES.join(", ")}`);

  if (skipOtherSections && specificComponents.length > 0) {
    logger.info(
      `Focus mode enabled: Only capturing specified targets: ${specificComponents.join(
        ", "
      )}`
    );
  }

  try {
    // Load components
    const componentsToUse = await loadComponents(
      useGeneratedSelectors,
      mergeSelectors
    );

    // Determine which components to capture based on mode
    const componentsToCapture = selectComponents(
      componentsToUse,
      mode,
      specificComponents,
      skipOtherSections
    );

    if (componentsToCapture.length === 0) {
      logger.error("No components to capture based on the specified mode");
      logger.info(`Available modes: all, components, sections, remix`);
      logger.info(
        `Available components: ${getAllComponentNames(componentsToUse).join(
          ", "
        )}`
      );
      return null;
    }

    logger.info(
      `Will capture ${
        componentsToCapture.length
      } components: ${componentsToCapture.map((c) => c.name).join(", ")}`
    );

    // Group components by page to minimize browser navigation
    const componentsByPage = groupComponentsByPage(componentsToCapture);

    // Initialize browser and page
    ({ browser, page } = await initBrowser());

    // Add a custom navigation timeout
    await page.setDefaultNavigationTimeout(60000); // 60 seconds

    // Track overall statistics
    const stats = {
      total: componentsToCapture.length * THEMES.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      componentResults: {},
      startTime: Date.now(),
    };

    // Process each page and its components
    for (const [pagePath, pageComponents] of Object.entries(componentsByPage)) {
      const url = `${BASE_URL}${PATH_PREFIX}${pagePath}`;
      logger.info(`\n📄 Navigating to ${url}`);

      // Navigate to the page with enhanced wait for full loading
      const navigationSuccess = await navigateToPage(page, url);

      if (!navigationSuccess) {
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

      // Add additional waiting time for the page to fully stabilize
      logger.info(
        "Waiting additional time for page to fully stabilize (5s)..."
      );
      await page.waitForTimeout(5000);

      // Check for React hydration readiness
      try {
        const isHydrated = await page.evaluate(() => {
          // Different ways to detect React is ready
          return (
            // Check for common React readiness indicators
            window.__REACT_HYDRATED === true ||
            document.documentElement.dataset.reactRoot === "loaded" ||
            // General check: no loading indicators visible
            (!document.querySelector(".loading-indicator") &&
              !document.querySelector('[data-loading="true"]') &&
              // Check if we can find React devtools
              window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined)
          );
        });
        logger.info(
          `Page hydration status: ${isHydrated ? "Ready" : "Not yet ready"}`
        );
      } catch (err) {
        logger.warn(`Could not detect React hydration status: ${err.message}`);
      }

      // Capture screenshots for each theme
      for (const theme of THEMES) {
        logger.info(`\n🎨 Capturing ${theme} theme`);

        // Set the theme with better error handling
        try {
          await retry(
            () => captureManager.setTheme(page, theme, pageComponents[0]),
            {
              name: `Theme setting (${theme})`,
              retries: 2,
              exponentialBackoff: true,
            }
          );
        } catch (error) {
          logger.error(
            `Failed to set ${theme} theme after multiple attempts: ${error.message}`,
            error
          );
          logger.info("Continuing with current theme...");
        }

        // Wait additional time after theme change for styles to apply
        logger.info("Waiting for theme styles to fully apply (3s)...");
        await page.waitForTimeout(3000);

        // Take screenshots of each component on this page
        for (const component of pageComponents) {
          // Verify component is fully loaded and visible before capturing
          try {
            await verifyComponentReady(page, component);
          } catch (err) {
            logger.warn(`Component verification warning: ${err.message}`);
          }

          await processComponentForTheme(
            page,
            component,
            theme,
            timestamp,
            saveBaseline,
            directories.unified,
            stats
          );
        }
      }
    }

    // Print summary
    stats.endTime = Date.now();
    stats.totalDuration = stats.endTime - stats.startTime;
    printSummary(stats, timestamp);

    return timestamp;
  } catch (error) {
    // Handle fatal errors
    logger.error(`Fatal error in screenshot process: ${error.message}`, error);

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

    return null;
  } finally {
    // Clean up
    if (browser) {
      await browser.close().catch((err) => {
        logger.debug(`Error closing browser: ${err.message}`);
      });
    }
  }
}

/**
 * Verify component is fully loaded and visible
 * @param {Page} page - Playwright page
 * @param {Object} component - Component to verify
 */
async function verifyComponentReady(page, component) {
  logger.info(`Verifying ${component.name} is ready for capture...`);

  // Wait for a reasonable element within the component to be visible
  const selector =
    component.selector || component.waitForSelector || "h1, h2, h3, button";

  try {
    // First check if the element exists
    const exists = await page.evaluate((sel) => {
      return !!document.querySelector(sel);
    }, selector);

    if (!exists) {
      logger.warn(
        `Element with selector "${selector}" does not exist on the page`
      );
      // Continue anyway since we'll try other selectors in the actual capture function
      return;
    }

    // Wait for visibility with timeout
    await page.waitForSelector(selector, {
      state: "visible",
      timeout: 8000,
    });

    // Check for content loading indicators
    const hasLoadingIndicator = await page.evaluate(() => {
      // Common loading indicator patterns
      const loadingSelectors = [
        '[aria-busy="true"]',
        ".loading",
        ".spinner",
        '[data-loading="true"]',
        '[role="progressbar"]',
      ];

      return loadingSelectors.some((sel) => !!document.querySelector(sel));
    });

    if (hasLoadingIndicator) {
      logger.info(
        `Component ${component.name} still has loading indicators, waiting...`
      );
      // Wait additional time for loading to complete
      await page.waitForTimeout(3000);
    }

    logger.info(`Component ${component.name} appears ready for capture`);
  } catch (error) {
    logger.warn(
      `Unable to verify component ${component.name} readiness: ${error.message}`
    );
    // Wait a bit anyway to give it time to render
    await page.waitForTimeout(2000);
  }
}

/**
 * Print a summary of the screenshot capture process
 * @param {Object} stats - Statistics object
 * @param {string} timestamp - Timestamp used for screenshots
 */
function printSummary(stats, timestamp) {
  logger.info("\n📊 Screenshot Results Summary:");
  logger.info(`Total components: ${stats.total}`);
  logger.info(`✅ Successful: ${stats.successful}`);
  logger.info(`❌ Failed: ${stats.failed}`);
  logger.info(`⏭️ Skipped: ${stats.skipped}`);
  logger.info(
    `⏱️ Total duration: ${Math.round(stats.totalDuration / 1000)} seconds`
  );

  if (stats.failed > 0) {
    logger.info("\nFailed components:");
    for (const [component, results] of Object.entries(stats.componentResults)) {
      for (const [theme, status] of Object.entries(results)) {
        if (status === "failed" || status === "error") {
          logger.info(`  - ${component} (${theme}): ${status}`);
        }
      }
    }
  }

  // Log retry statistics if available
  if (retry.getStats) {
    const retryStats = retry.getStats();
    logger.info("\nRetry statistics:");
    logger.info(
      `  Total operations: ${retryStats.successes + retryStats.failures}`
    );
    logger.info(`  Successful operations: ${retryStats.successes}`);
    logger.info(`  Failed operations: ${retryStats.failures}`);
    logger.info(`  Total retries: ${retryStats.totalRetries}`);
  }

  logger.success(
    `\nScreenshot process complete! Timestamp: ${timestamp || "baseline"}`
  );
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseCliArgs() {
  const args = process.argv.slice(2);

  return {
    saveBaseline: args.includes("--baseline"),
    useGeneratedSelectors: args.includes("--use-generated-selectors"),
    mergeSelectors: args.includes("--merge-selectors"),
    skipOtherSections: args.includes("--skip-other-sections"),
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

// Run the screenshot function only if this file is executed directly, not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  takeUnifiedScreenshots(
    cliArgs.mode,
    getTimestamp(),
    cliArgs.saveBaseline,
    cliArgs.specificComponents,
    cliArgs.skipOtherSections,
    cliArgs.useGeneratedSelectors,
    cliArgs.mergeSelectors
  ).catch((error) => {
    console.error("Error taking screenshots:", error);
    process.exit(1);
  });
}

export { takeUnifiedScreenshots };
