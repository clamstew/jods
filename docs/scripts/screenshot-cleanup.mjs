import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Delete old non-numbered baseline files
 * @param {string} directory - The directory containing screenshots
 * @param {boolean} dryRun - Whether to just simulate the deletion
 * @returns {number} Number of deleted files
 */
async function cleanupOldBaselineFiles(directory, dryRun = false) {
  console.log("\n🧹 Cleaning up old non-numbered baseline files");

  // Get all files in the directory
  const files = fs.readdirSync(directory);

  // Filter for baseline files without numeric prefixes (old format)
  const oldBaselineFiles = files.filter((file) => {
    // Match all old format files:
    // - hero-section-light.png
    // - framework-section-react-light.png
    // But not:
    // - 01-hero-section-light.png
    return (
      file.match(/^[a-z-]+-(?:light|dark)\.png$/) &&
      !file.match(/^\d+-[a-z-]+-(?:light|dark)\.png$/)
    );
  });

  console.log(
    `🔍 Found ${oldBaselineFiles.length} old baseline files without numeric prefixes`
  );

  if (oldBaselineFiles.length === 0) {
    return 0;
  }

  // Delete each old baseline file
  let deleted = 0;
  for (const file of oldBaselineFiles) {
    const filePath = path.join(directory, file);
    try {
      if (!dryRun) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted old baseline file: ${file}`);
        deleted++;
      } else {
        console.log(`🗑️  Would delete old baseline file: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting ${file}: ${error.message}`);
    }
  }

  console.log(
    `\n✅ ${
      dryRun ? "Would delete" : "Deleted"
    } ${deleted} old non-numbered baseline files`
  );
  return deleted;
}

/**
 * Main cleanup function
 * @param {string} directory - The directory containing screenshots
 * @param {number} keepLatest - Number of latest timestamped batches to keep
 * @param {boolean} dryRun - Whether to just simulate the deletion
 */
async function cleanup(directory, keepLatest = 1, dryRun = false) {
  console.log("🧹 Screenshot Cleanup Tool");
  console.log(`📂 Directory: ${directory}`);
  console.log(
    `⚙️ Mode: ${dryRun ? "Dry run (no deletion)" : "Actual deletion"}`
  );
  console.log(
    `🔢 Keeping ${keepLatest} most recent batch(es) of timestamped screenshots`
  );

  // Get all files in the directory
  const files = fs.readdirSync(directory);

  // Separate files into timestamped and baseline
  const timestampedFiles = [];
  const baselineFiles = [];

  files.forEach((file) => {
    // Check if the file matches the timestamp pattern "component-theme-YYYYMMDD-HHMMSS.png"
    const match = file.match(/^.*-(\d{8}-\d{6})\.png$/);
    // If it doesn't match this timestamp pattern, it's a baseline file
    if (!match) {
      baselineFiles.push(file);
    } else {
      timestampedFiles.push(file);
    }
  });

  console.log(
    `📊 Found ${timestampedFiles.length} timestamped screenshots and ${baselineFiles.length} baseline screenshots`
  );

  // Extract unique timestamps
  const timestamps = [
    ...new Set(
      timestampedFiles
        .map((file) => {
          const match = file.match(/^.*-(\d{8}-\d{6})\.png$/);
          return match ? match[1] : null;
        })
        .filter((timestamp) => timestamp !== null)
    ),
  ]
    .sort()
    .reverse(); // Sort timestamps in descending order

  console.log(
    `🕒 Found ${timestamps.length} unique timestamp batches: ${timestamps
      .slice(0, 3)
      .join(", ")}${timestamps.length > 3 ? ", ..." : ""}`
  );

  // Determine which timestamps to keep
  const timestampsToKeep = timestamps.slice(0, keepLatest);
  console.log(`✅ Keeping batches: ${timestampsToKeep.join(", ")}`);

  // Files to delete (timestamped files not in the keep list)
  const filesToDelete = timestampedFiles.filter((file) => {
    const match = file.match(/^.*-(\d{8}-\d{6})\.png$/);
    const timestamp = match ? match[1] : null;
    return timestamp && !timestampsToKeep.includes(timestamp);
  });

  console.log(
    `🗑️ Deleting ${filesToDelete.length} screenshots from older batches\n`
  );

  if (filesToDelete.length === 0) {
    console.log("✅ No timestamped files need to be deleted");
  } else {
    // Delete each file
    let deletedCount = 0;
    for (const file of filesToDelete) {
      const filePath = path.join(directory, file);
      try {
        if (!dryRun) {
          fs.unlinkSync(filePath);
          console.log(`  Deleted: ${file}`);
          deletedCount++;
        } else {
          console.log(`  Would delete: ${file}`);
        }
      } catch (error) {
        console.error(`  Error deleting ${file}: ${error.message}`);
      }
    }

    if (!dryRun) {
      console.log(`  Successfully deleted ${deletedCount} timestamped files`);
    }
  }

  // Also clean up old non-numbered baseline files
  await cleanupOldBaselineFiles(directory, dryRun);

  // Get final count
  const remainingFiles = fs.readdirSync(directory);
  const numBaselineFiles = remainingFiles.filter(
    (file) => !file.match(/^.*-\d{8}-\d{6}\.png$/) && file.endsWith(".png")
  ).length;
  const numTimestampedFiles = remainingFiles.filter((file) =>
    file.match(/^.*-\d{8}-\d{6}\.png$/)
  ).length;

  console.log(
    `\n📊 Directory now contains ${
      numBaselineFiles + numTimestampedFiles
    } files`
  );
  console.log(`   - ${numBaselineFiles} baseline screenshots`);
  console.log(
    `   - ${numTimestampedFiles} timestamped screenshots${
      dryRun ? " (dry run)" : ""
    }`
  );

  console.log("\n🎉 Cleanup complete!");
}

// Process command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  // Check for --keep-latest flag with a value
  const keepLatestIndex = args.indexOf("--keep-latest");
  const keepLatest =
    keepLatestIndex !== -1 && keepLatestIndex + 1 < args.length
      ? parseInt(args[keepLatestIndex + 1]) || 1
      : 1;

  // Check for --dry-run flag
  const dryRun = args.includes("--dry-run");

  return { keepLatest, dryRun };
}

// Get directory path
const screenshotsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../static/screenshots/unified"
);

// Run the script
const { keepLatest, dryRun } = parseArgs();
cleanup(screenshotsDir, keepLatest, dryRun).catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
