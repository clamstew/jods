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

## Adding New Screenshot Features

When adding new screenshot capabilities:

1. Update the implementation in the appropriate script
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

```bash
# Generate selectors and take screenshots with timestamps
npm run screenshots:homepage

# Take screenshots with baseline names (no timestamps)
npm run screenshots:homepage:baseline

# Regenerate selectors and take screenshots
node docs/scripts/use-selectors.mjs --regenerate
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
