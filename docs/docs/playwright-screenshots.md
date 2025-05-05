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

## 📊 Recommended Commands

The unified screenshot approach is the recommended way to capture screenshots:

```bash
# From root directory
pnpm docs:screenshot:unified              # All components
pnpm docs:screenshot:unified:baseline     # Create baseline screenshots (no timestamp)
pnpm docs:screenshot:unified:localhost    # Use localhost URL
pnpm docs:screenshot:unified:components   # Only UI components
pnpm docs:screenshot:unified:sections     # Only homepage sections
pnpm docs:screenshot:unified:remix        # Only Remix section

# From docs directory
pnpm screenshot:unified
pnpm screenshot:unified:baseline
pnpm screenshot:unified:localhost
pnpm screenshot:unified:components
pnpm screenshot:unified:sections
pnpm screenshot:unified:remix
```

Advanced options:

```bash
# Capture specific named components
node scripts/screenshot-unified.mjs --components=hero-section,framework-section

# Run with debug mode for detailed logs
DEBUG=true pnpm screenshot:unified
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
4. **Smart Element Triangulation** - Uses multiple selectors to reliably locate sections
5. **Element Exclusion** - Allows excluding specific elements from screenshots

### Advanced Features

#### Element Triangulation

The unified script uses multiple selectors to find elements more reliably:

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
    fallbackStrategy: "first-heading",
    padding: 50,
    waitForSelector: "h1",
    testId: "jods-hero-section",
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
| `selector`             | Primary CSS selector to find the element                                     |
| `fallbackStrategy`     | Strategy to use when selector fails (e.g., "first-heading", "section-index") |
| `padding`              | Extra padding around element in pixels                                       |
| `waitForSelector`      | Selector to wait for before capturing (ensures content is loaded)            |
| `testId`               | Test ID attribute for fallback identification                                |
| `alternativeSelectors` | Array of alternative selectors for triangulation                             |
| `excludeElements`      | Array of selectors for elements to exclude from screenshot                   |
| `minHeight`            | Minimum height for the screenshot (useful for tall sections)                 |
| `extraScroll`          | Extra scroll amount to better position the section                           |

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
pnpm docs:screenshot:unified:baseline
```

### Cleaning Up Screenshots

To prevent accumulating too many screenshots, you can clean up old ones:

```bash
# Remove all timestamped screenshots
pnpm docs:screenshot:cleanup

# Keep the 3 most recent batches of screenshots
pnpm docs:screenshot:cleanup:keep-latest

# Only clean up section screenshots (keeping the most recent one for each section/theme)
pnpm docs:screenshot:cleanup:sections

# Keep the 3 most recent section screenshots for each section/theme
pnpm docs:screenshot:cleanup:sections:keep

# Test section cleanup without actually deleting (dry run)
pnpm docs:screenshot:cleanup:sections:dry-run
```

## 🤔 Troubleshooting

If the screenshot system encounters issues:

1. **Connection Issues**: Make sure the documentation site is running locally before taking screenshots
2. **Theme Toggle Issues**: The system uses multiple selectors to find the theme toggle button, but if the site structure changes, you may need to update the selectors in the screenshot scripts
3. **Missing Pages/Components**: Verify that the URLs and selectors match the actual site structure
4. **Disk Space**: If you have many timestamped screenshots, use `pnpm docs:screenshot:cleanup` to free up space

### Section Screenshot Issues

If section screenshots aren't capturing the right elements:

1. **Add more specific alternative selectors** in `screenshot-selectors.mjs` for better triangulation
2. **Use element exclusion** to remove unwanted elements while keeping useful ones for triangulation
3. **Run with debug mode** for detailed logs: `DEBUG=true pnpm screenshot:unified`
4. **Adjust padding settings** for specific sections that need more context

## 🔄 Design Versioning and Comparison

The timestamped screenshots enable several workflows for design management:

1. **Design History**: Track how the site's design evolves over time
2. **A/B Comparison**: Compare new iterations with baseline images
3. **Focused Component Testing**: Test specific UI elements without capturing the entire page
4. **Regression Testing**: Identify unintended visual changes
5. **Design Reviews**: Share specific timestamped versions for feedback

To compare design changes with the baselines:

1. Take new screenshots with the updated design (they'll automatically get timestamped)
2. Place the baseline image and new timestamped image side by side
3. Look for differences in layout, colors, typography, spacing, etc.
4. Make further design adjustments as needed and repeat

## 🧠 Best Practices

1. Take screenshots after significant UI changes
2. Use component screenshots for focused testing of specific UI elements
3. Use section screenshots for marketing and documentation materials
4. Create baseline screenshots before major redesigns for reference
5. Include screenshots in PR descriptions for visual reviews
6. Use screenshots for marketing materials and documentation updates
7. Store screenshot sets for each major release for reference
8. When comparing design changes, always use timestamped versions against baselines
9. Clean up older timestamped screenshots periodically to save space

## 🔗 Related Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Docusaurus Theming System](https://docusaurus.io/docs/styling-layout#theme)
- [jods Maintainer's Guide](./maintainers-guide)

## Appendix: Legacy Screenshot Approaches

:::note
The following sections describe legacy screenshot approaches that are maintained for backward compatibility. For new development, use the unified approach described above.
:::

### Legacy Available Commands

```bash
# Take full-page screenshots of the local development site
pnpm docs:screenshot:homepage

# Take component-focused screenshots of the local development site
pnpm docs:screenshot:component

# Take screenshots of specific homepage sections
pnpm docs:screenshot:sections:homepage

# Take section screenshots with consistent selectors
pnpm docs:screenshot:sections:use-selectors

# Fix all screenshots
pnpm docs:screenshot:fix

# Create baseline screenshots
pnpm docs:screenshot:baseline
```

### Legacy Output Directories

```
# Full page screenshots
docs/static/screenshots/

# Component screenshots
docs/static/screenshots/components/

# Section screenshots
docs/static/screenshots/sections/
```

### Legacy Configuration

The legacy approaches use different configuration files:

- Full page screenshots: `docs/scripts/screenshot.mjs`
- Component screenshots: `docs/scripts/screenshot-component.mjs`
- Section screenshots: `docs/scripts/generate-selectors.mjs`

For details on these legacy approaches, see the archived documentation.
