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
} from "./screenshot-utils.mjs";
import { captureManager } from "./screenshot-capture.mjs";

// Initialize environment and utilities
const { directories, BASE_URL, PATH_PREFIX, THEMES, getTimestamp, DEBUG } =
  setupEnvironment();

// Initialize the logger
const logger = setupLogger(DEBUG);

// Setup retry utility
const retry = setupRetry(logger);

// Add code to import generated selectors if they exist and the flag is set
let componentsToUse = COMPONENTS;

try {
  // Check if the generated selectors file exists and if the --use-generated-selectors flag is used
  if (process.argv.includes("--use-generated-selectors")) {
    // Try to import the generated selectors
    const { GENERATED_COMPONENTS, mergeWithExisting } = await import(
      "./screenshot-selectors.generated.mjs"
    );

    logger.info(
      `🔄 Loading ${GENERATED_COMPONENTS.length} generated selectors from data-testids`
    );

    // Decide if we should merge or replace
    if (process.argv.includes("--merge-selectors")) {
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
  }
} catch (error) {
  logger.warn(
    `⚠️ No generated selectors found or error loading them: ${error.message}`
  );
  logger.info(`ℹ️ Using default component selectors`);
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
          await retry(
            () => captureManager.setTheme(page, theme, pageComponents[0]),
            {
              name: `Theme setting (${theme})`,
              retries: 2,
            }
          );
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
              const result = await captureManager.captureFrameworkTabs(
                page,
                component,
                theme,
                timestamp,
                saveBaseline,
                directories.unified
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
                const result = await captureManager.captureSpecificElement(
                  page,
                  remixElement,
                  component,
                  theme,
                  timestamp,
                  saveBaseline,
                  directories.unified
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
            const elementHandle = await captureManager.findElementForComponent(
              page,
              component
            );

            if (elementHandle) {
              // Capture HTML debug info
              if (component.captureHtmlDebug !== false) {
                await captureManager.captureComponentHtml(
                  page,
                  component,
                  elementHandle,
                  theme
                );
              }

              // Take the screenshot
              const result = await captureManager.captureSpecificElement(
                page,
                elementHandle,
                component,
                theme,
                timestamp,
                saveBaseline,
                directories.unified
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
