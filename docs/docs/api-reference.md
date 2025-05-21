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

### 📷 `json(store)`

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

| Name       | Type       | Description                                                                   |
| ---------- | ---------- | ----------------------------------------------------------------------------- |
| `store`    | `Object`   | A jods store created with `store()`                                           |
| `callback` | `Function` | Function called when the store state changes with both new and previous state |

**Returns:** Unsubscribe function that can be called to stop listening for updates

**Example:**

```js
import { store, onUpdate, diff } from "jods";

const counter = store({ count: 0 });

// Subscribe to changes with access to both new and old state
const unsubscribe = onUpdate(counter, (newState, oldState) => {
  console.log("Changed from", oldState.count, "to", newState.count);

  // You can directly use diff to track changes
  const changes = diff(oldState, newState);
  console.log("Changes:", changes);
});

counter.count = 1; // Logs changes and diff information

// To stop listening for updates
unsubscribe();
```

### 🧮 `computed(fn)`

Creates a computed property that automatically updates when its dependencies change.

**Parameters:**

| Name | Type       | Description                                              |
| ---- | ---------- | -------------------------------------------------------- |
| `fn` | `Function` | Function that computes a value based on store properties |

**Returns:** A marker that defines a property on the store. The computed value is accessed directly as a property (e.g., `store.computedProperty`), not as a function call.

**👀 Important:** Computed properties are **read-only** by design. Attempting to assign a value directly to a computed property will throw an error. To update a computed value, you must modify the source properties that it depends on.

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

console.log(prices.total); // 60

// Update the items
prices.items.push(40);
console.log(prices.total); // 100

// This would throw an error:
// prices.total = 200; // Error: Attempted to set non-settable computed property
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

### 🔋 `store.batch(fn, batchName?)`

Executes a function that makes multiple store updates, treating them as a single atomic update. Subscribers are notified only once after all changes are complete.

**Parameters:**

| Name        | Type       | Description                                    |
| ----------- | ---------- | ---------------------------------------------- |
| `fn`        | `Function` | Function containing multiple store updates     |
| `batchName` | `string`   | Optional name for debugging (default: unnamed) |

**Returns:** The return value of the provided function

**Example:**

```js
import { store } from "jods";

const user = store({
  firstName: "John",
  lastName: "Doe",
  isActive: false,
});

// All updates as one atomic change
user.batch(() => {
  user.firstName = "Jane";
  user.lastName = "Smith";
  user.isActive = true;
});
```

For more details on batch operations, see the [Batch Updates](/batch) page.

### 🔋 `store.beginBatch()` and `store.commitBatch()`

Manual control functions for starting and committing batch operations.

**Example:**

```js
import { store } from "jods";

const cart = store({ items: [], total: 0 });

// Start batch manually
cart.beginBatch();

// Multiple updates...
cart.items.push({ id: 1, name: "Widget", price: 10 });
cart.items.push({ id: 2, name: "Gadget", price: 20 });
cart.total = 30;

// Commit all changes as a single update
cart.commitBatch();
```

### 💾 `persist(storage, store, options?)`

Persists store state across page reloads using the specified storage mechanism.

**Parameters:**

| Name                   | Type                     | Description                                                 |
| ---------------------- | ------------------------ | ----------------------------------------------------------- |
| `storage`              | `Storage`                | Storage mechanism (localStorage, sessionStorage, or custom) |
| `store`                | `Object` or `Object[]`   | A store or array of stores to persist                       |
| `options`              | `Object`                 | Optional configuration options                              |
| `options.key`          | `string`                 | Key to use in storage (default: "jods-state")               |
| `options.version`      | `number`                 | Schema version for migrations (default: 1)                  |
| `options.migrate`      | `Function`               | Migration function for version changes                      |
| `options.partial`      | `string[]` or `Function` | Properties to include or function to select properties      |
| `options.exclude`      | `string[]`               | Properties to exclude from persistence                      |
| `options.syncDebounce` | `number`                 | Debounce interval for writes in ms (default: 100)           |
| `options.loadOnly`     | `boolean`                | Only load from storage, don't save changes                  |
| `options.onError`      | `Function`               | Error handler for storage/parsing errors                    |

**Returns:** Cleanup function to stop persistence

**Example:**

```js
import { store, persist } from "jods";

// Create a store
const settings = store({
  theme: "light",
  fontSize: 16,
  notifications: true,
});

// Basic persistence with localStorage
const cleanup = persist(localStorage, settings, {
  key: "app-settings",
});

// Later, stop persistence
cleanup();
```

#### Advanced Usage

**Selective Persistence:**

