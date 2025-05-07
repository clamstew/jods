// Screenshot utilities for environment setup, logging, and retry functionality
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Cache for memoized functions
const _memoCache = {
  environment: null,
  configuration: null,
  loggers: new Map(),
};

/**
 * Set up the environment for screenshot scripts
 * @param {boolean} forceRefresh - Force refresh the cached environment
 * @returns {Object} Environment settings
 */
export function setupEnvironment(forceRefresh = false) {
  // Return cached environment if available and not forced to refresh
  if (_memoCache.environment && !forceRefresh) {
    return _memoCache.environment;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const screenshotsBaseDir = path.join(__dirname, "../static/screenshots");

  // Create screenshot directories
  const directories = {
    unified: path.join(screenshotsBaseDir, "unified"),
    diffs: path.join(screenshotsBaseDir, "diffs"),
    iterations: path.join(screenshotsBaseDir, "iterations"),
    debug: path.join(screenshotsBaseDir, "debug"),
  };

  try {
    // Create directories if they don't exist
    Object.values(directories).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } catch (error) {
    console.error(`Failed to create screenshot directories: ${error.message}`);
    // Create a fallback directory if the main ones fail
    try {
      const tempDir = path.join(__dirname, "../static/temp-screenshots");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      Object.keys(directories).forEach((key) => {
        directories[key] = tempDir;
      });
      console.log(`Created fallback directory at ${tempDir}`);
    } catch (fallbackError) {
      console.error(
        `Failed to create fallback directory: ${fallbackError.message}`
      );
    }
  }

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

  // Build and cache the environment object
  _memoCache.environment = {
    __dirname,
    screenshotsBaseDir,
    directories,
    BASE_URL,
    PATH_PREFIX,
    THEMES,
    getTimestamp,
    DEBUG,
  };

  return _memoCache.environment;
}

/**
 * Set up the logger utility with enhanced error handling
 * @param {boolean} DEBUG - Whether debug logging is enabled
 * @returns {Object} Logger utility
 */
export function setupLogger(DEBUG) {
  // Use cached logger if we've already created one with this debug setting
  const cacheKey = `logger_${DEBUG ? "debug" : "normal"}`;
  if (_memoCache.loggers.has(cacheKey)) {
    return _memoCache.loggers.get(cacheKey);
  }

  // Error handler with stack trace support
  const handleError = (message, error) => {
    console.error(`❌ ${message}`);
    if (error && error.stack && DEBUG) {
      console.error(`Stack trace: ${error.stack}`);
    }
  };

  // Create logger object
  const logger = {
    info: (message) => console.log(`ℹ️ ${message}`),
    success: (message) => console.log(`✅ ${message}`),
    warn: (message) => console.log(`⚠️ ${message}`),
    error: (message, error) => handleError(message, error),
    debug: (message) => {
      if (DEBUG) console.log(`🔍 DEBUG: ${message}`);
    },
    // Track performance of operations
    startTimer: (label) => {
      if (!DEBUG) return null;
      const timerId = `${label}_${Date.now()}`;
      console.time(timerId);
      return timerId;
    },
    endTimer: (timerId) => {
      if (!timerId || !DEBUG) return;
      console.timeEnd(timerId);
    },
    // Enhanced standardized methods for the framework
    component: (component, message) =>
      console.log(`🧩 [${component}] ${message}`),
    theme: (theme, message) => console.log(`🎨 [${theme}] ${message}`),
    capture: (component, theme, message) =>
      console.log(`📸 [${component}|${theme}] ${message}`),
    timing: (duration, operation) =>
      console.log(`⏱️ ${operation} took ${duration}ms`),
    group: (name) => {
      if (DEBUG) console.group(`🔍 ${name}`);
    },
    groupEnd: () => {
      if (DEBUG) console.groupEnd();
    },
  };

  // Cache the logger
  _memoCache.loggers.set(cacheKey, logger);
  return logger;
}

/**
 * Set up the retry utility with enhanced failure tracking
 * @param {Object} logger - Logger utility
 * @returns {Function} Retry utility function
 */
export function setupRetry(logger) {
  // Track operation statistics
  const stats = {
    successes: 0,
    failures: 0,
    totalRetries: 0,
  };

  const retry = async function retry(operation, options = {}) {
    const {
      retries = 3,
      delay = 500,
      name = "operation",
      onRetry = null,
      onSuccess = null,
      onFailure = null,
      exponentialBackoff = true,
    } = options;

    let lastError;
    const startTime = performance.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        const duration = Math.round(performance.now() - startTime);

        stats.successes++;
        if (attempt > 1) {
          stats.totalRetries += attempt - 1;
        }

        if (onSuccess) {
          onSuccess(result, attempt, duration);
        } else if (attempt > 1) {
          logger.success(
            `${name} succeeded on attempt ${attempt} (${duration}ms)`
          );
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

          // Calculate delay, with or without exponential backoff
          const waitTime = exponentialBackoff
            ? delay * Math.pow(2, attempt - 1)
            : delay;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    stats.failures++;
    const duration = Math.round(performance.now() - startTime);

    if (onFailure) {
      onFailure(lastError, duration);
    } else {
      logger.error(
        `${name} failed after ${retries} attempts (${duration}ms): ${lastError.message}`,
        lastError
      );
    }

    throw lastError;
  };

  // Add stats to the retry function for monitoring
  retry.getStats = () => ({ ...stats });
  retry.resetStats = () => {
    stats.successes = 0;
    stats.failures = 0;
    stats.totalRetries = 0;
  };

  return retry;
}

/**
 * Unified configuration system for screenshot framework
 * @param {boolean} forceRefresh - Force refresh the cached configuration
 * @returns {Object} Configuration object
 */
export function getConfiguration(forceRefresh = false) {
  // Return cached configuration if available
  if (_memoCache.configuration && !forceRefresh) {
    return _memoCache.configuration;
  }

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

    // Performance optimization
    memoizationEnabled: true,
    parallelProcessing: false, // Disabled by default as Playwright has issues with parallel execution
  };

  // TODO: Load from a config file if needed
  // Check for a config file in the project root
  try {
    const configPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../screenshot.config.json"
    );

    if (fs.existsSync(configPath)) {
      const configFile = JSON.parse(fs.readFileSync(configPath, "utf8"));
      // Merge with defaults, preserving defaults for any missing properties
      _memoCache.configuration = { ...defaults, ...configFile };
      return _memoCache.configuration;
    }
  } catch (error) {
    console.warn(`Failed to load config file: ${error.message}`);
  }

  // Cache and return defaults if no config file
  _memoCache.configuration = defaults;
  return defaults;
}

