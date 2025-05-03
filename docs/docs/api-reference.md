---
sidebar_position: 2
---

# 📚 🐿️ 🦆 API Reference

jods provides a small but powerful API for state management.

## 🧰 Core Functions

### 📦 `store(initialState)`

Creates a reactive store with the provided initial state.

**Parameters:**

| Name           | Type     | Description                        |
| -------------- | -------- | ---------------------------------- |
| `initialState` | `Object` | Initial state object for the store |

**Returns:** A reactive store object that can be modified directly

**Example:**

```js
import { store } from "jods";

const counter = store({ count: 0 });
console.log(counter.count); // 0

counter.count = 1; // Updates the store
console.log(counter.count); // 1
```

### 🪞 `json(store)`

Returns a deep-cloned plain JSON snapshot of the store, evaluating all computed properties.

**Parameters:**

| Name    | Type     | Description                         |
| ------- | -------- | ----------------------------------- |
| `store` | `Object` | A jods store created with `store()` |

**Returns:** A plain JavaScript object containing the store's state

**Example:**

```js
import { store, json, computed } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
});

// Add a computed property
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Get a JSON snapshot
const snapshot = json(user);
console.log(snapshot);
// { firstName: 'Burt', lastName: 'Macklin', fullName: 'Burt Macklin' }
```

### 👂 `onUpdate(store, callback)`

Registers a callback function that is triggered whenever the store changes.

**Parameters:**

| Name       | Type       | Description                                   |
| ---------- | ---------- | --------------------------------------------- |
| `store`    | `Object`   | A jods store created with `store()`           |
| `callback` | `Function` | Function to call when the store state changes |

**Returns:** Unsubscribe function that can be called to stop listening for updates

**Example:**

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

### 🧮 `computed(fn)`

Creates a computed property that automatically updates when its dependencies change.

**Parameters:**

| Name | Type       | Description                                              |
| ---- | ---------- | -------------------------------------------------------- |
| `fn` | `Function` | Function that computes a value based on store properties |

**Returns:** A function that returns the computed value when called

**Example:**

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

### 🔍 `diff(oldState, newState)`

Generates a detailed diff object showing changes between two states.

**Parameters:**

| Name       | Type     | Description               |
| ---------- | -------- | ------------------------- |
| `oldState` | `Object` | Previous state to compare |
| `newState` | `Object` | Current state to compare  |

**Returns:** An object detailing the differences between states

**Example:**

```js
import { store, diff } from "jods";

const before = store({ name: "Burt", age: 30 });
const after = store({ name: "Burt", age: 31 });

const changes = diff(before, after);
console.log(changes);
// { age: { __old: 30, __new: 31 } }
```

### 🕰️ `history(store, options?)`

Creates a history tracker with time-travel capabilities for a store.

**Parameters:**

| Name              | Type     | Description                                              |
| ----------------- | -------- | -------------------------------------------------------- |
| `store`           | `Object` | A jods store created with `store()`                      |
| `options`         | `Object` | Optional configuration options                           |
| `options.maxSize` | `number` | Maximum number of history entries to keep (default: 100) |

**Returns:** A history controller object with the following methods:

- ⏮️ `back()`: Move back one step in history
- ⏭️ `forward()`: Move forward one step in history
- 🔢 `travelTo(index)`: Jump to a specific point in history
- 📜 `getHistory()`: Get the full history array
- 🧹 `clear()`: Clear the history

**Example:**

```js
import { store, history, json } from "jods";

const counter = store({ count: 0 });
const counterHistory = history(counter);

// Make some changes
counter.count = 1;
counter.count = 2;

// Travel back in time
counterHistory.travelTo(0);
console.log(json(counter)); // { count: 0 }

// Move forward
counterHistory.forward();
console.log(json(counter)); // { count: 1 }
```

For more details on time-travel debugging, see the [Time-Travel Debugging](/time-travel-debugging) page.

## 🔌 Framework Integration

### ⚛️ React

**`useJods(store)`**

React hook for subscribing to a jods store.

**Parameters:**

| Name    | Type     | Description                         |
| ------- | -------- | ----------------------------------- |
| `store` | `Object` | A jods store created with `store()` |

**Returns:** The current state of the store, updated reactively

**Example:**

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

### ⚡️ Preact

**`useJods(store)`**

Preact hook for subscribing to a jods store.

**Parameters:**

| Name    | Type     | Description                         |
| ------- | -------- | ----------------------------------- |
| `store` | `Object` | A jods store created with `store()` |

**Returns:** The current state of the store, updated reactively

**Example:**

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

### 💿 Remix

jods provides first-class integration with Remix 💿, replacing traditional loaders and actions with reactive stores.

**`defineStore(options)`**

Creates a reactive store with server-side handlers and loaders.

**Parameters:**

| Name               | Type        | Description                                                     |
| ------------------ | ----------- | --------------------------------------------------------------- |
| `options`          | `Object`    | Configuration options for the store                             |
| `options.name`     | `string`    | Unique name for the store (required)                            |
| `options.schema`   | `ZodSchema` | Zod schema for type validation                                  |
| `options.defaults` | `Object`    | Default values for store properties                             |
| `options.handlers` | `Object`    | Form handler functions that process form submissions            |
| `options.loader`   | `Function`  | Async function that loads server data, similar to Remix loaders |

**Example:**

```jsx
// Define a store with server-side handlers
import { defineStore } from "jods/remix";
import { z } from "zod";

export const user = defineStore({
  name: "user",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  loader: async () => {
    // Load user data from database
    return { name: "Burt Macklin", email: "burt.macklin@fbi.pawnee.city" };
  },
  handlers: {
    async updateProfile({ current, form }) {
      // Process form submission
      return {
        ...current,
        name: form.get("name"),
        email: form.get("email"),
      };
    },
  },
});

// In your component
import { useJodsStore, useJodsForm } from "jods/remix";

function ProfileComponent() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <form {...form.props}>
      <input name="name" defaultValue={userData.name} />
      <button type="submit">Update</button>
    </form>
  );
}
```

For comprehensive documentation on Remix integration, see the [Remix Integration Guide](/remix) 💿.