```js
// Only persist specific properties
persist(localStorage, settings, {
  key: "app-settings",
  partial: ["theme", "fontSize"],
});

// Exclude sensitive properties
persist(localStorage, settings, {
  key: "app-settings",
  exclude: ["authToken", "personalData"],
});

// Dynamic property selection
persist(localStorage, settings, {
  key: "app-settings",
  partial: (key, value) => {
    // Only persist non-private properties
    return !key.startsWith("private_");
  },
});
```

**Multiple Stores:**

```js
const userStore = store({ name: "User", preferences: {} });
const appStore = store({ theme: "dark" });

// Persist multiple stores under one key
persist(localStorage, [userStore, appStore], {
  key: "app-state",
});
```

**Versioning and Migrations:**

```js
persist(localStorage, settings, {
  key: "app-settings",
  version: 2, // Current schema version
  migrate: (oldState, oldVersion) => {
    // Convert from version 1 to version 2
    if (oldVersion === 1) {
      return {
        ...oldState,
        // Transform state for version 2
        theme: oldState.theme || "system",
        fontSize: oldState.textSize || 16, // renamed property
      };
    }
    return oldState;
  },
});
```

**Async Storage:**

```js
const asyncStorage = {
  getItem: async (key) => {
    const value = await fetchFromAPI(key);
    return value;
  },
  setItem: async (key, value) => {
    await saveToAPI(key, value);
  },
  removeItem: async (key) => {
    await deleteFromAPI(key);
  },
};

// Persistence with async storage
persist(asyncStorage, settings, {
  key: "remote-settings",
});
```

#### Helper Functions

**`getPersisted(storage, key, options?)`**

Gets persisted data without affecting any store.

```js
import { getPersisted } from "jods";

// Get persisted data
const savedSettings = getPersisted(localStorage, "app-settings");
console.log(savedSettings); // { theme: "dark", fontSize: 16 }
```

**`clearPersisted(storage, key)`**

Clears persisted data for a specific key.

```js
import { clearPersisted } from "jods";

// Clear persisted data
clearPersisted(localStorage, "app-settings");
```

**`isPersisted(store)`**

Checks if a store is currently being persisted.

```js
import { isPersisted } from "jods";

// Check if the store is persisted
if (isPersisted(settings)) {
  console.log("Settings are being persisted");
}
```

**`isPersistAvailable()`**

Checks if persistence is available in the current environment.

```js
import { isPersistAvailable } from "jods";

// Check if persistence is available
if (isPersistAvailable()) {
  // Safe to use persistence
}
```

For more details on persistence options and patterns, see the [State Persistence](/state-persistence) page.

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

**`usePersist(storage, store, options?)`**

React hook for persisting a store to storage.

**Parameters:**

| Name      | Type                   | Description                                                 |
| --------- | ---------------------- | ----------------------------------------------------------- |
| `storage` | `Storage`              | Storage mechanism (localStorage, sessionStorage, or custom) |
| `store`   | `Object` or `Object[]` | A store or array of stores to persist                       |
| `options` | `Object`               | Same options as `persist()` function                        |

**Example:**

```jsx
import { useJods, usePersist } from "jods/react";
import { store } from "jods";

// Create a store
const settings = store({
  theme: "light",
  fontSize: 16,
});

function SettingsComponent() {
  // Use the store
  const state = useJods(settings);

  // Persist with localStorage
  usePersist(localStorage, settings, {
    key: "user-settings",
  });

  return (
    <div>
      <select
        value={state.theme}
        onChange={(e) => (state.theme = e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
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

**`usePersist(storage, store, options?)`**

Preact hook for persisting a store to storage.

**Parameters:**

| Name      | Type                   | Description                                                 |
| --------- | ---------------------- | ----------------------------------------------------------- |
| `storage` | `Storage`              | Storage mechanism (localStorage, sessionStorage, or custom) |
| `store`   | `Object` or `Object[]` | A store or array of stores to persist                       |
| `options` | `Object`               | Same options as `persist()` function                        |

**Example:**

```jsx
import { useJods, usePersist } from "jods/preact";
import { store } from "jods";

// Create a store
const settings = store({
  theme: "light",
  fontSize: 16,
});

