# jods — JSON On Demand Store

![CI](https://github.com/clamstew/jods/workflows/CI/badge.svg)

A minimal, reactive JSON state layer for Node.js and the browser. Create lightweight observable stores that emit JSON snapshots on demand.
Perfect for syncing app state, powering APIs, or building reactive UIs without heavy frameworks.

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

// Subscribe to changes
onUpdate(user, (newUserState) => {
  console.log("User state updated:", json(newUserState));
  // Example output: { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
});

// Mutate exsting fields
user.firstName = "Burt Macklin";
user.mood = "sneaky";

// Add new computed field on the fly
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(json(user)); // { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
```

### TypeScript Support

jods is built with TypeScript and provides full type definitions for all its APIs:

```ts
import { store, computed } from "jods";

// Define state interface (optional but recommended)
interface UserState {
  firstName: string;
  lastName: string;
  age: number;
  fullName?: string; // Will be added later
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

## Example: API Ready Snapshot

```js
app.get("/api/user", (req, res) => {
  res.json(json(user));
});
```

## Roadmap

- Add time-travel debugging (`jods.history()`)
- Built-in persistence (`jods.persist(localStorage)`)
- Remote syncing (`jods.sync(socket)`)

## License

MIT
