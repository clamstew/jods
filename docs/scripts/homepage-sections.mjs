import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "../static/screenshots/sections");

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Base URL of the site
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

// Section definitions with text-based locators
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
      strategy: "element",
      value: "section#features",
      contextSelector: null,
    },
    testId: "jods-features-section",
    padding: 40,
  },
  {
    name: "try-jods-live",
    locator: {
      strategy: "element",
      value: 'section#try-jods-live, section[class*="try"]',
      contextSelector: null,
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
      fallback: "section#framework-showcase.features-container",
    },
    testId: "jods-framework-section",
    padding: 60,
  },
  {
    name: "compare",
    locator: {
      strategy: "element",
      value: "section#compare",
      contextSelector: null,
    },
    testId: "jods-compare-section",
    padding: 70,
  },
  {
    name: "remix-integration",
    locator: {
      strategy: "element",
      value: "section#remix-integration",
      contextSelector: null,
    },
    testId: "jods-remix-section",
    padding: 70,
  },
  {
    name: "footer",
    locator: {
      strategy: "element",
      value: "footer.footer",
      contextSelector: null,
    },
    testId: "jods-footer",
    padding: 20,
  },
];

// Theme modes to capture
const THEMES = ["light", "dark"];

// Get timestamp for filename
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

async function addTestIds(page) {
  // Add test IDs to the DOM for easier selection in future runs
  const idsAdded = await page.evaluate((sections) => {
    const results = [];

    for (const section of sections) {
      let element = null;
      const { strategy, value, contextSelector } = section.locator;

      if (strategy === "text") {
        // Find by text content
        if (contextSelector) {
          const containers = Array.from(
            document.querySelectorAll(contextSelector)
          );
          element = containers.find((el) => el.textContent.includes(value));
        } else {
          // Find any element containing this text
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
        // Find by heading text
        const headings = Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6")
        );
        const heading = headings.find((h) => h.textContent.trim() === value);

        if (heading && contextSelector) {
          // Look for the closest parent that matches contextSelector
          let current = heading.parentElement;
          while (current && current !== document.body) {
            if (current.matches(contextSelector)) {
              element = current;
              break;
            }
            current = current.parentElement;
          }
        } else if (heading) {
          // If no contextSelector, use the parent of the heading
          element = heading.parentElement;
        }
      } else if (strategy === "element") {
        // Direct element selector
        element = document.querySelector(value);
      }

      if (element) {
        element.setAttribute("data-testid", section.testId);
        results.push({ name: section.name, added: true });
      } else {
        results.push({ name: section.name, added: false });
      }
    }

    return results;
  }, HOMEPAGE_SECTIONS);

  return idsAdded;
}

