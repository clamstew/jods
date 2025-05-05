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
// Format: { page, name, selector, padding }
const COMPONENTS = [
  {
    page: "/",
    name: "hero-section",
    selector: ".hero__title",
    padding: 100, // Extra padding around element in pixels
  },
  {
    page: "/",
    name: "features-section",
    selector: ".features",
    padding: 50,
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

  for (const { page: pagePath, name, selector, padding } of COMPONENTS) {
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
        // Find the element and get its bounding box
        const elementHandle = await page.$(selector);
        if (!elementHandle) {
          console.error(`Element not found: ${selector}`);
          continue;
        }

        const boundingBox = await elementHandle.boundingBox();
        if (!boundingBox) {
          console.error(`Could not get bounding box for element: ${selector}`);
          continue;
        }

        // Add padding around the element
        const clip = {
          x: Math.max(0, boundingBox.x - padding),
          y: Math.max(0, boundingBox.y - padding),
          width: boundingBox.width + padding * 2,
          height: boundingBox.height + padding * 2,
        };

        // Create timestamped screenshot
        const screenshotPath = path.join(
          screenshotsDir,
          `${name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
        );

        await page.screenshot({
          path: screenshotPath,
          clip,
        });

        console.log(`Component screenshot saved to: ${screenshotPath}`);
      } catch (error) {
        console.error(`Error capturing component ${name}:`, error);
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
