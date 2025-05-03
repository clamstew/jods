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

## Why JODS?

- ☁️ Zero dependencies
- 🧠 Computed values are built-in
- ⚡ Works with React/Preact via useSyncExternalStore
- 🪞 Built-in deep cloning with json()
- 🧬 Minimal API, no boilerplate actions or reducers
- 🧪 Diff detection baked in
- 🧩 Framework agnostic, but integrates well with React/Preact

## Features

- Tiny reactive store (`jods.store`) with subscription
- Lazy JSON snapshots (`jods.json()`)
- Built-in computed fields (`computed`)
- Smart diff/patching (`jods.diff()`)
- Middleware-like hooks (`onUpdate`)
- Zero-dependency, ES module + CJS support
- Fully type-safe with complete TypeScript definitions

## Installation

```bash
npm install jods
```

## Usage

```js
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

### React/Preact Integration

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

### TypeScript Support

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

### Change Tracking

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

## API

### `store(initialState: object)`

Creates a reactive store object. Direct mutations are tracked.

### `json(store)`

Returns a deep-cloned plain JSON snapshot of the store.

### `onUpdate(store, callback)`

Calls `callback(newState)` whenever any key is updated.

### `computed(fn)`

Returns a reactive getter. Automatically re-runs when deps change.

### `diff(before, after)`

Returns a deep diff object of changes between two snapshots.

### `history(store, options?)`

Creates a history tracker with time-travel capabilities. See the [Time-Travel Debugging](#time-travel-debugging) section for details.

## Example: API Ready Snapshot

```js
app.get("/api/user", (req, res) => {
  res.json(json(user));
});
```

## Comparison with other libraries

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

## Roadmap

- ~~Add time-travel debugging (`jods.history()`)~~ ✅ Implemented!
- Built-in persistence (`jods.persist(localStorage)`)
- Remote syncing (`jods.sync(socket)`)

## Time-Travel Debugging

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

## Documentation

The project documentation is built with Docusaurus and can be run locally:

```bash
# Navigate to docs directory
cd docs

# Start the development server
pnpm start
```

The documentation will be available at http://localhost:3000/jods/

## Contributing

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

## License

[MIT](./LICENSE)

## Framework Integrations

### React

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

### Preact

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

### Remix

jods provides first-class support for Remix applications, replacing traditional loaders and actions with reactive stores:

```jsx
// Define a store in app/jods/user.jods.ts
import { defineStore } from "jods/remix";
import { z } from "zod";

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

- Server-Client Synchronization: State is automatically hydrated from server to client
- Form Handling: Built-in form utilities with validation
- Type Safety: Full TypeScript and Zod schema support
- Optimistic Updates: Manage pending state with useJodsFetchers

For detailed documentation, see [Remix Integration Guide](./docs/remix-integration.md).

## Exports

jods is organized into distinct modules:

- **Core**: `import { store } from 'jods'`
- **React**: `import { useJods } from 'jods/react'`
- **Preact**: `import { useJods } from 'jods/preact'`
- **Remix**: `import { defineStore, useJodsStore } from 'jods/remix'`

Each integration is tree-shakable and only includes what you need.
