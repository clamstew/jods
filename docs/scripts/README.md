# jods Documentation Scripts

This directory contains scripts for automating various aspects of the jods documentation site, particularly related to screenshot testing, design iteration, and visual regression testing.

## Documentation

Comprehensive documentation for the design iterations and screenshot system is now available in the documentation site:

- **[Design Iterations Overview](../docs/design-iterations/index.md)** - Overview of the design iterations system
- **[Vision](../docs/design-iterations/vision.md)** - The long-term vision and philosophy
- **[Complete Workflow](../docs/design-iterations/workflow.md)** - Step-by-step guide to using design iterations
- **[With AI](../docs/design-iterations/with-ai.md)** - How AI powers the design iteration process
- **[Command Reference](../docs/design-iterations/commands.md)** - Detailed command documentation
- **[Feedback System](../docs/design-iterations/feedback.md)** - How to provide structured feedback

### Screenshot System Documentation

The screenshot system documentation is available in:

- **[Screenshot System Overview](../docs/design-iterations/screenshot-system/index.md)** - Overview of the screenshot system
- **[Getting Started](../docs/design-iterations/screenshot-system/getting-started.md)** - Learn the basics
- **[TestID Guidelines](../docs/design-iterations/screenshot-system/testid-guidelines.md)** - Best practices for testIDs
- **[Advanced Usage](../docs/design-iterations/screenshot-system/advanced.md)** - Advanced techniques and optimizations

## Available Scripts

### Screenshot System

The screenshot system allows capturing consistent screenshots of documentation components for visual regression testing and design iteration.

```bash
# Capture screenshots of all components
pnpm screenshot

# Set new baseline images
pnpm screenshot:baseline

# Compare against production site
pnpm screenshot:production

# Focus on specific component mode
pnpm screenshot:components

# Use TestID-based selectors (recommended)
pnpm screenshot:testid

# Generate selectors from TestIDs
pnpm generate-selectors

# Run the complete rebaseline process
pnpm rebaseline
```

### Visual Diffing

The visual diffing system enables comparing screenshots for changes:

```bash
# Compare current screenshots against baseline
pnpm screenshot:diff

# Clean up old screenshots
pnpm screenshot:cleanup
```

### Design Iterations

The design iterations system helps track UI changes over time:

```bash
# Run 3 design iterations
pnpm design-iterations --count=3

# Focus on specific components
pnpm design-iterations --target="hero-section"
```

## Implementation Files

- `screenshot-unified.mjs` - Core screenshot capture system
- `screenshot-diff.mjs` - Visual comparison tool
- `screenshot-cleanup.mjs` - Cleanup utilities
- `screenshot-selectors.mjs` - Component selectors
- `testid-helpers.mjs` - TestID utility functions
- `screenshot-utils.mjs` - Shared utilities
- `generate-selectors.mjs` - TestID discovery
- `rebaseline.mjs` - Unified rebaseline process
- `design-iterations.mjs` - Design iteration system
- `design-iterations-init.mjs` - Initialization helper
- `force-react-tab.mjs` - Tab-specific screenshot helper
- `fix-react-framework.mjs` - Framework section screenshot helper
- `capture-diff.mjs` - Immediate screenshot diffing

## Future Development

- Complete active record model implementation for Remix
- Enhance design iteration system
- Further improve TestID coverage
- Connect with AI-driven design suggestions

## Testing

The screenshot framework now includes test coverage for key utilities. The tests are located in the `__tests__` directory and can be run with:

```bash
pnpm test
```

Or in watch mode during development:

```bash
pnpm run test:watch
```

The tests focus on core utilities and helper functions. When adding new scripts or refactoring existing ones, consider:

1. Extracting pure functions that can be tested independently
2. Using dependency injection for external modules to enable mocking
3. Adding tests for complex logic and edge cases

```

```
