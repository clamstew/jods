---
sidebar_position: 2
title: Performance Best Practices
description: Optimize your jods implementation for maximum performance
---

# Performance Best Practices

## Introduction

jods is designed to be lightweight and efficient, but like any reactive state management system, improper usage can lead to performance issues. This guide covers best practices to ensure your jods implementation remains performant, even with complex state structures.

## Understanding Reactivity in jods

jods uses a proxy-based reactivity system to track property access and mutations. When you update a property, jods:

1. Detects the change through its proxy handler
2. Compares the new value with the old value
3. Updates internal state
4. Notifies subscribers of the change

Understanding this flow helps optimize your usage patterns.

## Key Performance Principles

### 1. Minimize Unnecessary Subscriptions

Each subscription adds overhead to state updates. Consider these practices:

```js
// ❌ Subscribing to everything
store.subscribe(() => {
  // Re-runs on ANY state change
  doSomething();
});

// ✅ Subscribe to specific paths
store.subscribe(() => {
  // Only runs when user.preferences changes
  doSomething();
}, [["user", "preferences"]]);
```

### 2. Use Computed Properties Effectively

Computed properties are recalculated only when their dependencies change:

```js
// ❌ Recalculating in a subscriber
store.subscribe(() => {
  const total = store.items.reduce((sum, item) => sum + item.price, 0);
  updateTotal(total);
});

// ✅ Using computed properties
store.total = computed(() => {
  return store.items.reduce((sum, item) => sum + item.price, 0);
});
store.subscribe(() => {
  updateTotal(store.total);
}, [["total"]]);
```

### 3. Avoid Deep Nesting When Possible

Deeply nested state can cause performance issues:

```js
// ❌ Very deep nesting
store.level1.level2.level3.level4.level5.value = newValue;

// ✅ Flatter structures
store.settings = {
  ui: {
    /* UI settings */
  },
  data: {
    /* Data settings */
  },
  permissions: {
    /* Permission settings */
  },
};
```

### 4. Handle Complex Data Structures Correctly

jods has optimized handling for circular references and complex objects:

```js
// ✅ jods handles circular references gracefully
const user = { name: "Alice" };
user.self = user; // Circular reference
store.user = user; // This works fine in jods
```

However, avoid creating circular references unnecessarily as they add complexity.

### 5. Batch Updates When Possible

When making multiple related updates, batching can improve performance:

```js
// ❌ Multiple individual updates
store.user.firstName = "John";
store.user.lastName = "Doe";
store.user.email = "john@example.com";

// ✅ Single batch update (future enhancement)
// Batching API coming soon:
// batch(() => {
//   store.user.firstName = 'John';
//   store.user.lastName = 'Doe';
//   store.user.email = 'john@example.com';
// });

// ✅ Alternative approach with object assignment
store.user = {
  ...store.user,
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
};
```

### 6. Optimize State Structure for Access Patterns

Structure your state based on how it's accessed:

```js
// ❌ Misaligned structure for access patterns
// If you frequently access user permissions but rarely access user preferences
store.user = {
  info: {
    /* ... */
  },
  preferences: {
    /* ... */
  },
  permissions: {
    /* ... */
  },
};

// ✅ Structure aligned with access patterns
store.userInfo = {
  /* ... */
};
store.userPreferences = {
  /* ... */
}; // Rarely accessed
store.userPermissions = {
  /* ... */
}; // Frequently accessed
```

## Advanced Performance Techniques

### Use Selector Functions for Precise Subscriptions

Create selector functions to target specific parts of your state:

```js
const selectActiveUsers = (store) =>
  store.users.filter((user) => user.status === "active");

// In a React component:
const activeUsers = useSelector(store, selectActiveUsers);
```

### Memoize Expensive Computations

For computations that are expensive but don't change often:

```js
let lastInputs = null;
let lastResult = null;

store.expensiveComputation = computed(() => {
  const inputs = [store.data1, store.data2];

  // If inputs haven't changed, return cached result
  if (
    lastInputs &&
    lastInputs[0] === inputs[0] &&
    lastInputs[1] === inputs[1]
  ) {
    return lastResult;
  }

  // Calculate new result
  lastInputs = [...inputs];
  lastResult = performExpensiveCalculation(inputs);
  return lastResult;
});
```

### Consider Data Structure Size

Large arrays or deeply nested objects can impact performance:

```js
// ❌ Storing too much in a single store
store.allItems = [...thousandsOfItems];

// ✅ Pagination or virtualization
store.currentPageItems = items.slice(pageStart, pageEnd);
store.pagination = {
  currentPage: 1,
  totalPages: Math.ceil(items.length / pageSize),
  pageSize: 20,
};
```

## Upcoming Performance Features

The jods team is working on several performance-focused enhancements:

1. **Batched Updates API**: Group multiple updates to reduce notification overhead
2. **Middleware Support**: Intercept store operations for custom optimization
3. **Enhanced Selector API**: More targeted subscriptions for precise reactivity

## Performance Debugging

If you encounter performance issues:

1. Check the number and scope of your subscriptions
2. Review the structure of your state object
3. Look for unnecessary deep nesting or circular references
4. Consider using more granular computed properties
5. Verify that you're not running expensive calculations in subscription callbacks

## Further Reading

- [API Reference](../api-reference.md) - Detailed API information
- [Fine-Grained Reactivity](../fine-grained-reactivity.md) - Deep dive into the reactivity system
- [Examples](../examples.md) - Code examples demonstrating best practices
