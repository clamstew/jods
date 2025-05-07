#!/usr/bin/env node

/**
 * Verify Design Changes Script
 *
 * This utility script compares screenshots between design iterations to verify
 * that changes were successfully captured. It helps diagnose issues where
 * design changes don't appear in screenshots.
 *
 * Usage:
 *   node verify-design-changes.mjs --iteration=2 --target="try-jods-section"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import minimist from "minimist";
import { chromium } from "@playwright/test";
import open from "open";

// Get directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const tempDir = path.join(rootDir, "temp");
const iterationsDir = path.join(tempDir, "design-iterations");
const diagnosticsDir = path.join(tempDir, "diagnostics");

// Create directories if they don't exist
if (!fs.existsSync(diagnosticsDir)) {
  fs.mkdirSync(diagnosticsDir, { recursive: true });
}

// Create a verification results directory for visual diffs
const verificationDir = path.join(tempDir, "verification");
if (!fs.existsSync(verificationDir)) {
  fs.mkdirSync(verificationDir, { recursive: true });
}

// Parse command line arguments
function parseArgs() {
  const args = minimist(process.argv.slice(2));

  return {
    iteration: args.iteration ? parseInt(args.iteration) : null,
    target: args.target || null,
    theme: args.theme || "light",
    threshold: args.threshold ? parseFloat(args.threshold) : 5.0, // 5% difference threshold
    openDiffs: args.open !== false,
    checkAll: args.all || false,
    verbose: args.verbose || false,
  };
}

/**
 * Get all iterations available
 */
function getAvailableIterations() {
  if (!fs.existsSync(iterationsDir)) {
    return [];
  }

  return fs
    .readdirSync(iterationsDir)
    .filter((dir) => dir.startsWith("iteration-"))
    .map((dir) => {
      const iteration = parseInt(dir.split("-")[1]);
      return {
        iteration,
        path: path.join(iterationsDir, dir),
      };
    })
    .sort((a, b) => a.iteration - b.iteration);
}

/**
 * Get available targets for an iteration
 */
function getAvailableTargets(iterationPath) {
  const screenshotsDir = path.join(iterationPath, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    return [];
  }

  const files = fs.readdirSync(screenshotsDir);
  const targets = new Set();

  files.forEach((file) => {
    // Extract target from filename (e.g., "03-try-jods-section-light-20250507.png")
    const match = file.match(/^([^-]+-[^-]+(?:-[^-]+)?)-(?:light|dark)/);
    if (match) {
      targets.add(match[1]);
    }
  });

  return Array.from(targets);
}

/**
 * Find screenshots for a specific target and theme in an iteration
 */
function findScreenshots(iterationPath, target, theme) {
  const screenshotsDir = path.join(iterationPath, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    return [];
  }

  return fs
    .readdirSync(screenshotsDir)
    .filter((file) => file.includes(target) && file.includes(`-${theme}`))
    .map((file) => path.join(screenshotsDir, file));
}

/**
 * Compare two images using Playwright's canvas functionality
 */
