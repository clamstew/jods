// Consolidated script to fix all screenshot issues
// This script addresses issues with section screenshots, especially
// ensuring sufficient vertical height to capture content properly
// including headers and footers of sections that may be cut off
import { takeComponentScreenshots } from "./screenshot-component.mjs";
import { takeRemixSectionScreenshot } from "./remix-section.mjs";

// Get a shared timestamp for all screenshots to keep them in sync
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

async function fixAllScreenshots() {
  console.log("🔧 Starting screenshot fix process...");

  // Generate a shared timestamp
  const timestamp = getTimestamp();
  console.log(`📅 Using timestamp: ${timestamp}`);

  try {
    // Run component screenshots with increased heights and better selectors
    console.log("\n📸 Taking component screenshots...");
    await takeComponentScreenshots(timestamp, false);

    // Run dedicated Remix screenshot
    console.log("\n📸 Taking dedicated Remix section screenshot...");
    await takeRemixSectionScreenshot(timestamp, false);

    console.log("\n✅ All screenshots completed successfully!");
    console.log(`📂 Screenshots saved with timestamp: ${timestamp}`);
  } catch (error) {
    console.error("❌ Error taking screenshots:", error);
    process.exit(1);
  }
}

// Check for baseline flag
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");

if (saveBaseline) {
  console.log("🔄 Creating baseline screenshots (no timestamps)...");

  // Run with baseline flag
  Promise.all([
    takeComponentScreenshots(null, true),
    takeRemixSectionScreenshot(null, true),
  ])
    .then(() => {
      console.log("✅ Baseline screenshots created successfully!");
    })
    .catch((error) => {
      console.error("❌ Error creating baseline screenshots:", error);
      process.exit(1);
    });
} else {
  // Run with timestamp
  fixAllScreenshots().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}
