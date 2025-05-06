---
sidebar_position: 7
---

# 📸 Documentation Screenshots

This guide explains how to use Playwright to generate consistent, automated screenshots of the jods documentation site for review and marketing purposes.

## Overview

The documentation site includes a Playwright-based screenshot system that:

1. Captures full-page screenshots of key pages
2. Captures targeted component screenshots for focused UI testing
3. Captures specific homepage sections for design reviews and marketing
4. Automatically captures both light and dark themes
5. Organizes screenshots with timestamped filenames
6. Works with both local development and production environments
7. Preserves baseline images for comparison during design iterations
8. Provides tools to manage and clean up screenshot history
9. Enables visual regression testing through pixel diffing

## 📊 Recommended Commands

The unified screenshot approach is the recommended way to capture screenshots:

```bash
# From root directory
pnpm docs:screenshot                            # All components
pnpm docs:screenshot:baseline                   # Create baseline screenshots (no timestamp)
pnpm docs:screenshot:diff                       # Compare against baselines with 2% threshold
pnpm docs:screenshot:cleanup                    # Clean up old screenshots

# From docs directory
pnpm screenshot                                 # All components
pnpm screenshot:baseline                        # Create baseline screenshots
pnpm screenshot:diff                            # Compare against baselines
pnpm screenshot:cleanup                         # Clean up old screenshots
```

Advanced options (using command-line arguments):

```bash
# Capture specific types of components
pnpm screenshot -- --mode=sections              # Only homepage sections
pnpm screenshot -- --mode=components            # Only UI components
pnpm screenshot -- --mode=remix                 # Only Remix section

# Capture specific named components
pnpm screenshot -- --components=hero-section,framework-section-react

# Use auto-generated selectors from data-testids
pnpm screenshot -- --use-generated-selectors

# Combine multiple options
pnpm screenshot -- --use-generated-selectors --mode=sections
pnpm screenshot -- --components=framework-section-react --baseline

# Run with debug mode for detailed logs
DEBUG=true pnpm screenshot
```

### 📁 Screenshot Output

Unified screenshots are saved to:

```
docs/static/screenshots/unified/
```

With the following naming format:

```
[component-name]-[theme]-[YYYYMMDD-HHMMSS].png  # Timestamped screenshots
[component-name]-[theme].png                     # Baseline screenshots (no timestamp)
```

For example:

- `hero-section-light-20240615-134527.png`
- `hero-section-dark-20240615-134527.png`
- `hero-section-light.png` (baseline)
- `hero-section-dark.png` (baseline)

## 🔧 How It Works

The screenshot system uses Playwright, a browser automation library, to:

1. Launch a headless Chromium browser
2. Navigate to each configured page
3. Toggle between light and dark themes using the site's theme toggle button
4. Take component and section screenshots in both themes
5. Save images with timestamped filenames to preserve version history

## 📋 Unified Screenshot Approach

The unified screenshot approach provides a consistent, flexible system for capturing screenshots:

### Benefits

1. **Consistent Output** - All screenshots use the same selectors, padding rules, and filename conventions
2. **Single Source of Truth** - Component definitions are defined once in `screenshot-selectors.mjs`
3. **Flexible Modes** - Run the script with different modes for components, sections, or specific items
4. **Reliable Element Location** - Uses data-testid attributes as the preferred location method
5. **Element Exclusion** - Allows excluding specific elements from screenshots

### Element Identification Hierarchy

The system uses the following hierarchy to identify elements:

1. **data-testid Attribute** (Preferred Method)

   ```jsx
   <section data-testid="jods-hero-section">...</section>
   ```

2. **CSS Selectors**

   ```js
   selector: "div.heroBanner_UJgQ, div.hero-container, .hero";
   ```

3. **Triangulation with Alternative Selectors**

   ```js
   alternativeSelectors: [
     "h1:has-text('jods')",
     ".hero-subtitle, .hero-description",
   ];
   ```

4. **Fallback Strategies**
   ```js
   fallbackStrategy: "first-heading";
   ```

### Advanced Features

#### Data TestID Attributes

The most reliable way to identify elements is using the `data-testid` attribute:

```jsx
// In the React component
<section className="features-container" data-testid="jods-features-section">
  {/* section content */}
</section>

// In screenshot-selectors.mjs
{
  name: "features-section",
  // ...
  testId: "jods-features-section"
}
```

Benefits of using testIDs:

- More resilient to CSS class changes
- Clearer intent with explicit IDs
- Less prone to breakage from content changes
- Works even when content differs between themes

#### Element Triangulation

The unified script uses multiple selectors to find elements more reliably as a fallback when testIDs aren't available:

```js
{
  page: "/",
  name: "hero-section",
  // Primary selector
  selector: "div.heroBanner_UJgQ, div.hero-container, .hero, [class*='hero_']",
  // Additional selectors for triangulation
  alternativeSelectors: [
    "h1:has-text('jods')",
    ".hero-subtitle, .hero-description",
    "div:has(> h1:has-text('jods'))"
  ]
}
```

If the primary selector doesn't find the element, the script will:

