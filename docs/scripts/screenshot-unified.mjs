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
  } else if (mode === "all") {
    // Capture all components
    componentsToCapture = COMPONENTS;
  } else if (mode === "components") {
    // Legacy component mode - same as all for now
    componentsToCapture = COMPONENTS;
  } else if (mode === "sections") {
    // Legacy sections mode - filter only homepage sections
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
  } else if (specificComponents && specificComponents.length > 0) {
    // Specific named components
    componentsToCapture = COMPONENTS.filter((component) =>
      specificComponents.includes(component.name)
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
    viewport: { width: 1280, height: 1600 }, // Increased height for taller sections
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

          // Find the element using the selector or fallback strategies
          const elementHandle = await findElement(page, component);

          if (elementHandle) {
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
 * Helper: Find element using selector and fallback strategies
 */
async function findElement(page, component) {
  // First try the main selector
  let elementHandle = await page.$(component.selector);

  if (elementHandle) {
    console.log(
      `Found ${component.name} using selector: ${component.selector}`
    );
    return elementHandle;
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

  // If component has a testId, try that as a last resort
  if (!elementHandle && component.testId) {
    elementHandle = await page.$(`[data-testid="${component.testId}"]`);
    if (elementHandle) {
      console.log(`Found ${component.name} using testId: ${component.testId}`);
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

  // For tall sections, scroll up a bit to ensure full visibility
  if (component.name.includes("section") || boundingBox.height > 500) {
    await page.evaluate(
      (params) => {
        window.scrollBy(0, -params.offset);
      },
      { offset: topPadding }
    );
    await page.waitForTimeout(500);
  }

  // Get updated position after scrolling
  const updatedBoundingBox = await elementHandle.boundingBox();

  // Create clip with padding around the element, respecting minHeight
  const clip = {
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

  // Make sure we don't exceed the page dimensions
  if (clip.y + clip.height > page.viewportSize().height) {
    clip.height = page.viewportSize().height - clip.y - 10;
  }

  // Verify clip dimensions are positive
  if (clip.width <= 0 || clip.height <= 0) {
    console.log(
      `Invalid clip dimensions: width=${clip.width}, height=${clip.height}`
    );
    console.log(`Taking full viewport screenshot instead`);

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });
  } else {
    // Take the screenshot with the calculated clip area
    console.log(
      `Taking screenshot with clip: x=${clip.x}, y=${clip.y}, width=${clip.width}, height=${clip.height}`
    );

    await page.screenshot({
      path: screenshotPath,
      clip,
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

  // Find tab buttons
  const tabButtons = await page.$$(
    "button:has-text('React'), button:has-text('Preact'), button:has-text('Remix')"
  );

  if (!tabButtons || tabButtons.length === 0) {
    console.log("Could not find framework tabs");
    return;
  }

  console.log(`Found ${tabButtons.length} framework tabs`);

  // Capture each tab
  for (let i = 0; i < tabButtons.length; i++) {
    const tabButton = tabButtons[i];
    const tabName = await tabButton.evaluate((el) => el.textContent.trim());

    console.log(`Clicking on ${tabName} tab`);

    // Click the tab
    await tabButton.click();
    await page.waitForTimeout(1000);

    // Get bounding box after tab change
    const boundingBox = await frameworkSection.boundingBox();

    // Calculate clip area
    const padding = component.padding || 40;
    const clip = {
      x: Math.max(0, boundingBox.x - padding),
      y: Math.max(0, boundingBox.y - padding),
      width: Math.min(
        page.viewportSize().width - Math.max(0, boundingBox.x - padding),
        boundingBox.width + padding * 2
      ),
      height: Math.max(
        boundingBox.height + padding * 2,
        component.minHeight || 0
      ),
    };

    // Make sure we don't exceed the page dimensions
    if (clip.y + clip.height > page.viewportSize().height) {
      clip.height = page.viewportSize().height - clip.y - 10;
    }

    // Take the screenshot
    const screenshotPath = path.join(
      directories.unified,
      `${component.name}-${tabName.toLowerCase()}-${theme}${
        saveBaseline ? "" : "-" + timestamp
      }.png`
    );

    await page.screenshot({
      path: screenshotPath,
      clip,
    });

    console.log(`Framework tab screenshot saved to: ${screenshotPath}`);
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
