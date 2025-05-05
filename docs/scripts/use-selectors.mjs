import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { saveSelectors } from "./generate-selectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const selectorsPath = path.join(__dirname, "../static/selectors");
const selectorsFile = path.join(selectorsPath, "homepage-selectors.json");
const screenshotsDir = path.join(__dirname, "../static/screenshots/sections");

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

async function loadSelectors() {
  // Check if selectors file exists
  if (fs.existsSync(selectorsFile)) {
    console.log(`Loading selectors from ${selectorsFile}`);
    try {
      const data = fs.readFileSync(selectorsFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading selectors file:", error);
      return null;
    }
  } else {
    console.log("Selectors file not found, generating new selectors...");
    return await saveSelectors();
  }
}

async function takeScreenshotsWithSelectors(
  timestamp = getTimestamp(),
  saveBaseline = false
) {
  console.log(`Taking screenshots from ${BASE_URL}${PATH_PREFIX}`);
  console.log(`Saving to ${screenshotsDir}`);

  // Load selectors
  const selectors = await loadSelectors();

  if (!selectors || Object.keys(selectors).length === 0) {
    console.error("No selectors available, cannot take screenshots");
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Navigate to homepage
  await page.goto(`${BASE_URL}${PATH_PREFIX}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000); // Give extra time for animations to complete

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
    for (const [name, section] of Object.entries(selectors)) {
      try {
        console.log(`Capturing ${name} section...`);

        // Try to find the element using the stored selector
        let elementHandle = await page.$(section.selector);

        // If not found, try using testId as fallback
        if (!elementHandle) {
          console.log(`  Could not find by selector, trying testId...`);
          elementHandle = await page.$(`[data-testid="${section.testId}"]`);
        }

        // If we found an element, take a screenshot
        if (elementHandle) {
          const screenshotPath = path.join(
            screenshotsDir,
            `${name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
          );

          const boundingBox = await elementHandle.boundingBox();

          if (boundingBox) {
            // Add padding and handle viewport boundaries
            const padding = section.padding || 40;

            // Get viewport dimensions
            const viewportSize = page.viewportSize();

            // Create clip with proper boundaries
            const clip = {
              x: Math.max(0, boundingBox.x - padding),
              y: Math.max(0, boundingBox.y - padding),
              width: Math.min(
                viewportSize.width - Math.max(0, boundingBox.x - padding),
                boundingBox.width + padding * 2
              ),
              height: Math.min(
                viewportSize.height - Math.max(0, boundingBox.y - padding),
                boundingBox.height + padding * 2
              ),
            };

            // Ensure minimum dimensions
            if (clip.width < 10 || clip.height < 10) {
              console.log(
                `  Error: Clip area too small (${clip.width}x${clip.height})`
              );
              // Take a viewport screenshot as fallback
              await page.screenshot({
                path: screenshotPath,
                fullPage: false,
              });
              console.log(
                `  Fallback viewport screenshot saved: ${screenshotPath}`
              );
            } else {
              // Take screenshot with clip area
              try {
                await page.screenshot({
                  path: screenshotPath,
                  clip,
                });
                console.log(`  Screenshot saved: ${screenshotPath}`);

                // Print debug info
                if (section.debug) {
                  console.log(
                    `  Debug info: ${section.debug.elementTagName} element, ${section.debug.width}px wide`
                  );
                  if (section.debug.textSummary) {
                    console.log(
                      `  Content: ${section.debug.textSummary.substring(
                        0,
                        50
                      )}...`
                    );
                  }
                }
              } catch (screenshotError) {
                console.log(
                  `  Error taking screenshot: ${screenshotError.message}`
                );
                // Try with a smaller clip area if there was an error
                const safeClip = {
                  x: clip.x + 5,
                  y: clip.y + 5,
                  width: clip.width - 10,
                  height: clip.height - 10,
                };

                if (safeClip.width > 10 && safeClip.height > 10) {
                  try {
                    await page.screenshot({
                      path: screenshotPath,
                      clip: safeClip,
                    });
                    console.log(
                      `  Screenshot saved with reduced clip area: ${screenshotPath}`
                    );
                  } catch (retryError) {
                    console.log(
                      `  Fallback to viewport screenshot after retry failed`
                    );
                    await page.screenshot({
                      path: screenshotPath,
                      fullPage: false,
                    });
                    console.log(
                      `  Viewport screenshot saved: ${screenshotPath}`
                    );
                  }
                } else {
                  // Take a viewport screenshot as last resort
                  await page.screenshot({
                    path: screenshotPath,
                    fullPage: false,
                  });
                  console.log(`  Viewport screenshot saved: ${screenshotPath}`);
                }
              }
            }
          } else {
            console.log(`  Could not get bounding box for ${name}`);

            // Take a viewport screenshot as fallback
            const fallbackPath = path.join(
              screenshotsDir,
              `${name}-${theme}-fallback${
                saveBaseline ? "" : "-" + timestamp
              }.png`
            );

            await page.screenshot({
              path: fallbackPath,
              fullPage: false,
            });

            console.log(
              `  Fallback viewport screenshot saved: ${fallbackPath}`
            );
          }
        } else {
          console.log(`  Could not find ${name} section`);

          // Take a viewport screenshot as last resort
          const fallbackPath = path.join(
            screenshotsDir,
            `${name}-${theme}-fallback${
              saveBaseline ? "" : "-" + timestamp
            }.png`
          );

          await page.screenshot({
            path: fallbackPath,
            fullPage: false,
          });

          console.log(`  Fallback viewport screenshot saved: ${fallbackPath}`);
        }
      } catch (error) {
        console.error(`  Error capturing ${name}:`, error);
      }
    }
  }

  await browser.close();
  console.log("\nAll screenshots completed!");

  return timestamp;
}

// Handle command line arguments
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");
const regenerateSelectors = args.includes("--regenerate");

// Run the main function
async function main() {
  if (regenerateSelectors) {
    console.log("Regenerating selectors...");
    await saveSelectors();
  }

  await takeScreenshotsWithSelectors(getTimestamp(), saveBaseline);
}

main().catch((error) => {
  console.error("Error taking screenshots:", error);
  process.exit(1);
});

export { takeScreenshotsWithSelectors };
