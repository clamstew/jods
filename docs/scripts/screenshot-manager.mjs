// Screenshot management utility for handling baseline screenshots and cleanup
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { takeComponentScreenshots } from "./screenshot-component.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fullPageScreenshotsDir = path.join(__dirname, "../static/screenshots");
const componentScreenshotsDir = path.join(
  __dirname,
  "../static/screenshots/components"
);

// Ensure directories exist
[fullPageScreenshotsDir, componentScreenshotsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Create baseline screenshots (without timestamps)
 * @param {boolean} components - Whether to create component baselines
 * @param {boolean} fullPages - Whether to create full page baselines
 */
async function createBaselines(components = true, fullPages = true) {
  console.log("Creating baseline screenshots...");

  if (components) {
    console.log("Creating component baselines...");
    await takeComponentScreenshots(null, true);
  }

  if (fullPages) {
    console.log("Creating full page baselines...");
    // Import dynamically to avoid circular dependencies
    const { default: childProcess } = await import("child_process");
    childProcess.execSync("node ./scripts/screenshot.mjs --baseline", {
      stdio: "inherit",
    });
  }

  console.log("Baseline screenshots created successfully!");
}

/**
 * Clean up timestamped screenshots
 * @param {boolean} components - Whether to clean component screenshots
 * @param {boolean} fullPages - Whether to clean full page screenshots
 * @param {number} keepLastN - How many timestamped batches to keep (default: 0 - remove all)
 */
function cleanupScreenshots(
  components = true,
  fullPages = true,
  keepLastN = 0
) {
  console.log("Cleaning up timestamped screenshots...");

  // Helper function to clean a directory
  const cleanDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;

    // Get all PNG files
    const files = fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".png"))
      .filter((file) => /\d{8}-\d{6}\.png$/.test(file)); // Contains timestamp

    if (files.length === 0) {
      console.log(`No timestamped screenshots found in ${dir}`);
      return;
    }

    // If keepLastN > 0, keep the most recent N batches
    if (keepLastN > 0) {
      // Extract unique timestamps
      const timestamps = [
        ...new Set(
          files
            .map((file) => {
              const match = file.match(/(\d{8}-\d{6})\.png$/);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        ),
      ];

      // Sort timestamps (newest first)
      timestamps.sort().reverse();

      // Keep only the most recent N batches
      const timestampsToKeep = timestamps.slice(0, keepLastN);

      // Delete files not in the most recent N batches
      files.forEach((file) => {
        if (!timestampsToKeep.some((ts) => file.includes(ts))) {
          fs.unlinkSync(path.join(dir, file));
          console.log(`Deleted: ${file}`);
        }
      });

      console.log(
        `Kept the ${keepLastN} most recent screenshot batches in ${dir}`
      );
    } else {
      // Delete all timestamped files
      files.forEach((file) => {
        fs.unlinkSync(path.join(dir, file));
        console.log(`Deleted: ${file}`);
      });
      console.log(`Deleted all timestamped screenshots in ${dir}`);
    }
  };

  if (components) {
    cleanDirectory(componentScreenshotsDir);
  }

  if (fullPages) {
    cleanDirectory(fullPageScreenshotsDir);
  }

  console.log("Cleanup completed successfully!");
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes("--create-baselines")) {
  const componentsOnly = args.includes("--components-only");
  const fullPagesOnly = args.includes("--full-pages-only");

  // Default to both if neither specified
  const doComponents = !fullPagesOnly || componentsOnly;
  const doFullPages = !componentsOnly || fullPagesOnly;

  createBaselines(doComponents, doFullPages);
} else if (args.includes("--cleanup")) {
  const componentsOnly = args.includes("--components-only");
  const fullPagesOnly = args.includes("--full-pages-only");

  // Get how many recent batches to keep
  const keepArg = args.find((arg) => arg.startsWith("--keep="));
  const keepLastN = keepArg ? parseInt(keepArg.split("=")[1], 10) : 0;

  // Default to both if neither specified
  const doComponents = !fullPagesOnly || componentsOnly;
  const doFullPages = !componentsOnly || fullPagesOnly;

  cleanupScreenshots(doComponents, doFullPages, keepLastN);
} else {
  console.log(`
Screenshot Manager Utility
--------------------------

Commands:
  --create-baselines    Create baseline screenshots (no timestamps)
  --cleanup             Remove timestamped screenshots
  
Options:
  --components-only     Only process component screenshots
  --full-pages-only     Only process full page screenshots
  --keep=N              When cleaning up, keep the N most recent batches
  
Examples:
  node screenshot-manager.mjs --create-baselines
  node screenshot-manager.mjs --cleanup --keep=3
  node screenshot-manager.mjs --cleanup --components-only
  `);
}

export { createBaselines, cleanupScreenshots };
