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
   - Includes optional test IDs
   - Supports element exclusion for fine-tuned screenshots

2. **Unified Screenshot Script** (`screenshot-unified.mjs`)

   - Supports multiple modes (all, components, sections, remix)
   - Uses triangulation of multiple elements for more reliable section capture
   - Intelligently excludes specified elements while capturing sections
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
pnpm screenshot:cleanup:dry-run      # Preview what would be deleted
pnpm screenshot:cleanup:keep 4       # Keep 4 most recent batches (flexible)
pnpm screenshot:cleanup:keep-latest  # Keep 3 most recent batches (fixed)

# From root directory
pnpm docs:screenshot:cleanup
pnpm docs:screenshot:cleanup:dry-run
pnpm docs:screenshot:cleanup:keep 4
pnpm docs:screenshot:cleanup:keep-latest
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
   - Locates elements using CSS selectors and fallback strategies
   - Captures screenshots in both light and dark modes

## Adding New Screenshot Features

When adding new screenshot capabilities:

1. Update the component definitions in `screenshot-selectors.mjs`
2. Add npm scripts to package.json if needed
3. Update the documentation in `docs/docs/playwright-screenshots.md`

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

## Troubleshooting

If screenshots aren't capturing the right sections:

1. Check the component definitions in `screenshot-selectors.mjs`
2. Add more specific alternative selectors to help with triangulation
3. Use `excludeElements` to remove unwanted parts from screenshots
4. Run with debug mode for detailed logging: `DEBUG=true pnpm screenshot:unified`
