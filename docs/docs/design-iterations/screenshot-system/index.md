---
sidebar_position: 1
---

# 📸 Screenshot System Overview

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

## 🔗 Related Resources

For more details about the screenshot system, check out:

- [Getting Started](./getting-started)
- [TestID Guidelines](./testid-guidelines)
- [Advanced Usage](./advanced)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Design Iterations Workflow](../workflow)
