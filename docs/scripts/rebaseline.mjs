#!/usr/bin/env node

import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { createRequire } from "module";

// Setup require in ESM
const require = createRequire(import.meta.url);
const minimist = require("minimist");

// Parse arguments
const argv = minimist(process.argv.slice(2), {
  boolean: ["full", "testid", "help"],
  alias: {
    f: "full",
    t: "testid",
    h: "help",
  },
});

// Show help
if (argv.help) {
  console.log(`
  📸 Screenshot Rebaselining Tool

  Regenerates screenshots for the jods documentation site.
  
  Options:
    --full, -f     Full rebaseline (cleanup + baseline + test IDs)
    --testid, -t   Use test ID selectors for rebaselining
    --help, -h     Show this help message
  
  Examples:
    node scripts/rebaseline.mjs         # Simple rebaseline
    node scripts/rebaseline.mjs --full  # Full rebaseline
    node scripts/rebaseline.mjs --testid # TestID rebaseline
  `);
  process.exit(0);
}

// Determine mode
const mode = argv.full ? "full" : argv.testid ? "testid" : "simple";

async function createDirectories() {
  console.log("📁 Creating screenshot directories");
  await mkdir("static/screenshots/unified", { recursive: true });
}

async function runServer() {
  console.log("🚀 Starting Docusaurus server...");
  const server = spawn("npx", ["docusaurus", "start"], {
    stdio: "inherit",
    shell: true,
    detached: true,
  });

  // Return both the server process and a promise that resolves when server is ready
  return {
    process: server,
    ready: new Promise((resolve) => {
      console.log("⏳ Waiting for server to start (20 seconds)...");
      setTimeout(() => {
        console.log("Server should be ready now");
        resolve();
      }, 20000);
    }),
  };
}

async function runCommand(command, args, message) {
  console.log(message);
  return new Promise((resolve, reject) => {
    const cmd = spawn("node", [command, ...args], {
      stdio: "inherit",
      shell: true,
    });

    cmd.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function rebaseline() {
  try {
    await createDirectories();

    // Start server
    const server = await runServer();

    try {
      // Wait for server to be ready
      await server.ready;

      // Run cleanup first
      await runCommand(
        "scripts/screenshot-cleanup.mjs",
        [],
        "🧹 Cleaning up old screenshots..."
      );

      // Run baseline
      await runCommand(
        "scripts/screenshot-unified.mjs",
        ["--baseline"],
        "📸 Generating new baseline screenshots..."
      );

      // For testid or full mode, also generate selectors and run testid baseline
      if (mode === "testid" || mode === "full") {
        await runCommand(
          "scripts/generate-selectors.mjs",
          [],
          "🔍 Generating test ID selectors..."
        );
        await runCommand(
          "scripts/screenshot-unified.mjs",
          ["--use-generated-selectors", "--baseline"],
          "📸 Generating baseline with test ID selectors..."
        );
      }

      console.log(
        "✅ Screenshot rebaselining complete! Results are in static/screenshots/unified"
      );
    } finally {
      // Always kill the server
      console.log("🛑 Stopping Docusaurus server...");
      if (server.process && server.process.pid) {
        process.kill(-server.process.pid, "SIGTERM");
      }
    }
  } catch (err) {
    console.error("❌ Error during rebaselining:", err);
    process.exit(1);
  }
}

rebaseline();
