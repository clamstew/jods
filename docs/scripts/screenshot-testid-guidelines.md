# TestID-Driven Screenshot Framework

This document outlines a systematic approach to building a screenshot testing framework driven by `data-testid` attributes. By simply tagging elements with proper test IDs, we can automate the entire screenshot testing process.

## Core Vision

With this framework, the developer workflow becomes:

1. **Tag components** with standardized `data-testid` attributes
2. **Run the generation script** to auto-discover elements and build the selectors file
3. **Execute screenshot tests** that reliably target the right elements

## Core Principles

1. **Explicit over implicit**: Use explicit testIDs rather than relying on text content or DOM structure
2. **Consistent naming**: Follow a consistent naming pattern for all testIDs
3. **Hierarchical structure**: Use parent/child relationships in testID naming
4. **Progressive enhancement**: Add testIDs while maintaining backward compatibility
5. **Auto-discovery**: Components with proper testIDs are automatically included in testing

## TestID Naming Convention

```
data-testid="jods-[section]-[component]-[variant]"
```

Examples:

- `data-testid="jods-framework-section"` - Main framework section container
- `data-testid="jods-framework-tab-react"` - React tab in framework section
- `data-testid="jods-framework-tab-remix"` - Remix tab in framework section
- `data-testid="jods-hero-section"` - Hero section
- `data-testid="jods-features-section"` - Features section

## Implementation in Components

### Framework Tabs Example

```jsx
// Framework card/tab
<div
  className={`framework-card ${isActive ? 'active' : ''}`}
  data-testid={`jods-framework-tab-${framework.toLowerCase()}`}
  onClick={() => selectFramework(framework)}>
  <div className="emoji">{framework === 'React' ? '⚛️' : framework === 'Remix' ? '💿' : ''}</div>
  <h3>{framework}</h3>
  <p>{description}</p>
</div>

// Framework section
<section
  id="framework-integration"
  data-testid="jods-framework-section">
  <h2>Works with your favorite frameworks</h2>
  {/* tabs and content */}
</section>
```

## Auto-Generation of Screenshot Selectors

One of the powerful features of this approach is the ability to auto-generate the selectors configuration.

Here's how it works:

1. A **discovery script** crawls the site and finds all elements with matching `data-testid` patterns
2. It **analyzes the structure** to identify parent/child relationships and interactive elements
3. It **generates a configuration file** with optimized selectors for each element
4. Additional settings (padding, min-height, etc.) can be applied based on component type

### Example Generator Script

```js
// pseudocode for the generator
async function generateScreenshotSelectors() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Visit the site
  await page.goto("http://localhost:3000");

  // Find all elements with data-testid that match our patterns
  const elements = await page.$$('[data-testid^="jods-"]');

  // Build component configurations
  const components = [];

  for (const element of elements) {
    const testId = await element.getAttribute("data-testid");
    const rect = await element.boundingBox();

    // Analyze the element type and structure
    const component = {
      name: testIdToName(testId),
      selector: `[data-testid="${testId}"]`,
      testId,
      padding: calculatePadding(testId, rect),
      minHeight: calculateMinHeight(testId, rect),
      // Additional smart defaults based on element type
    };

    // For framework tabs, add special click handling
    if (testId.includes("framework-tab")) {
      component.clickSelector = `[data-testid="${testId}"]`;
      component.clickWaitTime = 1500;
    }

    components.push(component);
  }

  // Write the components to a file
  fs.writeFileSync(
    "./screenshot-selectors.generated.mjs",
    generateCode(components)
  );

  await browser.close();
}
```

## Updating Screenshot Selectors

In `screenshot-selectors.mjs`, prioritize testIDs:

```js
{
  page: "/",
  name: "framework-section-remix",
  selector: "[data-testid='jods-framework-section']",
  fallbackStrategy: "keyword-context",
  keywords: ["favorite frameworks", "Framework Integration"],
  clickSelector: "[data-testid='jods-framework-tab-remix']",
  // Fallbacks after the testID selector...
}
```

## Testing Workflow

1. Add testIDs to key components
2. Run the generator to discover and create selectors
3. Execute the screenshot tests
4. Review and manually adjust generated selectors if needed

## Benefits

- **Resilience to design changes**: TestIDs don't change when styling or content changes
- **Explicit intent**: Clear indication of what elements are important for testing
- **Simplified selectors**: No need for complex CSS or XPath selectors
- **Better debugging**: Easier to identify elements in test failures
- **Cross-browser consistency**: More reliable than relying on visual appearance or text content
- **Auto-generation**: Reduces manual work in maintaining selectors
- **Self-documenting**: TestIDs make it clear what's important to test

## Integration with Unified Screenshot Approach

The unified screenshot script is enhanced to:

1. First try finding elements by testID
2. Fall back to existing selectors if testIDs aren't found
3. Report elements found by testID vs fallback in logs

## Implementation Roadmap

1. **Phase 1**: Add testIDs to critical components
2. **Phase 2**: Create helpers for testID-based selection
3. **Phase 3**: Build the auto-discovery and generation script
4. **Phase 4**: Integrate with existing screenshot workflows
5. **Phase 5**: Migrate entirely to testID-driven approach

## Practical Example Command

Example of running the generator and screenshot tests:

```bash
# Generate selectors from testIDs
npm run docs:generate-selectors

# Run tests using generated selectors
npm run docs:screenshot:testid

# Combined command for CI
npm run docs:screenshot:auto
```

This provides a gradual migration path without breaking existing tests while moving toward a fully automated, testID-driven screenshot testing framework.
