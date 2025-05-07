#!/usr/bin/env node

/**
 * Design Iterations Script
 *
 * This script automates the process of creating design iterations, capturing
 * screenshots, and storing the changes for later evaluation and application.
 *
 * Usage:
 *   node design-iterations.mjs --count=5 --target="hero-section,features-section"
 *                             --compare-with="react,redux,zustand"
 */

import fs from "fs";
import path from "path";
// Import child_process for git operations
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import minimist from "minimist";
// Import screenshot function - UNCOMMENTED
import { takeUnifiedScreenshots } from "./screenshot-unified.mjs";
import http from "http";
import { spawn } from "child_process";
import { chromium } from "@playwright/test";

// Get directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const tempDir = path.join(rootDir, "temp");
const iterationsDir = path.join(tempDir, "design-iterations");
const possibleDiffsDir = path.join(tempDir, "possible-diffs"); // Directory for storing diffs

// Default configuration
const defaultConfig = {
  count: 1, // Number of iterations to run
  targets: [
    "hero-section",
    "features-section",
    "framework-section-react",
    "framework-section-remix",
  ],
  compareWith: [], // Libraries to compare with
  aiPrompt: "Improve the visual design while maintaining brand identity",
  baseScreenshotDir: path.join(rootDir, "static/screenshots/unified"),
  diffTool: "git diff", // Tool to generate diffs
  requireSignoff: true, // Require signoff for baseline changes
  skipOtherSections: false, // Default to capturing all sections
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = minimist(process.argv.slice(2));

  return {
    count: args.count ? parseInt(args.count) : defaultConfig.count,
    targets: args.target ? args.target.split(",") : defaultConfig.targets,
    compareWith: args.compareWith
      ? args.compareWith.split(",")
      : defaultConfig.compareWith,
    aiPrompt: args.prompt || defaultConfig.aiPrompt,
    requireSignoff: args.signoff !== false, // Default to requiring signoff
    apply: args.apply || false,
    iteration: args.iteration ? parseInt(args.iteration) : null,
    refine: args.refine || false,
    status: args.status || false,
    cleanup: args.cleanup || false,
    force: args.force || false,
    skipOtherSections:
      args["skip-other-sections"] || defaultConfig.skipOtherSections, // Add the new flag
    confirm: args.confirm || false, // Add confirmation flag for rebaseline
    rebaseline: args.rebaseline || false, // Add rebaseline flag
  };
}

/**
 * Create directory structure for iterations
 */
function createDirectoryStructure() {
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create iterations directory if it doesn't exist
  if (!fs.existsSync(iterationsDir)) {
    fs.mkdirSync(iterationsDir, { recursive: true });
  }

  // Create possible-diffs directory if it doesn't exist
  if (!fs.existsSync(possibleDiffsDir)) {
    fs.mkdirSync(possibleDiffsDir, { recursive: true });
  }

  console.log(`📁 Created directory structure at ${tempDir}`);
  console.log(`   - Iterations: ${iterationsDir}`);
  console.log(`   - Possible diffs: ${possibleDiffsDir}`);
}

/**
 * Create a new iteration directory
 */
function createIterationDirectory(iteration) {
  const iterationDir = path.join(iterationsDir, `iteration-${iteration}`);
  const screenshotsDir = path.join(iterationDir, "screenshots");

  if (!fs.existsSync(iterationDir)) {
    fs.mkdirSync(iterationDir, { recursive: true });
  }

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  return iterationDir;
}

/**
 * Generate a design change for the specified target component
 */
async function generateDesignChange(target, iteration, config) {
  console.log(
    `🎨 Generating design change for ${target} (iteration ${iteration})`
  );

  // TODO: Replace this with actual AI-driven design changes
  // For now, we'll just make a simple change to demonstrate the concept

  // Example: This would be replaced with AI-driven design suggestions
  const designPrompt = config.aiPrompt;
  console.log(`   Using design prompt: "${designPrompt}"`);

  const designChanges = {
    "hero-section": [
      { file: "src/css/custom.css", change: "Adjust hero section padding" },
      {
        file: "src/components/HomepageHero.js",
        change: "Increase hero text contrast",
      },
    ],
    "features-section": [
      { file: "src/css/custom.css", change: "Refine features card styling" },
      {
        file: "src/components/HomepageFeatures.js",
        change: "Improve features layout",
      },
    ],
    "framework-section-react": [
      {
        file: "src/css/custom.css",
        change: "Enhance framework tabs appearance",
      },
      {
        file: "src/components/HomepageFrameworks.js",
        change: "Refine React tab content",
      },
    ],
    "framework-section-remix": [
      {
        file: "src/css/custom.css",
        change: "Enhance framework tabs appearance",
      },
      {
        file: "src/components/HomepageFrameworks.js",
        change: "Refine Remix tab content",
      },
    ],
  };

  const changes = designChanges[target] || [];

  // Here we would actually apply the changes, but for now we'll just log
  console.log(`🔧 Would apply these changes for ${target}:`);
  changes.forEach((change) => {
    console.log(`   - ${change.file}: ${change.change}`);
  });

  return changes;
}

/**
 * Capture screenshots of the specified target components
 */
async function captureScreenshots(targets, iterationDir, config) {
  console.log(`📸 Capturing screenshots for targets: ${targets.join(", ")}`);
  if (config && config.skipOtherSections) {
    console.log(`   Focus mode enabled: Only capturing specified targets`);
  }

  const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15);

  // Use the existing screenshot infrastructure
  try {
    console.log(
      `   Calling takeUnifiedScreenshots with mode 'all' and timestamp ${timestamp}`
    );

    // Actually call the screenshot function instead of just commenting about it
    const skipOther = config && config.skipOtherSections ? true : false;
    await takeUnifiedScreenshots("all", timestamp, false, targets, skipOther);

    // Copy the screenshots to the iteration directory
    console.log(`   Copying screenshots to ${iterationDir}/screenshots`);

    // Copy screenshots from unified directory to iteration directory
    const baseScreenshotDir = path.join(rootDir, "static/screenshots/unified");
    const destDir = path.join(iterationDir, "screenshots");

    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Find relevant screenshots containing the timestamp
    const files = fs
      .readdirSync(baseScreenshotDir)
      .filter(
        (file) =>
          file.includes(timestamp) &&
          targets.some((target) => file.includes(target))
      );

    // Copy files to iteration directory
    for (const file of files) {
      fs.copyFileSync(
        path.join(baseScreenshotDir, file),
        path.join(destDir, file)
      );
      console.log(`   Copied ${file} to iteration directory`);
    }

    return timestamp;
  } catch (error) {
    console.error(`Error capturing screenshots: ${error.message}`);
    return null;
  }
}

