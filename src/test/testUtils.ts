/**
 * Test utilities for jods using Vitest
 * Provides mocks, stubs, and helpers for testing jods functionality
 */

import { vi } from "vitest";
import type { Store, StoreState } from "../core/store";

// Type for subscriber function
export type Subscriber<T = any> = (state: T) => void;

// Type for mocked store
export interface MockStore<T extends StoreState = StoreState> extends Store<T> {
  _subscribers: Set<Subscriber<T>>;
  _getSubscribers: () => Set<Subscriber<T>>;
  _signals: Map<string, any>;
}

/**
 * Creates a mock store for testing
 * Allows tracking subscribers and signals for testing purposes
 */
export function createMockStore<T extends StoreState>(
  initialState: T
): T & MockStore<T> {
  const subscribers = new Set<Subscriber<T>>();
  const signals = new Map<string, any>();

  const mockStore = {
    ...initialState,
    getState: vi.fn(() => ({ ...initialState })),
    subscribe: vi.fn((fn: Subscriber<T>) => {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    }),
    _subscribers: subscribers,
    _getSubscribers: () => subscribers,
    _signals: signals,
  } as unknown as T & MockStore<T>;

  return mockStore;
}

/**
 * Creates a controlled environment for testing store-dependent code
 * Returns utilities for triggering updates and controlling store behavior
 */
export function createTestEnvironment<T extends StoreState>(initialState: T) {
  const mockStore = createMockStore(initialState);

  return {
    store: mockStore,
    triggerUpdate: (key: keyof T, value: any) => {
      (mockStore as any)[key] = value;
      mockStore._subscribers.forEach((fn) => fn(mockStore));
    },
    getSubscriberCount: () => mockStore._subscribers.size,
  };
}

/**
 * Helper to mock computed values
 */
export function mockComputed<T>(value: T) {
  const mockFn = vi.fn(() => value);
  return Object.assign(mockFn, { value });
}

/**
 * Wait for all pending promises to resolve
 */
export async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Set up global test utilities
 * Called by jest/vitest setup to initialize test environment
 */
export function setupTestUtils() {
  // Any global test setup can be added here
  // Currently this is a placeholder for future test setup needs
}
