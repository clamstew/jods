---
sidebar_position: 4
---

# ⚙️ Advanced Screenshot Usage

This guide covers advanced features and techniques for the screenshot system, building on the foundations covered in the other guides.

## Advanced Element Identification

### Element Triangulation

The unified script uses multiple selectors to find elements more reliably as a fallback when testIDs aren't available:

```js
{
  page: "/",
  name: "hero-section",
  // Primary selector
  selector: "div.heroBanner_UJgQ, div.hero-container, .hero, [class*='hero_']",
  // Additional selectors for triangulation
  alternativeSelectors: [
    "h1:has-text('jods')",
    ".hero-subtitle, .hero-description",
    "div:has(> h1:has-text('jods'))"
  ]
}
```

If the primary selector doesn't find the element, the script will:

1. Try each alternative selector individually
2. If multiple alternative selectors match, find their common parent
3. Use triangulation to determine the correct section boundaries

### Framework Tabs

The system supports capturing different tabs of the framework showcase section:

```js
// React tab (default tab on load)
{
  name: "framework-section-react",
  selector: "section:has(h2:has-text('Works with your favorite frameworks'))",
  testId: "jods-framework-section",
  // other properties...
},

// Remix tab (requires clicking the tab)
{
  name: "framework-section-remix",
  selector: "section:has(h2:has-text('Works with your favorite frameworks'))",
  testId: "jods-framework-section",
  clickSelector: "button:has-text('Remix'), button:has-text('💿')", // Clicks Remix tab
  clickWaitTime: 1500, // Wait for tab content to load
  minHeight: 1600, // Taller to accommodate Remix content
  // other properties...
}
```

This approach:

- Treats each tab as a separate component
- Automatically clicks the Remix tab when needed
- Uses appropriate heights for each tab's content
- Maintains separate screenshots for React and Remix tabs

### Element Exclusion

The unified script allows you to exclude specific elements from screenshots while still using them for triangulation:

```js
{
  page: "/",
  name: "hero-section",
  selector: "div.heroBanner_UJgQ",
  alternativeSelectors: [ /* ... */ ],
  // Elements to exclude from screenshot
  excludeElements: [
    "nav",
    ".navbar",
    "[class*='navbar_']"
  ]
}
```

This enables:

- Using navigation bars for triangulation without including them in screenshots
- Excluding footer links or pagination from section captures
- Precise control over what appears in the final screenshot
- Better consistency across themes and viewport sizes

## Screenshot Management

### Creating Baselines

Baseline screenshots are the reference images without timestamps used for comparison:

```bash
# Create baseline screenshots (no timestamp)
pnpm screenshot:baseline
```

### Cleaning Up Screenshots

To prevent accumulating too many screenshots, you can clean up old ones:

```bash
# Keep only the most recent batch
pnpm screenshot:cleanup

# Preview what would be deleted (no actual deletion)
pnpm screenshot:cleanup -- --dry-run
```

The cleanup script automatically:

1. Identifies timestamped vs. baseline screenshots
2. Preserves all baseline (non-timestamped) screenshots
3. Keeps only the most recent batch(es) of timestamped screenshots
4. Provides detailed reporting about what was deleted

## Visual Regression Testing

The screenshot system includes an automated pixel diff tool for visual regression testing:

```bash
# Basic diff test (uses 2% threshold)
pnpm screenshot:diff

# Test with custom options
pnpm screenshot:diff -- --verbose               # Keep all diff images
pnpm screenshot:diff -- --components=try-jods-section,framework-section-react
pnpm screenshot:diff -- --threshold=0.05        # Use 5% threshold
```

The pixel diff tool:

1. Takes new screenshots with the current code
2. Compares them with the baseline screenshots
3. Highlights differences in magenta
4. Generates diff images when differences exceed the threshold
5. Reports a pass/fail summary with percentage differences
6. Exits with error code on test failure

This creates a powerful workflow:

1. Establish baseline screenshots with `pnpm screenshot:baseline`
2. Make design changes or code updates
3. Run `pnpm screenshot:diff` to detect visual regressions
4. Review diff images in the `diffs` folder to see highlighted changes
5. Only update baselines when intentionally changing designs

Diff images are saved to:

```
docs/static/screenshots/unified/diffs/
```

## Visual Comparison Grid Layout

To showcase design iterations in your documentation, we provide a responsive grid layout system for comparing screenshots side-by-side:

```jsx
<div className="iterations-comparison">
  <h3 className="comparison-heading">Iterations Comparison</h3>

  <div className="iterations-grid">
    <!-- Light Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (Before)</div>
      <img className="iteration-image" src="/jods/path/to/before-light.png" alt="Before design (light mode)" />
    </div>

    <!-- Light Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (After)</div>
      <img className="iteration-image" src="/jods/path/to/after-light.png" alt="After design (light mode)" />
    </div>

    <!-- Dark Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (Before)</div>
      <img className="iteration-image" src="/jods/path/to/before-dark.png" alt="Before design (dark mode)" />
    </div>

    <!-- Dark Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (After)</div>
      <img className="iteration-image" src="/jods/path/to/after-dark.png" alt="After design (dark mode)" />
    </div>
  </div>
</div>
```

This grid automatically organizes your screenshots in a 2x2 grid on larger screens, and stacks them in a single column on mobile devices.

## Troubleshooting

If the screenshot system encounters issues:

1. **Missing Test IDs**: Check if the `data-testid` attributes are correctly added to components in the source code
2. **Connection Issues**: Make sure the documentation site is running locally before taking screenshots
3. **Theme Toggle Issues**: The system uses multiple selectors to find the theme toggle button, but if the site structure changes, you may need to update the selectors in the screenshot scripts
4. **Missing Pages/Components**: Verify that the URLs and selectors match the actual site structure
5. **Disk Space**: If you have many timestamped screenshots, use `pnpm screenshot:cleanup` to free up space

### Section Screenshot Issues

If section screenshots aren't capturing the right elements:

1. **Add data-testid attributes** to the components in source code
2. **Add more specific alternative selectors** in `screenshot-selectors.mjs` for better triangulation
3. **Use element exclusion** to remove unwanted elements while keeping useful ones for triangulation
4. **Run with debug mode** for detailed logs: `DEBUG=true pnpm screenshot`
5. **Adjust padding settings** for specific sections that need more context

## 🧠 Best Practices

1. **Add data-testid attributes** to all major section components
2. Take screenshots after significant UI changes
3. Use component screenshots for focused testing of specific UI elements
4. Use section screenshots for marketing and documentation materials
5. Create baseline screenshots before major redesigns for reference
6. Include screenshots in PR descriptions for visual reviews
7. Use screenshots for marketing materials and documentation updates
8. Store screenshot sets for each major release for reference
9. **Run visual regression tests** before and after significant changes
10. Use pixel diffing to ensure design consistency across updates
11. Only update baseline screenshots when intentionally changing design
12. Clean up older timestamped screenshots periodically to save space

## Integration with Design Iterations

The advanced screenshot features play a critical role in the design iterations workflow:

1. **Visual history** allows tracking how design evolves over time
2. **Visual comparison** enables side-by-side evaluation of design changes
3. **Regression testing** ensures changes don't break existing design
4. **Focused component testing** lets you experiment with specific UI elements
5. **Design reviews** are enhanced with timestamped screenshots for feedback

For more information on how these advanced techniques integrate with the design iteration process, see the [Design Iterations Workflow](../workflow) and [Feedback System](../feedback) guides.
