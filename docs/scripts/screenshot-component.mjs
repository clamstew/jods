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
// Format: { page, name, selector, padding, fallbackStrategy, minHeight, waitForSelector }
const COMPONENTS = [
  {
    page: "/",
    name: "hero-section",
    selector:
      "div.heroBanner_UJgQ, div.hero-container, .hero, [class*='hero_']",
    fallbackStrategy: "first-heading",
    padding: 50,
    waitForSelector: "h1",
  },
  {
    page: "/",
    name: "features-section",
    selector: "section:has(h2:has-text('Powerful features'))",
    fallbackStrategy: "section-index",
    sectionIndex: 1,
    padding: 50,
    waitForSelector: "h2:has-text('Powerful features')",
  },
  {
    page: "/",
    name: "try-jods-section",
    selector: "section:has(h2:has-text('Try jods live'))",
    fallbackStrategy: "section-index",
    sectionIndex: 2,
    padding: 50,
    waitForSelector: "h2:has-text('Try jods live')",
    minHeight: 600,
  },
  {
    page: "/",
    name: "framework-section",
    selector:
      "section:has(h2:has-text('Works with your favorite frameworks')), section:has(h2:has-text('Framework Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["favorite frameworks", "Framework Integration"],
    padding: 60,
    waitForSelector:
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
    minHeight: 800,
  },
  {
    page: "/",
    name: "compare-section",
    selector:
      "section:has(h2:has-text('Compare')), section:has(h2:has-text('How jods compares'))",
    fallbackStrategy: "section-index",
    sectionIndex: 4,
    padding: 70, // Increased padding to capture the top title
    waitForSelector: "h2:has-text('Compare'), h2:has-text('How jods compares')",
    minHeight: 700,
  },
  {
    page: "/",
    name: "remix-section",
    selector:
      "section#remix-integration, section:has(h2:has-text('Remix Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["Remix", "Integration"],
    padding: 70, // Increased padding to capture the header and buttons
    waitForSelector: "h2:has-text('Remix Integration')",
    minHeight: 700, // Increased to include the full section with buttons
  },
  {
    page: "/",
    name: "footer-section",
    selector: "footer",
    fallbackStrategy: "last-element",
    padding: 30,
    waitForSelector: "footer",
  },
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
    viewport: { width: 1280, height: 1200 }, // Increase viewport height for taller sections
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
    minHeight,
    waitForSelector,
  } of COMPONENTS) {
    const url = `${BASE_URL}${PATH_PREFIX}${pagePath}`;
    console.log(`Navigating to ${url} to capture component: ${name}`);

    // Go to the page with longer timeout and wait until network is idle
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for specific content to ensure the page is fully loaded
    if (waitForSelector) {
      try {
        console.log(`Waiting for selector: ${waitForSelector}`);
        await page.waitForSelector(waitForSelector, { timeout: 5000 });
      } catch (e) {
        console.log(
          `Warning: Could not find wait selector for ${name}: ${e.message}`
        );
      }
    }

    // Additional safety wait to ensure all animations and dynamic content are loaded
    await page.waitForTimeout(2000);

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
        await page.waitForTimeout(1000); // Wait longer for theme transition
      }

      try {
        // Create the screenshot filename
        const screenshotPath = path.join(
          screenshotsDir,
          `${name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
        );

        // Special case for remix-section - use enhanced finder approach
        let elementHandle = null;
        if (name === "remix-section") {
          // Try dedicated approach for finding Remix section
          elementHandle = await findRemixSection(page);
          console.log(`Using dedicated Remix section finder for ${name}`);
        } else {
          // Find the element using a comma-separated list of selectors
          console.log(`Looking for element with selector: ${selector}`);
          elementHandle = await page.$(selector);

          if (elementHandle) {
            const boundingBox = await elementHandle.boundingBox();
            console.log(
              `Found element with dimensions: ${boundingBox.width}x${boundingBox.height}, at y=${boundingBox.y}`
            );
          }
        }

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

        // Debug log the element's position
        console.log(
          `Element ${name} found at y=${boundingBox.y}, height=${boundingBox.height}`
        );

        // Make sure element is in view
        await elementHandle.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500); // Wait for scroll to complete

        // Only try to clip if we found a valid element with a bounding box
        if (!takingFullPage && boundingBox) {
          // Create clip with padding around the element, respecting minHeight
          const clip = {
            x: Math.max(0, boundingBox.x - padding),
            y: Math.max(0, boundingBox.y - padding),
            width: Math.min(
              page.viewportSize().width - Math.max(0, boundingBox.x - padding),
              boundingBox.width + padding * 2
            ),
            height: Math.max(boundingBox.height + padding * 2, minHeight || 0),
          };

          // Check if element is partly offscreen (scrolled out of view)
          if (boundingBox.y < 0 || boundingBox.y > page.viewportSize().height) {
            console.log(
              `Element is offscreen (y=${boundingBox.y}), scrolling to it...`
            );
            await elementHandle.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500); // Wait for scroll to complete

            // Get updated position after scrolling
            const newBoundingBox = await elementHandle.boundingBox();
            if (newBoundingBox) {
              clip.y = Math.max(0, newBoundingBox.y - padding);
              console.log(`New y position after scroll: ${newBoundingBox.y}`);
            }
          }

          // Make sure we don't exceed the page dimensions
          if (clip.y + clip.height > page.viewportSize().height) {
            console.log(
              `Adjusting clip height to fit viewport - was ${
                clip.height
              }, max allowed: ${page.viewportSize().height - clip.y - 10}`
            );
            clip.height = page.viewportSize().height - clip.y - 10; // leave a small margin
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

/**
 * Helper function to find the Remix integration section - shared with remix-section.mjs
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
takeComponentScreenshots(getTimestamp(), saveBaseline).catch((error) => {
  console.error("Error taking component screenshots:", error);
  process.exit(1);
});

export { takeComponentScreenshots };
