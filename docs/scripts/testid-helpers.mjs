/**
 * Helper functions for working with data-testid attributes in screenshot scripts
 */

/**
 * Finds an element by data-testid with fallbacks
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} testId - The base testId to look for
 * @param {string[]} variants - Additional variants to try if the base testId isn't found
 * @param {string[]} fallbackSelectors - CSS selectors to try if no testIds match
 * @returns {Promise<import('@playwright/test').ElementHandle | null>} - The found element or null
 */
export async function findByTestId(
  page,
  testId,
  variants = [],
  fallbackSelectors = []
) {
  console.log(`Looking for element with testId: ${testId}`);

  // Try the base testId first
  let element = await page.$(`[data-testid="${testId}"]`);
  if (element) {
    console.log(`✅ Found element by testId: ${testId}`);
    return element;
  }

  // Try variants
  for (const variant of variants) {
    const variantId = `${testId}-${variant}`;
    element = await page.$(`[data-testid="${variantId}"]`);
    if (element) {
      console.log(`✅ Found element by variant testId: ${variantId}`);
      return element;
    }
  }

  // Try fallback selectors
  for (const selector of fallbackSelectors) {
    try {
      element = await page.$(selector);
      if (element) {
        console.log(`⚠️ Found element by fallback selector: ${selector}`);
        return element;
      }
    } catch (e) {
      console.log(`Error with fallback selector: ${selector}`, e.message);
    }
  }

  console.log(`❌ Could not find element with testId: ${testId} or fallbacks`);
  return null;
}

/**
 * Clicks an element by data-testid with fallbacks
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} testId - The base testId to look for
 * @param {string[]} variants - Additional variants to try if the base testId isn't found
 * @param {string[]} fallbackSelectors - CSS selectors to try if no testIds match
 * @param {number} waitTime - Time to wait after clicking in ms
 * @returns {Promise<boolean>} - Whether the click was successful
 */
export async function clickByTestId(
  page,
  testId,
  variants = [],
  fallbackSelectors = [],
  waitTime = 1000
) {
  const element = await findByTestId(page, testId, variants, fallbackSelectors);

  if (element) {
    try {
      await element.click();
      console.log(`✅ Successfully clicked element with testId: ${testId}`);

      if (waitTime > 0) {
        console.log(`Waiting ${waitTime}ms after click...`);
        await page.waitForTimeout(waitTime);
      }

      return true;
    } catch (e) {
      console.log(`Error clicking element with testId: ${testId}`, e.message);

      // Try direct DOM click as fallback
      try {
        await page.evaluate((id) => {
          const el = document.querySelector(`[data-testid="${id}"]`);
          if (el) {
            el.click();
            return true;
          }
          return false;
        }, testId);

        console.log(
          `✅ Successfully clicked element with testId: ${testId} via DOM`
        );

        if (waitTime > 0) {
          await page.waitForTimeout(waitTime);
        }

        return true;
      } catch (domError) {
        console.log(`Error with DOM click fallback:`, domError.message);
      }
    }
  }

  // Last resort: try direct CSS selector click
  if (fallbackSelectors.length > 0) {
    try {
      await page.click(fallbackSelectors[0]);
      console.log(
        `⚠️ Clicked first fallback selector: ${fallbackSelectors[0]}`
      );

      if (waitTime > 0) {
        await page.waitForTimeout(waitTime);
      }

      return true;
    } catch (e) {
      console.log(`Error with direct selector click:`, e.message);
    }
  }

  return false;
}

/**
 * Converts a component config to use testId-first approach
 * @param {Object} component - The component configuration object
 * @returns {Object} - Updated component with testId selectors prioritized
 */
export function convertComponentToTestIdFirst(component) {
  const baseName = component.name.replace(/-/g, " ").split(" ");
  const section =
    baseName[baseName.length - 1] === "section"
      ? baseName.slice(0, -1).join("-")
      : baseName.join("-");

  // Create standard testId patterns
  const sectionTestId = `jods-${section}-section`;

  // For tabs, create framework-specific testIds
  const isFrameworkTab =
    component.name.includes("framework") && component.name.includes("-tab");
  const tabName = isFrameworkTab ? component.name.split("-").pop() : null;
  const tabTestId = tabName ? `jods-framework-tab-${tabName}` : null;

  // Update the component
  const updatedComponent = {
    ...component,
    testId: component.testId || sectionTestId,
  };

  // Add testId as first alternativeSelector if we have it
  if (!updatedComponent.alternativeSelectors) {
    updatedComponent.alternativeSelectors = [];
  }

  updatedComponent.alternativeSelectors = [
    `[data-testid="${updatedComponent.testId}"]`,
    ...updatedComponent.alternativeSelectors,
  ];

  // Update clickSelector for tabs
  if (tabTestId && updatedComponent.clickSelector) {
    updatedComponent.clickSelector = `[data-testid="${tabTestId}"], ${updatedComponent.clickSelector}`;
  }

  return updatedComponent;
}

/**
 * Convert all components to testId-first approach
 * @param {Array} components - Array of component configurations
 * @returns {Array} - Updated components with testId selectors prioritized
 */
export function convertAllComponentsToTestIdFirst(components) {
  return components.map(convertComponentToTestIdFirst);
}
