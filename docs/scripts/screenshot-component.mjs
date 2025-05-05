// Component-focused screenshot script using Playwright
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "../static/screenshots/components");

// Create component screenshots directory if it doesn't exist
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Base URL of the site
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

// Component selectors to screenshot
// Format: { page, name, selector, padding, fallbackStrategy }
const COMPONENTS = [
  {
    page: "/",
    name: "hero-section",
    selector: "div.hero-container, .hero, [class*='hero_']", // Multiple potential selectors
    fallbackStrategy: "first-heading", // Fallback to screenshot the first heading and surrounding area
    padding: 50,
  },
  {
    page: "/",
    name: "features-section",
    selector: "section#features, .featuresContainer_bzYo, [class*='features']",
    fallbackStrategy: "section-index",
    sectionIndex: 1, // If needed, take the 1st section
    padding: 50,
  },
  {
    page: "/",
    name: "try-jods-section",
    selector: "section#try-jods-live, .features-container",
    fallbackStrategy: "section-index",
    sectionIndex: 2, // If needed, take the 2nd section
    padding: 50,
  },
  {
    page: "/",
    name: "framework-section",
    selector:
      "section#framework-showcase, section:has-text('Framework Integration')",
    fallbackStrategy: "section-index",
    sectionIndex: 3, // If needed, take the 3rd section
    padding: 50,
  },
  {
    page: "/",
    name: "compare-section",
    selector: "section#compare, section:has-text('Compare')",
    fallbackStrategy: "section-index",
    sectionIndex: 4, // If needed, take the 4th section
    padding: 50,
  },
  {
    page: "/",
    name: "remix-section",
    selector:
      "div:has-text('Remix Integration'):not(h1):not(h2):not(h3):not(h4):not(h5):not(h6), div.container_iE9g, div[class*='container_']",
    fallbackStrategy: "keyword-context",
    keywords: ["Remix", "Integration"], // Find elements with these keywords
    padding: 50,
  },
  {
    page: "/",
    name: "footer-section",
    selector: "footer",
    fallbackStrategy: "last-element", // Simply take the last element on the page
    padding: 30,
  },
  // Add more components as needed
];

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

