# Design Iterations Workflow Improvements

Based on user feedback, the following improvements would enhance the design iterations workflow:

## 1. Targeted Screenshot Capture

**Issue:** Currently, the design iterations script captures screenshots for all sections, not just the targeted component. This creates excessive files and confusion.

**Solution:** Add a `--skip-other-sections` flag to the `design-iterations.mjs` script that modifies the screenshot capture to focus only on the specified target.

```javascript
// In design-iterations.mjs, modify captureScreenshots function
async function captureScreenshots(targets, iterationDir) {
  console.log(`📸 Capturing screenshots for targets: ${targets.join(", ")}`);

  const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);

  try {
    // If --skip-other-sections flag is present, only capture the specified targets
    const skipOtherSections = config.skipOtherSections ? true : false;

    if (skipOtherSections) {
      console.log(`   Only capturing specified target components: ${targets.join(", ")}`);
      // Use the existing screenshot infrastructure but with only the specified targets
      await takeUnifiedScreenshots("custom", timestamp, false, targets, true);
    } else {
      // Existing behavior - capture all
      await takeUnifiedScreenshots("all", timestamp, false, targets);
    }

    // Rest of function remains the same...
  }
  // ...
}

// Also update the parseArgs function to support the new flag
function parseArgs() {
  const args = minimist(process.argv.slice(2));

  return {
    // Existing args...
    skipOtherSections: args['skip-other-sections'] || false,
  };
}
```

## 2. Better Timestamp Matching

**Issue:** The HTML files generated don't have timestamps that match with PNGs, making it difficult to correlate between them.

**Solution:** Modify the HTML debug info file naming to include the same timestamp:

```javascript
// In screenshot-unified.mjs
HTML debug info saved to: ${rootDir}/static/debug/${component}-${theme}-${timestamp}-debug.html
```

## 3. Use Existing Baselines for Context

**Issue:** The workflow regenerates base screenshots unnecessarily.

**Solution:** Add functionality to use existing baseline images when available, only generating new ones for the target component:

```javascript
// In design-iterations.mjs
async function getContextFromBaselines(targets) {
  const baseScreenshotDir = path.join(rootDir, "static/screenshots/unified");
  const baselineImages = {};

  for (const target of targets) {
    const lightBase = path.join(baseScreenshotDir, `${target}-light.png`);
    const darkBase = path.join(baseScreenshotDir, `${target}-dark.png`);

    if (fs.existsSync(lightBase) && fs.existsSync(darkBase)) {
      baselineImages[target] = {
        light: lightBase,
        dark: darkBase,
      };
    }
  }

  return baselineImages;
}
```

## 4. Improved Feedback Template

**Issue:** The feedback template could benefit from AI-populated observations.

**Solution:** Enhance the createFeedbackTemplate function to include AI-generated observations about the current design and suggested improvements:

```javascript
function createFeedbackTemplate(
  iteration,
  targets,
  timestamp,
  iterationDir,
  baselineImages
) {
  // Existing code...

  // Add AI-populated observations
  const aiObservations = {
    strengths: [
      "Clean, organized layout",
      "Good visual hierarchy",
      // More generated based on component analysis
    ],
    improvements: [
      "Could enhance visual distinction between sections",
      "Consider adjusting spacing for better readability",
      // More generated based on component analysis
    ],
  };

  // Include these in the template
  // ...
}
```

## 5. Summary Generation

**Issue:** No clear summary comparing all iterations.

**Solution:** Add automatic generation of a summary file after creating all iterations:

```javascript
function generateIterationSummary(iterations, targets, config) {
  const summaryPath = path.join(
    tempDir,
    `design-iterations/summary-${new Date().toISOString().slice(0, 10)}.md`
  );

  // Generate summary content comparing all iterations
  // ...

  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`   Summary generated at ${summaryPath}`);
}
```

## Implementation Plan

1. Add the `--skip-other-sections` flag first, as it addresses the most immediate pain point
2. Update the HTML debug file naming convention to include timestamps
3. Implement the baseline reference functionality
4. Enhance the feedback template generation
5. Add summary generation

These improvements will significantly enhance the design iterations workflow by making it more focused, efficient, and informative.
