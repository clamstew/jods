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
      console.error(`Unknown mode or component: ${mode}`);
      console.log(`Available modes: all, components, sections, remix`);
      console.log(
        `Available components: ${getAllComponentNames(componentsToUse).join(
          ", "
        )}`
      );
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
      await setTheme(page, theme, componentsToUse[0]);

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
 * Helper: Pause all animations on the page for consistent screenshots
 * Used for components with animations or particle backgrounds
 */
async function pauseAllAnimations(page, shouldPause = true) {
  console.log(
    `${
      shouldPause ? "Pausing" : "Resuming"
    } animations for consistent screenshots...`
  );

  await page.evaluate((pause) => {
    const style = document.createElement("style");
    style.id = "pause-animations-for-screenshots";
    style.textContent = pause
      ? `
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      
      /* Hide canvas elements for particle backgrounds */
      canvas.particles-js-canvas-el,
      canvas.tsparticles-canvas-el, 
      canvas[id^="tsparticles"] {
        opacity: 0 !important;
      }
    `
      : "";

    // Remove existing style if present
    const existingStyle = document.getElementById(
      "pause-animations-for-screenshots"
    );
    if (existingStyle) {
      existingStyle.remove();
    }

    if (pause) {
      document.head.appendChild(style);
    }
  }, shouldPause);

  // Wait for style to take effect
  await page.waitForTimeout(200);
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
  // Pause animations if specified in the component config
  if (component.pauseAnimations) {
    await pauseAllAnimations(page, true);
  }

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
        console.log(
          "Direct DOM click didn't succeed, falling back to traditional click"
        );
        await page.click(component.clickSelector);
      } else {
        console.log(`Successfully clicked tab via ${clickResult.method}`);
      }

      // Wait for content to update after clicking
      const waitTime = component.clickWaitTime || 1000;
      console.log(`Waiting ${waitTime}ms for content to update after click...`);
      await page.waitForTimeout(waitTime);

      // Verify tab selection if required
      if (component.verifyTabSelected) {
        console.log(`Verifying ${component.verifyTabName} tab is selected...`);

        // Verify the tab is selected
        let isTabSelected = await verifyTabIsSelected(page, component);
        let retryCount = 0;
        const maxRetries = component.retryTabSelection || 2;

        // Retry clicking the tab if not selected
        while (!isTabSelected && retryCount < maxRetries) {
          console.log(
            `Tab not selected, retrying click (${
              retryCount + 1
            }/${maxRetries})...`
          );

          // Try a more direct clicking approach
          await page.evaluate((tabName) => {
            // First try by data-testid (most reliable)
            const testIdSelector = `[data-testid='framework-tab-${tabName.toLowerCase()}']`;
            const elementByTestId = document.querySelector(testIdSelector);
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
            const buttons = Array.from(document.querySelectorAll("button"));
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
          }, component.verifyTabName || "Remix");

          await page.waitForTimeout(1000); // Wait after retry click

          // Check again
          isTabSelected = await verifyTabIsSelected(page, component);
          retryCount++;
        }

        if (isTabSelected) {
          console.log(
            `✅ ${component.verifyTabName} tab successfully selected!`
          );
        } else {
          console.log(
            `⚠️ Could not verify ${component.verifyTabName} tab selection after ${maxRetries} retries`
          );
        }
      }

      // Special handling for Remix tab to ensure proper scrolling
      if (component.name === "framework-section-remix") {
        console.log("Special handling for Remix tab...");
        await page.evaluate(() => {
          // Find the framework section
          const sections = Array.from(document.querySelectorAll("section"));
          const frameworkSection = sections.find((section) => {
            // Look for headings in this section
            const headings = Array.from(section.querySelectorAll("h2"));
            return headings.some(
              (h) =>
                h.textContent.includes("Works with your favorite frameworks") ||
                h.textContent.includes("Framework Integration")
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
      console.log(`Error clicking element: ${error.message}`);
    }
  }

  // Special handling for framework-section-remix to ensure we capture the full section
  if (component.name === "framework-section-remix") {
    // Ensure we can see the heading and tabs
    await page.evaluate(() => {
      // Find the framework section heading using standard DOM methods
      const headings = Array.from(document.querySelectorAll("h2"));
      const heading = headings.find(
        (h) =>
          h.textContent.includes("Works with your favorite frameworks") ||
          h.textContent.includes("Framework Integration")
      );

      if (heading) {
        const rect = heading.getBoundingClientRect();
        // Adjust scroll to show heading at top with padding
        window.scrollTo(0, window.scrollY + rect.top - 100);
      }
    });

    await page.waitForTimeout(500);
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

    // NEW: Check if we need to verify content is loaded
    if (component.verifyContentLoaded) {
      console.log("Verifying content is fully loaded...");

      // Check for code blocks specifically
      const codeBlocksVisible = await page.evaluate((minLines) => {
        const codeBlocks = document.querySelectorAll("pre code");

        if (codeBlocks.length === 0) {
          console.log("No code blocks found on page");
          return false;
        }

        // Check if any code block has minimum number of lines
        const hasVisibleCode = Array.from(codeBlocks).some((block) => {
          const lineCount = block.textContent.split("\n").length;
          console.log(`Found code block with ${lineCount} lines`);
          return lineCount >= minLines;
        });

        // If we don't have visible code with enough lines, we need to adjust
        if (!hasVisibleCode) {
          console.log("Code blocks don't have enough visible lines");
          return false;
        }

        return true;
      }, component.minVisibleCodeLines || 5);

      // If code blocks aren't properly visible, scroll down to reveal them
      if (!codeBlocksVisible) {
        console.log("Code blocks not fully visible, adjusting scroll...");
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(800); // Give more time for rendering
      }
    }

    // NEW: For framework-section-react, ensure React tab is selected if needed
    if (
      component.name === "framework-section-react" &&
      component.forceReactTabSelected
    ) {
      console.log(
        "Ensuring React tab is selected for framework-section-react..."
      );

      // Check if React tab is already selected
      const isReactSelected = await page.evaluate(() => {
        // Look for React tab with selected state
        const reactTabs = Array.from(
          document.querySelectorAll('button, [role="tab"], .framework-card')
        ).filter(
          (el) =>
            (el.textContent.includes("React") &&
              !el.textContent.includes("Preact")) ||
            el.textContent.includes("⚛️")
        );

        if (reactTabs.length === 0) return false;

        // Check if any React tab appears selected
        return reactTabs.some((tab) => {
          // Check various selection indicators
          return (
            tab.getAttribute("aria-selected") === "true" ||
            tab.classList.contains("active") ||
            tab.classList.contains("selected") ||
            tab.style.background?.includes("gradient") ||
            (window.getComputedStyle(tab).background || "").includes("gradient")
          );
        });
      });

      // If React tab isn't selected, try to click it
      if (!isReactSelected) {
        console.log("React tab not selected, attempting to select it...");

        try {
          // Try to find and click the React tab
          await page.evaluate(() => {
            // Try various ways to find React tab
            const reactSelectors = [
              '[data-testid="jods-framework-tab-react"]',
              'button:has-text("React"):not(:has-text("Preact"))',
              'button:has-text("⚛️")',
              '.framework-card:has-text("React"):not(:has-text("Preact"))',
              '.framework-card:has-text("⚛️")',
            ];

            for (const selector of reactSelectors) {
              try {
                const reactTab = document.querySelector(selector);
                if (reactTab) {
                  console.log(`Found React tab with selector: ${selector}`);
                  reactTab.click();
                  return true;
                }
              } catch (e) {
                console.log(`Error with selector ${selector}: ${e.message}`);
              }
            }

            // Try by text content if selectors failed
            const allButtons = Array.from(
              document.querySelectorAll('button, [role="tab"], .framework-card')
            );
            const reactButton = allButtons.find(
              (btn) =>
                (btn.textContent.includes("React") &&
                  !btn.textContent.includes("Preact")) ||
                btn.textContent.includes("⚛️")
            );

            if (reactButton) {
              console.log("Found React tab by text content");
              reactButton.click();
              return true;
            }

            return false;
          });

          // Wait after clicking
          await page.waitForTimeout(1200);
        } catch (error) {
          console.log(`Error selecting React tab: ${error.message}`);
        }
      }
    }

    // NEW: For try-jods-section, verify editor is loaded
    if (
      component.name === "try-jods-section" &&
      component.editorLoadVerification
    ) {
      console.log("Verifying code editor is fully loaded...");

      const editorLoaded = await page.evaluate(() => {
        // Check for editor elements - multiple possible implementations
        const editorFrames = document.querySelectorAll(
          'iframe.code-editor, iframe[title*="editor"]'
        );
        const codeBlocks = document.querySelectorAll(
          'pre code, .prism-code, [class*="codeBlock"]'
        );
        const editorDivs = document.querySelectorAll(
          '[class*="editor"], [class*="playground"], [class*="liveEditor"], ' +
            '[data-testid*="editor"], [data-testid*="playground"]'
        );

        // Log what we found for debugging
        console.log(
          `Found: ${editorFrames.length} editor iframes, ${codeBlocks.length} code blocks, ${editorDivs.length} editor divs`
        );

        if (
          editorFrames.length === 0 &&
          codeBlocks.length === 0 &&
          editorDivs.length === 0
        ) {
          console.log("No editor elements found on page");
          return false;
        }

        // If we have code blocks, check if they contain code
        if (codeBlocks.length > 0) {
          const hasCode = Array.from(codeBlocks).some(
            (block) =>
              block.textContent.trim().length > 50 || // Has substantial content
              block.textContent.includes("import") || // Has code keywords
              block.textContent.includes("function") ||
              block.textContent.includes("const") ||
              block.textContent.includes("jods")
          );

          if (!hasCode) {
            console.log("Code blocks found but don't contain code yet");
            return false;
          }
        }

        // Check for Monaco editor or other common editor implementations
        const hasMonacoEditor =
          document.querySelector(".monaco-editor") !== null ||
          document.querySelector('[data-mode="javascript"]') !== null ||
          document.querySelector('[data-language="javascript"]') !== null;

        if (hasMonacoEditor) {
          console.log("Monaco editor found and loaded");
          return true;
        }

        // If we have editor divs, check if they're rendered with content
        if (editorDivs.length > 0) {
          const hasRenderedEditor = Array.from(editorDivs).some((div) => {
            const rect = div.getBoundingClientRect();
            return rect.width > 100 && rect.height > 100; // Must have significant size
          });

          if (!hasRenderedEditor) {
            console.log("Editor divs found but not properly rendered yet");
            return false;
          }
        }

        // If we have iframes, check if they're properly loaded
        if (editorFrames.length > 0) {
          // Can't directly check iframe content due to same-origin policy
          // but we can check if they're visible and sized properly
          const hasRenderedFrames = Array.from(editorFrames).some((frame) => {
            const rect = frame.getBoundingClientRect();
            return rect.width > 100 && rect.height > 100 && !frame.hidden;
          });

          if (!hasRenderedFrames) {
            console.log("Editor iframes found but not properly rendered yet");
            return false;
          }
        }

        // If we got here, we've found editor elements that appear to be loaded
        return true;
      });

      if (!editorLoaded) {
        console.log("Editor not fully loaded, waiting longer...");
        await page.waitForTimeout(2000);

        // Scroll slightly to trigger any lazy loading
        await page.evaluate(() => {
          window.scrollBy(0, 20);
          window.scrollBy(0, -20);
        });

        await page.waitForTimeout(1000);

        // For dark mode specifically, even longer wait
        if (theme === "dark") {
          console.log("Extra wait for editor in dark mode...");
          await page.waitForTimeout(1500);
        }
      } else {
        console.log("Editor appears to be fully loaded");
      }
    }
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

  // Resume animations if they were paused
  if (component.pauseAnimations) {
    await pauseAllAnimations(page, false);
  }
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
        frameworkCards: Array.from(
          frameworkSection.querySelectorAll(
            ".framework-card, div:has(h3:has-text('Remix')), div:has(h3:has-text('React'))"
          )
        ).map((card) => ({
          html: card.outerHTML,
          hasRemix:
            card.textContent.includes("Remix") ||
            card.textContent.includes("💿"),
          hasReact:
            card.textContent.includes("React") ||
            card.textContent.includes("⚛️"),
          hasPreact: card.textContent.includes("Preact"),
          classes: card.className,
        })),
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

    // Try direct approach with framework cards
    console.log("Trying to find framework cards...");

    // Look for div.framework-card elements, especially those containing Remix/CD emoji
    const frameworkCardSelector =
      "div.framework-card, div:has(h3:has-text('Remix')), div:has(.spinningEmoji_oGVK:has-text('💿'))";
    const frameworkCards = await page.$$(frameworkCardSelector);

    if (frameworkCards && frameworkCards.length > 0) {
      console.log(`Found ${frameworkCards.length} framework cards`);

      // Find cards for each framework
      const frameworkCardByType = {
        react: null,
        preact: null,
        remix: null,
      };

      for (const card of frameworkCards) {
        const cardText = await card.evaluate((el) => el.textContent);
        const cardClasses = await card.evaluate((el) => el.className);
        console.log(
          `Found card with text: "${cardText}" and classes: "${cardClasses}"`
        );

        if (cardText.includes("Remix") || cardText.includes("💿")) {
          frameworkCardByType.remix = card;
          console.log("Identified Remix card");
        } else if (cardText.includes("Preact")) {
          frameworkCardByType.preact = card;
          console.log("Identified Preact card");
        } else if (cardText.includes("React") || cardText.includes("⚛️")) {
          frameworkCardByType.react = card;
          console.log("Identified React card");
        }
      }

      // Prioritize Remix card for this component
      if (frameworkCardByType.remix) {
        console.log("Clicking Remix framework card");

        // Direct click on the Remix card
        try {
          await frameworkCardByType.remix.click();
          console.log("Successfully clicked Remix card");
          await page.waitForTimeout(1500);

          // After clicking, take screenshot of Remix tab
          await captureTabScreenshot(
            page,
            frameworkSection,
            frameworkCardByType.remix,
            component.forceSaveAsReact ? "react" : "remix",
            component,
            theme,
            timestamp,
            saveBaseline
          );
        } catch (err) {
          console.log(`Error clicking Remix card: ${err.message}`);
        }
      }

      // If we want other framework cards too and not just forceReactTabOnly
      if (!component.forceReactTabOnly) {
        // Handle React card if found
        if (frameworkCardByType.react) {
          console.log("Clicking React framework card");
          try {
            await frameworkCardByType.react.click();
            await page.waitForTimeout(1500);

            await captureTabScreenshot(
              page,
              frameworkSection,
              frameworkCardByType.react,
              "react",
              component,
              theme,
              timestamp,
              saveBaseline
            );
          } catch (err) {
            console.log(`Error clicking React card: ${err.message}`);
          }
        }

        // Handle Preact card if found
        if (frameworkCardByType.preact) {
          console.log("Clicking Preact framework card");
          try {
            await frameworkCardByType.preact.click();
            await page.waitForTimeout(1500);

            await captureTabScreenshot(
              page,
              frameworkSection,
              frameworkCardByType.preact,
              component.forceSaveAsReact ? "react" : "preact",
              component,
              theme,
              timestamp,
              saveBaseline
            );
          } catch (err) {
            console.log(`Error clicking Preact card: ${err.message}`);
          }
        }
      }

      return; // We've handled all cards, so return early
    }

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

  // Pause animations if specified in the component config
  if (component.pauseAnimations) {
    await pauseAllAnimations(page, true);
  }

  // NEW: Extra wait for dark mode if needed
  if (theme === "dark" && component.darkModeExtraWait) {
    console.log(
      `Adding extra wait time for ${tabIdentifier} tab in dark mode: ${component.darkModeExtraWait}ms`
    );
    await page.waitForTimeout(component.darkModeExtraWait);
  }

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

  // NEW: For React tab in dark mode, ensure code blocks are visible
  if (!isRemixTab && theme === "dark" && component.verifyContentLoaded) {
    console.log("Verifying React tab code blocks are visible in dark mode...");

    // Check for code blocks with React content
    const reactCodeVisible = await page.evaluate((minLines) => {
      // Look for code blocks
      const codeBlocks = document.querySelectorAll("pre code");

      if (codeBlocks.length === 0) {
        console.log("No code blocks found on React tab");
        return false;
      }

      // Try to find React-specific content
      const reactBlock = Array.from(codeBlocks).find(
        (block) =>
          block.textContent.includes("React") ||
          block.textContent.includes("useState") ||
          block.textContent.includes("useEffect") ||
          block.textContent.includes("useStore")
      );

      if (reactBlock) {
        const lineCount = reactBlock.textContent.split("\n").length;
        console.log(`Found React code block with ${lineCount} lines`);

        if (lineCount < minLines) {
          console.log("React code block doesn't have enough visible lines");
          // Scroll to show more
          reactBlock.scrollIntoView({ behavior: "smooth", block: "center" });
          return false;
        }

        return true;
      }

      // If no React-specific block found, check if any code block has enough lines
      return Array.from(codeBlocks).some((block) => {
        const lineCount = block.textContent.split("\n").length;
        return lineCount >= minLines;
      });
    }, component.minVisibleCodeLines || 5);

    if (!reactCodeVisible) {
      console.log("React code blocks not fully visible, adjusting scroll...");
      // Scroll down to reveal code blocks
      await page.evaluate(() => {
        const codeBlocks = document.querySelectorAll("pre code");
        if (codeBlocks.length > 0) {
          codeBlocks[0].scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          // If no code blocks found, just scroll down a bit
          window.scrollBy(0, 300);
        }
      });
      await page.waitForTimeout(1000);
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

  // Resume animations if they were paused
  if (component.pauseAnimations) {
    await pauseAllAnimations(page, false);
  }

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
