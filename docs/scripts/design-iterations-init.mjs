#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { setupLogger } from "./screenshot-utils.mjs";

// Initialize logger
const logger = setupLogger(false);

// Setup paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const TEMP_DIR = path.join(ROOT_DIR, "temp");
const ITERATIONS_DIR = path.join(TEMP_DIR, "design-iterations");

/**
 * Create directory if it doesn't exist
 * @param {string} dir - Directory path to create
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    logger.debug(`Directory created: ${dir}`);
  } catch (error) {
    logger.error(`Error creating directory ${dir}: ${error.message}`);
    throw error;
  }
}

/**
 * Write file with content
 * @param {string} filePath - Path to write file to
 * @param {string} content - Content to write to file
 */
async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, "utf8");
    logger.debug(`File written: ${filePath}`);
  } catch (error) {
    logger.error(`Error writing file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Create a starter README file
 * @param {string} dir - Directory to place README in
 */
async function createReadme(dir) {
  const readmeContent = `# Design Iterations

This directory contains design iterations created by the AI-driven design iteration system.

## Directory Structure

\`\`\`
/iteration-1/
  /screenshots/         # Screenshots of the iteration
  /diffs/               # Visual diffs between iterations
  diff.patch            # Git diff of the changes made
  metadata.json         # Metadata about the iteration
/iteration-2/
  ...
\`\`\`

## Running Design Iterations

From the root directory:

\`\`\`bash
pnpm docs:design-iterations              # Run a single iteration
pnpm docs:design-iterations --count=5    # Run 5 iterations
pnpm docs:design-iterations --target=hero-section,features-section # Focus on specific sections
\`\`\`

From the docs directory:

\`\`\`bash
pnpm design-iterations                   # Run a single iteration
pnpm design-iterations --count=5         # Run 5 iterations
pnpm design-iterations --target=hero-section,features-section # Focus on specific sections
\`\`\`

## Available Options

- \`--count=N\`: Number of iterations to run (default: 1)
- \`--target="component1,component2"\`: Components to focus on
- \`--prompt="Custom design prompt"\`: Custom prompt for design guidance
- \`--compare-with="lib1,lib2"\`: Libraries to compare with

## Viewing Results

Each iteration contains:

1. Screenshots of the components before/after changes
2. A diff file showing the exact changes made
3. Metadata about the iteration's goals and results
4. Visual diffs highlighting the changes between iterations

## Relation to Active Record Model

The design iterations system follows the same opinionated approach as jods itself.
By providing one good way to do design iterations rather than endless configuration,
we create a streamlined workflow that follows convention over configuration.
`;

  await writeFile(path.join(dir, "README.md"), readmeContent);
  logger.success("README created with usage instructions");
}

/**
 * Create a sample metadata file
 * @param {string} dir - Directory to place metadata sample in
 */
async function createMetadataSample(dir) {
  const metadataSample = {
    iteration: 0,
    timestamp: new Date().toISOString(),
    changes: [
      {
        component: "hero-section",
        description: "Sample change description",
        files: ["src/components/HomepageHero.js"],
        reasoning: "Improved readability on light backgrounds",
      },
    ],
    inspirations: [
      {
        source: "react.dev",
        element: "hero section",
        attributes: ["layout", "typography"],
      },
    ],
    evaluation: {
      aesthetic_score: 7.8,
      readability_score: 8.2,
      accessibility_score: 9.0,
      diff_percentage: 0.034,
      visual_changes: {
        "hero-section-light": 0.057,
        "hero-section-dark": 0.028,
      },
    },
  };

  await writeFile(
    path.join(dir, "metadata-sample.json"),
    JSON.stringify(metadataSample, null, 2)
  );
  logger.success("Sample metadata file created");
}

/**
 * Initialize the design iterations directory structure
 */
async function initDesignIterations() {
  try {
    logger.info("Initializing design iterations directory structure...");

    // Create base directories
    await ensureDir(ITERATIONS_DIR);
    await ensureDir(path.join(ITERATIONS_DIR, "inspiration"));

    // Create README
    await createReadme(ITERATIONS_DIR);

    // Create sample metadata
    await createMetadataSample(ITERATIONS_DIR);

    // Create .gitkeep file
    await writeFile(path.join(ITERATIONS_DIR, "inspiration", ".gitkeep"), "");

    logger.success(
      `Design iterations directory structure created at ${ITERATIONS_DIR}`
    );
    logger.info("Ready to run design iterations!");
  } catch (error) {
    logger.error(`Failed to initialize design iterations: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
initDesignIterations();