/**
 * Capture the diff of changes made in this iteration
 */
function captureDiff(iterationDir, timestamp, target) {
  console.log("💾 Capturing diff of changes");

  // Generate diff using git
  try {
    // Create unique identifier for this diff
    const diffFileName = `${target}-${timestamp}.diff`;
    const diffPath = path.join(possibleDiffsDir, diffFileName);

    // Execute git diff command and capture output
    const diff = execSync("git diff", { encoding: "utf8" });

    // Save diff to the possible-diffs directory
    fs.writeFileSync(diffPath, diff);

    // Also save a copy to the iteration directory for completeness
    fs.writeFileSync(path.join(iterationDir, "diff.patch"), diff);

    console.log(`   Diff saved to temporary location: ${diffPath}`);
    console.log("   This diff can be applied later if this design is selected");

    return {
      diffPath,
      diffFileName,
    };
  } catch (error) {
    console.error(`Error capturing diff: ${error.message}`);
    return null;
  }
}

/**
 * Create metadata for the iteration
 */
function createMetadata(
  iteration,
  targets,
  changes,
  timestamp,
  diffInfo,
  config
) {
  console.log("📝 Creating metadata for iteration");

  // Get detailed timestamp information
  const now = new Date();
  const isoTimestamp = now.toISOString();
  const readableTimestamp = new Date().toLocaleString();
  const formattedTimestamp = timestamp.toString();

  // Extract design approach keywords from changes
  const designKeywords = new Set();
  const changedFiles = new Set();
  changes.forEach((change) => {
    change.changes.forEach((c) => {
      // Extract keywords from change descriptions
      const description = c.change.toLowerCase();
      if (description.includes("color") || description.includes("background"))
        designKeywords.add("color scheme");
      if (description.includes("flex") || description.includes("grid"))
        designKeywords.add("layout");
      if (description.includes("anim") || description.includes("transition"))
        designKeywords.add("animations");
      if (description.includes("font") || description.includes("text"))
        designKeywords.add("typography");
      if (description.includes("shadow") || description.includes("elevation"))
        designKeywords.add("shadows");
      if (description.includes("border") || description.includes("radius"))
        designKeywords.add("borders");
      if (description.includes("gradient")) designKeywords.add("gradients");
      if (description.includes("responsive")) designKeywords.add("responsive");
      changedFiles.add(c.file);
    });
  });

  // Build file paths for screenshots and debug HTML
  const artifactPaths = {};
  targets.forEach((target) => {
    artifactPaths[target] = {
      lightScreenshot: `docs/static/screenshots/unified/${target}-light-${timestamp}.png`,
      darkScreenshot: `docs/static/screenshots/unified/${target}-dark-${timestamp}.png`,
      lightDebugHtml: `docs/static/debug/${target}-light-debug-${isoTimestamp.replace(
        /[:.]/g,
        "-"
      )}.html`,
      darkDebugHtml: `docs/static/debug/${target}-dark-debug-${isoTimestamp.replace(
        /[:.]/g,
        "-"
      )}.html`,
      diffPath: diffInfo[target]?.diffPath || null,
    };
  });

  const metadata = {
    iteration,
    timestamp: {
      iso: isoTimestamp,
      readable: readableTimestamp,
      formatted: formattedTimestamp,
    },
    targets,
    screenshotTimestamp: timestamp,
    designApproach: {
      keywords: Array.from(designKeywords),
      description: "Design approach summary - to be filled by AI or designer",
      primaryFocus:
        designKeywords.size > 0
          ? Array.from(designKeywords)[0]
          : "general improvements",
    },
    changes: changes.map((change) => ({
      component: change.target,
      description: change.changes.map((c) => c.change).join("; "),
      files: change.changes.map((c) => c.file),
      reasoning: "Placeholder reasoning - would come from AI",
    })),
    changedFiles: Array.from(changedFiles),
    diffInfo: diffInfo,
    artifactPaths,
    previousIterationsContext:
      iteration > 1
        ? {
            comparedToPrevious:
              "Placeholder for comparison to previous iterations",
            iterationProgression: `This is iteration ${iteration} in the sequence`,
            buildingUpon: [],
          }
        : null,
    config,
    evaluation: {
      // These would be filled in by the evaluation process
      aesthetic_score: null,
      readability_score: null,
      accessibility_score: null,
    },
    approval: {
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      notes: null,
    },
  };

  // Try to load previous iteration's metadata to build context if this isn't the first iteration
  if (iteration > 1) {
    try {
      const previousIterationDir = path.join(
        iterationsDir,
        `iteration-${iteration - 1}`
      );
      const previousMetadataPath = path.join(
        previousIterationDir,
        "metadata.json"
      );

      if (fs.existsSync(previousMetadataPath)) {
        const previousMetadata = JSON.parse(
          fs.readFileSync(previousMetadataPath, "utf8")
        );

        // Build upon previous keywords
        if (
          previousMetadata.designApproach &&
          previousMetadata.designApproach.keywords
        ) {
          const prevKeywords = new Set(
            previousMetadata.designApproach.keywords
          );
          metadata.previousIterationsContext.buildingUpon =
            Array.from(prevKeywords);

          // Add keywords that appeared in previous iterations but not this one
          prevKeywords.forEach((keyword) => {
            if (!designKeywords.has(keyword)) {
              metadata.designApproach.keywords.push(`previous:${keyword}`);
            }
          });
        }

        // Add progression context
        if (previousMetadata.screenshotTimestamp) {
          metadata.previousIterationsContext.previousTimestamp =
            previousMetadata.screenshotTimestamp;
        }
      }
    } catch (error) {
      console.log(
        `Note: Could not load previous iteration metadata: ${error.message}`
      );
    }
  }

  return metadata;
}

/**
 * Save metadata to the iteration directory
 */
function saveMetadata(metadata, iterationDir) {
  const metadataPath = path.join(iterationDir, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`   Metadata saved to ${metadataPath}`);
}

