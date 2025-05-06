# Screenshot System API Reference

This document provides detailed information about all the scripts and configuration options available in the screenshot system.

## Command Line Scripts

### `screenshot-unified.mjs`

The main script for capturing screenshots of components.

```bash
node scripts/screenshot-unified.mjs [options]
```

#### Options

| Option                      | Description                                                                 | Default |
| --------------------------- | --------------------------------------------------------------------------- | ------- |
| `--mode=<mode>`             | Capture mode: `all`, `components`, `sections`, or a specific component name | `all`   |
| `--components=<list>`       | Comma-separated list of component names to capture                          | none    |
| `--baseline`                | Save as baseline (no timestamp in filename)                                 | false   |
| `--use-generated-selectors` | Use selectors generated from testids                                        | false   |
| `--merge-selectors`         | Merge generated selectors with existing ones                                | false   |

#### Examples

```bash
# Capture all components
node scripts/screenshot-unified.mjs

# Capture only sections
node scripts/screenshot-unified.mjs --mode=sections

# Capture specific components and save as baseline
node scripts/screenshot-unified.mjs --components=hero-section,features-section --baseline
```

### `screenshot-cleanup.mjs`

Cleans up old screenshot files, keeping only the most recent N batches.

```bash
node scripts/screenshot-cleanup.mjs [options]
```

#### Options

| Option              | Description                                       | Default |
| ------------------- | ------------------------------------------------- | ------- |
| `--keep-latest=<n>` | Number of latest screenshot batches to keep       | 1       |
| `--dry-run`         | Simulate deletion without actually removing files | false   |

#### Examples

```bash
# Keep only the latest batch
node scripts/screenshot-cleanup.mjs

# Keep the latest 3 batches
node scripts/screenshot-cleanup.mjs --keep-latest=3

# Simulate cleanup (no actual deletion)
node scripts/screenshot-cleanup.mjs --dry-run
```

### `screenshot-diff.mjs`

Compares screenshots against baselines to find visual differences.

```bash
node scripts/screenshot-diff.mjs [options]
```

#### Options

| Option                    | Description                                    | Default |
| ------------------------- | ---------------------------------------------- | ------- |
| `--timestamp=<timestamp>` | Specific timestamp to compare against baseline | latest  |
| `--component=<name>`      | Filter to a specific component                 | all     |
| `--theme=<theme>`         | Filter to a specific theme (`light` or `dark`) | both    |
| `--threshold=<n>`         | Pixel difference threshold (0-1)               | 0.01    |

#### Examples

```bash
# Compare latest screenshots
node scripts/screenshot-diff.mjs

# Compare specific component in light theme
node scripts/screenshot-diff.mjs --component=hero-section --theme=light
```

### `generate-selectors.mjs`

Automatically generates selectors from data-testid attributes.

```bash
node scripts/generate-selectors.mjs
```

### `design-iterations.mjs`

Manages design iterations and comparisons over time.

```bash
node scripts/design-iterations.mjs [options]
```

#### Options

| Option          | Description                             | Default   |
| --------------- | --------------------------------------- | --------- |
| `--init`        | Initialize a new design iteration       | false     |
| `--compare`     | Compare current with previous iteration | false     |
| `--name=<name>` | Name for the design iteration           | timestamp |

## Configuration Objects

### Component Configuration Options

| Property                 | Type     | Description                                                                                     | Required |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------- | -------- |
| `name`                   | string   | Component identifier                                                                            | Yes      |
| `page`                   | string   | Page path where component exists                                                                | Yes      |
| `selector`               | string   | Primary CSS selector                                                                            | Yes      |
| `alternativeSelectors`   | string[] | Fallback selectors if primary fails                                                             | No       |
| `fallbackStrategy`       | string   | Strategy if selectors fail: `first-heading`, `section-index`, `keyword-context`, `last-element` | No       |
| `keywords`               | string[] | Keywords for `keyword-context` strategy                                                         | No       |
| `padding`                | number   | Padding around component in pixels                                                              | No       |
| `minHeight`              | number   | Minimum capture height in pixels                                                                | No       |
| `waitForSelector`        | string   | Selector to wait for before capture                                                             | No       |
| `extraScroll`            | number   | Extra pixels to scroll before capture                                                           | No       |
| `clickSelector`          | string   | Selector to click before capture                                                                | No       |
| `clickWaitTime`          | number   | Wait time after click in ms                                                                     | No       |
| `testId`                 | string   | Testid attribute value                                                                          | No       |
| `excludeElements`        | string[] | Selectors for elements to exclude                                                               | No       |
| `diffThreshold`          | number   | Diff threshold for this component                                                               | No       |
| `captureFrameworkTabs`   | boolean  | Whether to capture framework tabs                                                               | No       |
| `pauseAnimations`        | boolean  | Whether to pause animations                                                                     | No       |
| `diffHighlightSelectors` | string[] | Elements to highlight in diff                                                                   | No       |
| `beforeScreenshot`       | function | Hook called before screenshot                                                                   | No       |

### Screenshot-Utils Configuration

#### Environment Options

| Property      | Description              | Default               |
| ------------- | ------------------------ | --------------------- |
| `BASE_URL`    | Base URL for the site    | http://localhost:3000 |
| `PATH_PREFIX` | Path prefix for the site | /jods if local        |
| `THEMES`      | Themes to capture        | ["light", "dark"]     |
| `DEBUG`       | Enable debug output      | false                 |

## Directory Structure

```
static/
├── screenshots/
│   ├── unified/          # Component screenshots
│   ├── diff/             # Visual diff images
│   └── iterations/       # Design iterations
└── debug/                # HTML debug information
```

## Integration with package.json

These npm scripts provide easy access:

```json
{
  "scripts": {
    "screenshots": "node scripts/screenshot-unified.mjs",
    "screenshots:baseline": "node scripts/screenshot-unified.mjs --baseline",
    "screenshots:cleanup": "node scripts/screenshot-cleanup.mjs",
    "screenshots:diff": "node scripts/screenshot-diff.mjs",
    "screenshots:generate-selectors": "node scripts/generate-selectors.mjs"
  }
}
```

## Troubleshooting

- **Selector not found**: Verify the element exists and try alternative selectors
- **Screenshots cut off**: Increase `padding` and `minHeight` values
- **Theme issues**: Check the theme toggle selector in `screenshot-capture.mjs`
- **Performance problems**: Use `--components` to limit captures to specific components
