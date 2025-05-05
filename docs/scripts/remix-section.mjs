import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "../static/screenshots/remix");

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Base URL of the site
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

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

/**
 * Takes screenshots of just the Remix integration section
 */
async function takeRemixSectionScreenshot(
  timestamp = getTimestamp(),
  saveBaseline = false
) {
  console.log(`Taking Remix section screenshot from ${BASE_URL}${PATH_PREFIX}`);
  console.log(`Saving to ${screenshotsDir}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1600 }, // Increased height for taller sections
  });

  const page = await context.newPage();

  // Navigate to homepage
  await page.goto(`${BASE_URL}${PATH_PREFIX}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // Extra time for animations to complete

  // Take screenshots for each theme
  for (const theme of THEMES) {
    console.log(`Capturing ${theme} theme`);

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
      await page.waitForTimeout(1200); // Wait longer for theme transition
    }

    try {
      // First try to find the section by heading content
      const remixSection = await findRemixSection(page);

      if (remixSection) {
        // Get the bounding box for the screenshot
        const boundingBox = await remixSection.boundingBox();

        if (boundingBox) {
          console.log(
            `Found section with dimensions: ${boundingBox.width}x${boundingBox.height}, at y=${boundingBox.y}`
          );

          // If section is very tall or offscreen, handle differently
          if (
            boundingBox.height > 5000 ||
            boundingBox.y > page.viewportSize().height
          ) {
            console.log(
              `Section too large (${boundingBox.height}px) or offscreen (y=${boundingBox.y}), scrolling to it...`
            );

            // Scroll to the section
            await remixSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(600); // Wait for scroll to complete

            // Take a full page screenshot instead
            const screenshotPath = path.join(
              screenshotsDir,
              `remix-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
            );

            await page.screenshot({
              path: screenshotPath,
              fullPage: false,
            });

            console.log(`Full page screenshot saved: ${screenshotPath}`);
            continue;
          }

          const padding = 200; // Increased padding for remix section

          // Get viewport dimensions
          const viewportSize = page.viewportSize();

          // Account for possible fixed header height
          const headerHeight = await page.evaluate(() => {
            const header = document.querySelector(
              'header, .navbar, [class*="navbar_"]'
            );
            return header ? header.offsetHeight : 0;
          });

          const topPadding = padding + headerHeight + 50;
          const bottomPadding = padding + 200; // Extra padding for bottom buttons

          // Ensure the element is properly in view by scrolling a bit above it
          await page.evaluate(
            (params) => {
              const rect = params.sectionEl.getBoundingClientRect();
              window.scrollTo({
                top: window.scrollY + rect.top - params.offset,
                behavior: "instant",
              });
            },
            { sectionEl: remixSection, offset: topPadding }
          );

          await page.waitForTimeout(600); // Wait for scroll to complete

          // Get updated bounding box after scrolling
          const updatedBoundingBox = await remixSection.boundingBox();

          // Create clip with proper boundaries and checks
          const clip = {
            x: Math.max(0, updatedBoundingBox.x - padding),
            y: Math.max(0, updatedBoundingBox.y - topPadding),
            width: Math.min(
              viewportSize.width - Math.max(0, updatedBoundingBox.x - padding),
              updatedBoundingBox.width + padding * 2
            ),
            height: Math.min(
              Math.max(
                1200,
                updatedBoundingBox.height + topPadding + bottomPadding
              ), // Ensure minimum height of 1200px
              viewportSize.height - 10 // Subtract 10 for safety
            ),
          };

          // Make sure clipping dimensions are valid
          if (
            clip.width <= 0 ||
            clip.height <= 0 ||
            clip.x < 0 ||
            clip.y < 0 ||
            clip.x + clip.width > viewportSize.width ||
            clip.y + clip.height > viewportSize.height
          ) {
            console.log(
              `Invalid clip dimensions: x=${clip.x}, y=${clip.y}, width=${clip.width}, height=${clip.height}`
            );

            // Scroll to make element visible then take a viewport screenshot
            await remixSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(600); // Wait for scroll to complete

            // Scroll up a bit to ensure header visibility
            await page.evaluate(
              (params) => {
                window.scrollBy(0, -params.offset);
              },
              { offset: topPadding }
            );
            await page.waitForTimeout(500);

            const screenshotPath = path.join(
              screenshotsDir,
              `remix-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
            );

            await page.screenshot({
              path: screenshotPath,
              fullPage: false,
            });

            console.log(
              `Viewport screenshot saved after scroll: ${screenshotPath}`
            );
          } else {
            // Take the screenshot with clipping
            const screenshotPath = path.join(
              screenshotsDir,
              `remix-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
            );

            try {
              await page.screenshot({
                path: screenshotPath,
                clip,
              });
              console.log(`Screenshot saved: ${screenshotPath}`);

              // Save the selector we found for future reference
              await page.evaluate((sectionEl) => {
                // Add test ID for future use
                sectionEl.setAttribute("data-testid", "jods-remix-section");

                // Log some details about what we found
                console.log(`Found Remix section: ${sectionEl.tagName}`);
                console.log(`Classes: ${sectionEl.classList}`);
                console.log(`ID: ${sectionEl.id}`);
                console.log(`Width: ${sectionEl.offsetWidth}`);
                console.log(`Height: ${sectionEl.offsetHeight}`);
              }, remixSection);
            } catch (error) {
              console.error(`Error taking screenshot: ${error.message}`);

              // Take a full page screenshot as fallback
              const fallbackPath = path.join(
                screenshotsDir,
                `remix-${theme}-fallback${
                  saveBaseline ? "" : "-" + timestamp
                }.png`
              );

              await page.screenshot({
                path: fallbackPath,
                fullPage: false,
              });

              console.log(`Fallback screenshot saved: ${fallbackPath}`);
            }
          }
        } else {
          console.log("Could not get bounding box for Remix section");
        }
      } else {
        console.log("Could not find Remix section");

        // Take a full page screenshot as fallback
        const fallbackPath = path.join(
          screenshotsDir,
          `remix-${theme}-fallback${saveBaseline ? "" : "-" + timestamp}.png`
        );

        await page.screenshot({
          path: fallbackPath,
          fullPage: true,
        });

        console.log(`Full page screenshot saved: ${fallbackPath}`);
      }
    } catch (error) {
      console.error(`Error capturing Remix section: ${error}`);
    }
  }

  await browser.close();
  console.log("Screenshots completed!");

  return timestamp;
}

/**
 * Helper function to find the Remix integration section
 */
async function findRemixSection(page) {
  // Try multiple strategies to find the Remix section

  // 0. First try the direct section ID (highest priority)
  try {
    const directSection = await page.$("section#remix-integration");
    if (directSection) {
      console.log("Found Remix section by ID: section#remix-integration");
      return directSection;
    }
  } catch (e) {
    console.log("Could not find by direct ID:", e.message);
  }

  // 1. Try to find by heading text
  try {
    const headingHandle = await page.$(
      'h2:has-text("Remix Integration"), h3:has-text("Remix Integration")'
    );
    if (headingHandle) {
      // Find the container section/div
      return await headingHandle.evaluateHandle((el) => {
        // Walk up to find a container
        let current = el.parentElement;
        let container = null;

        // Look for a section, article, or div with specific class names
        while (current && current !== document.body) {
          if (
            current.tagName === "SECTION" ||
            current.tagName === "ARTICLE" ||
            (current.tagName === "DIV" &&
              (current.classList.contains("container") ||
                current.classList.contains("section") ||
                current.classList.length > 0))
          ) {
            container = current;

            // Check if this container is wide enough
            const rect = container.getBoundingClientRect();
            if (rect.width > window.innerWidth * 0.8) {
              return container;
            }
          }
          current = current.parentElement;
        }

        // If we didn't find a wide container, return the closest container or heading parent
        return container || el.parentElement;
      });
    }
  } catch (e) {
    console.log("Could not find by heading:", e.message);
  }

  // 2. Try to find by text content
  try {
    return await page.evaluateHandle(() => {
      // Find elements containing "Remix Integration"
      const elements = Array.from(document.querySelectorAll("*")).filter(
        (el) =>
          el.textContent.includes("Remix Integration") &&
          !["SCRIPT", "STYLE", "META"].includes(el.tagName)
      );

      if (elements.length === 0) return null;

      // Get the first matching element
      const el = elements[0];

      // Walk up to find a container
      let current = el;
      while (current && current !== document.body) {
        // Look for a section, article, or div with specific class names
        if (
          current.tagName === "SECTION" ||
          current.tagName === "ARTICLE" ||
          (current.tagName === "DIV" &&
            (current.classList.contains("container") ||
              current.classList.contains("section") ||
              current.classList.length > 0))
        ) {
          // Check if this container is wide enough
          const rect = current.getBoundingClientRect();
          if (rect.width > window.innerWidth * 0.8) {
            return current;
          }
        }
        current = current.parentElement;
      }

      // If we didn't find a container, return the element or its parent
      return el.parentElement || el;
    });
  } catch (e) {
    console.log("Could not find by text content:", e.message);
  }

  // 3. Look for containers with specific IDs or classes
  try {
    for (const selector of [
      "section#remix-integration",
      "#remix-integration",
      ".remix-section",
      '[data-testid="jods-remix-section"]',
      // Potential fallbacks based on content
      'section:has-text("Remix Integration")',
      'div:has-text("Remix Integration"):not(h1):not(h2):not(h3):not(h4)',
    ]) {
      const handle = await page.$(selector);
      if (handle) {
        console.log(`Found Remix section by selector: ${selector}`);
        return handle;
      }
    }
  } catch (e) {
    console.log("Could not find by selector:", e.message);
  }

  return null;
}

// Handle command line arguments
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");

// Run the screenshot function
takeRemixSectionScreenshot(getTimestamp(), saveBaseline).catch((error) => {
  console.error("Error taking screenshots:", error);
  process.exit(1);
});

export { takeRemixSectionScreenshot };