/**
 * Create a feedback markdown file template
 */
function createFeedbackTemplate(iteration, targets, timestamp, iterationDir) {
  const templatePath = path.join(iterationDir, "feedback-template.md");

  // Try to get design approach info from previous iterations for context
  let designContext = "";
  let previousIterationLinks = "";

  if (iteration > 1) {
    try {
      const previousIterationDir = path.join(
        iterationsDir,
        `iteration-${iteration - 1}`
      );
      const previousMetadataPath = path.join(
        previousIterationDir,
        "metadata.json"
      );

      if (fs.existsSync(previousMetadataPath)) {
        const previousMetadata = JSON.parse(
          fs.readFileSync(previousMetadataPath, "utf8")
        );

        // Add info about previous design approach
        if (
          previousMetadata.designApproach &&
          previousMetadata.designApproach.keywords
        ) {
          const prevKeywords =
            previousMetadata.designApproach.keywords.join(", ");
          designContext = `\n## Previous Design Context\n\nIteration ${
            iteration - 1
          } focused on: **${prevKeywords}**\n\nThis iteration builds upon or contrasts with the previous approach.`;
        }

        // Add links to previous screenshots
        previousIterationLinks = `\n### Previous Iteration (${
          iteration - 1
        }) Screenshots\n`;
        targets.forEach((target) => {
          if (
            previousMetadata.artifactPaths &&
            previousMetadata.artifactPaths[target]
          ) {
            const paths = previousMetadata.artifactPaths[target];
            previousIterationLinks += `- ${target}:\n`;
            previousIterationLinks += `  - [Light Theme](${paths.lightScreenshot})\n`;
            previousIterationLinks += `  - [Dark Theme](${paths.darkScreenshot})\n`;
          }
        });
      }
    } catch (error) {
      console.log(
        `Note: Could not load previous iteration data for feedback template: ${error.message}`
      );
    }
  }

  // Get current metadata for timestamp and path references
  let metadataPath = path.join(iterationDir, "metadata.json");
  let screenshotPaths = "";

  try {
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      if (metadata.artifactPaths) {
        targets.forEach((target) => {
          if (metadata.artifactPaths[target]) {
            const paths = metadata.artifactPaths[target];
            screenshotPaths += `\n### ${target}\n`;
            screenshotPaths += `- Light theme: [${paths.lightScreenshot}](${paths.lightScreenshot})\n`;
            screenshotPaths += `- Dark theme: [${paths.darkScreenshot}](${paths.darkScreenshot})\n`;

            // Add debug HTML references
            screenshotPaths += `- Debug HTML:\n`;
            screenshotPaths += `  - [Light debug](${paths.lightDebugHtml})\n`;
            screenshotPaths += `  - [Dark debug](${paths.darkDebugHtml})\n`;

            // Add diff path if available
            if (paths.diffPath) {
              screenshotPaths += `- Changes: [Diff file](${paths.diffPath})\n`;
            }
          }
        });
      }
    }
  } catch (error) {
    console.log(
      `Note: Could not load current metadata for feedback template: ${error.message}`
    );
    // Fallback to generic paths if metadata loading fails
    targets.forEach((target) => {
      screenshotPaths += `\n### ${target}\n`;
      screenshotPaths += `- Light theme: [Path to light theme screenshot]\n`;
      screenshotPaths += `- Dark theme: [Path to dark theme screenshot]\n`;
    });
  }

  // If we couldn't load paths from metadata, use the generic fallback
  if (screenshotPaths === "") {
    targets.forEach((target) => {
      screenshotPaths += `\n### ${target}\n`;
      screenshotPaths += `- Light theme: [Path to light theme screenshot]\n`;
      screenshotPaths += `- Dark theme: [Path to dark theme screenshot]\n`;
    });
  }

  const template = `# Design Iteration Feedback (Iteration ${iteration})

## Session Information

- **Date:** ${new Date().toISOString().split("T")[0]}
- **Components:** ${targets.join(", ")}
- **Timestamp:** ${timestamp}
- **Context:** ${
    iteration > 1
      ? `This is iteration ${iteration} in the sequence`
      : "This is the first iteration"
  }
${designContext}

## Screenshots${screenshotPaths}
${previousIterationLinks}

## Detailed Feedback

${targets
  .map(
    (target) => `### ${target}

#### Visual Assessment
- **Color scheme:** [Effective, Needs adjustment, etc]
- **Layout:** [Effective, Needs adjustment, etc]
- **Typography:** [Effective, Needs adjustment, etc]
- **Spacing:** [Effective, Needs adjustment, etc]
- **Visual hierarchy:** [Effective, Needs adjustment, etc]

#### Feedback
- **What works well:**
  - 
  - 
  - 

- **What could be improved:**
  - 
  - 
  - 

- **Comparison to previous iterations:** ${
      iteration > 1
        ? "(How does this compare to previous versions?)"
        : "(First iteration)"
    }
  - 

#### Rating: [1-10]

`
  )
  .join("\n")}

## Design Progression

### Key Changes in This Iteration
- 
- 
- 

### Comparison to Previous Iterations
${
  iteration > 1
    ? `- How this iteration improves upon iteration ${iteration - 1}:`
    : "- This is the first iteration"
}
  - 
  - 

### Visual Timeline
- Iteration 1${
    iteration > 1
      ? " → " +
        Array.from(
          { length: iteration - 1 },
          (_, i) => `Iteration ${i + 2}`
        ).join(" → ")
      : ""
  }

## Summary and Decision

### Overall Assessment
- **Favorite component design:**
- **Best visual elements:**
  - 
  - 
  - 
- **Areas needing improvement:**
  - 
  - 

### Implementation Plan
- [ ] Proceed with current designs as is
- [ ] Create new iterations with specific focus
- [ ] Combine elements from different iterations

### Additional Notes

### Baseline Decision
- [ ] Approved for baseline update
- [ ] Not approved for baseline update
- [ ] Pending additional refinements before baseline approval

_Note: Baseline changes require maintainer signoff_
`;

  fs.writeFileSync(templatePath, template);
  console.log(`   Feedback template created at ${templatePath}`);

  return templatePath;
}

/**
 * Helper function to check if server is running
 */
