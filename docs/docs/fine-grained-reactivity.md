---
sidebar_position: 6
---

# Fine-grained Reactivity

JODS uses a signal-based reactive system under the hood to provide efficient, fine-grained updates to subscribers. This optimization ensures that subscribers are only notified when the specific data they depend on changes.

## Implementation Status

The fine-grained reactivity system is implemented in the codebase but currently operates in compatibility mode by default to maintain backward compatibility with existing applications.

To enable the signal-based optimization:

```js
// In src/store.ts, change this line:
const COMPATIBILITY_MODE = false; // Change from true to false
```

:::caution
Changing to the optimized signal-based implementation may require adjustments to your application if you rely on specific behavior of the previous implementation.
:::

## Migration Path

The path to migrate from compatibility mode to full signal optimization:

1. **Test in development first**: Enable signal-based optimization in a development or testing environment.
2. **Identify dependency issues**: Look for places where components expect to be notified about state changes they don't directly reference.
3. **Update subscriber functions**: Ensure subscribers explicitly access all properties they need to depend on.
4. **Update tests**: If your tests expect the previous behavior, update them to work with fine-grained reactivity.

In most cases, the migration should be seamless if your component subscriptions already follow best practices (only using the properties they actually need to render).

## How It Works

Unlike many state management libraries that notify all subscribers whenever any part of the state changes, JODS tracks which properties each subscriber actually uses and only triggers updates when those specific properties change.

### Signal-based Architecture

The store implementation uses these key concepts:

1. **Signals**: Each property in your store is backed by a signal (a read/write pair of functions)
2. **Dependency Tracking**: JODS automatically tracks which properties are accessed during a subscriber function
3. **Fine-grained Notifications**: Updates only trigger for subscribers that depend on changed properties

## Benefits

This approach provides several advantages:

- **Reduced Re-renders**: Components only re-render when data they actually use changes
- **Better Performance**: Fewer wasted update cycles, especially in larger applications
- **Automatic Optimization**: No manual selector functions needed - dependencies are tracked automatically

## Examples

### Basic Example

```js
import { store } from "jods";

const appState = store({
  user: { name: "Burt" },
  theme: "light",
  counter: 0,
});

// This subscriber only depends on counter
appState.subscribe((state) => {
  console.log("Counter:", state.counter);
});

// This subscriber only depends on theme
appState.subscribe((state) => {
  console.log("Theme:", state.theme);
});

// Updating counter only notifies the first subscriber
appState.counter++;

// Updating theme only notifies the second subscriber
appState.theme = "dark";
```

### React Component Example

```jsx
import { store } from "jods";
import { useJods } from "jods/react";

// Create a store with multiple sections
const appStore = store({
  user: { name: "Burt", role: "admin" },
  settings: { theme: "light", notifications: true },
  todos: [{ text: "Buy milk", done: false }],
});

// UserProfile component only re-renders when user data changes
function UserProfile() {
  const state = useJods(appStore);
  console.log("UserProfile render");

  return <div>User: {state.user.name}</div>;
}

// SettingsPanel component only re-renders when settings change
function SettingsPanel() {
  const state = useJods(appStore);
  console.log("SettingsPanel render");

  return (
    <div>
      <div>Theme: {state.settings.theme}</div>
      <button
        onClick={() =>
          (appStore.settings.theme =
            state.settings.theme === "light" ? "dark" : "light")
        }
      >
        Toggle Theme
      </button>
    </div>
  );
}

// TodoList component only re-renders when todos change
function TodoList() {
  const state = useJods(appStore);
  console.log("TodoList render");

  return (
    <div>
      <h3>Todos:</h3>
      <ul>
        {state.todos.map((todo, i) => (
          <li key={i}>{todo.text}</li>
        ))}
      </ul>
      <button
        onClick={() =>
          appStore.todos.push({
            text: "New todo",
            done: false,
          })
        }
      >
        Add Todo
      </button>
    </div>
  );
}
```

## Technical Implementation

Under the hood, JODS implements this optimization using a combination of JavaScript's Proxy and a dependency tracking system:

1. When a subscriber runs for the first time, JODS tracks which properties are accessed
2. These dependencies are stored in a map for that specific subscriber
3. When properties are updated, JODS only notifies subscribers that depend on those properties

This approach is similar to the reactivity systems in modern frameworks like Vue 3 and SolidJS, but it's packaged in a framework-agnostic way that feels like working with plain JavaScript objects.

## Comparison with Other Approaches

| Approach                  | Update Strategy                                       | Performance                    |
| ------------------------- | ----------------------------------------------------- | ------------------------------ |
| Redux                     | Notify all subscribers, components must use selectors | Requires manual optimization   |
| Zustand                   | Store-wide updates, selector functions needed         | Requires manual optimization   |
| Signals (SolidJS, Preact) | Property-level granularity                            | Automatic fine-grained updates |
| JODS                      | Property-level granularity with automatic tracking    | Automatic fine-grained updates |

## Best Practices

To get the most out of JODS's fine-grained reactivity:

1. **Keep subscriber functions focused**: Access only the properties you need
2. **Structure your state logically**: Group related data together
3. **Use computed values**: These automatically track their dependencies too

## Deep Nesting and Arrays

JODS's fine-grained tracking works with deeply nested properties and arrays. When you access a nested property or array element, JODS tracks that specific path as a dependency.

```js
const store = createStore({
  nested: {
    deeply: {
      value: 42,
    },
  },
  items: [1, 2, 3],
});

// This only tracks nested.deeply.value as a dependency
store.subscribe((state) => console.log(state.nested.deeply.value));

// This only tracks items as a dependency
store.subscribe((state) => console.log(state.items.length));
```
