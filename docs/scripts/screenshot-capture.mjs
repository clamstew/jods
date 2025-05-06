// Screenshot capture manager
// Contains all the functionality for capturing screenshots of components

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Tab manager - handles framework tab interactions
 */
const tabManager = {
  /**
   * Find all framework tabs in a section
   * @param {Page} page - Playwright page
   * @returns {Promise<Array<{name: string, element: ElementHandle, emoji: string}>>}
   */
  findAllTabs: async function (page) {
    console.log("Searching for framework tabs...");

    // Find tabs using multiple strategies
    const tabs = await page.evaluate(() => {
      const results = [];
      const tabDetectionStrategies = [
        // Strategy 1: Find by data-testid (most reliable)
        () => {
          const testIdTabs = document.querySelectorAll(
            '[data-testid^="jods-framework-tab-"]'
          );
          if (testIdTabs.length === 0) return null;

          console.log(
            `Found ${testIdTabs.length} framework tabs by data-testid`
          );
          return Array.from(testIdTabs).map((tab) => {
            const name = tab
              .getAttribute("data-testid")
              .replace("jods-framework-tab-", "");
            const emoji =
              name === "react" ? "⚛️" : name === "remix" ? "💿" : "";
            return {
              selector: `[data-testid="jods-framework-tab-${name}"]`,
              name,
              emoji,
              isTestId: true,
            };
          });
        },

        // Strategy 2: Find by framework cards
        () => {
          const frameworkCards = document.querySelectorAll(".framework-card");
          if (frameworkCards.length === 0) return null;

          console.log(`Found ${frameworkCards.length} framework cards`);
          const cardResults = [];

          for (const card of frameworkCards) {
            const cardText = card.textContent;
            let name = "",
              emoji = "";

            if (cardText.includes("React") && !cardText.includes("Preact")) {
              name = "react";
              emoji = "⚛️";
            } else if (cardText.includes("Preact")) {
              name = "preact";
              emoji = "⚛️";
            } else if (cardText.includes("Remix") || cardText.includes("💿")) {
              name = "remix";
              emoji = "💿";
            } else {
              continue; // Unrecognized framework
            }

            cardResults.push({
              selector: `.framework-card:has-text("${
                name === "remix"
                  ? "Remix"
                  : name === "react"
                  ? "React"
                  : "Preact"
              }")`,
              name,
              emoji,
              isCard: true,
            });
          }

          return cardResults.length > 0 ? cardResults : null;
        },

        // Strategy 3: Find by buttons with framework text or emoji
        () => {
          const buttons = document.querySelectorAll("button");
          const buttonResults = [];

          for (const button of buttons) {
            const buttonText = button.textContent;
            let name = "",
              emoji = "";

            if (
              (buttonText.includes("React") &&
                !buttonText.includes("Preact")) ||
              buttonText.includes("⚛️")
            ) {
              name = "react";
              emoji = "⚛️";
            } else if (buttonText.includes("Preact")) {
              name = "preact";
              emoji = "⚛️";
            } else if (
              buttonText.includes("Remix") ||
              buttonText.includes("💿")
            ) {
              name = "remix";
              emoji = "💿";
            } else {
              continue;
            }

            buttonResults.push({
              selector: `button:has-text("${emoji}")`,
              name,
              emoji,
              isButton: true,
            });
          }

          return buttonResults.length > 0 ? buttonResults : null;
        },
      ];

      // Try each strategy in order until one succeeds
      for (const strategy of tabDetectionStrategies) {
        const strategyResults = strategy();
        if (strategyResults) {
          return strategyResults;
        }
      }

      return results; // Empty if no strategy succeeded
    });

    if (tabs.length === 0) {
      console.warn("No framework tabs could be found on the page");
      return [];
    }

    console.log(
      `Found ${tabs.length} framework tabs: ${tabs
        .map((t) => t.name)
        .join(", ")}`
    );
    return tabs;
  },

  /**
   * Select a specific framework tab by name
   * @param {Page} page - Playwright page
   * @param {string} tabName - Name of the tab to select (react, remix, preact)
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<boolean>} Whether the tab was successfully selected
   */
  selectTab: async function (page, tabName, maxRetries = 3) {
    console.log(`Attempting to select ${tabName} tab...`);

    // Special handling for Remix tab in light mode
    const isRemixTab = tabName.toLowerCase() === "remix";
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.dataset.theme === "dark";
    });

    // For Remix in light mode, we need to be more aggressive with selection
    const actualRetries =
      isRemixTab && !isDarkMode ? maxRetries + 2 : maxRetries;
    console.log(`Using ${actualRetries} retries for ${tabName} tab selection`);

    // Find all tabs first
    const tabs = await this.findAllTabs(page);
    const targetTab = tabs.find((tab) => tab.name === tabName.toLowerCase());

    if (!targetTab) {
      console.warn(`Could not find ${tabName} tab among available tabs`);
      return false;
    }

    // Try to click the tab with retry
    let attempt = 0;
    let success = false;

    // Add specific direct click selector for light mode Remix tab as a last resort
    const directRemixSelector = isRemixTab
      ? '[data-testid="jods-framework-tab-remix"], button:has-text("Remix"), button:has-text("💿"), .framework-card:has-text("Remix")'
      : null;

    while (attempt < actualRetries && !success) {
      attempt++;
      try {
        // First check if already selected
        const isSelected = await this.isTabSelected(page, tabName);
        if (isSelected) {
          console.log(`${tabName} tab is already selected`);
          return true;
        }

        console.log(
          `Clicking ${tabName} tab using selector: ${targetTab.selector} (attempt ${attempt}/${actualRetries})`
        );

        // For Remix tab in light mode, use direct evaluation for more reliable clicking
        if (isRemixTab && !isDarkMode) {
          await this._handleRemixTabClick(page, targetTab.selector);
          // Wait longer for Remix tab change to take effect
          await page.waitForTimeout(2000);
        } else {
          // Standard click process for other tabs or dark mode
          await this._handleStandardTabClick(page, targetTab.selector);
          // Wait for tab change to take effect
          await page.waitForTimeout(1500);
        }

        // Verify tab selection
        const selected = await this.isTabSelected(page, tabName);
        if (!selected) {
          // Try one last direct attempt with a hardcoded selector for Remix tab in light mode
          if (
            isRemixTab &&
            !isDarkMode &&
            directRemixSelector &&
            attempt === actualRetries - 1
          ) {
            console.log(
              `Last resort click for Remix tab with direct selector: ${directRemixSelector}`
            );
            await page.click(directRemixSelector, { force: true });
            await page.waitForTimeout(2500);

            const finalCheck = await this.isTabSelected(page, tabName);
            if (finalCheck) {
              console.log(
                `Successfully selected ${tabName} tab after direct selector click`
              );
              return true;
            }
          }

          throw new Error(`${tabName} tab still not selected after clicking`);
        }

        console.log(
          `Successfully selected ${tabName} tab after ${attempt} attempts`
        );
        success = true;
      } catch (error) {
        if (attempt < actualRetries) {
          console.warn(
            `Attempt ${attempt}/${actualRetries} to select ${tabName} tab failed: ${error.message}`
          );
          // Increase wait time with each attempt
          await page.waitForTimeout(800 * attempt);
        } else {
          console.error(
            `Failed to select ${tabName} tab after ${actualRetries} attempts: ${error.message}`
          );
        }
      }
    }

    return success;
  },

  /**
   * Specialized handler for clicking Remix tabs in light mode
   * @private
   */
  _handleRemixTabClick: async function (page, selector) {
    // First try a direct click with Playwright
    try {
      await page.click(selector, {
        timeout: 1000,
        force: true,
      });
      console.log(`Direct click on Remix tab`);
    } catch (directClickError) {
      console.warn(`Direct click failed: ${directClickError.message}`);

      // Fall back to evaluate method for more aggressive clicking
      await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        console.log(`Found ${elements.length} elements matching ${selector}`);

        if (elements.length > 0) {
          // Try clicking all matching elements to increase chances
          elements.forEach((el) => {
            try {
              console.log(
                `Clicking element: ${el.tagName}${
                  el.className ? "." + el.className : ""
                }`
              );
              el.click();
            } catch (e) {
              console.warn(`Click failed on element: ${e.message}`);
            }
          });
        } else if (selector.includes(",")) {
          // Try each part of the selector individually
          const selectorParts = selector.split(",").map((s) => s.trim());
          for (const part of selectorParts) {
            const partElements = document.querySelectorAll(part);
            console.log(
              `Found ${partElements.length} elements matching ${part}`
            );

            for (const el of partElements) {
              try {
                el.click();
                console.log("Clicked element with selector part");
                break;
              } catch (e) {}
            }
          }
        }
      }, selector);
    }
  },

  /**
   * Standard tab click handler for non-Remix tabs or dark mode
   * @private
   */
  _handleStandardTabClick: async function (page, selector) {
    // Use evaluate for more reliable clicking
    const clickResult = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { success: false, error: "Element not found" };

      try {
        element.click();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, selector);

    if (!clickResult.success) {
      console.warn(
        `Failed to click tab in DOM: ${clickResult.error || "unknown error"}`
      );
      // Fall back to Playwright click
      await page.click(selector);
    }
  },

  /**
   * Check if a specific tab is currently selected
   * @param {Page} page - Playwright page
   * @param {string} tabName - Name of the tab to check
   * @returns {Promise<boolean>} Whether the tab is selected
   */
  isTabSelected: function (page, tabName) {
    return page.evaluate((name) => {
      console.log(`Checking if ${name} tab is selected...`);

      // 1. Check by data-testid with aria-selected
      const dataTestIdSelector = `[data-testid='framework-tab-${name.toLowerCase()}'][aria-selected='true'], [data-testid='framework-tab-${name.toLowerCase()}'].active, [data-testid='jods-framework-tab-${name.toLowerCase()}'][aria-selected='true']`;
      if (document.querySelector(dataTestIdSelector)) {
        return true;
      }

      // 2. Special case for Remix tabs
      if (name.toLowerCase() === "remix") {
        // Check common Remix selectors
        const remixSelectors = [
          '.framework-card:has-text("Remix").active',
          '.framework-card:has-text("💿").active',
          'button:has-text("Remix").active',
          'button:has-text("💿").active',
          '[data-testid*="remix" i][aria-selected="true"]',
          '[data-testid*="remix" i].active',
        ];

        if (
          remixSelectors.some((selector) => document.querySelector(selector))
        ) {
          return true;
        }

        // Check Remix-specific content visibility
        const remixContentSelectors = [
          'code:has-text("createCookieStore")',
          'code:has-text("loader")',
          'code:has-text("createSessionStorage")',
          'code:has-text("loaderStore")',
          'div:has-text("Remix state reimagined")',
          'h3:has-text("Remix state")',
        ];

        if (
          remixContentSelectors.some((selector) => {
            const el = document.querySelector(selector);
            return el && el.offsetParent !== null;
          })
        ) {
          return true;
        }
      }

      // 3. Check for tab role with aria-selected
      const tabElements = Array.from(
        document.querySelectorAll('button[role="tab"], [role="tab"], button')
      ).filter(
        (btn) =>
          btn.textContent.includes(name) ||
          (name === "Remix" && btn.textContent.includes("💿"))
      );

      for (const btn of tabElements) {
        // Check aria-selected attribute
        if (btn.getAttribute("aria-selected") === "true") {
          return true;
        }

        // Check for common "selected" classes
        const selectedClasses = [
          "selected",
          "active",
          "current",
          "tabs__item--active",
          "active-tab",
        ];
        if (selectedClasses.some((cls) => btn.className.includes(cls))) {
          return true;
        }

        // Check for parent tablist with selected child
        const tablist = btn.closest('[role="tablist"]');
        if (
          tablist &&
          tablist
            .querySelector('[aria-selected="true"]')
            ?.textContent.includes(name)
        ) {
          return true;
        }

        // Special case for Remix: check visual appearance
        if (name === "Remix") {
          const style = window.getComputedStyle(btn);
          if (
            style.backgroundColor &&
            style.backgroundColor !== "transparent" &&
            style.backgroundColor !== "rgba(0, 0, 0, 0)"
          ) {
            return true;
          }

          // Check parent container style
          const parent = btn.closest("div, li, span");
          if (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (
              parentStyle.backgroundColor &&
              parentStyle.backgroundColor !== "transparent" &&
              parentStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
            ) {
              return true;
            }
          }
        }
      }

      // 4. Check for framework cards with active class
      const frameworkCards = Array.from(
        document.querySelectorAll("div.framework-card")
      );

      for (const card of frameworkCards) {
        if (
          card.textContent.includes(name) ||
          (name === "Remix" && card.textContent.includes("💿"))
        ) {
          // Check active class
          if (card.classList.contains("active")) {
            return true;
          }

          // Check visual style
          const style = window.getComputedStyle(card);
          if (
            (style.transform &&
              style.transform !== "none" &&
              style.transform.includes("translate")) ||
            (style.background &&
              (style.background.includes("gradient") ||
                style.background.includes("rgb(184, 29, 91)") ||
                style.background.includes("rgb(233, 30, 99)")))
          ) {
            return true;
          }
        }
      }

      return false;
    }, tabName);
  },
};