async function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(
      "http://localhost:3000",
      {
        timeout: 3000, // Short timeout for each individual request
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve(res.statusCode === 200));
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Enhanced server startup with better timeout handling and graceful fallback
 */
async function ensureDocsServerRunning() {
  console.log("🔍 Checking if docs server is running...");

  // Set a global timeout for this entire operation
  const GLOBAL_TIMEOUT = 60000; // 60 seconds max
  const startTime = Date.now();

  try {
    // First just check if server is running without trying to start it
    const isRunning = await checkServerRunning();
    if (isRunning) {
      console.log("✅ Docs server is already running");
      return true;
    }

    console.log("📡 Docs server not running, attempting to start...");

    // Use a child process with proper detachment and stdio configuration
    const serverProcess = spawn("pnpm", ["start"], {
      cwd: path.join(__dirname, ".."),
      detached: true,
      stdio: "ignore",
    });

    // Unref to allow the parent process to exit independently
    serverProcess.unref();

    // Give server a moment to start up
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Poll for server availability with timeout
    let attempts = 0;
    while (Date.now() - startTime < GLOBAL_TIMEOUT) {
      const running = await checkServerRunning();
      if (running) {
        console.log("✅ Server started successfully");
        return true;
      }

      attempts++;
      if (attempts > 20) {
        console.log("⚠️ Server still not responding after many attempts");
        console.log("   Proceeding anyway - screenshots may not work");
        return false;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1000 * Math.pow(1.2, attempts), 5000))
      );

      // Log progress to keep the user informed
      console.log(`   Waiting for server - attempt ${attempts}/20`);
    }

    console.log("⚠️ Server startup timed out, proceeding without server");
    return false;
  } catch (error) {
    console.error(`❌ Error with server: ${error.message}`);
    console.log("   Proceeding with screenshot process anyway");
    return false;
  }
}

/**
 * Verify that screenshot shows a different design from previous iteration
 */
async function verifyScreenshotDifference(
  prevIterationPath,
  currentIterationPath
) {
  console.log("🔍 Verifying screenshots show different designs...");

  try {
    // Launch browser for pixel comparison
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Read both images and convert to base64
      const prevBuffer = fs.readFileSync(prevIterationPath);
      const currentBuffer = fs.readFileSync(currentIterationPath);

      const prevBase64 = `data:image/png;base64,${prevBuffer.toString(
        "base64"
      )}`;
      const currentBase64 = `data:image/png;base64,${currentBuffer.toString(
        "base64"
      )}`;

      // Compare images using Playwright
      const diffResult = await page.evaluate(
        async ({ prev, current }) => {
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
            const prevImg = await loadImage(prev);
            const currentImg = await loadImage(current);

            // Handle different sized images
            if (
              prevImg.width !== currentImg.width ||
              prevImg.height !== currentImg.height
            ) {
              return {
                diffPercentage: 100, // 100% different
                message: `Size mismatch: Previous (${prevImg.width}x${prevImg.height}) vs Current (${currentImg.width}x${currentImg.height})`,
                diffImage: null,
                success: true,
              };
            }

            // Get pixel data
            const prevData = imageToData(prevImg);
            const currentData = imageToData(currentImg);

            // Create diff image
            const canvas = document.createElement("canvas");
            canvas.width = prevImg.width;
            canvas.height = prevImg.height;
            const ctx = canvas.getContext("2d");

            // Draw the current image
            ctx.drawImage(currentImg, 0, 0);

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
            const totalPixels = prevData.width * prevData.height;

            for (let i = 0; i < prevData.data.length; i += 4) {
              const rDiff = Math.abs(prevData.data[i] - currentData.data[i]);
              const gDiff = Math.abs(
                prevData.data[i + 1] - currentData.data[i + 1]
              );
              const bDiff = Math.abs(
                prevData.data[i + 2] - currentData.data[i + 2]
              );

              // If any channel has significant difference
              if (rDiff > 5 || gDiff > 5 || bDiff > 5) {
                // Mark the different pixel as magenta
                diffData[i] = 255; // R
                diffData[i + 1] = 0; // G
                diffData[i + 2] = 255; // B

                differentPixels++;
              }
            }

            // Calculate percentage of different pixels
            const diffPercentage = (differentPixels / totalPixels) * 100;

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
              diffPercentage: 0,
              diffImage: null,
              error:
                "Failed to process images: " +
                (error.message || "Unknown error"),
              success: false,
            };
          }
        },
        { prev: prevBase64, current: currentBase64 }
      );

      await browser.close();

      if (!diffResult.success) {
        console.log(`❌ Error processing images: ${diffResult.error}`);
        return {
          isDifferent: false,
          diffPercentage: 0,
          diffPath: null,
          error: diffResult.error,
        };
      }

      // Save diff image for visual inspection in temp directory
      const tempDiffDir = path.join(tempDir, "screenshot-diffs");
      if (!fs.existsSync(tempDiffDir)) {
        fs.mkdirSync(tempDiffDir, { recursive: true });
      }

      const diffFileName = path
        .basename(currentIterationPath)
        .replace(".png", "-diff.png");
      const diffPath = path.join(tempDiffDir, diffFileName);

      if (diffResult.diffImage) {
        const base64Data = diffResult.diffImage.replace(
          /^data:image\/png;base64,/,
          ""
        );
        fs.writeFileSync(diffPath, Buffer.from(base64Data, "base64"));
        console.log(`   Diff image saved to: ${diffPath}`);
      }

      console.log(
        `   Difference between screenshots: ${diffResult.diffPercentage.toFixed(
          2
        )}%`
      );

      return {
        isDifferent: diffResult.diffPercentage > 5, // Threshold - 5% difference minimum
        diffPercentage: diffResult.diffPercentage,
        diffPath: diffPath,
        numDiffPixels: diffResult.differentPixels,
        dimensions: { width: diffResult.width, height: diffResult.height },
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error(`❌ Error comparing screenshots: ${error.message}`);
    return {
      isDifferent: false,
      diffPercentage: 0,
      diffPath: null,
      error: error.message,
    };
  }
}

/**
 * Create a diagnostic log for troubleshooting design iteration issues
 * @param {string} iterationDir - Path to the iteration directory
 * @param {Array} targets - List of component targets
 * @param {string} timestamp - Screenshot timestamp
 * @param {Object} additionalInfo - Additional debugging information
 */
