// Unified selectors registry for all screenshot scripts
// This file centralizes all component and section definitions to avoid duplication

// Combined selector definitions from all previous scripts
export const COMPONENTS = [
  // Hero section
  {
    page: "/",
    name: "01-hero-section",
    sectionIndex: 1, // Explicitly numbered for order
    selector:
      "div.heroBanner_UJgQ, div.hero-container, .hero, [class*='hero_']",
    fallbackStrategy: "first-heading",
    padding: 50,
    waitForSelector: "h1",
    testId: "jods-hero-section",
    pauseAnimations: true, // Flag to pause background particles
    particleBackground: true, // Specifically has particle background
    diffThreshold: 0.05, // Higher threshold for particle randomness
    alternativeSelectors: [
      "h1:has-text('jods')",
      ".hero-subtitle, .hero-description",
      "div:has(> h1:has-text('jods'))",
    ],
    excludeElements: ["nav", ".navbar", "[class*='navbar_']"],
  },

  // Features section
  {
    page: "/",
    name: "02-features-section",
    sectionIndex: 2, // Explicitly numbered for order
    selector: "section:has(h2:has-text('Powerful features'))",
    fallbackStrategy: "section-index",
    padding: 50,
    waitForSelector: "h2:has-text('Powerful features')",
    testId: "jods-features-section",
    alternativeSelectors: [
      "h2:has-text('Powerful features')",
      ".features-container, [class*='features']",
      "section:nth-of-type(2)",
    ],
    excludeElements: [],
  },

  // Try jods section
  {
    page: "/",
    name: "03-try-jods-section",
    sectionIndex: 3, // Explicitly numbered for order
    selector: "section:has(h2:has-text('Try jods live'))",
    fallbackStrategy: "section-index",
    padding: 200, // Increased for more space all around
    waitForSelector: "h2:has-text('Try jods live')",
    minHeight: 1100, // Increased to ensure editor is fully captured
    testId: "jods-try-live-section",
    extraScroll: 150, // Increased from 40 to position section higher in screenshot
    // New properties for better dark mode handling
    darkModeExtraWait: 2500, // Extra long wait for dark mode
    editorLoadVerification: true, // Verify editor is loaded before screenshot
    verifyContentLoaded: true, // Verify content is fully loaded
    minVisibleCodeLines: 3, // Ensure at least 3 lines of code are visible
    alternativeSelectors: [
      "h2:has-text('Try jods live')",
      ".playground-container, [class*='playground'], [class*='liveEditor']",
      "iframe.code-editor",
    ],
    excludeElements: [".bottom-links", ".pagination"],
  },

  // Framework section - React tab (default on load)
  {
    page: "/",
    name: "04-framework-section-react",
    sectionIndex: 4, // Explicitly numbered for order
    selector:
      "section:has(h2:has-text('Works with your favorite frameworks')), section:has(h2:has-text('Framework Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["favorite frameworks", "Framework Integration"],
    padding: 200,
    waitForSelector:
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
    minHeight: 1200,
    captureFrameworkTabs: false,
    testId: "jods-framework-section",
    extraScroll: 250,
    captureHtmlDebug: true,
    darkModeExtraWait: 1800,
    verifyContentLoaded: true,
    minVisibleCodeLines: 5,
    pauseAnimations: true,
    beforeScreenshot: async (page) => {
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const reactButton = buttons.find(
            (btn) =>
              btn.textContent &&
              btn.textContent.includes("React") &&
              !btn.textContent.includes("Preact")
          );

          if (reactButton) {
            reactButton.click();
            console.log("Clicked React tab via JavaScript");
          }
        });
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log("Error in React tab selection:", e);
      }

      try {
        await page.evaluate(() => {
          const allElements = document.querySelectorAll(
            'h3, h4, pre, code, .remix-tab, [data-tab="remix"]'
          );
          for (const el of allElements) {
            if (
              el.textContent &&
              (el.textContent.includes("Remix") ||
                el.textContent.includes("createCookieStore"))
            ) {
              if (el.closest(".framework-tab-content, .tab-content")) {
                el.closest(
                  ".framework-tab-content, .tab-content"
                ).style.display = "none";
              }
            }
          }
        });
      } catch (e) {
        console.log("Error hiding Remix content:", e);
      }
    },
    alternativeSelectors: [
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
      "button:has-text('React'), button:has-text('Preact'), button:has-text('Remix')",
      ".framework-tabs, [class*='tabs_'], [role='tablist']",
      "h2:has-text('Works with your favorite frameworks')",
      "div:has(h2:has-text('Works with your favorite frameworks'))",
    ],
    excludeElements: [
      "div.remix-content",
      "[data-framework='remix']",
      ".remix-content",
      "[data-testid='remix-example']",
      "p:has-text('Remix state reimagined')",
      "div:has(p:has-text('Remix state reimagined'))",
      "*:has-text('Remix state reimagined')",
      "[class*='description']:has-text('Remix')",
      ".remix-description",
      "[class*='subtitle']:has-text('reimagined')",
      ".subtitle:has-text('Remix')",
      ".feature-subtitle:has-text('Remix')",
      "h3:has-text('Remix state')",
      "h3:has-text('Remix State, Reimagined')",
      "h3:has-text('Reimagined')",
      "[class*='heading']:has-text('Remix')",
      "[class*='heading']:has-text('Reimagined')",
    ],
  },

  // Framework section - Remix tab (needs to click tab)
  {
    page: "/",
    name: "05-framework-section-remix",
    sectionIndex: 5, // Explicitly numbered for order (same section but different tab)
    selector:
      "section:has(h2:has-text('Works with your favorite frameworks')), section:has(h2:has-text('Framework Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["favorite frameworks", "Framework Integration"],
    padding: 200, // Increased for more space all around
    waitForSelector:
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
    minHeight: 1800, // Increased from 1600 to capture more content
    clickSelector:
      "[data-testid='framework-tab-remix'], [data-testid='jods-framework-tab-remix'], button:has-text('Remix'), button.remix-tab, button:has-text('💿'), div.framework-card:has-text('Remix'), .framework-tabs button:nth-child(3)", // Enhanced selector
    clickWaitTime: 2500, // Increased from 1800 to ensure tab content is fully loaded
    verifyTabSelected: true, // Verify the Remix tab is visibly selected
    verifyTabName: "Remix", // The tab name to verify as selected
    retryTabSelection: 5, // Increased from 3 to 5 for more retries
    testId: "jods-framework-section",
    extraScroll: 150, // Reduced from 250 to show more of the section
    captureHtmlDebug: true,
    // Disable diff highlighting to remove red boxes
    diffHighlightSelectors: [], // Removed all diffHighlightSelectors
    // Adding the same dark mode handling as for React tab
    darkModeExtraWait: 2500, // Increased from 2000 to give more time to load
    verifyContentLoaded: true, // Verify that code blocks are visible
    minVisibleCodeLines: 5, // Ensure at least 5 lines of code are visible
    pauseAnimations: true, // Pause animations during screenshot
    diffThreshold: 0.05, // Higher threshold for this component with animations
    alternativeSelectors: [
      "[data-testid='jods-framework-section']",
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
      "button:has-text('React'), button:has-text('Preact'), button:has-text('Remix')",
      ".framework-tabs, [class*='tabs_'], [role='tablist']",
      "h2:has-text('Works with your favorite frameworks')",
      "div:has(h2:has-text('Works with your favorite frameworks'))",
    ],
    // Fewer exclusions for the Remix tab since we want to show the Remix-specific content
    excludeElements: [
      // Removed most exclusions to show more content
    ],
  },

  // Compare section
  {
    page: "/",
    name: "06-compare-section",
    sectionIndex: 6, // Explicitly numbered for order
    selector:
      "section:has(h2:has-text('Compare')), section:has(h2:has-text('How jods compares'))",
    fallbackStrategy: "section-index",
    padding: 120,
    waitForSelector: "h2:has-text('Compare'), h2:has-text('How jods compares')",
    minHeight: 900,
    testId: "jods-compare-section",
    extraScroll: 300,
    alternativeSelectors: [
      "h2:has-text('Compare'), h2:has-text('How jods compares')",
      "table, .comparison-table, [class*='comparisonTable']",
      ".feature-comparison, [class*='comparison']",
    ],
    excludeElements: [
      ".footer-links",
      ".next-section-link",
      "a:has-text('Explore Remix Integration')",
      "a:has-text('Learn about Active Record')",
      "button:has-text('Explore Remix Integration')",
      "button:has-text('Learn about Active Record')",
      "[class*='button']:has-text('Explore')",
      "[class*='button']:has-text('Learn')",
      "a[href*='remix']",
      "a[href*='active-record']",
      ".cta-button, .action-button, .learn-more",
    ],
  },

  // Remix section
  {
    page: "/",
    name: "07-remix-section",
    sectionIndex: 7, // Explicitly numbered for order
    selector:
      "section#remix-integration, section:has(h2:has-text('Remix Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["Remix", "Integration"],
    padding: 250, // Increased from 200 to capture more of the surrounding area
    waitForSelector: "h2:has-text('Remix Integration')",
    minHeight: 1600,
    testId: "jods-remix-section",
    extraScroll: -200, // Changed from -100 to -200 to scroll up more and show the full header
    pauseAnimations: true, // Flag to pause animations during screenshot
    diffThreshold: 0.05, // Higher threshold for this animated component
    alternativeSelectors: [
      "h2:has-text('Remix Integration')",
      "h3:has-text('Remix')",
      "[id='remix-integration'], #remix-integration",
      "section:has(code:has-text('createCookieStore'))",
    ],
    excludeElements: [
      ".footer-cta",
      ".next-section-navigator",
      "section:has(h2:has-text('Compare'))", // Added to exclude compare section
      "[data-testid='jods-compare-section']",
      "section:has(h2:has-text('How jods compares'))",
      "table, .comparison-table",
    ],
  },

  // Footer section
  {
    page: "/",
    name: "08-footer-section",
    sectionIndex: 8, // Explicitly numbered for order
    selector: "footer",
    fallbackStrategy: "last-element",
    padding: 30,
    waitForSelector: "footer",
    testId: "jods-footer",
    alternativeSelectors: [
      "footer",
      ".footer, [class*='footer_']",
      "div:has(a[href*='github']):last-child",
    ],
    excludeElements: [],
  },
];

// Helper function to find the Remix integration section - shared across scripts
export async function findRemixSection(page) {
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

// Utility function to extract all component names for a given page
export function getComponentsForPage(pagePath, components = COMPONENTS) {
  return components.filter((component) => component.page === pagePath);
}

// Get a component by name
export function getComponentByName(name, components = COMPONENTS) {
  return components.find((component) => component.name === name);
}

// Get all available component names
export function getAllComponentNames(components = COMPONENTS) {
  return components.map((component) => component.name);
}