async function takeHomepageSectionScreenshots(
  timestamp = getTimestamp(),
  saveBaseline = false
) {
  console.log(
    `Taking homepage section screenshots from ${BASE_URL}${PATH_PREFIX}`
  );
  console.log(`Saving to ${screenshotsDir}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Navigate to homepage
  await page.goto(`${BASE_URL}${PATH_PREFIX}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000); // Give extra time for all animations to complete

  // Add test IDs to make future selections easier
  console.log("Adding test IDs to sections...");
  const idsResults = await addTestIds(page);
  console.log("Test ID results:", idsResults);

  // Take screenshots for each theme
  for (const theme of THEMES) {
    console.log(`\nCapturing ${theme} theme screenshots`);

    // Set theme if needed
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.dataset.theme === "dark";
    });

    if (
      (theme === "dark" && !isDarkMode) ||
      (theme === "light" && isDarkMode)
    ) {
      console.log("Toggling theme...");
      // Try various theme toggle selectors
      try {
        await page.click('[data-testid="theme-toggle"]');
      } catch (e) {
        try {
          await page.click(
            '.colorModeToggle_AEMF button, .toggleButton_e_pL, [class*="toggleButton_"]'
          );
        } catch (e2) {
          console.log("Using fallback theme toggle method...");
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button"));
            const themeButton = buttons.find((button) => {
              return (
                button.textContent.includes("🌙") ||
                button.textContent.includes("☀️") ||
                button.ariaLabel?.includes("theme") ||
                button.title?.includes("theme")
              );
            });
            if (themeButton) themeButton.click();
          });
        }
      }
      await page.waitForTimeout(500); // Wait for theme transition
    }

    // Take screenshots of each section
    for (const section of HOMEPAGE_SECTIONS) {
      try {
        console.log(`Capturing ${section.name} section...`);

        // Try to find the element using data-testid first
        let elementHandle = await page.$(`[data-testid="${section.testId}"]`);

        // If not found by testId, use the original locator strategy
        if (!elementHandle) {
          console.log(`  Could not find by test ID, using locator strategy...`);
          const { strategy, value, contextSelector } = section.locator;

          if (strategy === "text") {
            // By text content
            if (contextSelector) {
              elementHandle = await page.$(
                `${contextSelector}:has-text("${value}")`
              );
            } else {
              elementHandle = await page.$(`text="${value}"`);
            }
          } else if (strategy === "heading") {
            // By heading
            elementHandle = await page.$(
              `h1:has-text("${value}"), h2:has-text("${value}"), h3:has-text("${value}")`
            );
            if (elementHandle && contextSelector) {
              // Find the closest parent matching contextSelector
              elementHandle = await elementHandle.evaluateHandle((el) => {
                let current = el.parentElement;
                while (current && current !== document.body) {
                  if (current.matches(contextSelector)) return current;
                  current = current.parentElement;
                }
                return el;
              });
            }
          } else if (strategy === "element") {
            // Direct element selector
            elementHandle = await page.$(value);
          }
        }

        // If still not found, try fallback
        if (!elementHandle && section.locator.fallback) {
          console.log(`  Using fallback selector: ${section.locator.fallback}`);
          elementHandle = await page.$(section.locator.fallback);
        }

        // If we found an element, take a screenshot
        if (elementHandle) {
          const screenshotPath = path.join(
            screenshotsDir,
            `${section.name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
          );

          const boundingBox = await elementHandle.boundingBox();

          if (boundingBox) {
            // Add padding and handle viewport boundaries
            const clip = {
              x: Math.max(0, boundingBox.x - section.padding),
              y: Math.max(0, boundingBox.y - section.padding),
              width: Math.min(
                page.viewportSize().width -
                  Math.max(0, boundingBox.x - section.padding),
                boundingBox.width + section.padding * 2
              ),
              height: boundingBox.height + section.padding * 2,
            };

            // Take screenshot with clip area
            await page.screenshot({
              path: screenshotPath,
              clip,
            });

            console.log(`  Screenshot saved: ${screenshotPath}`);
          } else {
            console.log(`  Could not get bounding box for ${section.name}`);
          }
        } else {
          console.log(`  Could not find ${section.name} section`);

          // Take a viewport screenshot as last resort
          const screenshotPath = path.join(
            screenshotsDir,
            `${section.name}-${theme}-fallback${
              saveBaseline ? "" : "-" + timestamp
            }.png`
          );

          await page.screenshot({
            path: screenshotPath,
            fullPage: false,
          });

          console.log(
            `  Fallback viewport screenshot saved: ${screenshotPath}`
          );
        }
      } catch (error) {
        console.error(`  Error capturing ${section.name}:`, error);
      }
    }
  }

  await browser.close();
  console.log("\nAll homepage section screenshots completed!");

  return timestamp;
}

// Handle command line arguments
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");

// Run the screenshot function
takeHomepageSectionScreenshots(getTimestamp(), saveBaseline).catch((error) => {
  console.error("Error taking section screenshots:", error);
  process.exit(1);
});

export { takeHomepageSectionScreenshots };
