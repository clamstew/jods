# Playwright Screenshot Scripts

This directory contains various scripts for automated screenshots of the jods documentation site.

## Quick Overview

These scripts handle:

- Full page screenshots
- Component screenshots
- Section screenshots using content-based selection and CSS selectors

## 📚 Documentation

For complete documentation on the screenshot system, please refer to the [Playwright Screenshots](../docs/playwright-screenshots.md) guide in the docs directory.

## Available Scripts

- `screenshot.mjs` - Full page screenshots
- `screenshot-component.mjs` - Component-focused screenshots
- `homepage-sections.mjs` - Direct content-based section screenshots
- `generate-selectors.mjs` - Generates selectors for homepage sections and saves to JSON
- `use-selectors.mjs` - Takes section screenshots using saved selectors
- `screenshot-manager.mjs` - Utilities for managing screenshots (cleanup, baselines)
- `remix-section.mjs` - Dedicated script for capturing Remix integration section
- `screenshot-fix.mjs` - Consolidated script to fix all screenshot issues at once
- `screenshot-selectors.mjs` - Unified selectors registry for all components (NEW)
- `screenshot-unified.mjs` - Consolidated screenshot script with multiple modes (NEW - RECOMMENDED)

## Adding New Screenshot Features

When adding new screenshot capabilities:

1. Update the component definitions in `screenshot-selectors.mjs`
2. Add npm scripts to package.json
3. Update the documentation in `docs/docs/playwright-screenshots.md`

## Scripts Overview

### Homepage Section Screenshots

We have two approaches for capturing homepage sections:

1. **Direct Section Location** (`homepage-sections.mjs`)

   - Uses text content and headings to find sections
   - Adds data-testid attributes to elements
   - Works well for initial screenshots

2. **Selector-based Screenshots** (`use-selectors.mjs` + `generate-selectors.mjs`)
   - Generates and saves CSS selectors to a JSON file
   - Reuses selectors for consistent screenshots
   - Falls back to testIds if selectors change

### Consolidated Screenshot Fixing

The `screenshot-fix.mjs` script addresses common screenshot issues:

1. **Unified Approach**

   - Runs both component and dedicated section screenshots with a single command
   - Ensures consistent timestamps across all screenshots
   - Handles both standard and baseline screenshots

2. **Special Case Handling**
   - Uses specialized finders for complex sections like Remix integration
   - Ensures proper sizing with minimum height requirements
   - Better targeting for sections with similar content

## Consolidated Screenshot Approach

The new recommended approach uses a consolidated architecture:

1. **Unified Selectors Registry** (`screenshot-selectors.mjs`)

   - Contains all component definitions in one place
   - Includes helper functions for finding specific elements
   - Exports utility functions for working with component definitions

2. **Unified Screenshot Script** (`screenshot-unified.mjs`)

   - Supports different modes to capture different sets of components
   - Uses consistent padding, naming, and screenshot logic
   - Handles special cases like framework tabs and Remix section
   - Produces more consistent output

3. **Single Output Directory**
   - All screenshots are saved to `docs/static/screenshots/unified/`
   - Consistent naming format: `component-name-theme[-timestamp].png`

### Recommended Usage

When running screenshot scripts:

```bash
# From docs directory
pnpm screenshot:unified            # All components
pnpm screenshot:unified:sections   # Just homepage sections
pnpm screenshot:unified:remix      # Just Remix section

# From root directory
pnpm docs:screenshot:unified
pnpm docs:screenshot:unified:sections
pnpm docs:screenshot:unified:remix
```

The older scripts are still available for backward compatibility but new development should use the unified approach.

## How It Works

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

## Usage

### npm Scripts

From the root directory:

```bash
# Take section screenshots with direct content selection
npm run docs:screenshot:sections:homepage

# Take section screenshots with saved selectors
npm run docs:screenshot:sections:use-selectors

# Take section screenshots with baseline names (no timestamps)
npm run docs:screenshot:sections:homepage:baseline
npm run docs:screenshot:sections:use-selectors:baseline

# Regenerate selectors and take screenshots
npm run docs:screenshot:sections:regenerate

# Clean up section screenshots
npm run docs:screenshot:cleanup:sections

# Fix all screenshot issues at once
npm run docs:screenshot:fix

# Create baseline versions of fixed screenshots
npm run docs:screenshot:fix:baseline
```

From the docs directory:

```bash
# Take section screenshots with direct content selection
pnpm screenshot:sections:homepage

# Take section screenshots with saved selectors
pnpm screenshot:sections:use-selectors

# Take section screenshots with baseline names (no timestamps)
pnpm screenshot:sections:homepage:baseline
pnpm screenshot:sections:use-selectors:baseline

# Regenerate selectors and take screenshots
pnpm screenshot:sections:regenerate

# Clean up section screenshots
pnpm screenshot:cleanup:sections

# Fix all screenshot issues at once
pnpm screenshot:fix

# Create baseline versions of fixed screenshots
pnpm screenshot:fix:baseline

# Fix screenshots using localhost environment
pnpm screenshot:fix:localhost
```

### Screenshot Locations

Screenshots are saved to:

- `docs/static/screenshots/sections/` - For section screenshots

## Selector File

The selector file (`homepage-selectors.json`) contains:

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

## Adding New Sections

To add new sections:

1. Update the `HOMEPAGE_SECTIONS` array in `generate-selectors.mjs`
2. Run `node docs/scripts/use-selectors.mjs --regenerate`

## Troubleshooting

If screenshots aren't capturing the right sections:

1. Delete the selectors file to force regeneration: `rm docs/static/selectors/homepage-selectors.json`
2. Verify the section locator definitions in `generate-selectors.mjs`
3. Run with regeneration: `node docs/scripts/use-selectors.mjs --regenerate`
