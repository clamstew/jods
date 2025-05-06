# Playwright Screenshot Scripts

This directory contains scripts for automated screenshots of the jods documentation site.

## Quick Overview

These scripts handle:

- Full page screenshots
- Component screenshots
- Section screenshots using content-based selection and CSS selectors
- Screenshot batch cleanup and management

## 📚 Documentation

For complete documentation on the screenshot system, please refer to the [Playwright Screenshots](../docs/playwright-screenshots.md) guide in the docs directory.

## Available Scripts

- `screenshot-selectors.mjs` - Unified selectors registry for all components
- `screenshot-unified.mjs` - Consolidated screenshot script with multiple modes (RECOMMENDED)
- `screenshot-cleanup.mjs` - Tool for managing screenshot batches

## Unified Screenshot Approach

The unified screenshot approach consists of:

1. **Unified Selectors Registry** (`screenshot-selectors.mjs`)

   - Central registry of all components and sections
   - Includes primary selectors and multiple alternative selectors for triangulation
   - Provides fallback strategies for each component
   - **Uses data-testid attributes as the preferred identification method**
   - Supports element exclusion for fine-tuned screenshots

2. **Unified Screenshot Script** (`screenshot-unified.mjs`)

   - Supports multiple modes via simple command-line arguments
   - Uses triangulation of multiple elements for reliable section capture
   - Intelligently excludes specified elements while capturing sections
   - Uses consistent padding, naming, and screenshot logic
   - Supports both light and dark themes
   - Handles complex components like tabbed interfaces

3. **Single Output Directory**
   - All screenshots are saved to `docs/static/screenshots/unified/`
   - Consistent naming format: `component-name-theme[-timestamp].png`

### Command-Line Arguments

The screenshot script supports these arguments:

```
--baseline           Save as baseline (no timestamp)
--mode=MODENAME      Set mode: all, components, sections, remix
--components=C1,C2   Capture specific components by name
--use-generated-selectors  Use auto-generated selectors from data-testids
```

### Recommended Usage

When running screenshot scripts:

```bash
# From docs directory
pnpm screenshot                    # All components
pnpm screenshot -- --mode=sections # Just homepage sections
pnpm screenshot -- --mode=remix    # Just Remix section

# Capture specific components by name
pnpm screenshot -- --components=framework-section-react
pnpm screenshot -- --components=framework-section-react,framework-section-remix

# Create baseline screenshots (without timestamp)
pnpm screenshot:baseline

# From root directory
pnpm docs:screenshot
pnpm docs:screenshot:baseline
pnpm docs:screenshot:diff
pnpm docs:screenshot:cleanup
```

## Framework Tabs

The system supports capturing different tabs of the framework showcase section:

- `framework-section-react` - Captures the React tab (default tab, no click needed)
- `framework-section-remix` - Captures the Remix tab (automatically clicks the Remix tab)

These are configured as separate components in the selectors registry, allowing dedicated screenshots with appropriate heights and element exclusions for each tab.

### Special Configuration for Tabs

Framework tabs use these properties for reliable capturing:

```js
// React tab (default on load)
{
  name: "framework-section-react",
  // ...other properties
}

// Remix tab (needs to click tab)
{
  name: "framework-section-remix",
  // ...other properties
  clickSelector: "button:has-text('Remix'), button:has-text('💿')", // Click Remix tab
  clickWaitTime: 1500, // Wait for tab to switch
}
```

## Screenshot Cleanup

The screenshot cleanup script helps manage stored screenshot batches:

### Features

- Detects and organizes screenshots by timestamp batches
- Preserves baseline screenshots (non-timestamped)
- Selectively keeps recent batches while removing older ones
- Supports dry run mode to preview deletion without removing files

### Usage

```bash
# From docs directory
pnpm screenshot:cleanup              # Keep only latest batch
pnpm screenshot:cleanup -- --dry-run # Preview what would be deleted
```

### How It Works

The cleanup script:

1. Scans the unified screenshots directory
2. Identifies timestamped batches by parsing filenames
3. Sorts batches chronologically
4. Keeps the N most recent batches based on parameters
5. Removes older timestamped screenshots
6. Always preserves baseline (non-timestamped) screenshots

Use this script regularly to prevent the screenshots directory from growing too large.

## How It Works

The unified approach:

1. **Defining Components**

   - Components are defined in `screenshot-selectors.mjs`
   - Each component has a name, selector, and other properties
   - Special handling for complex cases like framework tabs

2. **Taking Screenshots**
   - The unified script loads component definitions
   - Navigates to the appropriate page for each component
   - **First tries to locate elements by data-testid attribute**
   - Falls back to CSS selectors and triangulation strategies if needed
   - Captures screenshots in both light and dark modes

## Using Test IDs

The preferred way to identify sections is using the `data-testid` attribute:

1. Each section component in the site adds a `data-testid` attribute to its root element
2. The screenshot script attempts to locate elements by this ID first
3. This provides the most reliable element selection method
4. CSS selectors and triangulation are used as fallbacks

Example:

```jsx
// In your React component
<section className="features-container" data-testid="jods-features-section">
  {/* section content */}
</section>

// In screenshot-selectors.mjs
{
  name: "features-section",
  selector: "section.features-container",
  testId: "jods-features-section", // This is the preferred selector
  // other properties...
}
```

## Adding New Screenshot Features

When adding new screenshot capabilities:

1. Update the component definitions in `screenshot-selectors.mjs`
2. **Add the data-testid attribute to the component in the source code**
3. Add npm scripts to package.json if needed
4. Update the documentation in `docs/docs/playwright-screenshots.md`

## Advanced Features

### Element Exclusion

The script supports fine-tuned control over what appears in screenshots:

- Use `excludeElements` to specify elements that should be excluded from the screenshot
- Elements are still used for triangulation and section identification
- The script automatically adjusts clip boundaries to exclude these elements
- Useful for removing navigation bars, footers, or other elements that shouldn't be in the final screenshot

Example:

```js
{
  name: "hero-section",
  // primary selector and other properties...
  alternativeSelectors: [
    "h1:has-text('jods')",
    ".hero-subtitle"
  ],
  excludeElements: [
    "nav",
    ".navbar"
  ]
}
```

### Animation Control

The script automatically pauses animations and transitions during screenshots for more consistent results:

```js
{
  name: "hero-section",
  // other properties...
  pauseAnimations: true, // Controls whether animations should be paused (default: true)
}
```

### Click Before Screenshot

Some components need interaction before capturing:

```js
{
  name: "framework-section-remix",
  // other properties...
  clickSelector: "button:has-text('Remix')", // Element to click before screenshot
  clickWaitTime: 1500, // Wait time after clicking (milliseconds)
}
```

This feature enables:

- Capturing different tab states
- Showing expanded sections
- Interacting with components before screenshot

## Troubleshooting

If screenshots aren't capturing the right sections:

1. Check if the component has a `data-testid` attribute in the source code
2. Check the component definitions in `screenshot-selectors.mjs`
3. Add more specific alternative selectors to help with triangulation
4. Use `excludeElements` to remove unwanted parts from screenshots
5. Run with debug mode for detailed logging: `DEBUG=true pnpm screenshot`
