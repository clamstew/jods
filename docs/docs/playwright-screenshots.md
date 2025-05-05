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

## 📊 Available Commands

From the root project directory:

```bash
# Take full-page screenshots of the local development site
pnpm docs:screenshot:homepage

# Take component-focused screenshots of the local development site
pnpm docs:screenshot:component

# Take screenshots of specific homepage sections
pnpm screenshots:homepage

# Take section screenshots with consistent selectors
pnpm screenshots:use-selectors

# Create baseline screenshots (without timestamps)
pnpm docs:screenshot:baseline
pnpm screenshots:homepage:baseline
pnpm screenshots:use-selectors:baseline

# Generate selectors for sections to reuse later
pnpm screenshots:generate-selectors

# Force regenerate selectors and take screenshots
pnpm screenshots:regenerate

# Clean up all timestamped screenshots
pnpm docs:screenshot:cleanup

# Clean up old screenshots but keep the 3 most recent batches
pnpm docs:screenshot:cleanup:keep-latest

# Clean up only section screenshots (keeping the most recent one for each section/theme)
pnpm docs:screenshot:cleanup:sections

# Clean up section screenshots but keep the 3 most recent for each section/theme
pnpm docs:screenshot:cleanup:sections:keep

# Do a dry run to see what would be deleted without actually deleting
pnpm docs:screenshot:cleanup:sections:dry-run

# Take screenshots of the production site
pnpm docs:screenshot:production
```

From the docs directory:

```bash
# Take full-page screenshots of the local development site
pnpm homepage:screenshot

# Take component-focused screenshots
pnpm screenshot:component

# Create baseline screenshots (without timestamps)
pnpm screenshot:baseline

# Take screenshots of the production site
pnpm production:screenshot
```

## 📁 Screenshot Output

Full-page screenshots are saved to:

```
docs/static/screenshots/
```

Component screenshots are saved to:

```
docs/static/screenshots/components/
```

Section screenshots are saved to:

```
docs/static/screenshots/sections/
```

With the following naming format for new screenshots:

```
# Full page screenshots
[page-name]-[theme]-[YYYYMMDD-HHMMSS].png

# Component screenshots
[component-name]-[theme]-[YYYYMMDD-HHMMSS].png

# Section screenshots
[section-name]-[theme]-[YYYYMMDD-HHMMSS].png
```

For example:

- `homepage-light-20240615-134527.png`
- `homepage-dark-20240615-134527.png`
- `hero-section-light-20240615-134527.png`
- `hero-section-dark-20240615-134527.png`
- `hero-light-20240615-134527.png`
- `features-dark-20240615-134527.png`

The baseline images (without timestamps) are:

- `homepage-light.png`
- `homepage-dark.png`
- `hero-section-light.png`
- `hero-section-dark.png`
- `hero-light.png`
- `features-dark.png`

This approach allows you to track design changes over time and compare new versions with the original baseline without overwriting important reference images.

## 🔧 How It Works

The screenshot system uses Playwright, a browser automation library, to:

1. Launch a headless Chromium browser
2. Navigate to each configured page
3. Toggle between light and dark themes using the site's theme toggle button
4. Take full-page, component-specific, or section-specific screenshots in both themes
5. Save images with timestamped filenames to preserve version history

## 📋 Screenshot Approaches

### Full-page Screenshots

Full-page screenshots capture entire pages, useful for overall design review.

### Component Screenshots

Component screenshots capture specific UI elements rather than entire pages, which is helpful for:

1. Focused UI testing of specific components
2. Comparing design changes to isolated UI elements
3. More efficient visual regression testing
4. Creating component-specific documentation

Components are defined in `docs/scripts/screenshot-component.mjs`:

```js
const COMPONENTS = [
  {
    page: "/",
    name: "hero-section",
    selector: ".hero__title",
    padding: 100, // Extra padding around element in pixels
  },
  {
    page: "/",
    name: "features-section",
    selector: ".features",
    padding: 50,
  },
  // Add more components as needed
];
```

### Section Screenshots

Section screenshots focus on capturing specific sections of the homepage for marketing and design review. We have two approaches:

1. **Direct Section Location** (`homepage-sections.mjs`)

   - Uses text content and headings to find sections
   - Adds data-testid attributes to elements
   - Works well for initial screenshots

2. **Selector-based Screenshots** (`use-selectors.mjs` + `generate-selectors.mjs`)
   - Generates and saves CSS selectors to a JSON file
   - Reuses selectors for consistent screenshots
   - Falls back to testIds if selectors change

## ⚙️ Configuration

### Full Page Screenshots

