# Getting Started with the Screenshot System

This guide will help you understand and use our screenshot automation system for documenting and testing the jods UI.

## Overview

The screenshot system lets you:

- Capture screenshots of components in both light and dark themes
- Establish baseline reference images
- Compare new screenshots against baselines to detect visual changes
- Iterate quickly on design changes with visual feedback

## Quick Start

### 1. Capture Screenshots

```bash
# Capture all components
npm run screenshots

# Capture only specific components
npm run screenshots -- --components=hero-section,features-section

# Capture only homepage sections
npm run screenshots -- --mode=sections
```

### 2. Baseline Management

```bash
# Create or update baselines
npm run screenshots:baseline

# Clean up old screenshots (keeps only the latest)
npm run screenshots:cleanup
```

### 3. Viewing Results

Screenshots are saved in:

- `static/screenshots/unified` - Component screenshots
- `static/debug` - HTML debug information

## Understanding Screenshot Types

- **Baseline screenshots**: Reference images with no timestamp in filename (e.g., `hero-section-light.png`)
- **Timestamped screenshots**: Images from latest run with timestamps (e.g., `hero-section-light-20230101-123456.png`)
- **Diff images**: Visual differences between baseline and new captures

## Component Configuration

Components are defined in `screenshot-selectors.mjs` with configurations like:

```javascript
{
  name: "hero-section",
  page: "/",
  selector: "[data-testid='jods-hero-section']",
  fallbackStrategy: "keyword-context",
  keywords: ["jods", "Powerful features"],
  padding: 50,
  // ... additional options
}
```

## Common Workflows

### Adding a New Component

1. Add a new component definition to `screenshot-selectors.mjs`
2. Capture it: `npm run screenshots -- --components=your-new-component`
3. Baseline it: `npm run screenshots:baseline -- --components=your-new-component`

### Design Iteration Process

1. Make UI changes to a component
2. Run `npm run screenshots -- --components=changed-component`
3. Compare with baselines to see visual differences
4. When satisfied, update baselines with `npm run screenshots:baseline -- --components=changed-component`

### Troubleshooting Selectors

If a component can't be captured correctly:

1. Use alternative selectors in the component config
2. Set a `fallbackStrategy` appropriate for the component
3. Use `testid` attributes in your components for reliable selection

## Advanced Usage

For more detailed information and advanced options, see the [API Reference](./api-reference.md) and [Advanced Features](./advanced-features.md) guides.
