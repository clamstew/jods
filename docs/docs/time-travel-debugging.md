---
sidebar_position: 5
---

# Time-Travel Debugging

jods provides powerful time-travel debugging capabilities through the `history` function. This allows you to track state changes over time and navigate back and forth between different states.

## Basic Usage

```js
import { store, history } from "jods";

// Create a store
const counter = store({ count: 0 });

// Create a history tracker
const timeTravel = history(counter);

// Make some changes
counter.count = 1;
counter.count = 2;

// Travel back in time to the initial state
timeTravel.travelTo(0);
console.log(counter.count); // 0

// Move forward one step
timeTravel.forward();
console.log(counter.count); // 1
```

## React Debugger Component

For React applications, jods provides a visual debugger component that you can use to track state changes and time travel with an intuitive UI.

```jsx
import { store } from "jods";
import { createDebugger } from "jods/react";

// Create a store
const appState = store({
  counter: 0,
  user: { name: "Burt" },
  theme: "light",
});

// Create a debugger component
const TimeTravel = createDebugger(appState, {
  showDiff: true, // Show what changed between states
  position: "bottom", // Position at the bottom of the screen
  maxEntries: 50, // Maximum history entries to keep
});

// Use the TimeTravel component in your app
function App() {
  return (
    <div>
      {/* Your app components */}
      <TimeTravel />
    </div>
  );
}
```

## Enhanced State Navigation

The time-travel debugger includes powerful navigation and search features that make it easy to find specific states in your application's history.

### Timeline Navigation

The timeline shows a visual representation of your application's state history:

- **Points on the timeline**: Each point represents a state update
- **Previous/Next buttons**: Navigate backward and forward in time
- **Direct timeline interaction**: Click on any point to jump directly to that state

### State Search

You can search for specific states in two ways:

#### 1. Property Search

Find all states where a specific property had a particular value:

```
Property path: user.name
Value: Burt
```

This will find all states where `user.name` was equal to `"Burt"`.

#### 2. JSON State Search

Find states matching a partial state object pattern by providing a JSON fragment:

```json
{ "theme": "dark" }
```

This will find all states where the theme was "dark", regardless of other properties.

You can also search for nested properties or complex state patterns:

```json
{ "user": { "preferences": { "notifications": true } } }
```

This would find all states where the user had notifications enabled.

## Optimizing History Tracking

The history tracker includes options to optimize performance and memory usage, especially important with signal-based reactivity:

```js
const timeTravel = history(store, {
  maxEntries: 50, // Limit number of history entries
  throttleMs: 200, // Throttle recording of state changes (milliseconds)
  active: true, // Enable/disable history tracking
});
```

### Throttling History Entries

By default, the history tracker throttles state changes to avoid creating too many history entries when multiple properties change rapidly. This is especially useful with signal-based reactivity systems.

### Finding States Programmatically

Beyond the UI, you can programmatically find and travel to specific states:

```js
// Find a state where the user is an admin
const foundIndex = timeTravel.findEntry(
  (entry) => entry.state.user?.role === "admin"
);

if (foundIndex >= 0) {
  timeTravel.travelTo(foundIndex);
}

// Or more directly:
timeTravel.travelToEntry((entry) => entry.state.theme === "dark");
```

## API Reference

### History Class

```ts
class History<T> {
  constructor(store: T & Store<T>, options?: HistoryOptions);

  // Navigation
  travelTo(index: number): void;
  back(): void;
  forward(): void;

  // State Access
  getEntries(): HistoryEntry<T>[];
  getCurrentIndex(): number;

  // Search
  findEntry(finder: (entry: HistoryEntry<T>) => boolean): number;
  travelToEntry(finder: (entry: HistoryEntry<T>) => boolean): boolean;

  // Management
  clear(): void;
  destroy(): void;
}
```

### History Options

```ts
interface HistoryOptions {
  maxEntries?: number; // Maximum entries to keep (default: 50)
  active?: boolean; // Whether tracking is active (default: true in development)
  throttleMs?: number; // Throttle time between entries in milliseconds (default: 100)
}
```

### History Entry

Each history entry contains:

```ts
interface HistoryEntry<T> {
  state: T; // Complete state snapshot
  timestamp: number; // When the state was captured
  diff?: object; // What changed from previous state
}
```

## Performance Considerations

- **Memory Usage**: Each history entry stores a full snapshot of your state. If your state is large, consider limiting `maxEntries`
- **Rendering Performance**: The debugger UI re-renders on state changes, but uses throttling to minimize impact
- **Production Usage**: The debugger is automatically disabled in production builds

## Example

For a complete example of time-travel debugging, see the [time-travel example on GitHub](https://github.com/example/jods/examples/time-travel-example.jsx).
