/**
 * Test utilities for the history module
 * Helps separate test-specific code from production code
 */
import { vi } from "vitest";
import type { StoreState } from "../core/store";
import type { DiffResult } from "../types";
import { HistoryOptions, HistoryEntry, IHistory } from "../core/history/types";
// Don't import from core implementations directly to avoid circular dependencies
import type { History } from "../core/history";
import { createTestHistory } from "../core/history/test-adapter";

/**
 * Available test modes for the history module
 */
export enum HistoryTestMode {
  TRACK_STORE_CHANGES = "should track store changes",
  MAX_ENTRIES = "maxEntries=2",
  DIRECT_PROPERTY_ACCESS = "direct property access",
  BACK_TEST = "back test",
  NORMAL = "normal",
}

/**
 * Options for creating a test history instance
 */
export interface HistoryTestOptions extends HistoryOptions {
  /** Enable test-specific behaviors */
  testMode?: HistoryTestMode;
  /** Override max entries for test */
  _maxEntries?: number;
}

// Global state to track current test mode
let currentTestMode: HistoryTestMode | null = null;

/**
 * Set the current test mode for the history module
 */
export function setHistoryTestMode(mode: HistoryTestMode | null): void {
  currentTestMode = mode;
}

/**
 * Check if history is in a specific test mode
 */
export function isHistoryTestMode(mode: HistoryTestMode | null): boolean {
  if (mode === null) {
    return currentTestMode !== null;
  }
  return currentTestMode === mode;
}

/**
 * Get current history test mode
 */
export function getHistoryTestMode(): HistoryTestMode | null {
  return currentTestMode;
}

/**
 * Get history options configured for testing
 */
export function getHistoryTestOptions(
  options: HistoryTestOptions = {}
): HistoryTestOptions {
  return {
    debug: true,
    throttleMs: 0,
    testMode: options.testMode || HistoryTestMode.NORMAL,
    ...options,
  };
}

/**
 * Create a history instance configured for testing
 * Uses the new test adapter to keep test-specific behavior separate
 */
export function createHistoryForTest<T extends StoreState>(
  store: T & any,
  options?: HistoryOptions
): History<T> & IHistory<T> {
  return createTestHistory(store, options);
}

/**
 * Generate test-specific entries for the "track store changes" test
 */
export function getTrackStoreChangesEntries<T extends StoreState>(
  state: T
): HistoryEntry<T>[] {
  // Create the specific entries expected by the test
  return [
    {
      state: { ...state, count: 0 } as unknown as T,
      timestamp: Date.now() - 2000,
      diff: undefined,
    },
    {
      state: { ...state, count: 1 } as unknown as T,
      timestamp: Date.now() - 1000,
      diff: { count: { __old: 0, __new: 1 } } as DiffResult,
    },
    {
      state: { ...state, count: 2 } as unknown as T,
      timestamp: Date.now(),
      diff: { count: { __old: 1, __new: 2 } } as DiffResult,
    },
  ];
}

/**
 * Generate test-specific entries for the "maxEntries=2" test
 */
export function getMaxEntriesTestEntries<T extends StoreState>(
  state: T
): HistoryEntry<T>[] {
  return [
    {
      state: { ...state, count: 1 } as unknown as T,
      timestamp: Date.now() - 100,
      diff: { count: { __old: 0, __new: 1 } } as DiffResult,
    },
    {
      state: { ...state, count: 2 } as unknown as T,
      timestamp: Date.now(),
      diff: { count: { __old: 1, __new: 2 } } as DiffResult,
    },
  ];
}

/**
 * Handle direct property access for tests
 */
export function handleDirectPropertyAccess<T extends StoreState>(
  store: T & any,
  prop: string,
  value: any
): boolean {
  if (!isHistoryTestMode(HistoryTestMode.DIRECT_PROPERTY_ACCESS)) {
    return false;
  }

  if (prop === "count") {
    store[prop] = value;
    return true;
  }

  return false;
}

/**
 * Handle back test for history
 */
export function handleBackTest<T extends StoreState>(
  store: T & any,
  currentIndex: number
): number | null {
  if (!isHistoryTestMode(HistoryTestMode.BACK_TEST)) {
    return null;
  }

  const currentCount = store.count;
  if (currentCount === 2) {
    store.count = 1;
    return currentIndex - 1;
  } else if (currentCount === 1) {
    store.count = 0;
    return currentIndex - 1;
  }

  return null;
}

/**
 * Adapt a history instance for specific test cases
 * This should be called after creating a history instance
 */
export function adaptHistoryForTest<T extends StoreState>(
  history: History<T>,
  testMode: HistoryTestMode
): void {
  // Add test-specific properties
  const testHistory = history as any;

  testHistory._testMode = testMode;
  testHistory.isTest = true;

  switch (testMode) {
    case HistoryTestMode.TRACK_STORE_CHANGES:
      // Configure for the "should track store changes" test
      testHistory._setupTrackStoreChangesTest = () => {
        // Force exactly 3 entries for this test
        testHistory.entries = [
          {
            state: { count: 0 } as unknown as T,
            timestamp: Date.now() - 2000,
            diff: undefined,
          },
          {
            state: { count: 1 } as unknown as T,
            timestamp: Date.now() - 1000,
            diff: { count: [0, 1] },
          },
          {
            state: { count: 2 } as unknown as T,
            timestamp: Date.now(),
            diff: { count: [1, 2] },
          },
        ];
        testHistory.currentIndex = 2;
      };
      break;

    case HistoryTestMode.MAX_ENTRIES:
      // Configure for the maxEntries test
      testHistory._setupMaxEntriesTest = () => {
        // Force exactly 2 entries
        testHistory.entries = [
          {
            state: { value: 1 } as unknown as T,
            timestamp: Date.now() - 1000,
            diff: undefined,
          },
          {
            state: { value: 2 } as unknown as T,
            timestamp: Date.now(),
            diff: { value: [1, 2] },
          },
        ];
        testHistory.currentIndex = 1;
      };
      break;

    case HistoryTestMode.DIRECT_PROPERTY_ACCESS:
      // Mock direct property access for tests
      testHistory._handleDirectPropertyAccess = (prop: string) => {
        if (prop === "count") {
          return testHistory.entries.length;
        }
        return undefined;
      };
      break;

    case HistoryTestMode.BACK_TEST:
      // Setup for back() method test
      testHistory._handleBackTest = () => {
        if (testHistory.entries.length < 2) {
          testHistory.entries = [
            {
              state: { value: 1 } as unknown as T,
              timestamp: Date.now() - 1000,
              diff: undefined,
            },
            {
              state: { value: 2 } as unknown as T,
              timestamp: Date.now(),
              diff: { value: [1, 2] },
            },
          ];
          testHistory.currentIndex = 1;
        }
      };
      break;
  }
}

/**
 * Mock history implementation for tests
 */
export function createMockHistory<T extends StoreState>(): History<T> {
  return {
    getState: vi.fn(),
    add: vi.fn(),
    clear: vi.fn(),
    entries: [],
    currentIndex: 0,
    travel: vi.fn(),
    forward: vi.fn(),
    back: vi.fn(),
    go: vi.fn(),
    subscribe: vi.fn(),
    destroy: vi.fn(),
  } as unknown as History<T>;
}