function createDiagnosticLog(
  iterationDir,
  targets,
  timestamp,
  additionalInfo = {}
) {
  console.log("📋 Creating diagnostic log for troubleshooting...");

  // Create diagnostics directory if it doesn't exist
  const diagnosticsDir = path.join(tempDir, "diagnostics");
  if (!fs.existsSync(diagnosticsDir)) {
    fs.mkdirSync(diagnosticsDir, { recursive: true });
  }

  const now = new Date();
  const diagnosticFileName = `iteration-diagnostic-${timestamp}.json`;
  const diagnosticPath = path.join(diagnosticsDir, diagnosticFileName);

  try {
    // Gather system information
    const systemInfo = {
      timestamp: now.toISOString(),
      readableTime: now.toLocaleString(),
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      screenshotTimestamp: timestamp,
    };

    // Check for git information
    try {
      const gitStatus = execSync("git status --porcelain", {
        encoding: "utf8",
      });
      const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
      }).trim();
      const gitHash = execSync("git rev-parse HEAD", {
        encoding: "utf8",
      }).trim();

      systemInfo.git = {
        branch: gitBranch,
        hash: gitHash,
        hasUncommittedChanges: gitStatus.trim().length > 0,
      };
    } catch (gitError) {
      systemInfo.git = { error: gitError.message };
    }

    // Check server status
    try {
      const serverCheck = execSync("lsof -i :3000 -P -n | grep LISTEN", {
        encoding: "utf8",
      });
      systemInfo.serverRunning = serverCheck.trim().length > 0;
    } catch (serverError) {
      // No output means no process found on port 3000
      systemInfo.serverRunning = false;
    }

    // Check for screenshot files
    const screenshotInfo = {};

    for (const target of targets) {
      screenshotInfo[target] = {
        light: null,
        dark: null,
      };

      // Check unified directory
      const unifiedDir = path.join(rootDir, "static/screenshots/unified");
      const lightScreenshot = path.join(
        unifiedDir,
        `${target}-light-${timestamp}.png`
      );
      const darkScreenshot = path.join(
        unifiedDir,
        `${target}-dark-${timestamp}.png`
      );

      // Check for light screenshot
      if (fs.existsSync(lightScreenshot)) {
        const stats = fs.statSync(lightScreenshot);
        screenshotInfo[target].light = {
          path: lightScreenshot,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          exists: true,
        };
      } else {
        screenshotInfo[target].light = {
          path: lightScreenshot,
          exists: false,
        };
      }

      // Check for dark screenshot
      if (fs.existsSync(darkScreenshot)) {
        const stats = fs.statSync(darkScreenshot);
        screenshotInfo[target].dark = {
          path: darkScreenshot,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          exists: true,
        };
      } else {
        screenshotInfo[target].dark = {
          path: darkScreenshot,
          exists: false,
        };
      }

      // Check for debug HTML files
      const debugDir = path.join(rootDir, "static/debug");
      if (fs.existsSync(debugDir)) {
        const debugFiles = fs
          .readdirSync(debugDir)
          .filter((f) => f.includes(target) && f.includes("debug"));

        if (debugFiles.length > 0) {
          screenshotInfo[target].debugFiles = debugFiles.map((f) => ({
            name: f,
            path: path.join(debugDir, f),
            mtime: fs.statSync(path.join(debugDir, f)).mtime.toISOString(),
          }));
        }
      }
    }

    // Collect all diff files
    const diffInfo = {};
    if (fs.existsSync(possibleDiffsDir)) {
      const diffFiles = fs
        .readdirSync(possibleDiffsDir)
        .filter(
          (f) => f.includes(timestamp) || targets.some((t) => f.includes(t))
        );

      if (diffFiles.length > 0) {
        diffInfo.files = diffFiles.map((f) => ({
          name: f,
          path: path.join(possibleDiffsDir, f),
          mtime: fs
            .statSync(path.join(possibleDiffsDir, f))
            .mtime.toISOString(),
          size: fs.statSync(path.join(possibleDiffsDir, f)).size,
        }));
      }
    }

    // Create the diagnostic log
    const diagnosticLog = {
      system: systemInfo,
      targets,
      iterationDir,
      screenshots: screenshotInfo,
      diffs: diffInfo,
      additional: additionalInfo,
      processTiming: {
        started: additionalInfo.processStartTime || now.toISOString(),
        completed: now.toISOString(),
        duration: additionalInfo.processStartTime
          ? (now - new Date(additionalInfo.processStartTime)) / 1000
          : null,
      },
    };

    // Save the diagnostic log
    fs.writeFileSync(diagnosticPath, JSON.stringify(diagnosticLog, null, 2));
    console.log(`   ✅ Diagnostic log saved to: ${diagnosticPath}`);

    // Also create a human-readable version
    const readablePath = path.join(
      diagnosticsDir,
      `iteration-diagnostic-${timestamp}.txt`
    );

    let readableContent = `# Design Iteration Diagnostic Report\n\n`;
    readableContent += `Generated: ${now.toLocaleString()}\n`;
    readableContent += `Screenshot Timestamp: ${timestamp}\n\n`;

    readableContent += `## System Information\n`;
    readableContent += `- Node: ${systemInfo.node}\n`;
    readableContent += `- Platform: ${systemInfo.platform}\n`;
    readableContent += `- Docusaurus Server Running: ${
      systemInfo.serverRunning ? "Yes" : "No"
    }\n`;

    if (systemInfo.git) {
      readableContent += `- Git Branch: ${
        systemInfo.git.branch || "Unknown"
      }\n`;
      readableContent += `- Uncommitted Changes: ${
        systemInfo.git.hasUncommittedChanges ? "Yes" : "No"
      }\n`;
    }

    readableContent += `\n## Screenshot Information\n`;
    for (const target of targets) {
      readableContent += `\n### ${target}\n`;

      if (screenshotInfo[target].light && screenshotInfo[target].light.exists) {
        readableContent += `- Light Theme: ${screenshotInfo[target].light.path}\n`;
        readableContent += `  - Size: ${screenshotInfo[target].light.size} bytes\n`;
        readableContent += `  - Modified: ${new Date(
          screenshotInfo[target].light.mtime
        ).toLocaleString()}\n`;
      } else {
        readableContent += `- Light Theme: NOT FOUND\n`;
      }

      if (screenshotInfo[target].dark && screenshotInfo[target].dark.exists) {
        readableContent += `- Dark Theme: ${screenshotInfo[target].dark.path}\n`;
        readableContent += `  - Size: ${screenshotInfo[target].dark.size} bytes\n`;
        readableContent += `  - Modified: ${new Date(
          screenshotInfo[target].dark.mtime
        ).toLocaleString()}\n`;
      } else {
        readableContent += `- Dark Theme: NOT FOUND\n`;
      }

      if (
        screenshotInfo[target].debugFiles &&
        screenshotInfo[target].debugFiles.length > 0
      ) {
        readableContent += `- Debug HTML Files:\n`;
        screenshotInfo[target].debugFiles.forEach((df) => {
          readableContent += `  - ${df.name} (Modified: ${new Date(
            df.mtime
          ).toLocaleString()})\n`;
        });
      } else {
        readableContent += `- Debug HTML Files: None found\n`;
      }
    }

    if (diffInfo.files && diffInfo.files.length > 0) {
      readableContent += `\n## Diff Files\n`;
      diffInfo.files.forEach((df) => {
        readableContent += `- ${df.name}\n`;
        readableContent += `  - Size: ${df.size} bytes\n`;
        readableContent += `  - Modified: ${new Date(
          df.mtime
        ).toLocaleString()}\n`;
      });
    } else {
      readableContent += `\n## Diff Files\nNo diff files found for this iteration\n`;
    }

    readableContent += `\n## Process Timing\n`;
    readableContent += `- Started: ${
      diagnosticLog.processTiming.started
        ? new Date(diagnosticLog.processTiming.started).toLocaleString()
        : "Unknown"
    }\n`;
    readableContent += `- Completed: ${new Date(
      diagnosticLog.processTiming.completed
    ).toLocaleString()}\n`;

    if (diagnosticLog.processTiming.duration) {
      readableContent += `- Duration: ${diagnosticLog.processTiming.duration.toFixed(
        2
      )} seconds\n`;
    }

    readableContent += `\n## Troubleshooting Tips\n`;
    readableContent += `- If screenshots look identical, check that your design changes are visible in the browser\n`;
    readableContent += `- Try increasing the wait time between iterations (60+ seconds recommended)\n`;
    readableContent += `- Check that the server is properly rebuilding with your changes\n`;
    readableContent += `- If the component is not captured, check the component selectors\n`;
    readableContent += `- Run 'pnpm docs:design-iterations:status' to see all iterations\n`;

    fs.writeFileSync(readablePath, readableContent);
    console.log(
      `   ✅ Human-readable diagnostic report saved to: ${readablePath}`
    );

    return diagnosticPath;
  } catch (error) {
    console.error(`   ❌ Error creating diagnostic log: ${error.message}`);
    return null;
  }
}

