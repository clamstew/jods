// This file runs before Jest runs your tests
import { jest } from "@jest/globals";

// Enable automock to ensure all imports are mocked
jest.autoMockOff();

// Fix for Jest+ESM compatibility (required to mock ES modules)
jest.unstable_mockModule = async (moduleName, factory) => {
  const path = await import.meta.resolve(moduleName);
  jest.doMock(path, factory);
  return path;
};

// Set up global mock configurations here
global.setupTestGlobals = () => {
  // Reset all mocks before each test
  jest.clearAllMocks();
};

// Run before each test
beforeEach(() => {
  setupTestGlobals();
});
