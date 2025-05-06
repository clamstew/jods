# Advanced Screenshot System Features

This guide covers advanced features and techniques for power users of the screenshot system.

## Design Iterations

The design iterations system helps you track UI changes over time and compare different design approaches.

### Creating a New Iteration

```bash
# Initialize a new named design iteration
npm run design:init -- --name="redesign-v1"

# Initialize with auto-generated name (uses timestamp)
npm run design:init
```

This will:

1. Create a new iteration folder in `static/screenshots/iterations/<name>`
2. Copy the current baseline screenshots
3. Record metadata about the iteration

### Comparing Iterations

```bash
# Compare the current state with a previous iteration
npm run design:compare -- --name="redesign-v1"

# Compare the most recent two iterations
npm run design:compare
```

This generates a visual report showing changes between iterations.

## Selector Strategies

### Automatic Selector Generation

If your components use data-testid attributes (recommended), you can automate selector discovery:

```bash
# Generate selectors
npm run screenshots:generate-selectors

# Use generated selectors
npm run screenshots -- --use-generated-selectors

# Merge generated with existing selectors
npm run screenshots -- --use-generated-selectors --merge-selectors
```

This creates `screenshot-selectors.generated.mjs` with selectors based on testids.

### Fallback Strategies

When a component can't be found with the primary selector, these fallback strategies kick in:

- `first-heading`: Finds the first `h1` or `h2` element
- `section-index`: Selects the nth section element
- `keyword-context`: Finds elements containing specified keywords
- `last-element`: Finds the last major element or footer

Configure these in the component definition:

```javascript
{
  name: "hero-section",
  // ...
  fallbackStrategy: "keyword-context",
  keywords: ["jods", "Powerful features"],
}
```

## Custom Screenshot Hooks

For complex components, you can define custom hooks that run before screenshots:

```javascript
{
  name: "complex-component",
  // ...
  beforeScreenshot: async (page, elementHandle, theme) => {
    // Click tabs, expand elements, etc
    await page.click('.toggle-button');
    await page.waitForTimeout(500);
  }
}
```

## Framework Tab Capturing

For components that have multiple framework tabs (React/Remix/etc), use:

```javascript
{
  name: "framework-section",
  // ...
  captureFrameworkTabs: true,
  captureTabs: ["react", "remix"],
  captureRemixFirst: true,
}
```

This will capture each tab in sequence and save separate screenshots.

## Performance Optimization

### Targeted Capturing

Capture only what you need:

```bash
# Capture only specific components
npm run screenshots -- --components=hero-section,features-section

# Capture only specific sections of the page
npm run screenshots -- --mode=sections
```

### Excluding Elements

Exclude elements that cause flakiness or are not relevant:

```javascript
{
  name: "hero-section",
  // ...
  excludeElements: [
    ".animation-container",
    ".random-quote",
    ".timestamp"
  ]
}
```

## Visual Diffing

### Customizing Diff Thresholds

Set global or component-specific diff thresholds:

```bash
# Global threshold
npm run screenshots:diff -- --threshold=0.05
```

Or in component config:

```javascript
{
  name: "animated-component",
  // ...
  diffThreshold: 0.05,  // 5% difference allowed
}
```

### Highlighting Diff Areas

Highlight specific areas in diff images:

```javascript
{
  name: "component",
  // ...
  diffHighlightSelectors: [
    ".new-feature",
    ".updated-text"
  ]
}
```

## Debugging

### HTML Debug Capture

Automatically capture HTML structure for debugging:

```javascript
{
  name: "component",
  // ...
  captureHtmlDebug: true
}
```

This saves detailed HTML information in `static/debug/`.

### Live Debug Mode

Run in debug mode for more verbose output:

```bash
DEBUG=true npm run screenshots
```

## Batch Processing

### Integration with CI/CD

For CI/CD integration, use the non-interactive mode:

```bash
CI=true npm run screenshots
```

This disables prompts and optimizes for automation.

### Screenshot Reporting

Generate an HTML report of screenshot results:

```bash
npm run screenshots -- --report
```

This creates a visual report of all captured screenshots for easy review.

## Custom Themes

For projects with more than light/dark themes, customize the theme list:

```javascript
// In your .env file
(SCREENSHOT_THEMES = light), dark, contrast, brand;
```

Then capture all themes:

```bash
npm run screenshots
```

## Animation Handling

### Pausing Animations

Control animations during capture:

```javascript
{
  name: "animated-component",
  // ...
  pauseAnimations: true,
  particleBackground: true  // Special handling for particle effects
}
```

### Capturing Specific Animation States

Capture specific animation states:

```javascript
{
  name: "transition-component",
  // ...
  beforeScreenshot: async (page) => {
    // Trigger animation
    await page.click('.animation-trigger');

    // Wait for specific animation state
    await page.waitForTimeout(500);

    // Pause at that state
    await page.evaluate(() => {
      document.documentElement.classList.add('pause-animations');
    });
  }
}
```

## Custom Selectors

Use custom, complex selectors for hard-to-target elements:

```javascript
{
  name: "dynamic-component",
  // ...
  selector: 'section:has(h2:has-text("Dynamic Content"))',
  alternativeSelectors: [
    'div.container:has(button:has-text("Load More"))',
    '[data-section="dynamic"][role="region"]'
  ]
}
```
