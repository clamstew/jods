# Playwright Screenshot Scripts

This directory contains scripts for automated screenshots of the jods documentation site.

## Quick Overview

These scripts handle:

- Full page screenshots
- Component screenshots
- Section screenshots using content-based selection and CSS selectors

## 📚 Documentation

For complete documentation on the screenshot system, please refer to the [Playwright Screenshots](../docs/playwright-screenshots.md) guide in the docs directory.

## Available Scripts

- `screenshot-selectors.mjs` - Unified selectors registry for all components
- `screenshot-unified.mjs` - Consolidated screenshot script with multiple modes (RECOMMENDED)

## Unified Screenshot Approach

The unified screenshot approach consists of:

1. **Unified Selectors Registry** (`screenshot-selectors.mjs`)

   - Central registry of all components and sections
   - Includes primary selectors and multiple alternative selectors for triangulation
   - Provides fallback strategies for each component
   - Includes optional test IDs

2. **Unified Screenshot Script** (`screenshot-unified.mjs`)

   - Supports multiple modes (all, components, sections, remix)
   - Uses triangulation of multiple elements for more reliable section capture
   - Uses consistent padding, naming, and screenshot logic
   - Supports both light and dark themes
   - Handles complex components like tabbed interfaces

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

## How It Works

The unified approach:

1. **Defining Components**

   - Components are defined in `screenshot-selectors.mjs`
   - Each component has a name, selector, and other properties
   - Special handling for complex cases like framework tabs

2. **Taking Screenshots**
   - The unified script loads component definitions
   - Navigates to the appropriate page for each component
   - Locates elements using CSS selectors and fallback strategies
   - Captures screenshots in both light and dark modes

## Adding New Screenshot Features

When adding new screenshot capabilities:

1. Update the component definitions in `screenshot-selectors.mjs`
2. Add npm scripts to package.json if needed
3. Update the documentation in `docs/docs/playwright-screenshots.md`

## Troubleshooting

If screenshots aren't capturing the right sections:

1. Check the component definitions in `screenshot-selectors.mjs`
2. Add more specific alternative selectors to help with triangulation
3. Run with debug mode for detailed logging: `DEBUG=true pnpm screenshot:unified`