async function compareImages(img1Path, img2Path, diffOutputPath, threshold) {
  if (!fs.existsSync(img1Path) || !fs.existsSync(img2Path)) {
    console.log(`❌ Missing image files for comparison`);
    return { diffPercentage: 1.0, message: "Missing image files" };
  }

  // Launch browser for pixel comparison
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Read both images and convert to base64
    const img1Buffer = fs.readFileSync(img1Path);
    const img2Buffer = fs.readFileSync(img2Path);

    const img1Base64 = `data:image/png;base64,${img1Buffer.toString("base64")}`;
    const img2Base64 = `data:image/png;base64,${img2Buffer.toString("base64")}`;

    // Compare images using Playwright
    const diffResult = await page.evaluate(
      async ({ img1, img2 }) => {
        // Load both images
        const loadImage = (dataUrl) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = dataUrl;
          });
        };

        // Convert image to pixel data
        const imageToData = (img) => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          return {
            width: img.width,
            height: img.height,
            data: ctx.getImageData(0, 0, img.width, img.height).data,
          };
        };

        try {
          const img1Loaded = await loadImage(img1);
          const img2Loaded = await loadImage(img2);

          // Handle different sized images
          if (
            img1Loaded.width !== img2Loaded.width ||
            img1Loaded.height !== img2Loaded.height
          ) {
            return {
              diffPercentage: 1.0, // 100% different
              message: `Size mismatch: Image 1 (${img1Loaded.width}x${img1Loaded.height}) vs Image 2 (${img2Loaded.width}x${img2Loaded.height})`,
              diffImage: null,
            };
          }

          // Get pixel data
          const img1Data = imageToData(img1Loaded);
          const img2Data = imageToData(img2Loaded);

          // Create diff image
          const canvas = document.createElement("canvas");
          canvas.width = img1Loaded.width;
          canvas.height = img1Loaded.height;
          const ctx = canvas.getContext("2d");

          // Draw the second image
          ctx.drawImage(img2Loaded, 0, 0);

          // Get image data for manipulation
          const diffImageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const diffData = diffImageData.data;

          // Compare pixels and highlight differences
          let differentPixels = 0;
          const totalPixels = img1Data.width * img1Data.height;

          for (let i = 0; i < img1Data.data.length; i += 4) {
            const rDiff = Math.abs(img1Data.data[i] - img2Data.data[i]);
            const gDiff = Math.abs(img1Data.data[i + 1] - img2Data.data[i + 1]);
            const bDiff = Math.abs(img1Data.data[i + 2] - img2Data.data[i + 2]);

            // If any channel has significant difference
            // Use the threshold to determine what counts as a significant difference
            // Convert percentage threshold to a channel difference value (0-255)
            const channelThreshold = Math.ceil(255 * (threshold / 100));
            if (
              rDiff > channelThreshold ||
              gDiff > channelThreshold ||
              bDiff > channelThreshold
            ) {
              // Mark the different pixel as magenta
              diffData[i] = 255; // R
              diffData[i + 1] = 0; // G
              diffData[i + 2] = 255; // B

              differentPixels++;
            }
          }

          // Calculate percentage of different pixels
          const diffPercentage = differentPixels / totalPixels;

          // Put the modified image data back
          ctx.putImageData(diffImageData, 0, 0);

          // Return the diff image as base64 and the percentage
          return {
            diffPercentage,
            diffImage: canvas.toDataURL(),
            differentPixels,
            totalPixels,
            success: true,
          };
        } catch (error) {
          return {
            diffPercentage: 1.0,
            diffImage: null,
            error:
              "Failed to process images: " + (error.message || "Unknown error"),
            success: false,
          };
        }
      },
      { img1: img1Base64, img2: img2Base64 }
    );

    if (!diffResult.success) {
      console.log(`❌ Error processing images: ${diffResult.error}`);
      await browser.close();
      return { diffPercentage: 1.0, message: diffResult.error };
    }

    // Save the diff image if there are differences
    if (diffResult.diffPercentage > 0 && diffResult.diffImage) {
      const base64Data = diffResult.diffImage.replace(
        /^data:image\/png;base64,/,
        ""
      );
      fs.writeFileSync(diffOutputPath, Buffer.from(base64Data, "base64"));
    }

    await browser.close();
    return diffResult;
  } catch (error) {
    await browser.close();
    return { diffPercentage: 1.0, message: error.message };
  }
}

/**
 * Verify design changes between iterations
 */
