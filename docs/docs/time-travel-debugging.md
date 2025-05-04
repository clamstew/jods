---
sidebar_position: 5
---

# 🕰️ Time-Travel Debugging with jods

jods provides a powerful time-travel debugging capability through the `history()` function, allowing you to track changes to your store and move back and forth through its state history.

## 🔍 Understanding Time-Travel Debugging

Time-travel debugging lets you:

1. Record all state changes over time
2. View a complete state history
3. Jump backward or forward to any recorded state
4. Understand what changed between states

This is particularly valuable for:

- Debugging complex state transitions
- Implementing undo/redo functionality
- Tracking user interactions
- Understanding the sequence of events in your application

## 🛠️ Basic Usage

### 📝 Creating a History Tracker

```js
import { store, history } from "jods";

// Create a store
const counter = store({ count: 0 });

// Add history tracking
const counterHistory = history(counter);

// Make some changes
counter.count = 1;
counter.count = 2;
counter.count = 3;

// View current history state
console.log(counterHistory.currentIndex); // 3 (after three changes)
console.log(counterHistory.states.length); // 4 (initial + 3 changes)
```

### ⏳ Traveling Through Time

```js
// Jump back to initial state
counterHistory.travelTo(0);
console.log(counter.count); // 0

// Move forward one step
counterHistory.forward();
console.log(counter.count); // 1

// Jump to the latest state
counterHistory.latest();
console.log(counter.count); // 3

// Go back one step
counterHistory.back();
console.log(counter.count); // 2
```

## 🌐 API Reference

For the complete jods API documentation, see the [📚 API Reference](/api/overview).

### 🔄 `history(store, options?)`

Creates a history tracker for the given store.

#### ⚙️ Options

```typescript
interface HistoryOptions {
  maxSize?: number; // Maximum number of states to keep (default: Infinity)
  autoRecord?: boolean; // Whether to automatically record state changes (default: true)
}
```

#### 📊 Return Value

```typescript
interface HistoryTracker<T> {
  states: T[]; // Array of recorded states
  currentIndex: number; // Current position in history

  record(): void; // Record current state
  latest(): void; // Go to most recent state
  travelTo(index: number): void; // Jump to specific index
  back(): boolean; // Go back one step (returns false if at beginning)
  forward(): boolean; // Go forward one step (returns false if at end)
  clear(): void; // Clear history
}
```

## 💡 Advanced Examples

### 📏 Limiting History Size

For performance reasons, you might want to limit the number of states stored:

```js
import { store, history } from "jods";

const bigStore = store({
  /* lots of data */
});
const limitedHistory = history(bigStore, { maxSize: 50 });

// Only the last 50 states will be kept
```

### 🖊️ Manual Recording

By default, all changes are recorded automatically. For more control, you can disable auto-recording:

```js
import { store, history } from "jods";

const userStore = store({ name: "", email: "" });
const userHistory = history(userStore, { autoRecord: false });

// Make some temporary changes
userStore.name = "typing...";
userStore.email = "still...";

// Only record when you want
userStore.name = "Final Name";
userStore.email = "final@email.com";
userHistory.record(); // Now this state is recorded
```

### ↩️ Creating an Undo/Redo Feature

```js
import { store, history } from "jods";
import { useState } from "react";

// Set up store and history
const documentStore = store({ text: "" });
const docHistory = history(documentStore);

function TextEditor() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update UI controls when history changes
  useEffect(() => {
    const updateButtons = () => {
      setCanUndo(docHistory.currentIndex > 0);
      setCanRedo(docHistory.currentIndex < docHistory.states.length - 1);
    };

    // Subscribe to store changes
    const unsubscribe = onUpdate(documentStore, updateButtons);
    updateButtons();

    return unsubscribe;
  }, []);

  return (
    <div>
      <textarea
        value={documentStore.text}
        onChange={(e) => {
          documentStore.text = e.target.value;
        }}
      />
      <div>
        <button disabled={!canUndo} onClick={() => docHistory.back()}>
          Undo
        </button>
        <button disabled={!canRedo} onClick={() => docHistory.forward()}>
          Redo
        </button>
      </div>
    </div>
  );
}
```

## 🔄 How It Works

The `history()` function creates a wrapper around your store that:

1. Captures the initial state of the store
2. Subscribes to store changes through `onUpdate()`
3. Creates a deep clone of each state when a change occurs
4. Maintains an array of these state snapshots
5. Updates the store with the appropriate state when time-traveling

This approach ensures that you always have accurate snapshots without modifying how you interact with your store normally.

## 🧠 Best Practices

### 💾 Memory Considerations

Because history keeps a complete copy of the store for each state, it can consume significant memory for large stores or many changes. Consider:

- Using the `maxSize` option to limit history length
- Applying history selectively to smaller, focused stores
- Using manual recording for precise control
- Clearing history when no longer needed with `historyTracker.clear()`

### 🧩 Complex State

For stores with computed values or nested structures, time-travel works seamlessly:

```js
import { store, computed, history, json } from "jods";

const userData = store({
  firstName: "Ada",
  lastName: "Lovelace",
  visits: 0,
});

// Add a computed property
userData.fullName = computed(
  () => `${userData.firstName} ${userData.lastName}`
);

const userHistory = history(userData);

// Make changes
userData.visits = 1;
userData.lastName = "Byron";

// Travel back to original state
userHistory.travelTo(0);
console.log(json(userData));
// { firstName: "Ada", lastName: "Lovelace", visits: 0, fullName: "Ada Lovelace" }
```

### 🧰 Framework Integration

Time-travel debugging works with any framework integration:

```jsx
import { store, history } from "jods";
import { useJods } from "jods/react";

const counterStore = store({ count: 0 });
export const counterHistory = history(counterStore);

function Counter() {
  const counter = useJods(counterStore);

  return (
    <div>
      <p>Count: {counter.count}</p>
      <button
        onClick={() => {
          counter.count++;
        }}
      >
        Increment
      </button>
      <button onClick={() => counterHistory.back()}>Undo</button>
    </div>
  );
}
```

Embrace the power of time-travel debugging with jods, and experience a new level of control and understanding over your application state! 🕰️ 🐿️ 🦆
