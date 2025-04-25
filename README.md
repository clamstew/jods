# jods — JSON On Demand Store

A minimal, reactive JSON state layer for Node.js and the browser. Create lightweight observable stores that emit JSON snapshots on demand.
Perfect for syncing app state, powering APIs, or building reactive UIs without heavy frameworks.

## Features

- Tiny reactive store (`jods.store`) with subscription
- Lazy JSON snapshots (`jods.json()`)
- Built-in computed fields (`computed`)
- Smart diff/patching (`jods.diff()`)
- Middleware-like hooks (`onUpdate`)
- Zero-dependency, ES module + CJS support

## Installation

```bash
npm install jods
```

## Usage

```js
import { store, json, onUpdate, computed } from "jods";

const user = store({
  firstName: "Clay",
  lastName: "Stewart",
  mood: "curious",
});

// Subscribe to changes
onUpdate(user, (newUserState) => {
  console.log("User state updated:", json(newUserState));
  // Example output: { firstName: "Doctor", lastName: "Stewart", mood: "playful", fullName: "Doctor Stewart" }
});

// Mutate
user.firstName = "Doctor";
user.mood = "playful";

// Computed field
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(json(user)); // { firstName: "Doctor", lastName: "Stewart", mood: "playful", fullName: "Doctor Stewart" }
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