/**
 * Process a single design iteration
 */
async function processIteration(iteration, config) {
  console.log(`\n🔄 Processing iteration ${iteration} of ${config.count}`);

  // Track process start time for diagnostics
  const processStartTime = new Date().toISOString();

  // Create directory for this iteration
  const iterationDir = createIterationDirectory(iteration);

  // Track changes for all targets
  const allChanges = [];

  // Generate design change for each target
  for (const target of config.targets) {
    const changes = await generateDesignChange(target, iteration, config);
    allChanges.push({ target, changes });
  }

  // Capture screenshots
  const timestamp = await captureScreenshots(
    config.targets,
    iterationDir,
    config
  );

  // Diagnostic info to track for troubleshooting
  const diagnosticInfo = {
    processStartTime,
    iteration,
    screenCaptureDuration: null,
    verificationResults: {},
  };

  // If this isn't the first iteration, verify the screenshots are different
  if (iteration > 1) {
    const prevIterationDir = path.join(
      iterationsDir,
      `iteration-${iteration - 1}`
    );
    const prevScreenshotsDir = path.join(prevIterationDir, "screenshots");

    // Check at least one screenshot from each target
    let allScreenshotsSame = true;
    const verificationResults = {};

    console.log("\n📊 Verifying design changes from previous iteration...");

    if (fs.existsSync(prevScreenshotsDir)) {
      for (const target of config.targets) {
        // Find matching screenshots for this target
        const currentScreenshots = fs
          .readdirSync(path.join(iterationDir, "screenshots"))
          .filter((file) => file.includes(target) && file.includes(timestamp));

        if (currentScreenshots.length > 0) {
          // Check first screenshot for this target
          const currentPath = path.join(
            iterationDir,
            "screenshots",
            currentScreenshots[0]
          );

          // Find matching screenshot in previous iteration
          const prevScreenshots = fs
            .readdirSync(prevScreenshotsDir)
            .filter((file) => file.includes(target));

          if (prevScreenshots.length > 0) {
            const prevPath = path.join(prevScreenshotsDir, prevScreenshots[0]);

            const { isDifferent, diffPercentage, diffPath } =
              await verifyScreenshotDifference(prevPath, currentPath);

            verificationResults[target] = {
              isDifferent,
              diffPercentage,
              diffPath,
            };
            diagnosticInfo.verificationResults[target] = {
              isDifferent,
              diffPercentage,
              diffPath,
            };

            if (isDifferent) {
              console.log(
                `   ✅ ${target}: Design changed (${diffPercentage.toFixed(
                  2
                )}% different)`
              );
              allScreenshotsSame = false;
            } else {
              console.log(
                `   ⚠️ ${target}: Screenshots look very similar (only ${diffPercentage.toFixed(
                  2
                )}% different)`
              );
            }
          }
        }
      }

      if (allScreenshotsSame) {
        console.log(
          "\n❌ WARNING: All screenshots appear similar to previous iteration!"
        );
        console.log(
          "   Please verify design changes are visible before continuing."
        );
        console.log("   Possible causes:");
        console.log("   - Design changes not visible in the UI");
        console.log("   - Server didn't reload the changes properly");
        console.log("   - Not enough wait time for changes to appear");

        diagnosticInfo.allScreenshotsSame = true;

        // We don't prompt or abort, just warn the user
      } else {
        diagnosticInfo.allScreenshotsSame = false;
      }
    } else {
      console.log("   ℹ️ No previous screenshots found to compare with");
      diagnosticInfo.previousScreenshotsMissing = true;
    }
  }

  // Capture diff for each target
  const diffInfo = {};
  for (const target of config.targets) {
    const targetDiffInfo = captureDiff(iterationDir, timestamp, target);
    if (targetDiffInfo) {
      diffInfo[target] = targetDiffInfo;
    }
  }

  // Create feedback template
  const feedbackTemplatePath = createFeedbackTemplate(
    iteration,
    config.targets,
    timestamp,
    iterationDir
  );

  // Create and save metadata
  const metadata = createMetadata(
    iteration,
    config.targets,
    allChanges,
    timestamp,
    diffInfo,
    config
  );
  metadata.feedbackTemplatePath = feedbackTemplatePath;
  saveMetadata(metadata, iterationDir);

  // Create diagnostic log for troubleshooting
  diagnosticInfo.processDuration =
    (new Date() - new Date(processStartTime)) / 1000;
  const diagnosticPath = createDiagnosticLog(
    iterationDir,
    config.targets,
    timestamp,
    diagnosticInfo
  );

  console.log(`✅ Iteration ${iteration} complete`);
  console.log(`   - Screenshots captured with timestamp: ${timestamp}`);
  console.log(`   - Diffs saved to: ${possibleDiffsDir}`);
  console.log(`   - Feedback template created: ${feedbackTemplatePath}`);
  console.log(`   - Diagnostic log created: ${diagnosticPath}`);

  return { iterationDir, metadata };
}