1. Try each alternative selector individually
2. If multiple alternative selectors match, find their common parent
3. Use triangulation to determine the correct section boundaries

#### Framework Tabs

The system supports capturing different tabs of the framework showcase section:

```js
// React tab (default tab on load)
{
  name: "framework-section-react",
  selector: "section:has(h2:has-text('Works with your favorite frameworks'))",
  testId: "jods-framework-section",
  // other properties...
},

// Remix tab (requires clicking the tab)
{
  name: "framework-section-remix",
  selector: "section:has(h2:has-text('Works with your favorite frameworks'))",
  testId: "jods-framework-section",
  clickSelector: "button:has-text('Remix'), button:has-text('💿')", // Clicks Remix tab
  clickWaitTime: 1500, // Wait for tab content to load
  minHeight: 1600, // Taller to accommodate Remix content
  // other properties...
}
```

This approach:

- Treats each tab as a separate component
- Automatically clicks the Remix tab when needed
- Uses appropriate heights for each tab's content
- Maintains separate screenshots for React and Remix tabs

#### Element Exclusion

The unified script allows you to exclude specific elements from screenshots while still using them for triangulation:

```js
{
  page: "/",
  name: "hero-section",
  selector: "div.heroBanner_UJgQ",
  alternativeSelectors: [ /* ... */ ],
  // Elements to exclude from screenshot
  excludeElements: [
    "nav",
    ".navbar",
    "[class*='navbar_']"
  ]
}
```

This enables:

- Using navigation bars for triangulation without including them in screenshots
- Excluding footer links or pagination from section captures
- Precise control over what appears in the final screenshot
- Better consistency across themes and viewport sizes

The script automatically:

1. Identifies excluded elements within the section
2. Adjusts the screenshot boundaries to exclude them
3. Maintains proper spacing and context for the remaining content

## ⚙️ Configuration

### Component and Section Configuration

All screenshots are configured in `docs/scripts/screenshot-selectors.mjs` using a unified component definition format:

```js
export const COMPONENTS = [
  // Hero section
  {
    page: "/",
    name: "hero-section",
    selector: "div.heroBanner_UJgQ, div.hero-container",
    testId: "jods-hero-section", // Preferred way to identify the section
    fallbackStrategy: "first-heading",
    padding: 50,
    waitForSelector: "h1",
    alternativeSelectors: [
      "h1:has-text('jods')",
      ".hero-subtitle, .hero-description",
    ],
    excludeElements: ["nav", ".navbar"],
  },
  // Add more components here...
];
```

Each component definition can include:

| Property               | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `page`                 | Page path where the component appears                                        |
| `name`                 | Unique identifier for the component                                          |
| `testId`               | **Test ID attribute for primary identification (recommended)**               |
| `selector`             | CSS selector to find the element (fallback when testId not found)            |
| `fallbackStrategy`     | Strategy to use when selector fails (e.g., "first-heading", "section-index") |
| `padding`              | Extra padding around element in pixels                                       |
| `waitForSelector`      | Selector to wait for before capturing (ensures content is loaded)            |
| `alternativeSelectors` | Array of alternative selectors for triangulation                             |
| `excludeElements`      | Array of selectors for elements to exclude from screenshot                   |
| `minHeight`            | Minimum height for the screenshot (useful for tall sections)                 |
| `extraScroll`          | Extra scroll amount to better position the section                           |
| `clickSelector`        | Selector for element to click before taking screenshot                       |
| `clickWaitTime`        | Time to wait after clicking (milliseconds)                                   |
| `pauseAnimations`      | Whether to pause animations during the screenshot (default: true)            |

### Interactive Elements

Some components require interaction before capturing:

```js
{
  name: "framework-section-remix",
  // other properties...
  clickSelector: "button:has-text('Remix')", // Element to click before screenshot
  clickWaitTime: 1500, // Wait time after clicking (milliseconds)
}
```

This enables:

- Capturing different tab states
- Showing expanded sections
- Interacting with components before screenshot

### Path Handling

The system automatically handles path prefixes:

- For localhost environments, it adds `/jods` to the URLs
- For production environments, it uses the base path

### Theme Detection

The system automatically detects and toggles between light and dark themes by:

1. Reading the `data-theme` attribute from the document
2. Clicking the theme toggle button when needed
3. Waiting for the theme transition to complete

## 📸 Screenshot Management

### Creating Baselines

Baseline screenshots are the reference images without timestamps used for comparison:

```bash
# Create baseline screenshots (no timestamp)
pnpm screenshot:baseline
```

### Cleaning Up Screenshots

To prevent accumulating too many screenshots, you can clean up old ones:

```bash
# Keep only the most recent batch
pnpm screenshot:cleanup

# Preview what would be deleted (no actual deletion)
pnpm screenshot:cleanup -- --dry-run
```

The cleanup script automatically:

1. Identifies timestamped vs. baseline screenshots
2. Preserves all baseline (non-timestamped) screenshots
3. Keeps only the most recent batch(es) of timestamped screenshots
4. Provides detailed reporting about what was deleted

