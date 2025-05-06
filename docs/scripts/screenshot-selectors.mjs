// Unified selectors registry for all screenshot scripts
// This file centralizes all component and section definitions to avoid duplication

// Combined selector definitions from all previous scripts
export const COMPONENTS = [
  // Hero section
  {
    page: "/",
    name: "hero-section",
    selector:
      "div.heroBanner_UJgQ, div.hero-container, .hero, [class*='hero_']",
    fallbackStrategy: "first-heading",
    padding: 50,
    waitForSelector: "h1",
    testId: "jods-hero-section",
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
    name: "features-section",
    selector: "section:has(h2:has-text('Powerful features'))",
    fallbackStrategy: "section-index",
    sectionIndex: 1,
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
    name: "try-jods-section",
    selector: "section:has(h2:has-text('Try jods live'))",
    fallbackStrategy: "section-index",
    sectionIndex: 2,
    padding: 150,
    waitForSelector: "h2:has-text('Try jods live')",
    minHeight: 700,
    testId: "jods-try-live-section",
    extraScroll: 100,
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
    name: "framework-section-react",
    selector:
      "section:has(h2:has-text('Works with your favorite frameworks')), section:has(h2:has-text('Framework Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["favorite frameworks", "Framework Integration"],
    padding: 150,
    waitForSelector:
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
    minHeight: 1200,
    captureFrameworkTabs: false, // Don't need to handle tabs, just screenshot the default React tab
    testId: "jods-framework-section",
    extraScroll: 250,
    captureHtmlDebug: true,
    alternativeSelectors: [
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
      "button:has-text('React'), button:has-text('Preact'), button:has-text('Remix')",
      ".framework-tabs, [class*='tabs_'], [role='tablist']",
      "h2:has-text('Works with your favorite frameworks')",
      "div:has(h2:has-text('Works with your favorite frameworks'))",
    ],
    excludeElements: [
      "p:has-text('Remix state reimagined')",
      "div:has(p:has-text('Remix state reimagined'))",
      "*:has-text('Remix state reimagined')",
      "[class*='description']",
      ".remix-description",
      "[class*='subtitle']:has-text('reimagined')",
      ".subtitle, .feature-subtitle",
      "h3:has-text('Remix state')",
      "div:has(h3:has-text('Remix state'))",
      "h3:has-text('Remix State, Reimagined')",
      "div:has(h3:has-text('Remix State, Reimagined'))",
      "h3:has-text('Reimagined')",
      "[class*='heading']:has-text('Remix')",
      "[class*='heading']:has-text('Reimagined')",
    ],
  },

  // Framework section - Remix tab (needs to click tab)
  {
    page: "/",
    name: "framework-section-remix",
    selector:
      "section:has(h2:has-text('Works with your favorite frameworks')), section:has(h2:has-text('Framework Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["favorite frameworks", "Framework Integration"],
    padding: 150,
    waitForSelector:
      "h2:has-text('Works with your favorite frameworks'), h2:has-text('Framework Integration')",
    minHeight: 1800, // Increased from 1600 to capture more content
    clickSelector:
      "[data-testid='framework-tab-remix'], div.framework-card.active:has-text('Remix'), div.framework-card:has(h3:has-text('Remix')), div:has-text('💿'):has(h3:has-text('Remix')), button:has-text('Remix'), button:has-text('💿')", // Updated to first try data-testid
    clickWaitTime: 1800, // Increased from 1500 to ensure tab content is fully loaded
    verifyTabSelected: true, // Verify the Remix tab is visibly selected
    verifyTabName: "Remix", // The tab name to verify as selected
    retryTabSelection: 3, // Number of retries if tab isn't selected
    testId: "jods-framework-section",
    extraScroll: 150, // Reduced from 250 to show more of the section
    captureHtmlDebug: true,
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
    name: "compare-section",
    selector:
      "section:has(h2:has-text('Compare')), section:has(h2:has-text('How jods compares'))",
    fallbackStrategy: "section-index",
    sectionIndex: 4,
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
    name: "remix-section",
    selector:
      "section#remix-integration, section:has(h2:has-text('Remix Integration'))",
    fallbackStrategy: "keyword-context",
    keywords: ["Remix", "Integration"],
    padding: 200,
    waitForSelector: "h2:has-text('Remix Integration')",
    minHeight: 1600,
    testId: "jods-remix-section",
    extraScroll: 100,
    alternativeSelectors: [
      "h2:has-text('Remix Integration')",
      "h3:has-text('Remix')",
      "[id='remix-integration'], #remix-integration",
      "section:has(code:has-text('createCookieStore'))",
    ],
    excludeElements: [".footer-cta", ".next-section-navigator"],
  },

  // Footer section
  {
    page: "/",
    name: "footer-section",
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
