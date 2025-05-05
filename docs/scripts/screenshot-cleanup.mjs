import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "../static/screenshots/unified");

// Parameters
const keepLatest = process.argv.includes("--keep-latest")
  ? parseInt(
      process.argv.find((arg) => arg.startsWith("--keep="))?.split("=")[1] ||
        "1"
    )
  : 1;
const dryRun = process.argv.includes("--dry-run");

console.log(`🧹 Screenshot Cleanup Tool`);
console.log(`📂 Directory: ${screenshotsDir}`);
console.log(
  `⚙️ Mode: ${
    dryRun ? "Dry run (no files will be deleted)" : "Actual deletion"
  }`
);
console.log(
  `🔢 Keeping ${keepLatest} most recent batch(es) of timestamped screenshots`
);

// Get all files in the directory
const files = fs.readdirSync(screenshotsDir);

// Separate files into timestamped and baseline
const timestampedFiles = [];
const baselineFiles = [];

files.forEach((file) => {
  // The pattern is component-theme-YYYYMMDD-HHMMSS.png
  // If it doesn't match this timestamp pattern, it's a baseline file
  if (/-\d{8}-\d{6}\.png$/.test(file)) {
    timestampedFiles.push(file);
  } else {
    baselineFiles.push(file);
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
        const match = file.match(/-(\d{8}-\d{6})\.png$/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
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
  const match = file.match(/-(\d{8}-\d{6})\.png$/);
  const timestamp = match ? match[1] : null;
  return timestamp && !timestampsToKeep.includes(timestamp);
});

console.log(
  `🗑️ Deleting ${filesToDelete.length} screenshots from older batches`
);

// Delete files or just print in dry run mode
if (filesToDelete.length > 0) {
  if (dryRun) {
    console.log("\nFiles that would be deleted:");
    filesToDelete.slice(0, 10).forEach((file) => console.log(`- ${file}`));
    if (filesToDelete.length > 10) {
      console.log(`... and ${filesToDelete.length - 10} more`);
    }
  } else {
    let deletedCount = 0;
    filesToDelete.forEach((file) => {
      try {
        fs.unlinkSync(path.join(screenshotsDir, file));
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting ${file}: ${err.message}`);
      }
    });
    console.log(
      `\n✅ Successfully deleted ${deletedCount} out of ${filesToDelete.length} files`
    );
  }
} else {
  console.log("\n✅ No files need to be deleted");
}

// Summary of what's left
if (!dryRun) {
  const remainingFiles = fs.readdirSync(screenshotsDir);
  console.log(`\n📊 Directory now contains ${remainingFiles.length} files`);
  console.log(
    `   - ${
      remainingFiles.filter((f) => !/-\d{8}-\d{6}\.png$/.test(f)).length
    } baseline screenshots`
  );
  console.log(
    `   - ${
      remainingFiles.filter((f) => /-\d{8}-\d{6}\.png$/.test(f)).length
    } timestamped screenshots`
  );
}

console.log("\n🎉 Cleanup complete!");
