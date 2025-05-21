---
sidebar_position: 4
title: State Update Flow
description: Visual guide to understanding how jods handles state updates
---

# State Update Flow

This guide provides a visual explanation of how jods processes state updates, helping you understand the internal mechanics of the library.

## Basic State Update Flow

When you update a value in a jods store, several steps occur in sequence:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Property       │         │  Proxy Handler  │         │  State Update   │
│  Assignment     │────────▶│  Intercepts     │────────▶│  Processing     │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                                                │
                                                                │
                                                                ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Subscriber     │◀────────│  Dependency     │◀────────│  Value Change   │
│  Notifications  │         │  Tracking       │         │  Detection      │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### 1. Property Assignment

It all begins when you assign a value to a property in your store:

```js
store.user.name = "Alice";
```

### 2. Proxy Handler Intercepts

The jods proxy handler intercepts this assignment operation:

```js
// Inside jods proxy handler
set(target, prop, value, receiver) {
  // Check if the value is actually changing
  const currentVal = Reflect.get(target, prop, receiver);
  const valueActuallyChanged = !Object.is(currentVal, value);

  // Proceed with update if the value is changing
  if (valueActuallyChanged) {
    // ...processing continues
  }

  return true;
}
```

### 3. State Update Processing

jods processes the update, handling special cases like:

- Computed properties
- Circular references
- Type changes (e.g., from object to primitive)

### 4. Value Change Detection

The library determines if the value actually changed:

```js
// Only if the value truly changed (not just same reference)
// will we proceed to notify subscribers
if (valueActuallyChanged) {
  notifySubscribers(path);
}
```

### 5. Dependency Tracking

jods identifies which computed properties and subscribers depend on the changed value:

```
┌───────────────────┐
│ store.user.name   │──────┐
└───────────────────┘      │
                           │  depends on
┌───────────────────┐      │
│ store.displayName │◀─────┘
└───────────────────┘
```

### 6. Subscriber Notifications

Finally, all affected subscribers are notified about the change:

```js
// Pseudocode for notification
function notifySubscribers(path) {
  for (const subscriber of subscribers) {
    if (subscriber.watchesPath(path)) {
      subscriber.callback(currentState);
    }
  }
}
```

## Computed Properties Flow

Computed properties add another layer to the update flow:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  State Value    │         │  Computed       │         │  Dependency     │
│  Changes        │────────▶│  Property       │────────▶│  Tracking       │
│                 │         │  Triggered      │         │  System         │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                                                │
                                                                │
                                                                ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Subscriber     │◀────────│  Computed       │◀────────│  Computed Value │
│  Notifications  │         │  Value Cache    │         │  Recalculation  │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

When a computed property's dependencies change:

1. The dependecy tracking system identifies affected computed properties
2. jods recalculates the computed value only if dependencies changed
3. The new computed value is cached
4. Subscribers to the computed property are notified

## Nested Updates

For nested updates, the flow is similar but includes path tracking:

```
store.user.contact.address.city = 'New York';

Path: ['user', 'contact', 'address', 'city']
```

This generates multiple update paths:

```
['user', 'contact', 'address', 'city']
['user', 'contact', 'address']
['user', 'contact']
['user']
```

Each path is processed for dependency tracking.

## Circular Reference Handling

jods handles circular references with special tracking:

```
┌─────────────────┐                  ┌─────────────────┐
│                 │                  │                 │
│  Object A       │                  │  Object B       │
│                 │──────────────────▶                 │
│                 │                  │                 │
└─────────────────┘                  └─────────────────┘
         ▲                                    │
         │                                    │
         └────────────────────────────────────┘
```

During operations like `json()` or `diff()`, jods detects cycles:

```js
// Simplified pseudocode
function processValue(value, visited = new WeakMap()) {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  // Check for circular reference
  if (visited.has(value)) {
    return { __circular: true, reference: /* reference path */ };
  }

  // Mark as visited
  visited.set(value, true);

  // Process object properties
  // ...
}
```

## Batch Update Flow (Coming Soon)

The upcoming batching feature will change the flow slightly:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Multiple       │         │  Batch          │         │  Collect All    │
│  State Updates  │────────▶│  Context        │────────▶│  Changes        │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                                                │
                                                                │
                                                                ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Subscriber     │◀────────│  Apply All      │◀────────│  Optimize       │
│  Notifications  │         │  Changes        │         │  Changes        │
│  (Once)         │         │  At Once        │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

This pattern will:

1. Collect multiple changes in a queue
2. Optimize changes (e.g., remove redundant operations)
3. Apply all changes in a single operation
4. Notify subscribers only once after all changes are applied

## Complete Internal Flow Diagram

This more detailed diagram shows the complete internal flow:

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                      User Code                                │
│                                                               │
│   store.user.name = 'Alice';     console.log(store.fullName)  │
│         │                                  │                  │
└─────────┼──────────────────────────────────┼──────────────────┘
          ▼                                  ▼
┌─────────────────────┐             ┌──────────────────────┐
│                     │             │                      │
│  Proxy Set Handler  │             │  Proxy Get Handler   │
│                     │             │                      │
└─────────┬───────────┘             └──────────┬───────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────┐             ┌──────────────────────┐
│                     │             │                      │
│  Value Change       │             │  Signal Tracker      │
│  Detection          │             │                      │
│                     │             │                      │
└─────────┬───────────┘             └──────────┬───────────┘
          │                                    │
          ▼                                    │
┌─────────────────────┐                        │
│                     │                        │
│  Dependency         │◀───────────────────────┘
│  Tracking System    │
│                     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐             ┌──────────────────────┐
│                     │             │                      │
│  Affected Computed  │────────────▶│  Compute Value       │
│  Properties         │             │                      │
│                     │             │                      │
└─────────┬───────────┘             └──────────┬───────────┘
          │                                    │
          ▼                                    │
┌─────────────────────┐                        │
│                     │◀───────────────────────┘
│  Subscription       │
│  System             │
│                     │
└─────────┬───────────┘
          │
          ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                    Subscriber Callbacks                       │
│                                                               │
│   UI Updates         Side Effects        Other Computations   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Key Insights

Understanding this flow helps you optimize your jods usage:

1. **Value Change Detection**: jods only triggers updates when values actually change
2. **Computed Property Efficiency**: Computed properties only recalculate when dependencies change
3. **Path-Based Subscriptions**: Subscribe to specific paths for more efficient updates
4. **Circular Reference Safety**: Circular references are handled gracefully
5. **Batch Updates (Coming)**: Will group changes for more efficient processing

## Framework Integration Flow

When using jods with React, Preact, or other frameworks, the update flow extends:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  jods Store     │         │  Framework      │         │  Component      │
│  Update         │────────▶│  Integration    │────────▶│  Re-render      │
│                 │         │  Hook           │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

For example, with React:

```jsx
import { useStore } from "jods/react";

function UserProfile() {
  // Subscribe component to store changes
  const store = useStore(userStore);

  // Component re-renders when relevant store parts change
  return <div>{store.user.name}</div>;
}
```

## Further Reading

To understand more about jods internals:

- [API Reference](../api-reference.md)
- [Performance Best Practices](./performance-best-practices.md)
- [Complex State Patterns](./complex-state-patterns.md)
- [Fine-Grained Reactivity](../fine-grained-reactivity.md)
