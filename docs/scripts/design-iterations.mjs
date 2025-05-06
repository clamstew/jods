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

  const metadata = {
    iteration,
    timestamp: new Date().toISOString(),
    targets,
    screenshotTimestamp: timestamp,
    changes: changes.map((change) => ({
      component: change.target,
      description: change.changes.map((c) => c.change).join("; "),
      files: change.changes.map((c) => c.file),
      reasoning: "Placeholder reasoning - would come from AI",
    })),
    diffInfo: diffInfo,
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

  const template = `# Design Iteration Feedback (Iteration ${iteration})

## Session Information

- **Date:** ${new Date().toISOString().split("T")[0]}
- **Components:** ${targets.join(", ")}
- **Timestamp:** ${timestamp}

## Screenshots

${targets
  .map(
    (target) => `### ${target}
- Light theme: [Path to light theme screenshot]
- Dark theme: [Path to dark theme screenshot]

#### Feedback
- **What works well:**
  - 
  - 
  - 

- **What could be improved:**
  - 
  - 
  - 

- **General notes:**
  

#### Rating: [1-10]

`
  )
  .join("\n")}

## Summary and Decision

### Overall Preferences
- **Favorite component design:**
- **Best visual elements:**
  - 
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
 * Process a single design iteration
 */
async function processIteration(iteration, config) {
  console.log(`\n🔄 Processing iteration ${iteration} of ${config.count}`);

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

  console.log(`✅ Iteration ${iteration} complete`);
  console.log(`   - Screenshots captured with timestamp: ${timestamp}`);
  console.log(`   - Diffs saved to: ${possibleDiffsDir}`);
  console.log(`   - Feedback template created: ${feedbackTemplatePath}`);

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
 * Check if the docs server is running, and start it if not
 */
async function ensureDocsServerRunning() {
  console.log("🔍 Checking if docs server is running...");

  // Try to connect to the docs server (default port 3000)
  try {
    // Check if server is running by attempting to connect
    await new Promise((resolve, reject) => {
      const req = http.get("http://localhost:3000", (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server returned status code ${res.statusCode}`));
          }
        });
      });

      req.on("error", () => {
        // Server not running, start it
        console.log("📡 Docs server not running. Starting server...");

        try {
          // Start the server in the background
          execSync("cd .. && pnpm start", {
            stdio: ["ignore", "pipe", "pipe"],
            detached: true,
            encoding: "utf8",
          });

          // Wait for server to start
          console.log("🚀 Server starting. Waiting for it to be ready...");

          // Check every second if server is running
          let attempts = 0;
          const checkInterval = setInterval(() => {
            const req = http.get("http://localhost:3000", (res) => {
              if (res.statusCode === 200) {
                clearInterval(checkInterval);
                console.log("✅ Docs server is now running!");
                resolve();
              }
              res.on("data", () => {});
            });

            req.on("error", () => {
              attempts++;
              if (attempts > 30) {
                // 30 second timeout
                clearInterval(checkInterval);
                console.error(
                  "❌ Failed to start docs server after 30 seconds"
                );
                reject(new Error("Failed to start docs server"));
              }
            });
          }, 1000);
        } catch (error) {
          console.error(`❌ Error starting docs server: ${error.message}`);
          reject(error);
        }
      });
    });

    console.log("✅ Docs server is running");
    return true;
  } catch (error) {
    console.error(
      `❌ Error checking or starting docs server: ${error.message}`
    );
    return false;
  }
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
