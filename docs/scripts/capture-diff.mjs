#!/usr/bin/env node

/**
 * Capture Diff Script
 *
 * A simple utility to capture the current Git diff and save it to the temp/possible-diffs directory.
 * This is particularly useful for saving the exact implementation details of design iterations
 * right after taking screenshots.
 *
 * Usage:
 *   node capture-diff.mjs --name="iteration-1-remix-section"
 *
 * If no name is provided, the current timestamp will be used.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import minimist from "minimist";

// Get directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const tempDir = path.join(rootDir, "temp");
const possibleDiffsDir = path.join(tempDir, "possible-diffs");

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const diffName =
  args.name || `diff-${new Date().toISOString().replace(/[:.]/g, "-")}`;

// Create directory structure if it doesn't exist
function ensureDirectoryExists() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  if (!fs.existsSync(possibleDiffsDir)) {
    fs.mkdirSync(possibleDiffsDir, { recursive: true });
  }
}

// Capture the current Git diff
function captureDiff() {
  try {
    console.log("📸 Capturing current Git diff...");

    // Execute git diff command
    const diff = execSync("git diff", { encoding: "utf8" });

    // If no changes, try including staged changes
    if (!diff.trim()) {
      console.log("  No unstaged changes found, checking staged changes...");
      const stagedDiff = execSync("git diff --staged", { encoding: "utf8" });

      if (!stagedDiff.trim()) {
        console.log("  No changes found to capture.");
        return null;
      }

      return stagedDiff;
    }

    return diff;
  } catch (error) {
    console.error(`❌ Error capturing Git diff: ${error.message}`);
    return null;
  }
}

// Save the diff to file
function saveDiff(diff, name) {
  if (!diff) return null;

  try {
    // Generate filename with .diff extension
    const filename = `${name}.diff`;
    const diffPath = path.join(possibleDiffsDir, filename);

    // Write diff to file
    fs.writeFileSync(diffPath, diff);

    console.log(`✅ Diff saved to: ${diffPath}`);
    console.log(`  File size: ${(diff.length / 1024).toFixed(2)} KB`);
    console.log(`  Changes: ${diff.split("\n").length} lines`);

    return diffPath;
  } catch (error) {
    console.error(`❌ Error saving diff: ${error.message}`);
    return null;
  }
}

// Main function
function main() {
  console.log(`🔄 Capturing diff with name: ${diffName}`);

  // Ensure directories exist
  ensureDirectoryExists();

  // Capture current diff
  const diff = captureDiff();

  if (diff) {
    // Save diff to file
    const diffPath = saveDiff(diff, diffName);

    if (diffPath) {
      console.log("\n💡 You can apply this diff later with:");
      console.log(`  git apply ${diffPath}`);
    }
  } else {
    console.log("❌ No changes to capture.");
    process.exit(1);
  }
}

// Run the script
main();
