import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";
import { takeUnifiedScreenshots } from "./screenshot-unified.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, "../static/screenshots/unified");
const diffOutputDir = path.join(screenshotsDir, "diffs");

// Create diff directory if it doesn't exist
if (!fs.existsSync(diffOutputDir)) {
  fs.mkdirSync(diffOutputDir, { recursive: true });
}

// Parameters
const threshold = parseFloat(
  process.argv.find((arg) => arg.startsWith("--threshold="))?.split("=")[1] ||
    "0.02"
); // Default 2% threshold
const componentsArg = process.argv.find((arg) =>
  arg.startsWith("--components=")
);
const specificComponents = componentsArg
  ? componentsArg.split("=")[1].split(",")
  : [];

async function pixelDiffScreenshots() {
  console.log("🔍 Screenshot Diff Tool");
  console.log(`📂 Screenshots directory: ${screenshotsDir}`);
  console.log(`📂 Diff output directory: ${diffOutputDir}`);
  console.log(`⚙️ Diff threshold: ${threshold * 100}%`);

  // Take fresh screenshots with a timestamp
  console.log("\n📸 Taking fresh screenshots...");
  const timestamp = await takeUnifiedScreenshots(
    specificComponents.length > 0 ? "components" : "all",
    undefined, // Use default timestamp
    false, // Not saving as baseline
    specificComponents
  );

  console.log(`\n✅ Screenshots taken with timestamp: ${timestamp}`);

  // Get all baseline screenshots
  const baselineFiles = fs
    .readdirSync(screenshotsDir)
    .filter((file) => file.endsWith(".png") && !file.includes("-20"));

  console.log(`\n🔍 Found ${baselineFiles.length} baseline screenshots`);

  // Get matching new screenshots
  const newScreenshots = fs
    .readdirSync(screenshotsDir)
    .filter((file) => file.includes(`-${timestamp}`) && file.endsWith(".png"));

  console.log(`📸 Found ${newScreenshots.length} new screenshots`);

  // Launch browser for pixel comparison
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let failedScreenshots = 0;
  const diffResults = [];

  // Compare each new screenshot with its baseline
  for (const newFile of newScreenshots) {
    // Find matching baseline file (removing timestamp)
    const baseFile = newFile.replace(`-${timestamp}`, "");

    if (!baselineFiles.includes(baseFile)) {
      console.log(`⚠️ No baseline found for ${newFile}, skipping`);
      continue;
    }

    console.log(`\n🔍 Comparing ${newFile} against baseline ${baseFile}`);

    const baselinePath = path.join(screenshotsDir, baseFile);
    const newPath = path.join(screenshotsDir, newFile);
    const diffPath = path.join(diffOutputDir, `diff-${newFile}`);

    try {
      // Read both images and convert to base64
      const baselineBuffer = fs.readFileSync(baselinePath);
      const newBuffer = fs.readFileSync(newPath);

      const baselineBase64 = `data:image/png;base64,${baselineBuffer.toString(
        "base64"
      )}`;
      const newBase64 = `data:image/png;base64,${newBuffer.toString("base64")}`;

      // Compare images using Playwright
      const diffResult = await page.evaluate(
        async ({ baseline, current }) => {
          // Load both images
          const loadImage = (dataUrl) => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = (_e) => {
                console.error("Failed to load image");
                reject(new Error("Failed to load image"));
              };
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
            const baselineImg = await loadImage(baseline);
            const currentImg = await loadImage(current);

            // Handle different sized images
            if (
              baselineImg.width !== currentImg.width ||
              baselineImg.height !== currentImg.height
            ) {
              return {
                diffPercentage: 1.0, // 100% different
                message: `Size mismatch: Baseline (${baselineImg.width}x${baselineImg.height}) vs Current (${currentImg.width}x${currentImg.height})`,
                diffImage: null,
              };
            }

            // Get pixel data
            const baseData = imageToData(baselineImg);
            const currentData = imageToData(currentImg);

            // Create diff image
            const canvas = document.createElement("canvas");
            canvas.width = baselineImg.width;
            canvas.height = baselineImg.height;
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
            const totalPixels = baseData.width * baseData.height;

            for (let i = 0; i < baseData.data.length; i += 4) {
              const rDiff = Math.abs(baseData.data[i] - currentData.data[i]);
              const gDiff = Math.abs(
                baseData.data[i + 1] - currentData.data[i + 1]
              );
              const bDiff = Math.abs(
                baseData.data[i + 2] - currentData.data[i + 2]
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
                "Failed to process images: " +
                (error.message || "Unknown error"),
              success: false,
            };
          }
        },
        { baseline: baselineBase64, current: newBase64 }
      );

      if (!diffResult.success) {
        console.log(`❌ Error processing images: ${diffResult.error}`);
        failedScreenshots++;
        continue;
      }

      // Save the diff image if there are differences
      if (diffResult.diffPercentage > 0) {
        // Convert base64 to image file
        if (diffResult.diffImage) {
          const base64Data = diffResult.diffImage.replace(
            /^data:image\/png;base64,/,
            ""
          );
          fs.writeFileSync(diffPath, Buffer.from(base64Data, "base64"));
        }

        console.log(
          `📊 Diff: ${(diffResult.diffPercentage * 100).toFixed(
            2
          )}% different ` +
            `(${diffResult.differentPixels} of ${diffResult.totalPixels} pixels)`
        );

        if (diffResult.diffPercentage > threshold) {
          console.log(
            `❌ FAILED: Diff exceeds threshold of ${threshold * 100}%`
          );
          console.log(`📄 Diff image saved to: ${diffPath}`);
          failedScreenshots++;
        } else {
          console.log(`✅ PASSED: Diff below threshold`);

          // Remove diff image if it passed and we're not in verbose mode
          if (!process.argv.includes("--verbose") && fs.existsSync(diffPath)) {
            fs.unlinkSync(diffPath);
          }
        }
      } else {
        console.log(`✅ PERFECT MATCH: No differences detected`);
      }

      // Save result for summary
      diffResults.push({
        newFile,
        baseFile,
        diffPercentage: diffResult.diffPercentage,
        passed: diffResult.diffPercentage <= threshold,
      });
    } catch (error) {
      console.log(`❌ Error comparing images: ${error.message}`);
      failedScreenshots++;
    }
  }

  await browser.close();

  // Print summary
  console.log("\n📝 SUMMARY:");
  console.log(
    `✅ ${diffResults.filter((r) => r.passed).length} screenshots passed`
  );
  console.log(`❌ ${failedScreenshots} screenshots failed`);

  if (failedScreenshots > 0) {
    console.log("\nFailed screenshots:");
    diffResults
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(
          `❌ ${result.newFile}: ${(result.diffPercentage * 100).toFixed(
            2
          )}% different`
        );
      });

    // Exit with error if any screenshots failed
    process.exit(1);
  }

  console.log("\n🎉 All screenshots passed pixel diff test!");
  return true;
}

// Run the diff
pixelDiffScreenshots().catch((error) => {
  console.error("Error during screenshot diff:", error);
  process.exit(1);
});