async function takeComponentScreenshots(
  timestamp = getTimestamp(),
  saveBaseline = false
) {
  console.log(`Taking component screenshots from ${BASE_URL}${PATH_PREFIX}`);
  console.log(`Saving to ${screenshotsDir}`);
  console.log(`Capturing themes: ${THEMES.join(", ")}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  for (const {
    page: pagePath,
    name,
    selector,
    padding,
    fallbackStrategy,
    sectionIndex,
    keywords,
  } of COMPONENTS) {
    const url = `${BASE_URL}${PATH_PREFIX}${pagePath}`;
    console.log(`Navigating to ${url} to capture component: ${name}`);

    await page.goto(url, { waitUntil: "networkidle" });

    // Ensure page is fully loaded
    await page.waitForTimeout(1000);

    // Take screenshots in both themes
    for (const theme of THEMES) {
      console.log(`Capturing ${theme} theme for component: ${name}`);

      // If we need dark theme and current theme is light, toggle it
      const isDarkMode = await page.evaluate(() => {
        return document.documentElement.dataset.theme === "dark";
      });

      if (
        (theme === "dark" && !isDarkMode) ||
        (theme === "light" && isDarkMode)
      ) {
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
                    ) || button.textContent.toLowerCase().includes("theme")
                  );
                });
                if (themeButton) themeButton.click();
                else console.warn("Could not find theme toggle button");
              });
            }
          }
        }
        await page.waitForTimeout(500); // Wait for theme transition
      }

      try {
        // Create the screenshot filename
        const screenshotPath = path.join(
          screenshotsDir,
          `${name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
        );

        // Find the element using a comma-separated list of selectors
        let elementHandle = await page.$(selector);
        let takingFullPage = false;

        // If not found, try fallback strategies
        if (!elementHandle) {
          console.log(`Element not found with selector: ${selector}`);
          console.log(`Trying fallback strategy: ${fallbackStrategy}`);

          if (fallbackStrategy === "first-heading") {
            // Get the first main heading on the page
            elementHandle = await page.$("h1");
            if (!elementHandle) {
              elementHandle = await page.$("h2");
            }
          } else if (
            fallbackStrategy === "section-index" &&
            sectionIndex !== undefined
          ) {
            // Try to get the nth section on the page
            const sections = await page.$$("section");
            if (sections.length > sectionIndex) {
              elementHandle = sections[sectionIndex];
              console.log(`Using section at index ${sectionIndex}`);
            } else if (sections.length > 0) {
              // If specified index is out of bounds but we have sections, take the last one
              elementHandle = sections[sections.length - 1];
              console.log(
                `Section index ${sectionIndex} out of bounds, using last section`
              );
            }
          } else if (fallbackStrategy === "keyword-context" && keywords) {
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
                    return current.textContent.length <
                      smallest.textContent.length
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
            }, keywords);
          } else if (fallbackStrategy === "last-element") {
            // Get the footer or last main element on the page
            elementHandle = await page.$("footer");
            if (!elementHandle) {
              const mainElements = await page.$$("main > *");
              if (mainElements.length > 0) {
                elementHandle = mainElements[mainElements.length - 1];
              }
            }
          }
        }

        // If we still couldn't find an element or it's invalid, take a full page screenshot
        if (
          !elementHandle ||
          (await page.evaluate(
            (handle) => handle === null || !handle.getBoundingClientRect,
            elementHandle
          ))
        ) {
          console.log(
            `Could not find a valid element for: ${name}, taking full page screenshot`
          );
          takingFullPage = true;

          // Just take a viewport screenshot
          await page.screenshot({
            path: screenshotPath,
            // Using fullPage: false to just capture what's visible in the viewport
            fullPage: false,
          });

          console.log(`Full viewport screenshot saved: ${screenshotPath}`);
          continue;
        }

        // If we have a valid element, get its bounding box
        const boundingBox = await elementHandle.boundingBox();
        if (!boundingBox) {
          console.log(
            `Could not get bounding box for element, taking full page screenshot`
          );
          takingFullPage = true;

          // Just take a viewport screenshot
          await page.screenshot({
            path: screenshotPath,
            fullPage: false,
          });

          console.log(`Full viewport screenshot saved: ${screenshotPath}`);
          continue;
        }

        // Only try to clip if we found a valid element with a bounding box
        if (!takingFullPage && boundingBox) {
          // Create clip with padding around the element
          const clip = {
            x: Math.max(0, boundingBox.x - padding),
            y: Math.max(0, boundingBox.y - padding),
            width: Math.min(
              page.viewportSize().width - Math.max(0, boundingBox.x - padding),
              boundingBox.width + padding * 2
            ),
            height: boundingBox.height + padding * 2,
          };

          // Make sure we don't exceed the page dimensions
          if (clip.y + clip.height > page.viewportSize().height) {
            clip.height = page.viewportSize().height - clip.y - 10; // leave a small margin
          }

          // Take the screenshot with the calculated clip area
          await page.screenshot({
            path: screenshotPath,
            clip,
          });

          console.log(`Component screenshot saved to: ${screenshotPath}`);
        }
      } catch (error) {
        console.error(`Error capturing component ${name}:`, error);

        // If there was an error, take a full viewport screenshot as last resort
        try {
          console.log(
            "Attempting to take full viewport screenshot as fallback..."
          );
          const screenshotPath = path.join(
            screenshotsDir,
            `${name}-${theme}-full${saveBaseline ? "" : "-" + timestamp}.png`
          );

          await page.screenshot({
            path: screenshotPath,
            fullPage: false,
          });

          console.log(`Full viewport screenshot saved to: ${screenshotPath}`);
        } catch (fallbackError) {
          console.error(
            "Failed to take even a full screenshot:",
            fallbackError
          );
        }
      }
    }
  }

  await browser.close();
  console.log("All component screenshots completed!");
  if (!saveBaseline) {
    console.log(`Timestamp for this batch: ${timestamp}`);
  }

  return timestamp;
}

// Handle command line arguments
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");

// Run the screenshot function
takeComponentScreenshots(getTimestamp(), saveBaseline).catch((error) => {
  console.error("Error taking component screenshots:", error);
  process.exit(1);
});

export { takeComponentScreenshots };