Full page screenshots are configured in `docs/scripts/screenshot.mjs`.

To add a new page, edit the `PAGES` array:

```js
const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/intro", name: "intro" },
  { path: "/api-reference", name: "api-reference" },
  // Add your new page here
  { path: "/your-page", name: "your-page-name" },
];
```

### Component Screenshots

Component screenshots are configured in `docs/scripts/screenshot-component.mjs`.

To add a new component, edit the `COMPONENTS` array:

```js
const COMPONENTS = [
  {
    page: "/",
    name: "hero-section",
    selector: ".hero__title",
    padding: 100,
  },
  // Add your new component here
  {
    page: "/your-page",
    name: "your-component-name",
    selector: ".your-component-selector",
    padding: 50,
  },
];
```

### Section Screenshots

Section screenshots are configured in `docs/scripts/generate-selectors.mjs`.

To add a new section, edit the `HOMEPAGE_SECTIONS` array:

```js
const HOMEPAGE_SECTIONS = [
  {
    name: "hero",
    locator: {
      strategy: "text",
      value: "Zero dependency JSON store",
      contextSelector: 'section, div.hero, [class*="hero"]',
      fallback: "h1",
    },
    testId: "jods-hero-section",
    padding: 40,
  },
  // Add your new section here
  {
    name: "your-section",
    locator: {
      strategy: "heading", // Can be "text", "heading", or "element"
      value: "Your Section Title",
      contextSelector: "section, div.container",
    },
    testId: "jods-your-section",
    padding: 40,
  },
];
```

### Selector-based Screenshots

The selector-based approach works in two phases:

1. **Generating Selectors**

   - Script analyzes the homepage to find each section
   - Uses text content, headings, and other semantic hints
   - Generates unique CSS selectors for each section
   - Saves selectors to `static/selectors/homepage-selectors.json`

2. **Taking Screenshots**
   - Loads selectors from the JSON file
   - Uses them to locate sections consistently
   - Adds padding and captures each section in light/dark mode
   - Falls back to data-testid attributes when selectors change

The selector file format is:

```json
{
  "section-name": {
    "selector": "unique.css .selector",
    "testId": "jods-section-id",
    "padding": 40,
    "originalLocator": {
      /* original locator data */
    }
  }
}
```

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

The screenshot system includes tools to manage your screenshots:

### Creating Baselines

Baseline screenshots are the reference images without timestamps used for comparison:

```bash
# Create all baselines (full-page and component)
pnpm screenshot:baseline

# Create section baselines
pnpm screenshots:homepage:baseline
pnpm screenshots:use-selectors:baseline

# Create only component baselines
node scripts/screenshot-manager.mjs --create-baselines --components-only

# Create only full-page baselines
node scripts/screenshot-manager.mjs --create-baselines --full-pages-only
```

### Cleaning Up Screenshots

To prevent accumulating too many screenshots, you can clean up old ones:

```bash
# Remove all timestamped screenshots
pnpm screenshot:cleanup

# Keep the 3 most recent batches of screenshots
pnpm screenshot:cleanup:keep-latest

# Only clean up section screenshots (keeping the most recent one for each section/theme)
pnpm screenshot:cleanup:sections

# Keep the 3 most recent section screenshots for each section/theme
pnpm screenshot:cleanup:sections:keep

# Test section cleanup without actually deleting (dry run)
pnpm screenshot:cleanup:sections:dry-run

# Only clean up component screenshots
node scripts/screenshot-manager.mjs --cleanup --components-only

# Only clean up full-page screenshots but keep 5 recent batches
node scripts/screenshot-manager.mjs --cleanup --full-pages-only --keep=5
```

## 🤔 Troubleshooting

If the screenshot system encounters issues:

1. **Connection Issues**: Make sure the documentation site is running locally before taking screenshots
2. **Theme Toggle Issues**: The system uses multiple selectors to find the theme toggle button, but if the site structure changes, you may need to update the selectors in the screenshot scripts
3. **Missing Pages/Components**: Verify that the URLs and selectors match the actual site structure
4. **Disk Space**: If you have many timestamped screenshots, use `pnpm screenshot:cleanup` to free up space

### Section Screenshot Issues

If section screenshots aren't capturing the right elements:

1. **Delete the selectors file** to force regeneration: `rm docs/static/selectors/homepage-selectors.json`
2. **Verify the section locator definitions** in `generate-selectors.mjs`
3. **Run with regeneration**: `node docs/scripts/use-selectors.mjs --regenerate`
4. **Check the DOM structure** to ensure text content and headings match your locator strategies

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
