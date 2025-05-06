// This file runs before Jest runs your tests
import { jest } from "@jest/globals";

// Make sure to clear mocks between tests
jest.clearAllMocks();

// Disable automatic mocks to ensure we use our manual mock implementations
jest.autoMockOff();

// Fix for Jest with ESM modules
global.__JEST_MOCKS__ = new Map();

// Helper for mocking ESM modules at runtime
global.mockModule = (moduleName, mockImplementation) => {
  global.__JEST_MOCKS__.set(moduleName, mockImplementation);
};

// Set up global test utilities
global.setupTestGlobals = () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
};

// Run before each test
beforeEach(() => {
  setupTestGlobals();
});
