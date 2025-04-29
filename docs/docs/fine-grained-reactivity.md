---
sidebar_position: 6
---

# Fine-grained Reactivity

JODS uses a signal-based reactive system to provide efficient, fine-grained updates to subscribers. This optimization ensures that subscribers are only notified when the specific data they depend on changes.

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

## Subscription Behavior

When you subscribe to a store, JODS uses an automatic dependency tracking mechanism:

1. JODS runs your subscriber function once immediately to track which properties are accessed
2. It remembers which properties were accessed and only notifies the subscriber when those specific properties change
3. If your subscriber doesn't access any properties, it becomes a global subscriber that gets notified on any change

### Dynamic Dependencies

Dependencies are re-tracked each time your subscriber function runs. This means if your subscriber accesses different properties based on the current state, JODS will update the tracked dependencies automatically.

```js
// This subscriber's dependencies change based on the value of showDetails
store.subscribe((state) => {
  console.log("Always shows:", state.title);

  if (state.showDetails) {
    console.log("Only when details shown:", state.description);
  }
});
```

### Unsubscribe Behavior

The `subscribe` method returns an unsubscribe function that you can call to stop receiving updates:

```js
const unsubscribe = store.subscribe((state) => {
  console.log("Count:", state.count);
});

// Later, when you want to stop receiving updates
unsubscribe();
```

When you call the unsubscribe function:

1. The subscriber is immediately removed from the notification list
2. All signal subscriptions associated with this subscriber are properly cleaned up
3. The subscriber will never be called again when properties change
4. Memory usage is optimized by removing all references to the subscriber

This clean unsubscribe behavior ensures your application doesn't experience memory leaks or unexpected behavior when components are unmounted or subscriptions are no longer needed.

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
