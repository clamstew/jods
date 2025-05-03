---
sidebar_position: 4
---

# Time-Travel Debugging 🕰️ 🔄 🐿️

jods includes powerful time-travel debugging capabilities that allow you to track state changes over time and jump back to previous states. This feature is invaluable for debugging complex state changes and understanding how your application's state evolves.

## Basic Usage 🚀

The `history()` function creates a history tracker for a store, which records all state changes and provides methods to travel between them:

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

## History API 📖

### `history(store, options?)` 🕰️

Creates a history tracker for a store.

- **Parameters**:

  - `store`: The store to track
  - `options` (optional): Configuration options
    - `maxEntries`: Maximum number of history entries to keep (default: 50)
    - `active`: Whether history tracking is active (default: true in development, false in production)

- **Returns**: A History instance with the following methods:
  - `travelTo(index)` 🚗: Travel to a specific point in history
  - `back()` ⏮️: Go back one step in history
  - `forward()` ⏭️: Go forward one step in history
  - `getEntries()` 📋: Get all history entries
  - `getCurrentIndex()` 🔍: Get the current index in history
  - `clear()` 🧹: Clear all history entries except the current one
  - `destroy()` 🗑️: Remove subscription to store updates

## History Entries 📝

Each history entry contains:

- `state` 📦: A snapshot of the entire store state
- `timestamp` ⏱️: When the change occurred
- `diff` 🔄: What changed from the previous state

```js
// Example of accessing history entries
const entries = counterHistory.getEntries();
entries.forEach((entry, index) => {
  console.log(`Entry ${index}:`);
  console.log(`State:`, entry.state);
  console.log(`Time:`, new Date(entry.timestamp).toLocaleTimeString());
  if (entry.diff) {
    console.log(`Changes:`, entry.diff);
  }
});
```

## Branching History 🌲

When you travel back in time and then make changes, jods automatically creates a new branch of history, discarding future states that are no longer relevant:

```js
// Start with a simple counter
const counter = store({ count: 0 });
const counterHistory = history(counter);

// Make some changes
counter.count = 10;
counter.count = 20;
counter.count = 30;

// Go back to the first change
counterHistory.travelTo(1); // count is now 10

// Make a new change - this creates a branch and discards future states
counter.count = 15;

// History now contains: [0, 10, 15] instead of [0, 10, 20, 30]
console.log(counterHistory.getEntries().map((entry) => entry.state.count));
```

## React Integration ⚛️

For React applications, jods provides a debugger component that renders a UI for time-travel debugging:

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

The debugger component is development-only and doesn't add any overhead in production builds.

## Complete Example 🦆

Here's a more complete example of using history for debugging:

```js
import { store, json, onUpdate, computed, history } from "jods";

// Create a todo list store
const todos = store({
  items: [],
  filter: "all",
});

// Add a computed property
todos.activeCount = computed(
  () => todos.items.filter((item) => !item.completed).length
);

// Create a history tracker
const todosHistory = history(todos);

// Log changes as they happen
onUpdate(todos, (state) => {
  console.log("State updated:", json(state));
});

// Add some todos
function addTodo(text) {
  todos.items.push({
    id: Date.now(),
    text,
    completed: false,
  });
}

addTodo("Learn jods");
addTodo("Build an app");
addTodo("Master time travel");

// Complete a todo
todos.items[1].completed = true;

// Inspect history
console.log(`History has ${todosHistory.getEntries().length} entries`);

// Go back to before the second todo was added
todosHistory.travelTo(1);
console.log("Traveled back:", json(todos));

// Now add a different todo - this creates a new timeline
addTodo("Alternative task");
console.log("New branch:", json(todos));
```

## Best Practices ✅

- 🔬 Only use history tracking in development or debugging scenarios
- 📊 Set a reasonable `maxEntries` value to prevent memory issues
- 🧹 Call `destroy()` when you're done with a history tracker to prevent memory leaks
- 🔍 Use the `diff` property to understand what changed between states