async function verifyDesignChanges(config) {
  console.log("🔍 Verifying Design Changes Between Iterations");

  // Get all available iterations
  const iterations = getAvailableIterations();

  if (iterations.length === 0) {
    console.error("❌ No iterations found");
    return false;
  }

  console.log(`Found ${iterations.length} iterations`);

  // Get the iteration to verify
  let iteration = config.iteration;
  if (!iteration) {
    // If no iteration specified, use the latest
    const latestIteration = iterations[iterations.length - 1];
    iteration = latestIteration.iteration;
    console.log(`No iteration specified, using latest (${iteration})`);
  }

  // Make sure this isn't the first iteration
  if (iteration <= 1) {
    console.error(
      "❌ Cannot verify the first iteration (nothing to compare with)"
    );
    return false;
  }

  // Find the current and previous iteration paths
  const currentIterationPath = path.join(
    iterationsDir,
    `iteration-${iteration}`
  );
  const prevIterationPath = path.join(
    iterationsDir,
    `iteration-${iteration - 1}`
  );

  if (!fs.existsSync(currentIterationPath)) {
    console.error(`❌ Iteration ${iteration} not found`);
    return false;
  }

  if (!fs.existsSync(prevIterationPath)) {
    console.error(`❌ Previous iteration ${iteration - 1} not found`);
    return false;
  }

  // Get available targets
  const currentTargets = getAvailableTargets(currentIterationPath);
  if (currentTargets.length === 0) {
    console.error(`❌ No targets found for iteration ${iteration}`);
    return false;
  }

  // Filter to specified target if provided
  const targetsToCheck = config.target
    ? currentTargets.filter((t) => t.includes(config.target))
    : currentTargets;

  if (targetsToCheck.length === 0) {
    console.error(
      `❌ Target "${config.target}" not found in iteration ${iteration}`
    );
    console.log(`Available targets: ${currentTargets.join(", ")}`);
    return false;
  }

  console.log(`Verifying changes for targets: ${targetsToCheck.join(", ")}`);

  // Create results directory for this verification
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsDir = path.join(
    verificationDir,
    `verify-${iteration}-${timestamp}`
  );
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Create a report file
  const reportPath = path.join(resultsDir, "report.md");
  let report = `# Design Changes Verification Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `Comparing iteration ${iteration - 1} → ${iteration}\n\n`;

  // Track overall results
  const results = {
    targets: {},
    overallDifferent: false,
  };

  // Process each target
  for (const target of targetsToCheck) {
    console.log(`\n📊 Checking target: ${target}`);
    report += `## Target: ${target}\n\n`;

    // Find screenshots for this target
    const currentScreenshots = findScreenshots(
      currentIterationPath,
      target,
      config.theme
    );
    const prevScreenshots = findScreenshots(
      prevIterationPath,
      target,
      config.theme
    );

    if (currentScreenshots.length === 0) {
      console.error(
        `  ❌ No screenshots found for ${target} in iteration ${iteration}`
      );
      report += `❌ No screenshots found for this target in iteration ${iteration}\n\n`;
      results.targets[target] = { error: "no_screenshots_current" };
      continue;
    }

    if (prevScreenshots.length === 0) {
      console.error(
        `  ❌ No screenshots found for ${target} in iteration ${iteration - 1}`
      );
      report += `❌ No screenshots found for this target in iteration ${
        iteration - 1
      }\n\n`;
      results.targets[target] = { error: "no_screenshots_previous" };
      continue;
    }

    // Use the first screenshot from each iteration
    const currentScreenshot = currentScreenshots[0];
    const prevScreenshot = prevScreenshots[0];

    // Output diff file path
    const diffFileName = `${target}-${config.theme}-diff.png`;
    const diffPath = path.join(resultsDir, diffFileName);

    // Compare the screenshots
    const comparison = await compareImages(
      prevScreenshot,
      currentScreenshot,
      diffPath,
      config.threshold
    );

    // Update results
    results.targets[target] = comparison;
    if (comparison.diffPercentage > 0) {
      results.overallDifferent = true;
    }

    // Add to report
    report += `### ${config.theme} theme\n\n`;
    report += `- Previous: \`${path.basename(prevScreenshot)}\`\n`;
    report += `- Current: \`${path.basename(currentScreenshot)}\`\n`;
    report += `- Difference: ${comparison.diffPercentage.toFixed(2)}%\n`;

    if (comparison.diffPercentage > 0) {
      report += `- ✅ **Changes detected** - Screenshots are different\n`;
    } else {
      report += `- ⚠️ **Warning** - Screenshots look very similar (${comparison.diffPercentage.toFixed(
        2
      )}% difference)\n`;
    }

    if (comparison.diffImage) {
      report += `- Diff image: [${diffFileName}](${diffFileName})\n`;

      // Add visual representation
      report += `\n<table>
  <tr>
    <td><strong>Previous (${iteration - 1})</strong></td>
    <td><strong>Current (${iteration})</strong></td>
    <td><strong>Difference</strong></td>
  </tr>
  <tr>
    <td><img src="${path.relative(
      resultsDir,
      prevScreenshot
    )}" width="250" /></td>
    <td><img src="${path.relative(
      resultsDir,
      currentScreenshot
    )}" width="250" /></td>
    <td><img src="${diffFileName}" width="250" /></td>
  </tr>
</table>\n\n`;
    }

    report += "\n";
  }

  // Add summary to report
  report += `## Summary\n\n`;

  if (results.overallDifferent) {
    report += `✅ **Design changes detected** - At least one component shows significant differences\n\n`;
  } else {
    report += `⚠️ **Warning** - No significant design changes detected between iterations\n\n`;
    report += `Possible causes:\n`;
    report += `- Design changes not visible in the UI\n`;
    report += `- Server didn't reload the changes properly\n`;
    report += `- Not enough wait time for changes to appear\n\n`;
  }

  // Add recommendations
  report += `## Recommendations\n\n`;
  report += `If screenshots look identical but you expected changes:\n\n`;
  report += `1. Verify design changes are visible in the browser\n`;
  report += `2. Try increasing the wait time between iterations (60+ seconds recommended)\n`;
  report += `3. Make sure the server is properly rebuilding with your changes\n`;
  report += `4. Consider restarting the development server\n`;

  // Save the report
  fs.writeFileSync(reportPath, report);
  console.log(`\n📝 Report saved to: ${reportPath}`);

  // Open diff images if requested
  if (config.openDiffs) {
    console.log("Opening report...");
    try {
      await open(reportPath);
    } catch (err) {
      console.error(`Error opening report: ${err.message}`);
    }
  }

  // Print summary
  console.log("\n📊 Verification Summary:");

  for (const target in results.targets) {
    const result = results.targets[target];

    if (result.error) {
      console.log(`  ❌ ${target}: Error - ${result.error}`);
    } else if (result.diffPercentage > 0) {
      console.log(
        `  ✅ ${target}: Changed (${result.diffPercentage.toFixed(
          2
        )}% different)`
      );
    } else {
      console.log(
        `  ⚠️ ${target}: Similar (only ${result.diffPercentage.toFixed(
          2
        )}% different)`
      );
    }
  }

  if (results.overallDifferent) {
    console.log("\n✅ Design changes detected!");
  } else {
    console.log(
      "\n⚠️ Warning: No significant design changes detected between iterations"
    );
  }

  return results.overallDifferent;
}

// Run the script if it's called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = parseArgs();
  verifyDesignChanges(config)
    .then((hasChanges) => {
      process.exit(hasChanges ? 0 : 1);
    })
    .catch((error) => {
      console.error("Error verifying design changes:", error);
      process.exit(1);
    });
}

export { verifyDesignChanges };
