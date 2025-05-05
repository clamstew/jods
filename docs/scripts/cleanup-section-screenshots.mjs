// Cleanup section screenshots script
// Keeps only the most recent screenshots for each section and theme
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsBaseDir = path.join(__dirname, "../static/screenshots");
const dirsToClean = [
  path.join(screenshotsBaseDir, "sections"),
  path.join(screenshotsBaseDir, "remix"),
];

// Parse command line arguments
const args = process.argv.slice(2);
const keepCount = args.includes("--keep")
  ? parseInt(args[args.indexOf("--keep") + 1]) || 1
  : 1; // Default to keeping just the most recent
const dryRun = args.includes("--dry-run");

console.log(
  `Cleaning up screenshots, keeping ${keepCount} most recent per section/theme...${
    dryRun ? " (DRY RUN)" : ""
  }`
);

let totalDeletedCount = 0;

// Process each directory
dirsToClean.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist. Skipping.`);
    return;
  }

  console.log(`\nProcessing directory: ${dir}`);

  // Get all PNG files in the directory
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(".png"));

  console.log(`Found ${files.length} PNG files`);

  // Group files by section and theme
  const groupedFiles = {};

  files.forEach((file) => {
    // Check if this is a timestamped file or a baseline file
    const isTimestamped = /\d{8}-\d{6}\.png$/i.test(file);

    if (!isTimestamped) {
      // This is likely a baseline file (no timestamp), skip it
      console.log(`Skipping baseline file: ${file}`);
      return;
    }

    // Extract the timestamp (last part before extension)
    const match = file.match(/(.+)-(\w+)-(\d{8}-\d{6})\.png$/i);

    if (!match) {
      console.log(`Couldn't parse filename pattern for: ${file}, skipping`);
      return;
    }

    const [, section, theme, timestamp] = match;

    const key = `${section}-${theme}`;
    if (!groupedFiles[key]) {
      groupedFiles[key] = [];
    }

    groupedFiles[key].push({
      filename: file,
      timestamp: timestamp,
      fullPath: path.join(dir, file),
    });
  });

  // For each section+theme group, sort by timestamp and keep only the most recent
  let dirDeletedCount = 0;

  Object.keys(groupedFiles).forEach((key) => {
    const group = groupedFiles[key];

    if (group.length <= keepCount) {
      console.log(`Group ${key} has ${group.length} files, no cleanup needed`);
      return;
    }

    // Sort by timestamp (newest first)
    group.sort((a, b) => {
      // Compare timestamps (YYYYMMDD-HHMMSS format)
      return b.timestamp.localeCompare(a.timestamp);
    });

    console.log(`Group ${key}: keeping ${keepCount} of ${group.length} files`);

    // Keep the most recent specified number, delete the rest
    const filesToDelete = group.slice(keepCount);

    filesToDelete.forEach((file) => {
      try {
        if (!dryRun) {
          fs.unlinkSync(file.fullPath);
        }
        console.log(`${dryRun ? "Would delete" : "Deleted"}: ${file.filename}`);
        dirDeletedCount++;
      } catch (err) {
        console.error(`Error deleting ${file.filename}:`, err);
      }
    });
  });

  console.log(
    `Directory cleanup complete. ${
      dryRun ? "Would have deleted" : "Deleted"
    } ${dirDeletedCount} old screenshots in ${path.basename(dir)}.`
  );

  totalDeletedCount += dirDeletedCount;
});

console.log(
  `\nOverall cleanup complete. ${
    dryRun ? "Would have deleted" : "Deleted"
  } ${totalDeletedCount} old screenshots.`
);

// Add help on how to use the script
if (totalDeletedCount === 0) {
  console.log("\nTips:");
  console.log(
    "  - Use --keep <number> to specify how many recent files to keep per group"
  );
  console.log(
    "  - Use --dry-run to see what would be deleted without actually deleting"
  );
  console.log(
    "  - Example: node scripts/cleanup-section-screenshots.mjs --keep 2 --dry-run"
  );
}
