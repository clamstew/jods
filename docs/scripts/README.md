# jods Documentation Scripts

This directory contains scripts for automating various aspects of the jods documentation site, particularly related to screenshot testing, design iteration, and visual regression testing.

## Vision

jods aims to be the definitive active record model for the Remix ecosystem, providing a minimal but opinionated approach to state management. Our documentation and tooling reflect this philosophy - we prefer offering **one good way** to do something rather than endless configuration options.

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

## TestID-Driven Approach

Our screenshot system uses a TestID-driven approach, as detailed in [screenshot-testid-guidelines.md](./screenshot-testid-guidelines.md). This provides a consistent way to identify and test components.

## Long-Term Vision

See [long-term-ai-vision.md](./long-term-ai-vision.md) for details on our AI-driven design iteration system and active record model vision for jods.

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

## Workflow Examples

### Rebaselining Process

```bash
# Full rebaseline process including server lifecycle management
pnpm rebaseline:full

# Focus on TestID-based elements
pnpm rebaseline:testid
```

### Design Iteration (Experimental)

```bash
# Run 3 design iterations
node scripts/design-iterations.mjs --count=3

# Focus on specific components
node scripts/design-iterations.mjs --target="hero-section"
```

## Future Development

- Complete active record model implementation for Remix
- Enhance design iteration system
- Further improve TestID coverage
- Connect with AI-driven design suggestions
