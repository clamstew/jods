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
