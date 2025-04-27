---
sidebar_position: 2
---

# API Reference

jods provides a small but powerful API for state management.

## Core Functions

### `store(initialState)`

Creates a reactive store with the provided initial state.

```js
import { store } from "jods";

const counter = store({ count: 0 });
console.log(counter.count); // 0

counter.count = 1; // Updates the store
console.log(counter.count); // 1
```

### `json(store)`

Returns a deep-cloned plain JSON snapshot of the store, evaluating all computed properties.

```js
import { store, json, computed } from "jods";

const user = store({
  firstName: "John",
  lastName: "Doe",
});

// Add a computed property
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Get a JSON snapshot
const snapshot = json(user);
console.log(snapshot);
// { firstName: 'John', lastName: 'Doe', fullName: 'John Doe' }
```

### `onUpdate(store, callback)`

Registers a callback function that is triggered whenever the store changes.

```js
import { store, onUpdate } from "jods";

const counter = store({ count: 0 });

// Subscribe to changes
const unsubscribe = onUpdate(counter, (newState) => {
  console.log("New state:", newState);
});

counter.count = 1; // Logs: New state: { count: 1 }

// To stop listening for updates
unsubscribe();
```

### `computed(fn)`

Creates a computed property that automatically updates when its dependencies change.

```js
import { store, computed } from "jods";

const prices = store({
  items: [10, 20, 30],
});

// Add a computed property
prices.total = computed(() =>
  prices.items.reduce((sum, price) => sum + price, 0)
);

console.log(prices.total()); // 60

// Update the items
prices.items.push(40);
console.log(prices.total()); // 100
```

### `diff(oldState, newState)`

Generates a detailed diff object showing changes between two states.

```js
import { store, diff } from "jods";

const before = store({ name: "John", age: 30 });
const after = store({ name: "John", age: 31 });

const changes = diff(before, after);
console.log(changes);
// { age: { __old: 30, __new: 31 } }
```

## Framework Integration

### React

```jsx
import { useJods } from "jods/react";
import { store } from "jods";

// Create a store
const counter = store({ count: 0 });

function Counter() {
  // Hook into the store
  const state = useJods(counter);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
}
```

### Preact

```jsx
import { useJods } from "jods/preact";
import { store } from "jods";

// Create a store
const counter = store({ count: 0 });

function Counter() {
  // Hook into the store
  const state = useJods(counter);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
}
```