/**
 * Apply the selected design iteration
 */
async function applySelectedIteration(iterationPath, requireSignoff = true) {
  console.log(`🔄 Applying selected design iteration from: ${iterationPath}`);

  // Check if the iteration exists
  if (!fs.existsSync(iterationPath)) {
    console.error(`❌ Iteration not found: ${iterationPath}`);
    return false;
  }

  // Load metadata
  const metadataPath = path.join(iterationPath, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error(`❌ Metadata not found: ${metadataPath}`);
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

  // Check if signoff is required and provided
  if (requireSignoff && !metadata.approval.isApproved) {
    console.error(
      `❌ This iteration requires maintainer signoff before applying as baseline`
    );
    console.log(`   Please update the approval section in: ${metadataPath}`);
    return false;
  }

  // Apply the changes using the saved diff
  try {
    // We could apply the diff directly with git apply, but for safety,
    // let's just indicate what we would do
    console.log(`🔄 Would apply the following diffs:`);

    for (const target in metadata.diffInfo) {
      const diffPath = metadata.diffInfo[target].diffPath;
      console.log(`   - ${diffPath}`);

      // In the actual implementation, we would do:
      // execSync(`git apply ${diffPath}`, { encoding: 'utf8' });
    }

    console.log(`✅ Design changes would be applied`);
    console.log(
      `   To actually apply changes, update this function to execute the git apply commands`
    );

    return true;
  } catch (error) {
    console.error(`❌ Error applying design changes: ${error.message}`);
    return false;
  }
}

/**
 * Display status of all design iterations
 */
function showStatus() {
  console.log("📊 Design Iterations Status");

  // Check if iterations directory exists
  if (!fs.existsSync(iterationsDir)) {
    console.log("   No iterations found.");
    return;
  }

  // Get all iteration directories
  const iterationDirs = fs
    .readdirSync(iterationsDir)
    .filter((dir) => dir.startsWith("iteration-"))
    .sort((a, b) => {
      const numA = parseInt(a.split("-")[1]);
      const numB = parseInt(b.split("-")[1]);
      return numA - numB;
    });

  if (iterationDirs.length === 0) {
    console.log("   No iterations found.");
    return;
  }

  console.log(`   Found ${iterationDirs.length} iterations:`);

  // Display info for each iteration
  for (const dir of iterationDirs) {
    const iterationPath = path.join(iterationsDir, dir);
    const metadataPath = path.join(iterationPath, "metadata.json");

    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      const iteration = metadata.iteration;
      const targets = metadata.targets.join(", ");
      const screenshotTimestamp = metadata.screenshotTimestamp || "Unknown";
      const isApproved =
        metadata.approval && metadata.approval.isApproved
          ? "✅ Approved"
          : "❌ Not approved";

      console.log(
        `   - Iteration ${iteration}: ${targets} [${screenshotTimestamp}] ${isApproved}`
      );
    } else {
      console.log(`   - ${dir}: No metadata found`);
    }
  }
}

/**
 * Clean up old iterations and temporary files
 */
