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

// Pages to screenshot
const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/docs/intro", name: "intro" },
  { path: "/docs/api", name: "api" },
  // Add more pages as needed
];

async function takeScreenshots() {
  console.log(`Taking screenshots from ${BASE_URL}`);
  console.log(`Saving to ${screenshotsDir}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  for (const { path: pagePath, name } of PAGES) {
    const url = `${BASE_URL}${pagePath}`;
    console.log(`Navigating to ${url}`);

    await page.goto(url, { waitUntil: "networkidle" });

    // Ensure page is fully loaded
    await page.waitForTimeout(1000);

    // Take full page screenshot
    const screenshotPath = path.join(screenshotsDir, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log(`Screenshot saved to ${screenshotPath}`);
  }

  await browser.close();
  console.log("All screenshots completed!");
}

// Run the screenshot function
takeScreenshots().catch((error) => {
  console.error("Error taking screenshots:", error);
  process.exit(1);
});