## 🤔 Troubleshooting

If the screenshot system encounters issues:

1. **Missing Test IDs**: Check if the `data-testid` attributes are correctly added to components in the source code
2. **Connection Issues**: Make sure the documentation site is running locally before taking screenshots
3. **Theme Toggle Issues**: The system uses multiple selectors to find the theme toggle button, but if the site structure changes, you may need to update the selectors in the screenshot scripts
4. **Missing Pages/Components**: Verify that the URLs and selectors match the actual site structure
5. **Disk Space**: If you have many timestamped screenshots, use `pnpm screenshot:cleanup` to free up space

### Section Screenshot Issues

If section screenshots aren't capturing the right elements:

1. **Add data-testid attributes** to the components in source code
2. **Add more specific alternative selectors** in `screenshot-selectors.mjs` for better triangulation
3. **Use element exclusion** to remove unwanted elements while keeping useful ones for triangulation
4. **Run with debug mode** for detailed logs: `DEBUG=true pnpm screenshot`
5. **Adjust padding settings** for specific sections that need more context

## 🔄 Design Versioning and Comparison

The timestamped screenshots enable several workflows for design management:

1. **Design History**: Track how the site's design evolves over time
2. **A/B Comparison**: Compare new iterations with baseline images
3. **Focused Component Testing**: Test specific UI elements without capturing the entire page
4. **Regression Testing**: Identify unintended visual changes
5. **Design Reviews**: Share specific timestamped versions for feedback

### Visual Comparison Grid Layout

To showcase design iterations in your documentation, we provide a responsive grid layout system that makes it easy to compare screenshots side-by-side:

```jsx
<div className="iterations-comparison">
  <h3 className="comparison-heading">Iterations Comparison</h3>

  <div className="iterations-grid">
    <!-- Light Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (Before)</div>
      <img className="iteration-image" src="/jods/path/to/before-light.png" alt="Before design (light mode)" />
    </div>

    <!-- Light Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (After)</div>
      <img className="iteration-image" src="/jods/path/to/after-light.png" alt="After design (light mode)" />
    </div>

    <!-- Dark Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (Before)</div>
      <img className="iteration-image" src="/jods/path/to/before-dark.png" alt="Before design (dark mode)" />
    </div>

    <!-- Dark Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (After)</div>
      <img className="iteration-image" src="/jods/path/to/after-dark.png" alt="After design (dark mode)" />
    </div>
  </div>
</div>
```

This grid automatically organizes your screenshots in a 2x2 grid on larger screens, and stacks them in a single column on mobile devices. Some key features:

- **Responsive Design**: Automatically adapts to different screen sizes
- **Themed Labels**: Special styling for light/dark mode images
- **Before/After Labels**: Makes comparisons more clear
- **Hover Effects**: Subtle enhancement when hovering over images
- **Consistent Styling**: Matches the jods documentation design system

For detailed examples and customization options, see the template file at `docs/examples/design-iteration-grid-template.md`.

### Visual Regression Testing

The screenshot system includes an automated pixel diff tool for visual regression testing:

```bash
# Basic diff test (uses 2% threshold)
pnpm screenshot:diff

# Test with custom options
pnpm screenshot:diff -- --verbose               # Keep all diff images
pnpm screenshot:diff -- --components=try-jods-section,framework-section-react
pnpm screenshot:diff -- --threshold=0.05        # Use 5% threshold
```

The pixel diff tool:

1. Takes new screenshots with the current code
2. Compares them with the baseline screenshots
3. Highlights differences in magenta
4. Generates diff images when differences exceed the threshold
5. Reports a pass/fail summary with percentage differences
6. Exits with error code on test failure

This creates a powerful workflow:

1. Establish baseline screenshots with `pnpm screenshot:baseline`
2. Make design changes or code updates
3. Run `pnpm screenshot:diff` to detect visual regressions
4. Review diff images in the `diffs` folder to see highlighted changes
5. Only update baselines when intentionally changing designs

Diff images are saved to:

```
docs/static/screenshots/unified/diffs/
```

To compare design changes manually:

1. Take new screenshots with the updated design (they'll automatically get timestamped)
2. Place the baseline image and new timestamped image side by side
3. Look for differences in layout, colors, typography, spacing, etc.
4. Make further design adjustments as needed and repeat

## 🧠 Best Practices

1. **Add data-testid attributes** to all major section components
2. Take screenshots after significant UI changes
3. Use component screenshots for focused testing of specific UI elements
4. Use section screenshots for marketing and documentation materials
5. Create baseline screenshots before major redesigns for reference
6. Include screenshots in PR descriptions for visual reviews
7. Use screenshots for marketing materials and documentation updates
8. Store screenshot sets for each major release for reference
9. **Run visual regression tests** before and after significant changes
10. Use pixel diffing to ensure design consistency across updates
11. Only update baseline screenshots when intentionally changing design
12. Clean up older timestamped screenshots periodically to save space

## 🔗 Related Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Docusaurus Theming System](https://docusaurus.io/docs/styling-layout#theme)
- [jods Maintainer's Guide](./maintainers-guide)
