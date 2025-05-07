import { test, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";

// Mock the fs module
vi.mock("fs", () => ({
  readdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Mock path
vi.mock("path", () => ({
  join: (...args) => args.join("/"),
  dirname: vi.fn().mockReturnValue("/mocked/dirname"),
}));

// Mock url module
vi.mock("url", () => ({
  fileURLToPath: vi.fn().mockReturnValue("/mocked/file/path"),
}));

// Import fs after mocking
import fs from "fs";

// We'll create a local version of the main functions to test them directly
// since the module just runs the cleanup and doesn't export functions

/**
 * Delete old non-numbered baseline files (from screenshot-cleanup.mjs)
 */
async function cleanupOldBaselineFiles(directory, dryRun = false) {
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

  // Delete each old baseline file
  let deleted = 0;
  for (const file of oldBaselineFiles) {
    const filePath = path.join(directory, file);
    try {
      if (!dryRun) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch (error) {
      // Handle error
    }
  }

  return deleted;
}

/**
 * Main cleanup function (from screenshot-cleanup.mjs)
 */
async function cleanup(directory, keepLatest = 1, dryRun = false) {
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

  // Determine which timestamps to keep
  const timestampsToKeep = timestamps.slice(0, keepLatest);

  // Files to delete (timestamped files not in the keep list)
  const filesToDelete = timestampedFiles.filter((file) => {
    const match = file.match(/^.*-(\d{8}-\d{6})\.png$/);
    const timestamp = match ? match[1] : null;
    return timestamp && !timestampsToKeep.includes(timestamp);
  });

  // Delete each file
  let deletedCount = 0;
  for (const file of filesToDelete) {
    const filePath = path.join(directory, file);
    try {
      if (!dryRun) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    } catch (error) {
      // Handle error
    }
  }

  // Also clean up old non-numbered baseline files
  const oldBaselineDeleted = await cleanupOldBaselineFiles(directory, dryRun);

  return {
    timestampedDeleted: deletedCount,
    oldBaselineDeleted,
  };
}

// Tests
beforeEach(() => {
  // Clear all mock implementations before each test
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

test("cleanupOldBaselineFiles should identify and delete old baseline files", async () => {
  // Setup mock file list
  const mockFiles = [
    "hero-section-light.png", // Old format - should be deleted
    "hero-section-dark.png", // Old format - should be deleted
    "framework-section-react-light.png", // Old format - should be deleted
    "01-hero-section-light.png", // New format - should NOT be deleted
    "02-features-section-dark.png", // New format - should NOT be deleted
    "hero-section-light-20230101-123456.png", // Timestamped - should NOT be deleted
    "other-file.txt", // Not a PNG - should NOT be deleted
  ];

  fs.readdirSync.mockReturnValue(mockFiles);

  // Test with dry run first
  const dryRunDeleted = await cleanupOldBaselineFiles("/test/dir", true);
  expect(dryRunDeleted).toBe(0); // No actual deletions in dry run
  expect(fs.unlinkSync).not.toHaveBeenCalled();

  // Test with actual deletion
  const deleted = await cleanupOldBaselineFiles("/test/dir", false);
  expect(deleted).toBe(3); // 3 old format files should be deleted

  // Check that the right files were deleted
  expect(fs.unlinkSync).toHaveBeenCalledTimes(3);
  expect(fs.unlinkSync).toHaveBeenCalledWith(
    "/test/dir/hero-section-light.png"
  );
  expect(fs.unlinkSync).toHaveBeenCalledWith("/test/dir/hero-section-dark.png");
  expect(fs.unlinkSync).toHaveBeenCalledWith(
    "/test/dir/framework-section-react-light.png"
  );

  // Check that new format files were NOT deleted
  expect(fs.unlinkSync).not.toHaveBeenCalledWith(
    "/test/dir/01-hero-section-light.png"
  );
  expect(fs.unlinkSync).not.toHaveBeenCalledWith(
    "/test/dir/02-features-section-dark.png"
  );
});

test("cleanup should keep the latest n timestamp batches and delete the rest", async () => {
  // Setup mock file list with 3 timestamp batches
  const mockFiles = [
    // Newest timestamp batch (20230103)
    "hero-section-light-20230103-123456.png",
    "hero-section-dark-20230103-123456.png",

    // Middle timestamp batch (20230102)
    "hero-section-light-20230102-123456.png",
    "hero-section-dark-20230102-123456.png",

    // Oldest timestamp batch (20230101)
    "hero-section-light-20230101-123456.png",
    "hero-section-dark-20230101-123456.png",

    // Baseline files
    "01-hero-section-light.png",
    "01-hero-section-dark.png",

    // Old format baseline files
    "hero-section-light.png",
    "hero-section-dark.png",
  ];

  fs.readdirSync.mockReturnValue(mockFiles);

  // Test keeping only the latest 1 batch (default)
  const result1 = await cleanup("/test/dir");

  // Should delete 4 timestamped files (from batches 20230102 and 20230101)
  // and 2 old format baseline files
  expect(result1.timestampedDeleted).toBe(4);
  expect(result1.oldBaselineDeleted).toBe(2);

  // Reset mocks for next test
  vi.clearAllMocks();
  fs.readdirSync.mockReturnValue(mockFiles);

  // Test keeping latest 2 batches
  const result2 = await cleanup("/test/dir", 2);

  // Should delete 2 timestamped files (only from batch 20230101)
  // and 2 old format baseline files
  expect(result2.timestampedDeleted).toBe(2);
  expect(result2.oldBaselineDeleted).toBe(2);

  // Check that files from batches 20230103 and 20230102 were NOT deleted
  expect(fs.unlinkSync).not.toHaveBeenCalledWith(
    "/test/dir/hero-section-light-20230103-123456.png"
  );
  expect(fs.unlinkSync).not.toHaveBeenCalledWith(
    "/test/dir/hero-section-dark-20230103-123456.png"
  );
  expect(fs.unlinkSync).not.toHaveBeenCalledWith(
    "/test/dir/hero-section-light-20230102-123456.png"
  );
  expect(fs.unlinkSync).not.toHaveBeenCalledWith(
    "/test/dir/hero-section-dark-20230102-123456.png"
  );

  // Check that files from batch 20230101 WERE deleted
  expect(fs.unlinkSync).toHaveBeenCalledWith(
    "/test/dir/hero-section-light-20230101-123456.png"
  );
  expect(fs.unlinkSync).toHaveBeenCalledWith(
    "/test/dir/hero-section-dark-20230101-123456.png"
  );
});

test("cleanup should not delete any files in dry run mode", async () => {
  const mockFiles = [
    "hero-section-light-20230101-123456.png",
    "hero-section-dark-20230101-123456.png",
    "hero-section-light.png", // Old format
    "01-hero-section-light.png", // New format
  ];

  fs.readdirSync.mockReturnValue(mockFiles);

  const result = await cleanup("/test/dir", 0, true); // Keep 0 batches, but dry run

  // No files should be deleted in dry run mode
  expect(result.timestampedDeleted).toBe(0);
  expect(result.oldBaselineDeleted).toBe(0);
  expect(fs.unlinkSync).not.toHaveBeenCalled();
});

test("cleanup should handle errors during file deletion", async () => {
  const mockFiles = [
    "hero-section-light-20230101-123456.png",
    "hero-section-light.png", // Old format
  ];

  fs.readdirSync.mockReturnValue(mockFiles);

  // Mock unlinkSync to throw an error
  fs.unlinkSync.mockImplementation(() => {
    throw new Error("Mock file deletion error");
  });

  // This should complete without throwing, despite the error in unlinkSync
  const result = await cleanup("/test/dir", 0);

  // Counts should be 0 because all deletions failed
  expect(result.timestampedDeleted).toBe(0);
  expect(result.oldBaselineDeleted).toBe(0);

  // unlinkSync should have been called twice (once for each file)
  expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
});
