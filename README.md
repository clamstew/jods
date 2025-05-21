<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/static/img/favicon/dark/favicon-dark-512.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/static/img/favicon/light/favicon-light-512.png">
    <img alt="jods logo" src="https://raw.githubusercontent.com/clamstew/jods/main/assets/jods_logo_light.png" width="100">
  </picture>
</div>

> [!WARNING] **⚠️This project is experimental and was largely AI-generated.⚠️**<br />
> Please do not use it in production environments.

<br /><br /><br />

# 🐿️ 🦆 jods — JavaScript Object Dynamics System

![CI](https://github.com/clamstew/jods/workflows/CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/jods.svg)](https://www.npmjs.com/package/jods)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/jods)](https://bundlephobia.com/package/jods)
[![npm downloads](https://img.shields.io/npm/dm/jods.svg)](https://www.npmjs.com/package/jods)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/clamstew/jods/blob/main/LICENSE)

> "Got state to track? Just jods it down"

![jods](https://raw.githubusercontent.com/clamstew/jods/main/assets/headline_repo_readme_image.png)

A fun, intuitive reactive state library that makes JavaScript objects come alive. Build lightweight stores that respond to changes, compute derived values, and keep your application state in sync - all with a simple, playful API that feels natural to use.

## ❓ Why JODS?

- ☁️ Zero dependencies
- 🧠 Computed values are built-in
- ⚡ Works with React/Preact via useSyncExternalStore
- 📷 Built-in deep cloning with json()
- 🧬 Minimal API, no boilerplate actions or reducers
- 🔍 Diff detection baked in
- 🧩 Framework agnostic, but integrates well with React/Preact
- 🧬 Cheeky name relation to Zod (jods/j as zod/z)

## ✨ Features

- 🔄 Tiny reactive store (`jods.store`) with subscription
- 📸 Lazy JSON snapshots (`jods.json()`)
- 🧮 Built-in computed fields (`computed`)
- 🔍 Smart diff/patching (`jods.diff()`)
- 🪝 Middleware-like hooks (`onUpdate`)
- 🔋 Batched updates for atomic state changes (`store.batch()`)
- 🧩 Zod integration: `j` and `jod` aliases for a curated subset of Zod's API (or use Zod directly for full functionality). See [Zod Integration](#zod-integration-detailed) for details.
- 💾 State persistence across page reloads (`jods.persist()`)
- 🗄️ Pre-built storage adapters for various persistence backends (`jods/persist/adapters`)
- 🪶 Zero-dependency, ES module + CJS support
- 🛡️ Fully type-safe with complete TypeScript definitions
- 🔄 Server-Client Synchronization: State is automatically hydrated from server to client
- 📝 Form Handling: Built-in form utilities with validation
- 🛡️ Type Safety: Full TypeScript and Zod schema support with `z`, `j`, or `jod`
- ⚡ Optimistic Updates: Manage pending state with useJodsFetchers
- 🌐 Real-time Synchronization: Bidirectional state syncing with WebSockets and BroadcastChannel

## 📦 Installation

```bash
npm install jods
```

## 🚀 Usage

```
import { store, json, onUpdate, computed } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Subscribe to changes - callbacks trigger for EACH property change
onUpdate(user, (newUserState) => {
  console.log("User state updated:", json(newUserState));
  // Updates fire granularly, once per property change:
  // 1st update: { firstName: "Burt Macklin", lastName: "Macklin", mood: "curious" }
  // 2nd update: { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky" }
  // 3rd update: { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
});

// Mutate existing fields - each change triggers the onUpdate callback
user.firstName = "Burt Macklin";
user.mood = "sneaky";

// Add new computed field - also triggers onUpdate
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(json(user)); // { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
```

### ⚡ Batched Updates for Performance

When making multiple updates to a store, use batching to improve performance by reducing the number of notification callbacks:

```
import { store, onUpdate } from "jods";

const userProfile = store({
  name: "John",
  age: 30,
  location: "New York",
  preferences: {
    theme: "light",
    notifications: true
  }
});

// Without batching, this triggers 3 separate updates
onUpdate(userProfile, () => console.log("Profile updated!")); // Will log 3 times

userProfile.name = "Alice";       // First update
userProfile.age = 32;             // Second update
userProfile.location = "Chicago"; // Third update

// With batching, all changes are applied in a single update
userProfile.batch(() => {
  userProfile.name = "Bob";
  userProfile.age = 35;
  userProfile.location = "San Francisco";
  userProfile.preferences.theme = "dark";
}, "update-profile"); // Optional name for debugging

// Logs just once after all changes are applied
```

For cases where you need more control or want to apply updates over time:

```
// Start batching updates but don't apply them immediately
userProfile.beginBatch("profile-update");

// Make some changes (no notifications yet)
userProfile.name = "Charlie";
userProfile.age = 40;

// Later, maybe in a callback or after an async operation
setTimeout(() => {
  // Make more changes
  userProfile.location = "Austin";
  userProfile.preferences.notifications = false;

  // Now commit all changes at once and notify subscribers
  userProfile.commitBatch();
}, 1000);
```

Batching provides these key benefits:

- **Performance**: Reduces render cycles in UI frameworks
- **Consistency**: Ensures subscribers only see the final state
- **Atomicity**: All related changes are applied together
- **Computed Values**: Computed properties are only evaluated once

Use the optional batch name parameter for easier debugging.

### ⚛️ React/Preact Integration

JODS now includes built-in React/Preact support via dedicated entry points:

```jsx
// For React
import { useJods } from "jods/react";

// For Preact
import { useJods } from "jods/preact";

// Create a store
const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Add a computed property
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Component usage (works with both React and Preact)
function Profile() {
  // Use the hook with your store
  const state = useJods(user);

  return (
    <div>
      <p>
        Name: {state.firstName} {state.lastName}
      </p>
      <p>Mood: {state.mood}</p>
      {state.fullName && <p>Full name: {state.fullName}</p>}

      <button onClick={() => (state.firstName = "Burt Macklin")}>
        Go Undercover
      </button>

      <button onClick={() => (state.mood = "sneaky")}>Change Mood</button>
    </div>
  );
}
```

The React hook works with React 16.8+ and uses `useSyncExternalStore` for React 18+ with a compatibility layer for older versions. The Preact hook uses Preact's native hooks API for optimal performance.

### 🧪 TypeScript Support

jods is built with TypeScript and provides full type definitions for all its APIs:

```ts
import { store, computed } from "jods";
import type { ComputedValue } from "jods";

// Define state interface (optional but recommended)
interface UserState {
  firstName: string;
  lastName: string;
  age: number;
  fullName?: ComputedValue<string>; // Will be added later
}

// Create typed store
const user = store<UserState>({
  firstName: "Burt",
  lastName: "Macklin",
  age: 30,
});

// TypeScript will enforce the correct shape
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Type error! Property 'invalid' does not exist
// user.invalid = "value";
```

### 🔄 Change Tracking

Track changes between store states - great for logging or syncing:

```js
// Track changes using diff
import { store, onUpdate, diff } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Subscribe with diff tracking
onUpdate(user, (newUserState, oldUserState) => {
  console.log("Change detected:", diff(oldUserState, newUserState));
  // Example output: { firstName: ["Burt", "Burt Macklin"], mood: ["curious", "sneaky"] }
});

user.firstName = "Burt Macklin";
user.mood = "sneaky";
```

## 🧠 API

### 📦 `store(initialState: object)`

Creates a reactive store object. Direct mutations are tracked.

### 📷 `json(store)`

Returns a deep-cloned plain JSON snapshot of the store.

### 👂 `onUpdate(store, callback)`

Calls `callback(newState)` whenever any key is updated.

### 🧠 `computed(fn)`

Returns a reactive getter. Automatically re-runs when deps change.

### 🛠️ `store.batch(fn, batchName?)`

Batches multiple store updates into a single notification. Useful for performance optimization when making several state changes.

```js
// Updates are batched - subscribers only notified once after all changes
userStore.batch(() => {
  userStore.name = "Alice";
  userStore.age = 32;
  userStore.location = "San Francisco";
  userStore.preferences.theme = "dark";
}, "update-user-profile"); // Optional batch name for debugging
```

### 🛠️ `store.beginBatch()` and `store.commitBatch()`

Alternative API for manual batching when a functional approach isn't suitable. Useful for cases where you need to perform operations over time before committing changes.

```js
// Start batching updates
userStore.beginBatch("profile-update"); // Optional batch name for debugging

// These operations won't trigger notifications yet
userStore.name = "Bob";
userStore.age = 40;

// You can do other work between updates
setTimeout(() => {
  userStore.location = "Chicago";

  // Apply all changes and notify subscribers once
  userStore.commitBatch();
}, 1000);
```

Batch operations are optimized to:

- Support nested batches that properly merge changes up to parent batches
- Correctly evaluate computed properties only once after all changes are applied
- Efficiently track and apply changes with minimal overhead
- Notify subscribers only once with all changes consolidated

### 🔍 `diff(before, after)`

Returns a deep diff object of changes between two snapshots.

### 🕰️ `history(store, options?)`

Creates a history tracker with time-travel capabilities. See the [Time-Travel Debugging](#time-travel-debugging) section for details.

### 💾 `persist(storage, store, options?)`

Persists store state across page reloads using the specified storage. See the [State Persistence](#state-persistence) section for details.

### 🔄 `sync(socket, store, options?)`

Enables bidirectional state synchronization between stores over socket-like connections (WebSockets, BroadcastChannel, etc.). See the [Real-Time Synchronization](#real-time-synchronization) section for details.

```js
// Basic usage with WebSocket
const socket = new WebSocket("wss://example.com");
const stopSync = sync(socket, store);

// With options for security and performance
const stopSync = sync(socket, store, {
  allowKeys: ["publicData"], // Only sync these properties
  throttleMs: 300, // Limit update frequency
  onError: (err) => console.error("Sync error:", err),
});
```

### 🧩 <a name="zod-integration-detailed"></a>`j` & `jod` (Zod Integration)

`j` and `jod` are aliases providing convenient access to a **curated subset** of Zod's `z` API. This allows for quick use of common Zod functionalities directly through jods, while maintaining the playful naming convention (j/jod is to jods as z is to zod).

**Key Points:**

- You must still install Zod: `pnpm install zod` (or npm/yarn).
- `j`/`jod` expose common Zod methods (e.g., `j.string()`, `j.object()`, `j.optional()`, `j.parse()`).
- For advanced features or methods not available via `j`/`jod`, import and use `z` directly from Zod: `import { z } from 'zod';`.
- Attempting to use a non-exposed Zod method via `j`/`jod` will result in an error, guiding you to use Zod directly and listing the available methods.
- For comprehensive details, see the [Zod Integration Guide](./docs/docs/zod-integration.md).

```js
import { j, jod } from "jods/zod";
// For Remix projects, they are also conveniently exported from:
// import { j, jod } from "jods/remix";
import { z } from "zod"; // Still need to install & import Zod for full functionality!

// Define schemas using j (for exposed methods)
const UserSchema = j.object({
  id: j.string().uuid(),
  name: j.string().min(2),
  email: j.string().email().optional(),
});

// For non-exposed or more complex schemas, use z:
const AdvancedSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("a"), a: z.string() }),
  z.object({ type: z.literal("b"), b: z.number() }),
]);
```

## 📚 Example: API Ready Snapshot

```js
app.get("/api/user", (req, res) => {
  res.json(json(user));
});
```

## 📊 Comparison with other libraries

It's just an object (kind of) with some helper methods 🤷

### JODS vs [Zustand](https://github.com/pmndrs/zustand) vs [Preact Signals](https://preactjs.com/guide/v10/signals/)

| Feature               | jods                              | [Zustand](https://github.com/pmndrs/zustand)             | [Preact Signals](https://preactjs.com/guide/v10/signals/) |
| --------------------- | --------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Framework Dependency  | 🙌 None                           | React-only                                               | Preact-only                                               |
| State Access          | Proxied object (`store.foo`)      | Hook (`useStore`)                                        | Signal `.value` or JSX unwrap                             |
| Updates               | Direct mutation (`store.foo = x`) | Direct mutation                                          | `signal.value = x`                                        |
| Computed Values       | ✅ via `computed()`               | 😬 with selector functions                               | ✅ via `computed()`                                       |
| Built-in JSON         | ✅ deep clone & computed eval     | ❌ (manual)                                              | ❌ (manual or serialize signals)                          |
| Built-in diff         | ✅                                | ❌                                                       | ❌                                                        |
| Dev Tools             | Not yet                           | ✅ [Zustand](https://github.com/pmndrs/zustand) DevTools | ❌                                                        |
| Middleware            | 🔮 Planned                        | ✅                                                       | ❌                                                        |
| Conceptual Simplicity | ✅ very small mental model        | ✅ (no actions/selectors)                                | ❌ (signals take time to grok)                            |

### On [Zustand](https://github.com/pmndrs/zustand) vs [Redux](https://redux.js.org/)

**[Zustand](https://github.com/pmndrs/zustand)** is popular because it ditched [Redux](https://redux.js.org/)'s ceremony — no need for:

- action creators<sup>\*\*</sup>
- switch statements<sup>\*\*</sup>
- reducers<sup>\*\*</sup>

\*\* [Redux Toolkit](https://redux-toolkit.js.org/tutorials/quick-start) state slices help reduce this boilerplate.

**Jods** takes that even further by saying:

- Just use the object, and subscribe if you care.
- It's like `useState`, but global and smarter.

## 🗺️ Roadmap

- ~~Add time-travel debugging (`jods.history()`)~~ ✅ Implemented!
- ~~Built-in persistence (`jods.persist(localStorage)`)~~ ✅ Implemented!
- ~~Remote syncing (`jods.sync(socket)`)~~ ✅ Implemented!
- Enhanced developer tools and visualization
- Server-side rendering optimizations
- Data streaming and real-time subscriptions

## 🕰️ Time-Travel Debugging

JODS includes time-travel debugging capability, allowing you to track state changes and jump back to previous states:

```js
import { store, history, json } from "jods";

// Create a store
const counter = store({ count: 0 });

// Create a history tracker
const counterHistory = history(counter);

// Make some changes
counter.count = 1;
counter.count = 2;
counter.count = 3;

// Time travel to first state
counterHistory.travelTo(0);
console.log(json(counter)); // { count: 0 }

// Move forward
counterHistory.forward();
console.log(json(counter)); // { count: 1 }

// Jump to latest state
counterHistory.travelTo(counterHistory.getEntries().length - 1);
console.log(json(counter)); // { count: 3 }
```

For React applications, you can use the built-in debugger component:

```jsx
import { store } from "jods";
import { useJods, createDebugger } from "jods/react";

// Create a store
const appStore = store({ count: 0 });

// Create a debugger component
const AppDebugger = createDebugger(appStore, {
  position: "bottom", // or 'right'
  showDiff: true,
  maxEntries: 50,
});

function App() {
  const state = useJods(appStore);

  return (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>

      {/* Add the debugger component (only included in development) */}
      <AppDebugger />
    </div>
  );
}
```

## 🔄 Real-Time Synchronization

JODS includes a powerful sync API for bidirectional state synchronization over WebSockets, BroadcastChannel, or any socket-like interface:

```js
import { store, sync } from "jods";

// Create a store
const chatStore = store({
  messages: [],
  users: [],
  status: "disconnected",
});

// Connect to WebSocket
const socket = new WebSocket("wss://chat-server.example.com");

// Start syncing with security and performance options
const stopSync = sync(socket, chatStore, {
  // Only sync specific properties for security
  allowKeys: ["messages", "users", "status"],

  // Never sync sensitive data even if nested under allowed keys
  sensitiveKeys: ["users.*.password", "users.*.email"],

  // Throttle updates to reduce network traffic
  throttleMs: 300,

  // Error handling
  onError: (err) => {
    console.error("Sync error:", err);
    chatStore.status = "error";
  },
});

// Updates to the store will be sent to the server
chatStore.messages.push({
  id: Date.now(),
  user: "User1",
  text: "Hello world",
  timestamp: Date.now(),
});

// And updates from the server will be applied to the store

// When done, clean up
stopSync();
socket.close();
```

For React applications:

```jsx
import { useEffect, useState } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Create a store
const chatStore = store({
  messages: [],
  users: [],
  status: "disconnected",
});

function ChatApp() {
  const state = useJods(chatStore);

  // Set up WebSocket connection
  useEffect(() => {
    const socket = new WebSocket("wss://chat-server.example.com");

    socket.addEventListener("open", () => {
      chatStore.status = "connected";
    });

    socket.addEventListener("close", () => {
      chatStore.status = "disconnected";
    });

    // Start syncing
    const stopSync = sync(socket, chatStore);

    // Clean up
    return () => {
      stopSync();
      socket.close();
    };
  }, []);

  return (
    <div>
      <div className={`status ${state.status}`}>{state.status}</div>

      <div className="messages">
        {state.messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          chatStore.messages.push({
            id: Date.now(),
            user: "Me",
            text: `Message at ${new Date().toLocaleTimeString()}`,
            timestamp: Date.now(),
          });
        }}
      >
        Send Message
      </button>
    </div>
  );
}
```

For cross-tab synchronization, use BroadcastChannel:

```js
// In each tab
import { store, sync } from "jods";

const sharedStore = store({
  theme: "light",
  count: 0,
  user: {
    name: "Anonymous",
    preferences: {},
  },
});

// Create a channel with a unique name
const channel = new BroadcastChannel("app-state");

// Start syncing between tabs
const stopSync = sync(channel, sharedStore);

// Changes in one tab will automatically update in other tabs
sharedStore.count++;
sharedStore.theme = "dark";
sharedStore.user.preferences.fontSize = 16;
```

The sync API provides advanced features for security, performance, and customization:

- **Security**: Control what data can be synced with `allowKeys`, `allowPaths`, and `sensitiveKeys`
- **Performance**: Optimize network usage with `throttleMs` and efficient change detection
- **Validation**: Validate incoming data with `validateSchema` or `onPatchReceive` callback
- **Customization**: Transform data with filter functions and callbacks
- **Multiplexing**: Use multiple stores over one connection with the `prefix` option

See the full [Sync API Documentation](https://clamstew.github.io/jods/docs/sync/api-reference) for more details.

## 📚 Documentation

The project documentation is built with Docusaurus and can be run locally:

```bash
# Navigate to docs directory
cd docs

# Start the development server
pnpm start
```

The documentation will be available at http://localhost:3000/jods/

### Available Documentation

- **Core Guides**

  - [Getting Started](https://clamstew.github.io/jods/docs/intro)
  - [API Reference](https://clamstew.github.io/jods/docs/api-reference)
  - [Framework Integrations](https://clamstew.github.io/jods/docs/guides/framework-integrations)
  - [Testing Guide](https://clamstew.github.io/jods/docs/guides/testing-guide)
  - [Time-Travel Debugging](https://clamstew.github.io/jods/docs/time-travel-debugging)

Please visit the [full documentation site](https://clamstew.github.io/jods/) for complete details on all features and APIs.

## 🤝 Contributing

We love your input! We want to make contributing to `jods` as easy and transparent as possible, whether it's:

- [Reporting a bug](https://github.com/clamstew/jods/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=%5BBUG%5D+)
- [Discussing the current state of the code](https://github.com/clamstew/jods/issues/new?assignees=&labels=discussion&projects=&template=code_discussion.md&title=%5BDISCUSSION%5D+)
- [Submitting a fix](https://github.com/clamstew/jods/issues/new?assignees=&labels=fix&projects=&template=submit_fix.md&title=%5BFIX%5D+)
- [Proposing new features](https://github.com/clamstew/jods/issues/new?assignees=&labels=enhancement&projects=&template=feature_request.md&title=%5BFEATURE%5D+)
- Becoming a maintainer

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

For more details, check out our [Contributing Guide](./CONTRIBUTING.md).

## 📝 License

[MIT](./LICENSE)

## 🖼️ Framework Integrations

### ⚛️ React

```jsx
import { store } from "jods";
import { useJods } from "jods/react";

const todoStore = store({
  items: [],
  filter: "all",
});

function Todos() {
  const todos = useJods(todoStore);

  return (
    <div>
      {/* Only re-renders when todos.items changes */}
      <ul>
        {todos.items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### ⚡ Preact

```jsx
import { store } from "jods";
import { useJods } from "jods/preact";

const todoStore = store({
  items: [],
  filter: "all",
});

function Todos() {
  const todos = useJods(todoStore);

  return (
    <div>
      <ul>
        {todos.items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 💿 Remix

jods provides first-class support for Remix applications, replacing traditional loaders and actions with reactive stores:

```jsx
// Define a store in app/jods/user.jods.ts
import { defineStore, j, jod } from "jods/remix";
import { z } from "zod";
// j and jod are conveniently exported from jods/remix

export const user = defineStore({
  name: "user",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  handlers: {
    async updateProfile({ current, form }) {
      return {
        ...current,
        name: form.get("name"),
        email: form.get("email"),
      };
    },
  },
  loader: async () => {
    // Load user data from database
    return { name: "Burt Macklin", email: "burt.macklin@fbi.pawnee.city" };
  },
});

// Using j/jod aliases from jods/remix
// export const todo = defineStore({
//   name: "todo",
//   schema: j.object({
//     id: j.string(),
//     title: j.string().min(3, "Title must be at least 3 characters"),
//     completed: j.boolean()
//   }),
//   defaults: {
//     id: "",
//     title: "",
//     completed: false
//   },
//   handlers: {
//     // ... handlers
//   }
// });

// Use in your route component
import { useJodsStore, useJodsForm } from "jods/remix";
import { user } from "~/jods/user.jods";

export default function Profile() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <div>
      <h1>Profile</h1>
      <form {...form.props}>
        <input name="name" defaultValue={userData.name} />
        <input name="email" defaultValue={userData.email} />
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
```

Key features:

- 🔄 Server-Client Synchronization: State is automatically hydrated from server to client
- 📝 Form Handling: Built-in form utilities with validation
- 🛡️ Type Safety: Full TypeScript and Zod schema support with `z`, `j`, or `jod`
- ⚡ Optimistic Updates: Manage pending state with useJodsFetchers

For detailed documentation, see [Remix Integration Guide](./docs/remix-integration.md) and [Zod Integration](./docs/zod-integration.md).

## 📦 Exports

jods is organized into distinct modules for better tree-shaking and bundle optimization:

- **Core**: `import { store, computed, json, diff } from 'jods'`

  - Contains the core reactive state functionality
  - Zero framework dependencies
  - Minimal bundle size

- **Zod Integration**: `import { j, jod } from 'jods/zod'`

  - Thin wrapper around Zod's API (requires Zod installation)
  - Limited to common schema building patterns
  - For advanced schema needs, import Zod directly: `import { z } from 'zod'`

- **React**: `import { useJods } from 'jods/react'`

  - React-specific hooks for jods integration
  - Optimized for React's rendering model
  - Also re-exports common core utilities: `import { store, computed } from 'jods/react'`

- **Preact**: `import { useJods } from 'jods/preact'`

  - Preact-specific hooks for jods integration
  - Lighter-weight than the React version
  - Also re-exports common core utilities: `import { store, computed } from 'jods/preact'`

- **Remix**: `import { defineStore, useJodsStore, j, jod } from 'jods/remix'`
  - Complete Remix integration with server-client sync
  - Includes form handling, loaders, actions
  - Conveniently re-exports `j`/`jod` for schema validation
  - Also re-exports common core utilities: `import { store, computed } from 'jods/remix'`

Each integration is tree-shakable and only includes what you need. Always import from the specific module path rather than relying on nested imports to ensure proper bundling.

## 💾 State Persistence

jods includes built-in persistence capabilities, allowing you to save and restore state across page reloads:

```js
import { store, persist } from "jods";

// Create a store
const counter = store({ count: 0 });

// Persist to localStorage
const cleanup = persist(localStorage, counter, {
  key: "counter-app", // Storage key
});

// Update the store - changes automatically persist to localStorage
counter.count = 5;

// To stop persistence
cleanup();
```

For async storage like IndexedDB or custom APIs:

```js
import { store, persist } from "jods";

// Create a store
const userPrefs = store({ theme: "light", fontSize: 16 });

// Custom async storage adapter
const asyncStorage = {
  getItem: async (key) => {
    // Fetch from API or IndexedDB
    const response = await fetch(`/api/userPrefs/${key}`);
    return response.json();
  },
  setItem: async (key, value) => {
    // Save to API or IndexedDB
    await fetch(`/api/userPrefs/${key}`, {
      method: "POST",
      body: JSON.stringify(value),
    });
  },
  removeItem: async (key) => {
    // Delete from API or IndexedDB
    await fetch(`/api/userPrefs/${key}`, {
      method: "DELETE",
    });
  },
};

// Persist with async storage
persist(asyncStorage, userPrefs, { key: "user-prefs" });
```

For React applications:

```jsx
import { store } from "jods";
import { useJods, usePersist } from "jods/react";

// Create a store
const appSettings = store({ theme: "dark", notifications: true });

function App() {
  // Use the store
  const settings = useJods(appSettings);

  // Persist with localStorage
  usePersist(localStorage, appSettings, { key: "app-settings" });

  return (
    <div className={`app ${settings.theme}`}>
      <h1>Settings</h1>
      <button
        onClick={() =>
          (settings.theme = settings.theme === "dark" ? "light" : "dark")
        }
      >
        Toggle Theme
      </button>
    </div>
  );
}
```

### ⚛️ `useJodsBatching()` for React/Preact

Optimizes batching specifically for React/Preact applications. This hook should be added to your application root component to enable framework-specific performance optimizations.

```jsx
// For React
import { useJodsBatching } from "jods/react";

// For Preact
import { useJodsBatching } from "jods/preact";

function App() {
  // Enable React/Preact-specific batching optimizations
  useJodsBatching();

  return (
    // Your app content
  );
}
```

Adding this hook improves performance by:

- Automatically batching store updates with React/Preact's rendering cycle
- Reducing unnecessary re-renders when multiple store properties change
- Optimizing when and how subscribers are notified of changes
