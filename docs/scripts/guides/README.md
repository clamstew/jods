# Screenshot System Documentation

Welcome to the documentation for the jods website screenshot system. This system helps capture, manage, and compare screenshots of UI components for documentation and testing purposes.

## Available Guides

- **[Getting Started](./getting-started.md)** - Learn the basics of the screenshot system
- **[Screenshot System for Dummies](./screenshot-system-for-dummies.md)** - Simplified explanation for beginners
- **[API Reference](./api-reference.md)** - Detailed reference of all available options
- **[Advanced Features](./advanced-features.md)** - Explore powerful features for advanced users

## Quick Links

- **Take screenshots**: `npm run screenshots`
- **Update baselines**: `npm run screenshots:baseline`
- **Clean up old screenshots**: `npm run screenshots:cleanup`
- **View differences**: `npm run screenshots:diff`

## Directory Structure

```
docs/scripts/
├── guides/               # Documentation
├── __tests__/            # Tests for the screenshot system
├── screenshot-unified.mjs   # Main screenshot script
├── screenshot-capture.mjs   # Screenshot capture logic
├── screenshot-selectors.mjs # Component selectors
├── screenshot-diff.mjs      # Diffing functionality
├── screenshot-cleanup.mjs   # Cleanup utility
├── generate-selectors.mjs   # Auto-selector generation
└── design-iterations.mjs    # Design iteration tracking
```

## Need Help?

The **[Screenshot System for Dummies](./screenshot-system-for-dummies.md)** guide is a great place to start if you're new to the system. If you need more detailed information, check the **[API Reference](./api-reference.md)**.

For issues or feature requests, please contact the development team.
