# Screenshot Script Optimizations

This document describes the performance optimizations made to the screenshot capturing scripts.

## Key Optimizations

### 1. Memoization

- Added caching for environment setup, configuration, and loggers
- Components now use a selector cache for faster element lookups
- Reduced redundant file system operations

```javascript
// Cache for memoized functions
const _memoCache = {
  environment: null,
  configuration: null,
  loggers: new Map(),
};
```

### 2. Enhanced Error Handling

- Added fallback mechanisms for directory creation
- Improved error reporting with stack traces in debug mode
- Safe file operations with graceful degradation

```javascript
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
    // Error handling with fallbacks
    return fallbackValue;
  }
}
```

### 3. Modular Architecture

- Refactored tab management into discrete methods
- Separated concerns between finding, selecting, and checking tabs
- Added browser initialization retry logic

### 4. Performance Monitoring

- Added timing metrics for operations
- Performance statistics collection in retry utility
- Better reporting of total duration and success/failure metrics

## Configuration System

Added a centralized configuration system with defaults:

```javascript
export function getConfiguration(forceRefresh = false) {
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

  // Config can be extended with external JSON file
  return defaults;
}
```

## Package Manager Transition

- Transitioned from npm to pnpm for better dependency management
- Added package.json metadata for pnpm
- Fixed Jest configuration for ES modules

## Additional Improvements

1. **Enhanced Logging**

   - Structured logging with categorization
   - Added support for grouping related logs
   - Better visual separation of different log types

2. **Retry Logic**

   - Exponential backoff for retries
   - Statistics tracking for retry performance
   - More consistent error handling

3. **Browser Handling**
   - More resilient browser initialization
   - Configurable timeouts and viewport size
   - Better cleanup of browser resources

## Usage Examples

Capturing screenshots with specific components:

```bash
node scripts/screenshot-unified.mjs --components=01-hero-section,02-features-section
```

Re-baseline with enhanced error handling:

```bash
node scripts/rebaseline.mjs --full
```

## Performance Impact

- Reduced redundant file operations
- Faster component selection with caching
- More reliable browser handling with retry mechanisms
- Better error recovery for long-running screenshot processes
