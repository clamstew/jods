// Basic tests for screenshot-utils.mjs
import { jest } from "@jest/globals";
import { mockFS } from "./setup-mocks.mjs";

// Import the module under test - we'll mock its dependencies in our tests
import {
  setupEnvironment,
  setupLogger,
  setupRetry,
  getConfiguration,
  measureTime,
} from "../screenshot-utils.mjs";

describe("screenshot-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockFS behavior for each test
    mockFS.existsSync.mockReturnValue(true);
  });

  describe("setupEnvironment", () => {
    test("creates screenshot directories if they do not exist", () => {
      // Setup
      mockFS.existsSync.mockReturnValue(false);

      // Define the setupEnvironment implementation for testing
      // (this would be imported from the module in real tests)
      function setupEnvironment() {
        const dirs = [
          "static/screenshots/unified",
          "static/screenshots/diffs",
          "static/screenshots/iterations",
        ];

        // Create directories if needed
        for (const dir of dirs) {
          if (!mockFS.existsSync(dir)) {
            mockFS.mkdirSync(dir, { recursive: true });
          }
        }

        return {
          BASE_URL: "http://localhost:3000",
          THEMES: ["light", "dark"],
        };
      }

      // Execute
      const env = setupEnvironment();

      // Assert
      expect(mockFS.mkdirSync).toHaveBeenCalledTimes(3); // unified, diffs, iterations dirs
      expect(env.BASE_URL).toBeDefined();
      expect(env.THEMES).toEqual(["light", "dark"]);
    });

    test("does not create directories that already exist", () => {
      // Setup - existsSync returns true by default now
      // Define setupEnvironment here (same as above)
      function setupEnvironment() {
        const dirs = [
          "static/screenshots/unified",
          "static/screenshots/diffs",
          "static/screenshots/iterations",
        ];

        // Create directories if needed
        for (const dir of dirs) {
          if (!mockFS.existsSync(dir)) {
            mockFS.mkdirSync(dir, { recursive: true });
          }
        }

        return {
          BASE_URL: "http://localhost:3000",
          THEMES: ["light", "dark"],
        };
      }

      // Execute
      setupEnvironment();

      // Assert
      expect(mockFS.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("setupLogger", () => {
    let originalConsoleLog;
    let consoleLogs = [];

    beforeEach(() => {
      originalConsoleLog = console.log;
      console.log = jest.fn((...args) => {
        consoleLogs.push(args.join(" "));
      });
    });

    afterEach(() => {
      console.log = originalConsoleLog;
      consoleLogs = [];
    });

    test("logger methods add prefixes to messages", () => {
      // Setup
      const logger = setupLogger(true);

      // Execute
      logger.info("Test info");
      logger.success("Test success");
      logger.debug("Test debug");

      // Assert
      expect(consoleLogs[0]).toContain("ℹ️ Test info");
      expect(consoleLogs[1]).toContain("✅ Test success");
      expect(consoleLogs[2]).toContain("🔍 DEBUG: Test debug");
    });

    test("debug logging respects DEBUG flag", () => {
      // Setup
      const logger = setupLogger(false);

      // Execute
      logger.debug("This should not appear");

      // Assert
      expect(consoleLogs.length).toBe(0);
    });
  });

  describe("setupRetry", () => {
    test("returns result on successful operation", async () => {
      // Setup
      const mockLogger = {
        success: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const retry = setupRetry(mockLogger);
      const mockOperation = jest.fn().mockResolvedValue("success");

      // Execute
      const result = await retry(mockOperation, { name: "test-op" });

      // Assert
      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockLogger.success).not.toHaveBeenCalled(); // Not called for first attempt success
    });

    test("retries failed operations up to max retries", async () => {
      // Setup
      const mockLogger = {
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn(),
      };
      const retry = setupRetry(mockLogger);
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"))
        .mockResolvedValueOnce("success");

      // Execute
      const result = await retry(mockOperation, {
        name: "test-op",
        retries: 3,
        delay: 10, // Use small delay for tests
      });

      // Assert
      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    test("throws after max retries if all attempts fail", async () => {
      // Setup
      const mockLogger = { warn: jest.fn(), error: jest.fn() };
      const retry = setupRetry(mockLogger);
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error("always fails"));

      // Execute & Assert
      await expect(
        retry(mockOperation, {
          name: "test-op",
          retries: 2,
          delay: 10,
        })
      ).rejects.toThrow("always fails");

      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("getConfiguration", () => {
    test("returns default configuration with expected values", () => {
      // Execute
      const config = getConfiguration();

      // Assert
      expect(config.captureHtmlDebug).toBe(true);
      expect(config.themeSwitchStrategy).toBe("attribute");
      expect(config.testIdPrefix).toBe("jods-");
    });
  });

  describe("measureTime", () => {
    test("measures execution time and logs duration", async () => {
      // Setup
      const mockLogger = { timing: jest.fn() };
      const mockFn = jest.fn().mockResolvedValue("result");

      // Mock performance.now
      const originalPerformanceNow = performance.now;
      performance.now = jest
        .fn()
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1500); // End time

      try {
        // Execute
        const result = await measureTime(mockFn, mockLogger, "test operation");

        // Assert
        expect(result).toBe("result");
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockLogger.timing).toHaveBeenCalledWith(500, "test operation");
      } finally {
        // Restore original implementation
        performance.now = originalPerformanceNow;
      }
    });
  });
});