function SettingsComponent() {
  // Use the store
  const state = useJods(settings);

  // Persist with localStorage
  usePersist(localStorage, settings, {
    key: "user-settings",
  });

  return (
    <div>
      <select
        value={state.theme}
        onChange={(e) => (state.theme = e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
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

**`createCookieStorage(options)`**

Creates a persistence storage adapter using Remix cookies for server-side persistence.

**Parameters:**

| Name             | Type     | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `options`        | `Object` | Cookie configuration options               |
| `options.cookie` | `Object` | Remix cookie options (name, secrets, etc.) |

**Example:**

```jsx
import { createCookieStorage } from "jods/remix";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { store } from "jods";
import { useEffect } from "react";
import { useJods, usePersist } from "jods/react";

// Create a cookie-based storage adapter
const cookieStorage = createCookieStorage({
  cookie: {
    name: "app_settings",
    secrets: ["your-secret-key"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
});

// Create your store outside component (shared between requests)
const settingsStore = store({
  theme: "light",
  fontSize: "medium",
});

// Server-side loader (runs on each request)
export async function loader({ request }) {
  // Load persisted data from cookie
  const persistedData = await cookieStorage.getItem("user-settings");

  // Create a fresh copy for this request
  const settings = { ...settingsStore };

  if (persistedData) {
    try {
      const parsedData = JSON.parse(persistedData);
      // Update the settings with cookie data
      Object.assign(settings, parsedData);
    } catch (e) {
      console.error("Failed to parse persisted data", e);
    }
  }

  // Return settings to the client for hydration
  return json({ settings });
}

// Server-side action (runs on form submissions)
export async function action({ request }) {
  const formData = await request.formData();
  const theme = formData.get("theme");
  const fontSize = formData.get("fontSize");

  // Create response
  const response = redirect("/settings");
  const headers = new Headers(response.headers);

  // Save to cookie with proper headers
  await cookieStorage.setItem(
    "user-settings",
    JSON.stringify({
      theme,
      fontSize,
    }),
    { headers }
  );

  // Return response with cookie headers
  return new Response(null, {
    status: response.status,
    headers,
  });
}

// Client-side component
export default function SettingsPage() {
  const { settings } = useLoaderData();

  // Create client-side store
  const clientStore = store({
    theme: "light",
    fontSize: "medium",
  });

  // First hydrate from server data
  useEffect(() => {
    Object.assign(clientStore, settings);
  }, [settings]);

  // Then set up client-side persistence (browser storage)
  usePersist(typeof window !== "undefined" ? localStorage : null, clientStore, {
    key: "user-settings",
  });

  // Use the store in UI
  const state = useJods(clientStore);

  return (
    <div>
      <h1>Settings</h1>
      <Form method="post">
        <label>
          Theme:
          <select name="theme" defaultValue={state.theme}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label>
          Font Size:
          <select name="fontSize" defaultValue={state.fontSize}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <button type="submit">Save</button>
      </Form>
    </div>
  );
}
```

This example demonstrates:

1. Creating a cookie storage adapter for server-side persistence
2. Loading settings from cookies in the loader
3. Saving settings to cookies in the action with proper header handling
4. Hydrating the client store with server data
5. Setting up client-side persistence with `usePersist`
6. Using the store in a React component with `useJods`

For comprehensive documentation on Remix integration, see the [Remix Integration Guide](/remix) 💿.

### Store

Creates a reactive store that can be directly mutated.

```js
import { store } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
});

// Direct property access & mutation
console.log(user.firstName); // "Burt"
user.firstName = "Agent";
```

#### Implementation Details

The store uses a signal-based implementation for fine-grained reactivity:

- Each property in the store is backed by a signal (read/write pair)
- Subscribers only re-run when properties they actually access change
- Property dependencies are tracked automatically when subscribers run
- Updates only notify the subscribers that depend on the changed properties
- Adding new properties dynamically is fully supported

#### Subscription Behavior

```js
// Subscribe to changes in the store
const unsubscribe = store.subscribe((state) => {
  // This function runs once immediately when subscribed
  // to track which properties you access
  console.log("Current count:", state.count);

  // Then it will run again only when those properties change
});

// Later, stop receiving updates
unsubscribe();
```

The `subscribe` function automatically:

1. Tracks which properties are accessed during the subscriber function
2. Only notifies your subscriber when those specific properties change
3. Re-tracks dependencies each time your function runs (for dynamic dependencies)
4. Treats subscribers that don't access any properties as global subscribers

When calling `unsubscribe()`:

1. The subscriber is immediately removed from all internal tracking maps
2. All signal-level subscriptions are properly cleaned up
3. The subscriber will never be called again for any state changes
4. All references are removed, preventing memory leaks

For more details on the reactivity system, see the [Fine-grained Reactivity](/fine-grained-reactivity) page.

#### API

```ts
function store<T extends Record<string, any>>(initialState: T): T & Store<T>;

interface Store<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(subscriber: (state: T) => void): () => void;
}
```

#### Methods

| Method              | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `getState()`        | Returns the current state object                                            |
| `setState(partial)` | Updates multiple properties at once (direct property mutation is preferred) |
| `subscribe(fn)`     | Subscribes to state changes with automatic dependency tracking              |

```

```
