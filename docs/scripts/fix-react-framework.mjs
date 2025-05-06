// Custom script to fix the React framework section in dark mode
import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

async function captureReactFramework() {
  console.log("Starting custom React framework screenshot capture");

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 2000 },
  });
  const page = await context.newPage();

  try {
    // Navigate to page and wait for load
    console.log("Navigating to site...");
    await page.goto("http://localhost:3000/jods/", {
      waitUntil: "networkidle",
    });

    // Switch to dark theme
    console.log("Switching to dark theme...");
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.dataset.theme = "dark";
      document.querySelector("html").setAttribute("data-theme", "dark");
    });

    // Force reload to ensure dark theme is applied
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Scroll to frameworks section first to ensure it's in view
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
    console.log("Finding frameworks section...");
    const frameworkSection = await page.$(
      'section:has(h2:has-text("Works with your favorite frameworks")), section:has(h2:has-text("Framework Integration"))'
    );

    if (!frameworkSection) {
      throw new Error("Could not find framework section");
    }

    console.log("Forcing React tab selection...");

    // Force React tab with multiple approaches
    await page.evaluate(() => {
      // First attempt - find tabs and click React
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

      // Second attempt - show React content, hide Remix
      document
        .querySelectorAll('[data-tab="react"], .react-content')
        .forEach((el) => {
          if (el) el.style.display = "block";
        });

      document
        .querySelectorAll('[data-tab="remix"], .remix-content')
        .forEach((el) => {
          if (el) el.style.display = "none";
        });

      // Third attempt - set active class on React tab
      allButtons.forEach((btn) => {
        if (
          btn.textContent &&
          btn.textContent.includes("React") &&
          !btn.textContent.includes("Preact")
        ) {
          btn.classList.add("active", "selected");
          btn.setAttribute("aria-selected", "true");
        } else if (btn.textContent && btn.textContent.includes("Remix")) {
          btn.classList.remove("active", "selected");
          btn.setAttribute("aria-selected", "false");
        }
      });

      // Last attempt - find any React/Remix content by code samples
      document.querySelectorAll("pre, code").forEach((el) => {
        if (
          el.textContent &&
          (el.textContent.includes("createCookieStore") ||
            el.textContent.includes("Remix.createStore"))
        ) {
          const container = el.closest(
            '.tab-content, .framework-tab-content, [role="tabpanel"]'
          );
          if (container) container.style.display = "none";
        }

        if (
          el.textContent &&
          el.textContent.includes("createStore") &&
          !el.textContent.includes("createCookieStore")
        ) {
          const container = el.closest(
            '.tab-content, .framework-tab-content, [role="tabpanel"]'
          );
          if (container) container.style.display = "block";
        }
      });
    });

    // Wait for changes to apply
    await page.waitForTimeout(2000);

    // Take a full page screenshot instead of trying to clip
    console.log("Taking full page screenshot...");
    await page.screenshot({
      path: path.join(
        process.cwd(),
        "static",
        "screenshots",
        "unified",
        "temp-full-page.png"
      ),
      fullPage: true,
    });

    // Now use a more reliable approach to get the framework section
    console.log("Capturing React framework section...");

    // Get better coordinates by evaluating in the page context
    const sectionRect = await page.evaluate(() => {
      // Find the framework section
      const heading = Array.from(document.querySelectorAll("h2")).find(
        (h) =>
          h.textContent.includes("Works with your favorite frameworks") ||
          h.textContent.includes("Framework Integration")
      );

      if (!heading) return null;

      // Find the section container
      let section = heading.closest("section");
      if (!section) return null;

      // Get section coordinates
      const rect = section.getBoundingClientRect();

      // Get scroll position
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Return absolute coordinates
      return {
        x: rect.x + scrollX,
        y: rect.y + scrollY,
        width: rect.width,
        height: rect.height,
        top: rect.top + scrollY,
        bottom: rect.bottom + scrollY,
      };
    });

    if (!sectionRect) {
      throw new Error("Could not determine section coordinates");
    }

    console.log("Section rect:", sectionRect);

    // Ensure the viewport is properly positioned
    await page.evaluate((rect) => {
      window.scrollTo({
        top: rect.top - 100,
        behavior: "instant",
      });
    }, sectionRect);

    await page.waitForTimeout(1000);

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

    // Take a properly bounded screenshot
    console.log("Taking section screenshot...");

    // Use elementHandle.screenshot instead of clipping
    await frameworkSection.screenshot({
      path: path.join(outputDir, "04-framework-section-react-dark.png"),
      // Add padding options
      omitBackground: false,
    });

    console.log("Screenshot saved successfully!");
  } catch (error) {
    console.error("Error capturing screenshot:", error);
  } finally {
    await browser.close();
  }
}

captureReactFramework().catch(console.error);
