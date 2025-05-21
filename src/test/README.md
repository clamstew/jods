# jods Test Utilities

This directory contains test utilities for jods that work with Vitest. These utilities help separate test-specific code from production code, making both easier to understand and maintain.

## Available Utilities

### General Test Utilities (`testUtils.ts`)

#### `createMockStore`

Creates a mock store for testing that tracks subscribers and provides access to internal state.

```typescript
import { createMockStore } from "../test/testUtils";

const mockStore = createMockStore({ count: 0, name: "test" });
// Access subscribers
console.log(mockStore._subscribers.size);
```

#### `createTestEnvironment`

Creates a controlled environment for testing store-dependent code with convenient methods for updates.

```typescript
import { createTestEnvironment } from "../test/testUtils";

const { store, triggerUpdate } = createTestEnvironment({ count: 0 });
// Trigger an update and notify subscribers
triggerUpdate("count", 1);
```

#### `mockComputed`

Helps mock computed values for testing.

```typescript
import { mockComputed } from "../test/testUtils";

const computed = mockComputed(42);
// Access both the function and value property
expect(computed()).toBe(42);
expect(computed.value).toBe(42);
```

#### `flushPromises`

Utility for handling async test cases.

```typescript
import { flushPromises } from "../test/testUtils";

// Wait for all promises in the microtask queue to resolve
await flushPromises();
```

### Store-Specific Test Utilities (`storeTestUtils.ts`)

#### `createTestSubscriber`

Creates a subscriber function with test metadata for testing specific store behaviors.

```typescript
import { createTestSubscriber, StoreTestMode } from "../test/storeTestUtils";

const subscriber = createTestSubscriber(
  (state) => {
    console.log(state.count);
  },
  { testMode: StoreTestMode.UNSUBSCRIBE_TEST }
);
```

#### `createSubscriberWithDeps`

Creates a subscriber with pre-defined dependencies for testing dependency tracking.

```typescript
import { createSubscriberWithDeps } from "../test/storeTestUtils";

const subscriber = createSubscriberWithDeps(["firstName", "age"]);
// This subscriber is pre-configured to track "firstName" and "age"
```

#### `isTestSubscriber`

Checks if a subscriber has the specified test mode.

```typescript
import { isTestSubscriber, StoreTestMode } from "../test/storeTestUtils";

if (isTestSubscriber(subscriber, StoreTestMode.SIGNAL_REACTIVITY)) {
  // Handle reactivity test specific code
}
```

### History-Specific Test Utilities (`historyTestUtils.ts`)

#### `setHistoryTestMode`

Sets the current test mode for the history module.

```typescript
import { setHistoryTestMode, HistoryTestMode } from "../test/historyTestUtils";

// Set up for specific test case
setHistoryTestMode(HistoryTestMode.TRACK_STORE_CHANGES);
```

#### `getHistoryTestOptions`

Returns options configured for history tests.

```typescript
import { getHistoryTestOptions } from "../test/historyTestUtils";

const options = getHistoryTestOptions({ maxEntries: 2 });
// Returns options suitable for history tests with test-specific settings
```

#### `adaptHistoryForTest`

Configures a history instance for specific tests.

```typescript
import { adaptHistoryForTest, HistoryTestMode } from "../test/historyTestUtils";

// Configure history instance for a specific test
adaptHistoryForTest(historyInstance, HistoryTestMode.MAX_ENTRIES);
```

## Test Code Extraction Strategy

These utilities are part of a broader strategy to extract test-specific code from production files:

1. **Identify Test-Specific Code:**

   - Conditional checks based on the environment (`process.env.NODE_ENV === "test"`)
   - Special case handling for specific test scenarios
   - Direct property mutations for tests

2. **Extract to Test Utilities:**

   - Create specialized functions in test utility files
   - Use test modes to control behavior
   - Replace inline conditionals with utility calls

3. **Update Tests:**
   - Configure tests to use the extracted utilities
   - Set appropriate test modes at the beginning of tests
   - Remove test-specific code from production imports

This approach keeps production code clean and focused on core functionality while providing all the necessary test infrastructure in dedicated files.

## Integration with Vitest

These utilities are designed to work with Vitest's mocking capabilities. For example:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createTestEnvironment } from "../test/testUtils";
import { setHistoryTestMode, HistoryTestMode } from "../test/historyTestUtils";

describe("History functionality", () => {
  it("should track changes correctly", async () => {
    // Set up test mode
    setHistoryTestMode(HistoryTestMode.TRACK_STORE_CHANGES);

    // Create test environment
    const { store, triggerUpdate } = createTestEnvironment({ count: 0 });

    // Create history instance (will use test mode)
    const historyInstance = history(store);

    // Test code...

    // Clean up
    setHistoryTestMode(null);
  });
});
```

## Best Practices

When using these test utilities:

1. Prefer `createTestEnvironment` over direct store mocking for most tests
2. Use `mockComputed` when testing components that use computed values
3. Set appropriate test modes at the beginning of tests
4. Clean up test modes after tests complete
5. Keep test-specific logic in test files, not in production code
6. Use the typings provided by the test utilities for better type safety
