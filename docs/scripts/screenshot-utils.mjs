// Screenshot utilities for environment setup, logging, and retry functionality
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Set up the environment for screenshot scripts
 * @returns {Object} Environment settings
 */
export function setupEnvironment() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const screenshotsBaseDir = path.join(__dirname, "../static/screenshots");

  // Create screenshot directories
  const directories = {
    unified: path.join(screenshotsBaseDir, "unified"),
    diffs: path.join(screenshotsBaseDir, "diffs"),
    iterations: path.join(screenshotsBaseDir, "iterations"),
  };

  // Create directories if they don't exist
  Object.values(directories).forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Base URL of the site
  const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  // Path prefix - include /jods/ if needed
  const PATH_PREFIX = BASE_URL.includes("localhost") ? "/jods" : "";

  // Theme modes to capture
  const THEMES = ["light", "dark"];

  // Debug mode flag - can be enabled with DEBUG=true environment variable
  const DEBUG = process.env.DEBUG === "true";

  // Generate a timestamp in the format YYYYMMDD-HHMMSS
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

  return {
    __dirname,
    screenshotsBaseDir,
    directories,
    BASE_URL,
    PATH_PREFIX,
    THEMES,
    getTimestamp,
    DEBUG,
  };
}

/**
 * Set up the logger utility
 * @param {boolean} DEBUG - Whether debug logging is enabled
 * @returns {Object} Logger utility
 */
export function setupLogger(DEBUG) {
  return {
    info: (message) => console.log(`ℹ️ ${message}`),
    success: (message) => console.log(`✅ ${message}`),
    warn: (message) => console.log(`⚠️ ${message}`),
    error: (message) => console.error(`❌ ${message}`),
    debug: (message) => {
      if (DEBUG) console.log(`🔍 DEBUG: ${message}`);
    },
    // New standardized methods for the framework
    component: (component, message) =>
      console.log(`🧩 [${component}] ${message}`),
    theme: (theme, message) => console.log(`🎨 [${theme}] ${message}`),
    capture: (component, theme, message) =>
      console.log(`📸 [${component}|${theme}] ${message}`),
    timing: (duration, operation) =>
      console.log(`⏱️ ${operation} took ${duration}ms`),
  };
}

/**
 * Set up the retry utility for operations that might fail
 * @param {Object} logger - Logger utility
 * @returns {Function} Retry utility function
 */
export function setupRetry(logger) {
  return async function retry(operation, options = {}) {
    const {
      retries = 3,
      delay = 500,
      name = "operation",
      onRetry = null,
      onSuccess = null,
      onFailure = null,
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();

        if (onSuccess) {
          onSuccess(result, attempt);
        } else if (attempt > 1) {
          logger.success(`${name} succeeded on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error;

        if (attempt < retries) {
          if (onRetry) {
            onRetry(error, attempt);
          } else {
            logger.warn(
              `${name} failed (attempt ${attempt}/${retries}): ${error.message}`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, delay * attempt)); // Exponential backoff
        }
      }
    }

    if (onFailure) {
      onFailure(lastError);
    } else {
      logger.error(
        `${name} failed after ${retries} attempts: ${lastError.message}`
      );
    }

    throw lastError;
  };
}

/**
 * Unified configuration system for screenshot framework
 * @returns {Object} Configuration object
 */
export function getConfiguration() {
  // Default configuration values
  const defaults = {
    // Core settings
    captureHtmlDebug: true,
    pauseAnimationsDefault: true,

    // Timeouts and delays
    navigationTimeout: 30000,
    elementTimeout: 5000,
    postClickDelay: 1500,

    // Selection strategies
    prioritySelectors: ["testId", "attribute", "css", "text", "triangulation"],

    // Theme handling
    themeSwitchStrategy: "attribute",
    themeAttributeName: "data-theme",

    // TestID configuration
    testIdPrefix: "jods-",
    testIdDelimiter: "-",

    // Output configuration
    outputFormat: "{name}-{theme}{timestamp}.png",
    errorOutputFormat: "{name}-{theme}-error{timestamp}.png",
  };

  // TODO: Load from a config file if needed
  return defaults;
}

/**
 * Measure execution time of an operation
 * @param {Function} fn - Function to measure
 * @param {Object} logger - Logger instance
 * @param {string} operationName - Name of the operation
 * @returns {Promise<any>} Result of the function
 */
export async function measureTime(fn, logger, operationName) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = Math.round(performance.now() - start);
    logger.timing(duration, operationName);
  }
}