/**
 * The capture manager object with all screenshot capture functionality
 */
export const captureManager = {
  /**
   * Set the theme (light/dark)
   */
  setTheme: async function (page, theme, component) {
    // Check current theme
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.dataset.theme === "dark";
    });

    if (
      (theme === "dark" && !isDarkMode) ||
      (theme === "light" && isDarkMode)
    ) {
      console.log(`Toggling theme to ${theme} mode...`);

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

      // Wait longer for theme transition
      await page.waitForTimeout(1200);

      // Verify the theme changed
      const themeAfterToggle = await page.evaluate(() => {
        return document.documentElement.dataset.theme;
      });

      console.log(`Theme after toggle: ${themeAfterToggle}`);

      // If theme didn't change, try alternative approach
      if (
        (theme === "dark" && themeAfterToggle !== "dark") ||
        (theme === "light" && themeAfterToggle !== "light")
      ) {
        console.log(
          "Theme didn't change as expected, using alternative method..."
        );

        await page.evaluate((targetTheme) => {
          // Force set the theme via dataset
          document.documentElement.dataset.theme = targetTheme;

          // Also try to trigger theme change events
          document.dispatchEvent(
            new CustomEvent("themeChange", {
              detail: { theme: targetTheme },
            })
          );
        }, theme);

        await page.waitForTimeout(500);
      }

      // Add extra wait time for dark mode if specified in component config
      if (theme === "dark" && component?.darkModeExtraWait) {
        console.log(
          `Adding extra wait time for dark mode: ${component.darkModeExtraWait}ms`
        );
        await page.waitForTimeout(component.darkModeExtraWait);
      }
    }
  },

  /**
   * Find the DOM element for a component
   */
  findElementForComponent: async function (page, component) {
    let elementHandle = null;

    // First try the primary selector
    try {
      elementHandle = await page.$(component.selector);
      if (elementHandle) {
        console.log(`Found ${component.name} with primary selector`);
        return elementHandle;
      }
    } catch (error) {
      console.log(`Error using primary selector: ${error.message}`);
    }

    // If we have alternativeSelectors, try those one by one
    if (
      component.alternativeSelectors &&
      component.alternativeSelectors.length > 0
    ) {
      console.log(`Trying alternative selectors for ${component.name}...`);

      // First try each alternative selector individually
      for (const altSelector of component.alternativeSelectors) {
        try {
          elementHandle = await page.$(altSelector);
          if (elementHandle) {
            console.log(
              `Found ${component.name} with alternative selector: ${altSelector}`
            );
            return elementHandle;
          }
        } catch (error) {
          console.log(
            `Error with alternative selector "${altSelector}": ${error.message}`
          );
        }
      }

      // If individual selectors didn't work, try triangulation approach
      // by finding common parent of multiple matched elements
      try {
        const matchedElements = [];

        for (const altSelector of component.alternativeSelectors) {
          const elements = await page.$$(altSelector);
          if (elements.length > 0) {
            matchedElements.push({
              selector: altSelector,
              elements,
            });
          }
        }

        if (matchedElements.length >= 2) {
          console.log(
            `Found ${matchedElements.length} alternative elements for triangulation`
          );

          // Try to find common parent for the first two successful matches
          const el1 = matchedElements[0].elements[0];
          const el2 = matchedElements[1].elements[0];

          elementHandle = await page.evaluateHandle(
            (e1, e2) => {
              // Convert element handles to DOM elements
              const element1 = e1;
              const element2 = e2;

              // Find all parents of element1
              const getParents = (element) => {
                const parents = [];
                let current = element;
                while (current && current !== document.documentElement) {
                  parents.push(current.parentElement);
                  current = current.parentElement;
                }
                return parents;
              };

              const parents1 = getParents(element1);

              // Find common parent (lowest/closest one)
              for (const parent1 of parents1) {
                if (!parent1) continue;
                // Check if this parent contains element2
                if (parent1.contains(element2)) {
                  // Found common parent
                  // If it's too broad (e.g., body), try to find a more specific container
                  if (
                    parent1.tagName === "BODY" ||
                    parent1.tagName === "MAIN"
                  ) {
                    // Look for a more specific container like a section
                    let current = element1;
                    while (current && current !== parent1) {
                      if (
                        current.tagName === "SECTION" ||
                        current.tagName === "ARTICLE" ||
                        (current.tagName === "DIV" &&
                          (current.className.includes("section") ||
                            current.className.includes("container")))
                      ) {
                        if (current.contains(element2)) {
                          return current;
                        }
                      }
                      current = current.parentElement;
                    }
                  }
                  return parent1;
                }
              }

              // If no common parent found, return the first element's parent
              return element1.parentElement;
            },
            el1,
            el2
          );

          if (elementHandle) {
            console.log(
              `Found ${component.name} via triangulation of multiple elements`
            );
            return elementHandle;
          }
        }
      } catch (error) {
        console.log(`Error during triangulation: ${error.message}`);
      }
    }

    // Wait for the selector if specified
    if (component.waitForSelector) {
      try {
        await page.waitForSelector(component.waitForSelector, {
          timeout: 5000,
        });
        elementHandle = await page.$(
          component.selector || component.waitForSelector
        );
        if (elementHandle) {
          console.log(`Found ${component.name} after waiting for selector`);
          return elementHandle;
        }
      } catch (e) {
        console.log(
          `Timeout waiting for selector: ${component.waitForSelector}`
        );
      }
    }

    // If component has a testId, try that
    if (component.testId) {
      try {
        elementHandle = await page.$(`[data-testid="${component.testId}"]`);
        if (elementHandle) {
          console.log(
            `Found ${component.name} using testId: ${component.testId}`
          );
          return elementHandle;
        }
      } catch (e) {
        console.log(`Error finding element by testId: ${e.message}`);
      }
    }

    console.log(`Element not found with selector: ${component.selector}`);
    console.log(`Trying fallback strategy: ${component.fallbackStrategy}`);

    // If not found, try fallback strategies
    if (component.fallbackStrategy === "first-heading") {
      // Get the first main heading on the page
      elementHandle = await page.$("h1");
      if (!elementHandle) {
        elementHandle = await page.$("h2");
      }
    } else if (
      component.fallbackStrategy === "section-index" &&
      component.sectionIndex !== undefined
    ) {
      // Try to get the nth section on the page
      const sections = await page.$$("section");
      if (sections.length > component.sectionIndex) {
        elementHandle = sections[component.sectionIndex];
        console.log(`Using section at index ${component.sectionIndex}`);
      } else if (sections.length > 0) {
        // If specified index is out of bounds but we have sections, take the last one
        elementHandle = sections[sections.length - 1];
        console.log(
          `Section index ${component.sectionIndex} out of bounds, using last section`
        );
      }
    } else if (
      component.fallbackStrategy === "keyword-context" &&
      component.keywords
    ) {
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
              return current.textContent.length < smallest.textContent.length
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
      }, component.keywords);
    } else if (component.fallbackStrategy === "last-element") {
      // Get the footer or last main element on the page
      elementHandle = await page.$("footer");
      if (!elementHandle) {
        const mainElements = await page.$$("main > *");
        if (mainElements.length > 0) {
          elementHandle = mainElements[mainElements.length - 1];
        }
      }
    }

    return elementHandle;
  },

  /**
   * Manage animations on the page for consistent screenshots
   * @param {Page} page - Playwright page object
   * @param {string} action - 'pause' or 'resume'
   * @param {Object} component - Component configuration (optional)
   */
  manageAnimations: async function (page, action = "pause", component = null) {
    // Skip if animations shouldn't be paused for this component
    if (component && !component.pauseAnimations) return;

    console.log(`${action === "pause" ? "Pausing" : "Resuming"} animations...`);

    // Apply a stylesheet to control animations
    await page.evaluate((pausing) => {
      // Create or get the style element
      let style = document.getElementById("animation-control-for-screenshots");
      if (!style) {
        style = document.createElement("style");
        style.id = "animation-control-for-screenshots";
        document.head.appendChild(style);
      }

      // Simple CSS to freeze all animations and transitions
      const css = pausing
        ? `
          *, *::before, *::after {
            animation-play-state: paused !important;
            transition: none !important;
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
          /* Hide particles and sparkle effects */
          canvas[class*="particles"], [class*="sparkle"], [class*="twinkle"] {
            opacity: 0 !important; 
          }
        `
        : "";

      // Apply or remove style
      style.textContent = css;
    }, action === "pause");

    // Give time for style to take effect
    await page.waitForTimeout(200);
  },

  /**
   * Capture HTML debug information for any component
   */
  captureComponentHtml: async function (page, component, elementHandle, theme) {
    try {
      // Create debug directory if it doesn't exist
      const debugDir = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../static/debug"
      );
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      // Get HTML content of the component
      const htmlContent = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element) return null;

        return {
          html: element.outerHTML,
          buttons: Array.from(element.querySelectorAll("button")).map(
            (btn) => ({
              text: btn.textContent.trim(),
              html: btn.outerHTML,
            })
          ),
          headings: Array.from(
            element.querySelectorAll("h1, h2, h3, h4, h5, h6")
          ).map((h) => ({
            level: h.tagName,
            text: h.textContent.trim(),
          })),
        };
      });

      if (htmlContent) {
        const debugFilePath = path.join(
          debugDir,
          `${component.name}-${theme}-debug.html`
        );
        let debugContent = `<h1>${component.name} Debug (${theme} theme)</h1>`;
        debugContent += `<h2>Full HTML</h2><pre>${htmlContent.html
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>`;

        debugContent += `<h2>Headings (${htmlContent.headings.length})</h2>`;
        htmlContent.headings.forEach((heading, _i) => {
          debugContent += `<p><strong>${heading.level}</strong>: ${heading.text}</p>`;
        });

        debugContent += `<h2>Buttons (${htmlContent.buttons.length})</h2>`;
        htmlContent.buttons.forEach((btn, _i) => {
          debugContent += `<h3>Button: "${btn.text}"</h3><pre>${btn.html
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</pre>`;
        });

        fs.writeFileSync(debugFilePath, debugContent);
        console.log(`HTML debug info saved to: ${debugFilePath}`);
      }
    } catch (error) {
      console.log(`Error capturing HTML debug: ${error.message}`);
    }
  },

  /**
   * Highlight elements for diffing by adding temporary visual markers
   * @param {Page} page - Playwright page
   * @param {string[]} selectors - Array of selectors to highlight
   * @param {string} action - 'add' or 'remove'
   */
  highlightElementsForDiff: async function (page, selectors, action = "add") {
    if (!selectors || selectors.length === 0) return;

    console.log(
      `${action === "add" ? "Adding" : "Removing"} diff markers to ${
        selectors.length
      } elements`
    );

    await page.evaluate(
      (params) => {
        // Create or get the style element
        let style = document.getElementById("diff-highlight-style");
        if (!style && params.action === "add") {
          style = document.createElement("style");
          style.id = "diff-highlight-style";
          document.head.appendChild(style);

          // Add the highlight styles
          style.textContent = `
          [data-diff-highlight="true"] {
            outline: 3px solid rgba(255, 0, 0, 0.7) !important;
            outline-offset: 2px !important;
            position: relative !important;
          }
          [data-diff-highlight="true"]::after {
            content: "📊 DIFF" !important;
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            background: rgba(255, 0, 0, 0.7) !important;
            color: white !important;
            font-size: 10px !important;
            padding: 2px 5px !important;
            border-radius: 3px !important;
            z-index: 10000 !important;
            pointer-events: none !important;
          }
        `;
        } else if (style && params.action === "remove") {
          style.remove();
        }

        // Apply or remove highlight for each selector
        if (params.action === "add") {
          for (const selector of params.selectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
              el.setAttribute("data-diff-highlight", "true");

              // Store original outline if any
              if (el.style.outline) {
                el.setAttribute("data-original-outline", el.style.outline);
              }
            }
          }
        } else {
          // Remove all highlights
          const highlightedElements = document.querySelectorAll(
            '[data-diff-highlight="true"]'
          );
          for (const el of highlightedElements) {
            el.removeAttribute("data-diff-highlight");

            // Restore original outline if any
            if (el.hasAttribute("data-original-outline")) {
              el.style.outline = el.getAttribute("data-original-outline");
              el.removeAttribute("data-original-outline");
            }
          }
        }
      },
      { selectors, action }
    );
  },

  /**
   * Capture a specific element with appropriate clipping
   * @returns {boolean} Whether the capture was successful
   */
  captureSpecificElement: async function (
    page,
    elementHandle,
    component,
    theme,
    timestamp,
    saveBaseline,
    outputDir
  ) {
    try {
      // Pause animations if specified
      await this.manageAnimations(page, "pause", component);

      // Special handling for Remix section to ensure header is visible
      if (component.name === "remix-section") {
        console.log("Applying special positioning for Remix section");
        await page.evaluate(() => {
          // Find the closest heading using standard DOM operations
          // First try with ID
          const section = document.querySelector("#remix-integration");
          let heading = null;

          if (section) {
            // Try to find the heading inside the section
            heading = section.querySelector("h2");
          }

          // If not found, try to find by heading text content
          if (!heading) {
            const allHeadings = document.querySelectorAll("h2");
            for (const h of allHeadings) {
              if (
                h.textContent &&
                h.textContent.includes("Remix Integration")
              ) {
                heading = h;
                break;
              }
            }
          }

          if (heading) {
            // Scroll to position header at the top with more margin
            const scrollTop =
              window.pageYOffset || document.documentElement.scrollTop;
            const headingTop = heading.getBoundingClientRect().top + scrollTop;
            window.scrollTo({
              top: Math.max(0, headingTop - 250), // Extra space above the heading
              behavior: "smooth",
            });
          } else if (section) {
            // Fallback to section if heading not found
            const scrollTop =
              window.pageYOffset || document.documentElement.scrollTop;
            const sectionTop = section.getBoundingClientRect().top + scrollTop;
            window.scrollTo({
              top: Math.max(0, sectionTop - 250),
              behavior: "smooth",
            });
          }
        });

        // Wait for scroll to complete
        await page.waitForTimeout(500);
      }

      // Add diff markers if component has diff highlights defined
      if (component.diffHighlightSelectors) {
        await this.highlightElementsForDiff(
          page,
          component.diffHighlightSelectors,
          "add"
        );
      }

      // Execute beforeScreenshot hook if defined
      if (
        component.beforeScreenshot &&
        typeof component.beforeScreenshot === "function"
      ) {
        console.log(`Executing beforeScreenshot hook for ${component.name}`);
        try {
          await component.beforeScreenshot(page, elementHandle, theme);
          // Allow time for changes to take effect if needed
          await page.waitForTimeout(500);

          // Re-get element handle in case DOM has changed
          if (component.selector) {
            const newElementHandle = await page.$(component.selector);
            if (newElementHandle) {
              elementHandle = newElementHandle;
              // Re-scroll into view after potential changes
              await elementHandle.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
            }
          }
        } catch (hookError) {
          console.warn(`Error in beforeScreenshot hook: ${hookError.message}`);
        }
      }

      // Create the screenshot filename
      const screenshotPath = path.join(
        outputDir,
        `${component.name}-${theme}${saveBaseline ? "" : "-" + timestamp}.png`
      );

      // Get element's bounding box
      const boundingBox = await elementHandle.boundingBox();
      if (!boundingBox) {
        console.warn(`Could not get bounding box for ${component.name}`);
        return false;
      }

      // Get header height for padding calculations
      const headerHeight = await page.evaluate(() => {
        const header = document.querySelector(
          'header, .navbar, [class*="navbar_"]'
        );
        return header ? header.offsetHeight : 0;
      });

      // Make sure element is in view
      await elementHandle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Handle click operations if needed
      if (component.clickSelector) {
        console.log(
          `Clicking element matching selector: ${component.clickSelector}`
        );
        try {
          await page.click(component.clickSelector);
          const waitTime = component.clickWaitTime || 1000;
          await page.waitForTimeout(waitTime);

          // Re-scroll after clicking
          await elementHandle.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
        } catch (error) {
          console.error(`Error clicking element: ${error.message}`);
        }
      }

      // Get updated position after scrolling/clicking
      const updatedBoundingBox = await elementHandle.boundingBox();
      if (!updatedBoundingBox) {
        console.warn(
          `Element disappeared after scrolling for ${component.name}`
        );
        return false;
      }

      // Calculate padding
      const padding = component.padding || 40;
      const topPadding = padding + headerHeight;

      // Set initial clip area
      let adjustedClip = {
        x: Math.max(0, updatedBoundingBox.x - padding),
        y: Math.max(0, updatedBoundingBox.y - topPadding),
        width: Math.min(
          page.viewportSize().width -
            Math.max(0, updatedBoundingBox.x - padding),
          updatedBoundingBox.width + padding * 2
        ),
        height: Math.max(
          updatedBoundingBox.height + topPadding + padding,
          component.minHeight || 0
        ),
      };

      // Handle element exclusions if specified
      if (component.excludeElements && component.excludeElements.length > 0) {
        // Get all elements to exclude that are visible
        const elements = await Promise.all(
          component.excludeElements.map((selector) => page.$$(selector))
        );
        const visibleElements = [];

        // Get bounding boxes for visible elements to exclude
        for (const elementList of elements.flat()) {
          try {
            const box = await elementList.boundingBox();
            const isVisible = await elementList.isVisible();
            if (box && isVisible) {
              visibleElements.push({ box });
            }
          } catch (e) {
            // Ignore errors
          }
        }

        // Adjust clip area to exclude elements at top/bottom if needed
        if (visibleElements.length > 0) {
          // Find elements at top and bottom
          const topElements = visibleElements.filter(
            (el) =>
              el.box.y < adjustedClip.y + 100 &&
              el.box.y + el.box.height <
                adjustedClip.y + adjustedClip.height / 2
          );

          const bottomElements = visibleElements.filter(
            (el) =>
              el.box.y > adjustedClip.y + adjustedClip.height / 2 &&
              el.box.y + el.box.height <=
                adjustedClip.y + adjustedClip.height + 50
          );

          // Adjust top if needed
          if (topElements.length > 0) {
            const maxBottom = Math.max(
              ...topElements.map((el) => el.box.y + el.box.height)
            );
            const newY = maxBottom + 10;

            if (
              newY > adjustedClip.y &&
              newY < adjustedClip.y + adjustedClip.height / 2
            ) {
              adjustedClip.height -= newY - adjustedClip.y;
              adjustedClip.y = newY;
            }
          }

          // Adjust bottom if needed
          if (bottomElements.length > 0) {
            const minTop = Math.min(...bottomElements.map((el) => el.box.y));
            const newHeight = minTop - adjustedClip.y - 10;

            if (newHeight > adjustedClip.height / 2) {
              adjustedClip.height = newHeight;
            }
          }
        }
      }

      // Make sure we don't exceed the page dimensions
      if (adjustedClip.y + adjustedClip.height > page.viewportSize().height) {
        adjustedClip.height = page.viewportSize().height - adjustedClip.y - 10;
      }

      // Verify clip dimensions are positive
      if (adjustedClip.width <= 0 || adjustedClip.height <= 0) {
        console.warn(
          `Invalid clip dimensions, taking full viewport screenshot instead`
        );
        await page.screenshot({ path: screenshotPath, fullPage: false });
      } else {
        // Take the screenshot with the calculated clip area
        console.log(
          `Taking screenshot with clip: x=${adjustedClip.x}, y=${adjustedClip.y}, width=${adjustedClip.width}, height=${adjustedClip.height}`
        );
        await page.screenshot({ path: screenshotPath, clip: adjustedClip });
      }

      console.log(`Screenshot saved to: ${screenshotPath}`);

      // Remove diff markers if they were added
      if (component.diffHighlightSelectors) {
        await this.highlightElementsForDiff(
          page,
          component.diffHighlightSelectors,
          "remove"
        );
      }

      await this.manageAnimations(page, "resume", component);
      return true;
    } catch (error) {
      console.error(`Error capturing ${component.name}: ${error.message}`);

      // Clean up in case of error
      if (component.diffHighlightSelectors) {
        await this.highlightElementsForDiff(
          page,
          component.diffHighlightSelectors,
          "remove"
        );
      }

      await this.manageAnimations(page, "resume", component);
      return false;
    }
  },

  /**
   * Capture framework tabs
   * @returns {boolean} Whether capturing was successful
   */
  captureFrameworkTabs: async function (
    page,
    component,
    theme,
    timestamp,
    saveBaseline,
    outputDir
  ) {
    console.log("Capturing framework tabs...");

    // Find the framework section
    const frameworkSection = await page.$(component.selector);

    if (!frameworkSection) {
      console.error("Could not find framework section");
      return false;
    }

    // If component has forceReactTabOnly flag, only capture React tab
    if (component.forceReactTabOnly) {
      console.log("Capturing only React tab due to forceReactTabOnly setting");

      // Select React tab
      const reactTabSelected = await tabManager.selectTab(page, "React", 3);

      if (!reactTabSelected) {
        console.warn(
          "Could not select React tab, but will attempt to capture anyway"
        );
      }

      // Capture React tab
      return await this.captureTabScreenshot(
        page,
        frameworkSection,
        null, // No need for tabButton anymore
        "react",
        component,
        theme,
        timestamp,
        saveBaseline,
        outputDir
      );
    }

    // Default behavior: capture multiple tabs
    // Get available tabs
    const tabsInfo = await tabManager.findAllTabs(page);

    if (tabsInfo.length === 0) {
      console.error("No framework tabs found on page");
      return false;
    }

    // Determine which tabs to capture
    let tabsToCaptureNames = [];

    if (component.captureTabs) {
      // Specific tabs requested in component config
      tabsToCaptureNames = component.captureTabs;
    } else {
      // Default: capture all tabs found
      tabsToCaptureNames = tabsInfo.map((tab) => tab.name);
    }

    console.log(`Will capture tabs: ${tabsToCaptureNames.join(", ")}`);

    // Track success
    let capturedAny = false;

    // Prioritize Remix tab first if requested
    if (component.captureRemixFirst && tabsToCaptureNames.includes("remix")) {
      // Move Remix to the beginning
      tabsToCaptureNames = [
        "remix",
        ...tabsToCaptureNames.filter((name) => name !== "remix"),
      ];
    }

    // Capture each tab
    for (const tabName of tabsToCaptureNames) {
      try {
        // Select the tab
        const tabSelected = await tabManager.selectTab(page, tabName, 3);

        if (!tabSelected) {
          console.warn(`Could not select ${tabName} tab, skipping`);
          continue;
        }

        // Determine final tab ID for filename
        let finalTabId = tabName;

        // Apply special handling based on component config
        if (component.forceSaveAsReact) {
          finalTabId = "react";
        } else if (component.name === "framework-section") {
          // For framework section, always use 'react' as the identifier
          finalTabId = "react";
        }

        // Capture screenshot for this tab
        const tabSuccess = await this.captureTabScreenshot(
          page,
          frameworkSection,
          null, // No need for tabButton anymore
          finalTabId,
          component,
          theme,
          timestamp,
          saveBaseline,
          outputDir
        );

        if (tabSuccess) {
          capturedAny = true;
        }

        // If this is the Remix tab and React tab couldn't be found, create a React file too
        if (finalTabId === "remix" && component.simulateReactTab) {
          const reactPath = path.join(
            outputDir,
            `${component.name}-react-${theme}${
              saveBaseline ? "" : "-" + timestamp
            }.png`
          );

          const screenshotPath = path.join(
            outputDir,
            `${component.name}-${finalTabId}-${theme}${
              saveBaseline ? "" : "-" + timestamp
            }.png`
          );

          try {
            // Copy the file to create a React version
            fs.copyFileSync(screenshotPath, reactPath);
            console.log(`Created simulated React tab screenshot: ${reactPath}`);
          } catch (error) {
            console.error(
              `Error creating simulated React tab: ${error.message}`
            );
          }
        }
      } catch (error) {
        console.error(`Error capturing ${tabName} tab: ${error.message}`);
      }
    }

    // Return true if we captured at least one tab successfully
    return capturedAny;
  },

  /**
   * Capture a single framework tab screenshot
   * @returns {boolean} Whether the capture was successful
   */
  captureTabScreenshot: async function (
    page,
    frameworkSection,
    tabButton, // This is now optional as tabManager handles selection
    tabIdentifier,
    component,
    theme,
    timestamp,
    saveBaseline,
    outputDir
  ) {
    try {
      console.log(`Capturing ${tabIdentifier} tab screenshot...`);

      // Pause animations if specified in the component config
      await this.manageAnimations(page, "pause", component);

      // Extra wait for dark mode if needed
      if (theme === "dark" && component.darkModeExtraWait) {
        console.log(
          `Adding extra wait time for ${tabIdentifier} tab in dark mode: ${component.darkModeExtraWait}ms`
        );
        await page.waitForTimeout(component.darkModeExtraWait);
      }

      // Special handling for Remix tab in light mode
      const isRemixTab = tabIdentifier.includes("remix");

      if (isRemixTab && theme === "light") {
        console.log("Special handling for Remix tab in light mode");

        // Special positioning for Remix tab
        await page.evaluate(() => {
          // Find the heading
          const frameworkHeading = Array.from(
            document.querySelectorAll("h2")
          ).find(
            (h) =>
              h.textContent.includes("Works with your favorite frameworks") ||
              h.textContent.includes("Framework Integration")
          );

          if (frameworkHeading) {
            console.log(
              "Found framework heading, scrolling to position it at top"
            );
            // Calculate position to show heading at top with more margin
            const rect = frameworkHeading.getBoundingClientRect();
            const scrollOffset = window.scrollY + rect.top - 250;
            window.scrollTo(0, scrollOffset);
            return true;
          }
          return false;
        });
      }

      // Additional scroll for better positioning
      await page.evaluate(
        (params) => {
          window.scrollBy(0, -params.offset);
        },
        { offset: component.extraScroll || 0 }
      );
      await page.waitForTimeout(500);

      // Get position after scrolling
      const updatedBoundingBox = await frameworkSection.boundingBox();

      if (!updatedBoundingBox) {
        console.warn("Could not get framework section bounding box");
        return false;
      }

      // Calculate clip area
      const padding = component.padding || 40;
      const clip = {
        x: Math.max(0, updatedBoundingBox.x - padding),
        y: Math.max(0, updatedBoundingBox.y - padding * 2),
        width: Math.min(
          page.viewportSize().width -
            Math.max(0, updatedBoundingBox.x - padding),
          updatedBoundingBox.width + padding * 2
        ),
        height: Math.max(
          updatedBoundingBox.height + padding * 3,
          component.minHeight || 0
        ),
      };

      // Make sure we don't exceed the page dimensions
      if (clip.y + clip.height > page.viewportSize().height) {
        clip.height = page.viewportSize().height - clip.y - 10;
      }

      // Verify clip dimensions are positive
      if (clip.width <= 0 || clip.height <= 0) {
        console.error(
          `Invalid clip dimensions: width=${clip.width}, height=${clip.height}`
        );
        return false;
      }

      // Take the screenshot
      const screenshotPath = path.join(
        outputDir,
        `${component.name}-${tabIdentifier}-${theme}${
          saveBaseline ? "" : "-" + timestamp
        }.png`
      );

      await page.screenshot({
        path: screenshotPath,
        clip,
      });

      console.log(`Framework tab screenshot saved to: ${screenshotPath}`);

      // Resume animations if they were paused
      await this.manageAnimations(page, "resume", component);

      return true;
    } catch (error) {
      console.error(`Error capturing ${tabIdentifier} tab: ${error.message}`);

      // Resume animations even if the screenshot failed
      try {
        await this.manageAnimations(page, "resume", component);
      } catch (e) {
        // Ignore errors in animation resuming
      }

      return false;
    }
  },
};