/**
 * Measure execution time of an operation with enhanced error handling
 * @param {Function} fn - Function to measure
 * @param {Object} logger - Logger instance
 * @param {string} operationName - Name of the operation
 * @param {Function} onError - Optional error handler
 * @returns {Promise<any>} Result of the function
 */
export async function measureTime(fn, logger, operationName, onError) {
  const start = performance.now();
  const timerId = logger.startTimer?.(operationName);

  try {
    return await fn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      logger.error(`Error in ${operationName}: ${error.message}`, error);
    }
    throw error;
  } finally {
    const duration = Math.round(performance.now() - start);
    logger.timing(duration, operationName);
    logger.endTimer?.(timerId);
  }
}

/**
 * Safe file operation wrapper with better error handling
 * @param {Function} operation - File operation function
 * @param {Object} options - Options including fallback behavior
 * @returns {any} Result of the operation or fallback value
 */
export function safeFileOperation(operation, options = {}) {
  const {
    description = "file operation",
    fallbackValue = null,
    throwError = false,
    logger = console,
  } = options;

  try {
    return operation();
  } catch (error) {
    const message = `Failed during ${description}: ${error.message}`;

    if (logger) {
      logger.error?.(message, error) || logger.error(message);
    } else {
      console.error(message);
    }

    if (throwError) {
      throw error;
    }

    return fallbackValue;
  }
}

/**
 * Ensure a directory exists, with fallback options
 * @param {string} dirPath - Path to ensure exists
 * @param {Object} options - Options object
 * @returns {boolean} Whether directory exists/was created
 */
export function ensureDirectoryExists(dirPath, options = {}) {
  const { recursive = true, fallbackDir = null, logger = console } = options;

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive });
      logger.info?.(`Created directory: ${dirPath}`) ||
        console.log(`Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    logger.error?.(
      `Failed to create directory ${dirPath}: ${error.message}`,
      error
    ) ||
      console.error(`Failed to create directory ${dirPath}: ${error.message}`);

    if (fallbackDir) {
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive });
        }
        logger.warn?.(`Using fallback directory: ${fallbackDir}`) ||
          console.warn(`Using fallback directory: ${fallbackDir}`);
        return true;
      } catch (fallbackError) {
        logger.error?.(
          `Failed to create fallback directory: ${fallbackError.message}`,
          fallbackError
        ) ||
          console.error(
            `Failed to create fallback directory: ${fallbackError.message}`
          );
      }
    }

    return false;
  }
}
