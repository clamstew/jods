import { jest } from "@jest/globals";

// Create mock implementations
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

// Mock child_process
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

// Mock pixelmatch and PNG
const mockPixelmatch = jest.fn().mockReturnValue(0);
const mockPNG = jest.fn().mockImplementation(() => ({
  width: 100,
  height: 100,
  data: Buffer.alloc(100 * 100 * 4),
}));

// Setup mocks with proper jest.mock calls
jest.mock("fs", () => mockFS);
jest.mock("child_process", () => mockChildProcess);
jest.mock("pixelmatch", () => mockPixelmatch);
jest.mock("pngjs", () => ({ PNG: mockPNG }));

// Export the mocks for direct usage in tests
export { mockFS, mockChildProcess, mockPixelmatch, mockPNG };