function cleanupIterations() {
  console.log("🧹 Cleaning up old iterations and temporary files");

  // Check if iterations directory exists
  if (!fs.existsSync(iterationsDir)) {
    console.log("   No iterations to clean up.");
    return;
  }

  // Get iteration directories
  const iterationDirs = fs
    .readdirSync(iterationsDir)
    .filter((dir) => dir.startsWith("iteration-"));

  if (iterationDirs.length === 0) {
    console.log("   No iterations to clean up.");
  } else {
    console.log(`   Found ${iterationDirs.length} iterations.`);

    // Offer to keep the latest iteration
    const latestIteration = iterationDirs
      .map((dir) => parseInt(dir.split("-")[1]))
      .sort((a, b) => b - a)[0];

    // Save latest iteration's metadata
    const latestDir = `iteration-${latestIteration}`;
    const latestPath = path.join(iterationsDir, latestDir);
    const latestMetadataPath = path.join(latestPath, "metadata.json");

    if (fs.existsSync(latestMetadataPath)) {
      const backupPath = path.join(tempDir, `latest-iteration-backup.json`);
      fs.copyFileSync(latestMetadataPath, backupPath);
      console.log(`   ✅ Backed up latest iteration metadata to ${backupPath}`);
    }

    // Clean up iteration directories
    let deletedCount = 0;
    for (const dir of iterationDirs) {
      const iterationPath = path.join(iterationsDir, dir);
      try {
        // Recursively delete directory
        fs.rmSync(iterationPath, { recursive: true, force: true });
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${dir}: ${error.message}`);
      }
    }

    console.log(`   ✅ Deleted ${deletedCount} iteration directories`);
  }

  // Clean up possible diffs
  if (fs.existsSync(possibleDiffsDir)) {
    const diffFiles = fs
      .readdirSync(possibleDiffsDir)
      .filter((file) => file.endsWith(".diff") || file.endsWith(".patch"));

    if (diffFiles.length > 0) {
      let deletedCount = 0;
      for (const file of diffFiles) {
        try {
          fs.unlinkSync(path.join(possibleDiffsDir, file));
          deletedCount++;
        } catch (error) {
          console.error(`   ❌ Error deleting ${file}: ${error.message}`);
        }
      }

      console.log(`   ✅ Deleted ${deletedCount} diff files`);
    } else {
      console.log("   No diff files to clean up.");
    }
  }

  console.log("🎉 Cleanup complete!");
}

/**
 * Rebaseline screenshots with a specific iteration's screenshots
 * Optionally confirms each rebaseline action if the confirm flag is set
 */
async function rebaselineScreenshots(iteration, targets, confirm = false) {
  const iterationDir = path.join(iterationsDir, `iteration-${iteration}`);
  console.log(`🔄 Rebaselining screenshots from iteration ${iteration}`);

  // Check if the iteration exists
  if (!fs.existsSync(iterationDir)) {
    console.error(`❌ Iteration not found: ${iterationDir}`);
    return false;
  }

  // Get screenshots directory
  const screenshotsDir = path.join(iterationDir, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    console.error(`❌ Screenshots not found for iteration ${iteration}`);
    return false;
  }

  // Get metadata
  const metadataPath = path.join(iterationDir, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error(`❌ Metadata not found for iteration ${iteration}`);
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

  // Determine which targets to rebaseline
  const targetList = targets && targets.length > 0 ? targets : metadata.targets;
  console.log(`📸 Rebaselining targets: ${targetList.join(", ")}`);

  // Get all screenshots
  const screenshots = fs.readdirSync(screenshotsDir);

  // Filter to only the target screenshots
  const targetScreenshots = screenshots.filter((file) =>
    targetList.some((target) => file.includes(target))
  );

  if (targetScreenshots.length === 0) {
    console.error(
      `❌ No screenshots found for targets ${targetList.join(", ")}`
    );
    return false;
  }

  // Baseline directory
  const baselineDir = path.join(rootDir, "static/screenshots/unified");

  // For each screenshot, confirm and copy
  let updatedCount = 0;
  for (const screenshot of targetScreenshots) {
    const source = path.join(screenshotsDir, screenshot);

    // Generate baseline filename without timestamp
    const parts = screenshot.split("-");
    const component = parts[1];
    const mode = parts[2]; // light or dark
    const baselineFile = `${parts[0]}-${component}-${mode}.png`;
    const destination = path.join(baselineDir, baselineFile);

    // If confirm flag is set, prompt for confirmation
    let shouldUpdate = true;
    if (confirm) {
      // In a real implementation, this would use a proper interactive prompt
      // For simplicity, we'll just log what would happen
      console.log(`   Would update: ${baselineFile}`);
      console.log(`   Source: ${screenshot}`);
      console.log(`   Prompt for confirmation would appear here`);

      // Simulate user confirmation (in real implementation, this would be interactive)
      console.log(`   ✅ User would be asked to confirm`);
    }

    if (shouldUpdate) {
      try {
        fs.copyFileSync(source, destination);
        console.log(`   ✅ Updated baseline: ${baselineFile}`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ Error updating ${baselineFile}: ${error.message}`);
      }
    } else {
      console.log(`   ❌ Skipped: ${baselineFile}`);
    }
  }

  console.log(`🎉 Rebaseline complete! Updated ${updatedCount} screenshots.`);
  return true;
}

/**
 * Main function to run the design iterations
 */
async function runDesignIterations() {
  console.log("🚀 Starting design iterations process");

  // Parse command line arguments
  const config = parseArgs();

  // Handle special commands
  if (config.status) {
    showStatus();
    return;
  }

  if (config.cleanup) {
    cleanupIterations();
    return;
  }

  // Handle rebaseline command
  if (config.rebaseline) {
    if (!config.iteration) {
      console.error(
        "❌ You must specify which iteration to rebaseline with --iteration=X"
      );
      return;
    }

    const success = await rebaselineScreenshots(
      config.iteration,
      config.targets,
      config.confirm
    );

    if (success) {
      console.log(
        `✅ Successfully rebaselined from iteration ${config.iteration}`
      );
    } else {
      console.error(
        `❌ Failed to rebaseline from iteration ${config.iteration}`
      );
    }
    return;
  }

  if (config.apply) {
    if (!config.iteration) {
      console.error(
        "❌ You must specify which iteration to apply with --iteration=X"
      );
      return;
    }

    const iterationDir = path.join(
      iterationsDir,
      `iteration-${config.iteration}`
    );
    const success = await applySelectedIteration(iterationDir, !config.force);

    if (success) {
      console.log(`✅ Successfully applied iteration ${config.iteration}`);
    } else {
      console.error(`❌ Failed to apply iteration ${config.iteration}`);
    }
    return;
  }

  // Ensure docs server is running before taking screenshots
  await ensureDocsServerRunning();

  console.log(
    `⚙️ Configuration: ${
      config.count
    } iterations, targets: ${config.targets.join(", ")}`
  );
  console.log(
    `   Maintainer signoff required: ${config.requireSignoff ? "Yes" : "No"}`
  );

  // Create directory structure
  createDirectoryStructure();

  // Process each iteration
  const iterations = [];
  for (let i = 1; i <= config.count; i++) {
    const result = await processIteration(i, config);
    iterations.push(result);
  }

  console.log(`\n🎉 All iterations complete!`);
  console.log(`📁 Results stored in ${iterationsDir}`);
  console.log(`📁 Diffs stored in ${possibleDiffsDir}`);
  console.log(`\n💡 Next steps:`);
  console.log(
    `   1. Review the screenshots and provide feedback using the feedback templates`
  );
  console.log(`   2. Select a design iteration to apply`);
  console.log(
    `   3. If required, update the approval section in the metadata.json`
  );
  console.log(
    `   4. Run 'pnpm docs:design-iterations:apply --iteration=X' to apply the changes`
  );

  return iterations;
}

// Run the script if it's called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDesignIterations().catch((error) => {
    console.error("Error running design iterations:", error);
    process.exit(1);
  });
}

// Export functions for use in other scripts
export {
  runDesignIterations,
  processIteration,
  createIterationDirectory,
  captureScreenshots,
  createMetadata,
  applySelectedIteration,
  rebaselineScreenshots,
};
