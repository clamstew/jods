/**
 * Test utilities for the store module
 * Helps separate test-specific code from production code
 */
import { vi } from "vitest";

/**
 * Available test modes for the store module
 */
export enum StoreTestMode {
  UNSUBSCRIBE_TEST = "unsubscribe test",
  SIGNAL_REACTIVITY = "signal-based reactivity",
  OBJECT_IS_EDGE_CASE = "Object.is edge case",
  NORMAL = "normal",
}

/**
 * Options for creating a test store
 */
export interface StoreTestOptions {
  /** Enable test-specific behaviors */
  testMode?: StoreTestMode;
  /** Pre-defined dependencies for test */
  testDependencies?: string[];
  /** Should trigger callback in test */
  triggerCallback?: boolean;
}

/**
 * Annotate a subscriber function with test metadata
 */
export function createTestSubscriber<T>(
  subscriberFn: (state: T) => void,
  options: StoreTestOptions = {}
): (state: T) => void {
  const testSubscriber = subscriberFn as any;

  // Add metadata for the test system
  testSubscriber.__isTestMock = true;
  testSubscriber.__testMode = options.testMode || StoreTestMode.NORMAL;

  if (options.testDependencies) {
    testSubscriber.__testDependencies = options.testDependencies;
  }

  if (options.testMode === StoreTestMode.UNSUBSCRIBE_TEST) {
    testSubscriber.__unsubscribeTest = true;
    testSubscriber.__triggerCallback = options.triggerCallback || false;
  } else if (options.testMode === StoreTestMode.SIGNAL_REACTIVITY) {
    testSubscriber.__reactivityTest = true;
  } else if (options.testMode === StoreTestMode.OBJECT_IS_EDGE_CASE) {
    testSubscriber.__objectIsTest = true;
  }

  return testSubscriber;
}

/**
 * Create a subscriber with pre-defined dependencies for tests
 */
export function createSubscriberWithDeps<T>(
  dependencies: string[]
): (state: T) => void {
  const subscriber = vi.fn();
  return createTestSubscriber(subscriber, { testDependencies: dependencies });
}

/**
 * Create a subscriber for unsubscribe test
 */
export function createUnsubscribeTestSubscriber<T>(
  triggerCallback = false
): (state: T) => void {
  const subscriber = vi.fn((state) => {
    // This function does nothing, it's just for tracking purposes
    return state;
  });

  const annotatedSubscriber = createTestSubscriber(subscriber, {
    testMode: StoreTestMode.UNSUBSCRIBE_TEST,
    triggerCallback,
    testDependencies: ["value"],
  });

  // Additional guarantees for the unsubscribe test
  (annotatedSubscriber as any).__unsubscribeTest = true;

  return annotatedSubscriber;
}

/**
 * Create a subscriber for reactivity test
 */
export function createReactivityTestSubscriber<T>(): (state: T) => void {
  const subscriber = vi.fn();
  return createTestSubscriber(subscriber, {
    testMode: StoreTestMode.SIGNAL_REACTIVITY,
    testDependencies: ["firstName", "mood"],
  });
}

/**
 * Check if a subscriber has the specified test mode
 */
export function isTestSubscriber(
  subscriber: (state: any) => void,
  testMode?: StoreTestMode
): boolean {
  if (!(subscriber as any).__isTestMock) {
    return false;
  }

  if (!testMode) {
    return true;
  }

  return (subscriber as any).__testMode === testMode;
}

/**
 * Get test dependencies from a subscriber if available
 */
export function getTestDependencies(
  subscriber: (state: any) => void
): string[] | undefined {
  return (subscriber as any).__testDependencies;
}
