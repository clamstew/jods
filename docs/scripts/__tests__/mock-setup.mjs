// Mock setup for ESM modules
import { jest } from "@jest/globals";

// Mock fs module
export const mockFS = {
  existsSync: jest.fn().mockReturnValue(true),
  readdirSync: jest.fn().mockReturnValue([]),
  readFileSync: jest.fn().mockReturnValue(Buffer.from("mock-data")),
  writeFileSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => true }),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  rmSync: jest.fn(),
  unlinkSync: jest.fn(),
};

// Mock path module
export const mockPath = {
  join: jest.fn((...args) => args.join("/")),
  basename: jest.fn((path) => path.split("/").pop()),
  dirname: jest.fn((dir) => dir.split("/").slice(0, -1).join("/")),
  resolve: jest.fn((...args) => args.join("/")),
  relative: jest.fn((from, to) => to.replace(from, "")),
};

// Mock child_process module
export const mockChildProcess = {
  spawn: jest.fn().mockReturnValue({
    on: jest.fn(),
    kill: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
  }),
  execSync: jest.fn().mockReturnValue(Buffer.from("success")),
};

// Setup mock implementations for jest.mock calls
export function setupMocks() {
  // Reset all mocks
  jest.resetAllMocks();

  // Set default behaviors
  mockFS.existsSync.mockReturnValue(true);
  mockFS.readdirSync.mockReturnValue([]);
  mockFS.readFileSync.mockReturnValue(Buffer.from("mock-data"));
  mockFS.statSync.mockReturnValue({ isDirectory: () => true });

  mockChildProcess.spawn.mockReturnValue({
    on: jest.fn(),
    kill: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
  });
}
