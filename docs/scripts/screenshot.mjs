// Screenshot automation script using Playwright
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "../static/screenshots");

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Base URL of the site
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Path prefix - include /jods/ if needed
const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

// Pages to screenshot
const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/intro", name: "intro" },
  { path: "/api-reference", name: "api-reference" },
  // Add more pages as needed
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

async function takeScreenshots() {
  // Generate a timestamp for this batch of screenshots
  const timestamp = getTimestamp();
  console.log(`Taking screenshots from ${BASE_URL}${PATH_PREFIX}`);
  console.log(`Saving to ${screenshotsDir} with timestamp ${timestamp}`);
  console.log(`Capturing themes: ${THEMES.join(", ")}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  for (const { path: pagePath, name } of PAGES) {
    const url = `${BASE_URL}${PATH_PREFIX}${pagePath}`;
    console.log(`Navigating to ${url}`);

    await page.goto(url, { waitUntil: "networkidle" });

    // Ensure page is fully loaded
    await page.waitForTimeout(1000);

    // Take screenshots in both themes
    for (const theme of THEMES) {
      console.log(`Capturing ${theme} theme`);

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
          // Try the selector from the HTML snippet
          await page.click("button.toggleButton_e_pL");
        } catch (e) {
          try {
            // Try the selector from the script
            await page.click(".colorModeToggle_AEMF button");
          } catch (e2) {
            try {
              // Try a more general selector
              await page.click("[data-theme-toggle]");
            } catch (e3) {
              // Last resort - get any button with the word "theme" in its attributes
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

      // Take full page screenshot with timestamp in filename
      const screenshotPath = path.join(
        screenshotsDir,
        `${name}-${theme}-${timestamp}.png`
      );

      // Also save a copy with the standard filename (for easy reference)
      const standardPath = path.join(screenshotsDir, `${name}-${theme}.png`);

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Make a copy with the standard filename
      fs.copyFileSync(screenshotPath, standardPath);

      console.log(`Screenshots saved to:`);
      console.log(`  - ${screenshotPath} (timestamped version)`);
      console.log(`  - ${standardPath} (standard version)`);
    }
  }

  await browser.close();
  console.log("All screenshots completed!");
  console.log(`Timestamp for this batch: ${timestamp}`);
}

// Run the screenshot function
takeScreenshots().catch((error) => {
  console.error("Error taking screenshots:", error);
  process.exit(1);
});
