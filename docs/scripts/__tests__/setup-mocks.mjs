import { jest } from "@jest/globals";

// Create mock implementations that will be used across test files
const mockFS = {
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => true }),
  readdirSync: jest.fn().mockReturnValue([]),
  readFileSync: jest.fn().mockReturnValue("{}"),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  unlinkSync: jest.fn(),
  copyFileSync: jest.fn(),
  createWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
  }),
};

// Mock child_process implementation
const mockChildProcess = {
  spawn: jest.fn().mockReturnValue({
    on: jest.fn((event, callback) => {
      if (event === "close") callback(0);
      return this;
    }),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
  }),
  exec: jest.fn((cmd, callback) =>
    callback(null, { stdout: "success", stderr: "" })
  ),
};

// Mock path implementation
const mockPath = {
  join: jest.fn((...args) => args.join("/")),
  dirname: jest.fn((p) => p.split("/").slice(0, -1).join("/")),
  basename: jest.fn((p) => p.split("/").pop()),
  resolve: jest.fn((...args) => args.join("/")),
};

// Use jest.mock outside any describer or it block
// These will be hoisted to the top of the file execution
jest.mock("fs", () => mockFS);
jest.mock("child_process", () => mockChildProcess);
jest.mock("path", () => mockPath);

// Export all mocks so they can be used in test files
export { mockFS, mockChildProcess, mockPath };
