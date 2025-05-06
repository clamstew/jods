// Script to force React tab selection for framework screenshots
import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

async function captureReactFramework() {
  console.log("🔧 Starting React framework tab fix script");

  // Launch browser with larger viewport
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 2000 },
  });
  const page = await context.newPage();

  try {
    // Process both themes
    for (const theme of ["light", "dark"]) {
      console.log(`\n🎨 Processing ${theme} theme...`);

      // Navigate to page and wait for load
      console.log("📄 Navigating to site...");
      await page.goto("http://localhost:3000/jods/", {
        waitUntil: "networkidle",
      });

      // Set theme
      console.log(`🔄 Setting ${theme} theme...`);
      await page.evaluate((targetTheme) => {
        localStorage.setItem("theme", targetTheme);
        document.documentElement.dataset.theme = targetTheme;
        document.querySelector("html").setAttribute("data-theme", targetTheme);
      }, theme);

      // Reload to ensure theme is applied
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(2000);

      // Scroll to frameworks section
      console.log("📏 Positioning framework section...");
      await page.evaluate(() => {
        const heading = Array.from(document.querySelectorAll("h2")).find(
          (h) =>
            h.textContent.includes("Works with your favorite frameworks") ||
            h.textContent.includes("Framework Integration")
        );

        if (heading) {
          heading.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      await page.waitForTimeout(1000);

      // Find the frameworks section
      console.log("🔍 Finding frameworks section...");
      const frameworkSection = await page.$(
        'section:has(h2:has-text("Works with your favorite frameworks")), section:has(h2:has-text("Framework Integration"))'
      );

      if (!frameworkSection) {
        throw new Error("Could not find framework section");
      }

      console.log("🔄 Forcing React tab selection...");

      // Force React tab with multiple approaches
      await page.evaluate(() => {
        console.log("Applying React tab fixes...");

        // 1. Find and click React tab
        const allButtons = Array.from(document.querySelectorAll("button"));
        const reactButton = allButtons.find(
          (btn) =>
            btn.textContent &&
            btn.textContent.includes("React") &&
            !btn.textContent.includes("Preact")
        );

        if (reactButton) {
          console.log("Found React button, clicking it");
          reactButton.click();
        }

        // 2. Force-hide Remix content and elements
        const hideRemixContent = () => {
          document
            .querySelectorAll('[data-tab="remix"], .remix-content')
            .forEach((el) => {
              if (el) el.style.display = "none";
            });

          // Find any elements containing createCookieStore/Remix and hide their containers
          const allCodeElements = document.querySelectorAll("pre, code, div");
          allCodeElements.forEach((el) => {
            if (
              el.textContent &&
              (el.textContent.includes("createCookieStore") ||
                el.textContent.includes("Remix state") ||
                el.textContent.includes("reimagined"))
            ) {
              const container =
                el.closest(".tab-content, .framework-tab-content") || el;
              container.style.display = "none";
            }
          });

          // Hide any headings with Remix
          document.querySelectorAll("h3, h4, p, div.heading").forEach((el) => {
            if (
              el.textContent &&
              (el.textContent.includes("Remix") ||
                el.textContent.includes("reimagined"))
            ) {
              el.style.display = "none";
            }
          });
        };

        // 3. Force-show React content
        const showReactContent = () => {
          document
            .querySelectorAll('[data-tab="react"], .react-content')
            .forEach((el) => {
              if (el) el.style.display = "block";
            });
        };

        // 4. Force tab selection state
        const forceReactTabSelected = () => {
          const allTabs = document.querySelectorAll(
            '.framework-tabs button, [role="tab"]'
          );
          allTabs.forEach((tab) => {
            const isReact =
              tab.textContent.includes("React") &&
              !tab.textContent.includes("Preact");

            if (isReact) {
              tab.setAttribute("aria-selected", "true");
              tab.classList.add("active", "selected");
            } else {
              tab.setAttribute("aria-selected", "false");
              tab.classList.remove("active", "selected");
            }
          });
        };

        // Execute all approaches for maximum reliability
        hideRemixContent();
        showReactContent();
        forceReactTabSelected();

        // 5. Add title override to ensure proper React title
        // Find framework section by heading instead of using :has selector
        const frameworkHeading = Array.from(
          document.querySelectorAll("h2")
        ).find(
          (h) =>
            h.textContent.includes("Works with your favorite frameworks") ||
            h.textContent.includes("Framework Integration")
        );

        if (frameworkHeading) {
          // Find the parent section
          const frameworkSection = frameworkHeading.closest("section");
          if (frameworkSection) {
            // Find any title heading in the section
            const titleElement = frameworkSection.querySelector("h3, h4");
            if (titleElement) {
              // Replace with "React Integration"
              titleElement.textContent = "React Integration";
              titleElement.style.display = "block";
            }
          }
        }
      });

      // Wait for changes to apply
      await page.waitForTimeout(2000);

      // Create output directory if it doesn't exist
      const outputDir = path.join(
        process.cwd(),
        "static",
        "screenshots",
        "unified"
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Take a screenshot of the section
      console.log(`📸 Taking ${theme} mode screenshot...`);

      // Add extra scroll for proper positioning
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(500);

      // Set up proper padding for the screenshot
      const padding = 200;

      // Get bounding box for the section
      const boundingBox = await frameworkSection.boundingBox();

      // Take screenshot with clipping
      await page.screenshot({
        path: path.join(outputDir, `04-framework-section-react-${theme}.png`),
        clip: {
          x: 0, // Take full width
          y: Math.max(0, boundingBox.y - padding),
          width: 1280,
          height: Math.min(boundingBox.height + padding * 2, 1800), // Limit maximum height
        },
      });

      console.log(`✅ Screenshot saved for ${theme} mode!`);
    }

    console.log("\n🎉 All screenshots captured successfully!");
  } catch (error) {
    console.error("❌ Error capturing screenshots:", error);
  } finally {
    await browser.close();
  }
}

// Run the script
captureReactFramework().catch((error) => {
  console.error("Script error:", error);
  process.exit(1);
});
