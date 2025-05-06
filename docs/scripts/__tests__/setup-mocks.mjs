import { jest } from "@jest/globals";

// Standard module mocks
jest.mock("fs");
jest.mock("path");
jest.mock("child_process");

// Import modules after mocking
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";

// Shared setup function that can be called from individual test files
export function setupMocks() {
  // Clear all previous mock calls
  jest.clearAllMocks();

  // fs module mocks
  fs.existsSync = jest.fn().mockReturnValue(true);
  fs.readdirSync = jest.fn().mockReturnValue([]);
  fs.readFileSync = jest.fn().mockReturnValue(Buffer.from("mock-data"));
  fs.writeFileSync = jest.fn();
  fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true });
  fs.mkdirSync = jest.fn();
  fs.copyFileSync = jest.fn();
  fs.rmSync = jest.fn();
  fs.unlinkSync = jest.fn();

  // path module mocks
  path.join = jest.fn((...args) => args.join("/"));
  path.basename = jest.fn((path) => path.split("/").pop());
  path.dirname = jest.fn((dir) => dir.split("/").slice(0, -1).join("/"));
  path.resolve = jest.fn((...args) => args.join("/"));
  path.relative = jest.fn((from, to) => to.replace(from, ""));

  // child_process mocks
  const mockProcess = {
    on: jest.fn(),
    kill: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
  };
  childProcess.spawn = jest.fn().mockReturnValue(mockProcess);
  childProcess.execSync = jest.fn().mockReturnValue(Buffer.from("success"));
}

// Export the mocked modules directly for use in tests
export { fs, path, childProcess };
