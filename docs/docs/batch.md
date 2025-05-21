---
sidebar_position: 5
---

# 🔋 Batch Updates

Batching allows you to group multiple state updates together, deferring notifications to subscribers until all changes are complete. This is especially useful for complex state transitions that should be treated as a single atomic update.

## Why Use Batching?

- **Performance**: Prevents unnecessary re-renders by notifying subscribers only once
- **Consistency**: Ensures computed values are only recalculated after all changes
- **Atomicity**: Updates multiple properties as a single transaction

## 🧰 API Reference

### 📦 `store.batch(fn)`

Executes a function that can make multiple store updates, batching them into a single notification.

**Parameters:**

| Name        | Type       | Description                                                |
| ----------- | ---------- | ---------------------------------------------------------- |
| `fn`        | `Function` | A function containing multiple store updates to be batched |
| `batchName` | `string?`  | Optional name for debugging purposes (defaults to unnamed) |

**Returns:** The return value of the provided function

**Example:**

```js
import { store } from "jods";

const userStore = store({
  firstName: "John",
  lastName: "Doe",
  fullName: "", // Will be updated in batch
  isActive: false,
});

// Multiple updates as a single batch
userStore.batch(() => {
  userStore.firstName = "Jane";
  userStore.lastName = "Smith";
  userStore.fullName = "Jane Smith";
  userStore.isActive = true;
});
```

### 📦 `store.beginBatch()` and `store.commitBatch()`

For manual control of batch operations when you need to start a batch and commit it later.

**Example:**

```js
import { store } from "jods";

const cartStore = store({
  items: [],
  total: 0,
  itemCount: 0,
});

// Start batch manually
cartStore.beginBatch();

// Add multiple items (these don't trigger updates yet)
addItemsToCart(items);

// Update derived values
updateCartTotals();

// Commit all changes as a single update
cartStore.commitBatch();
```

## Best Practices

### ✅ Move Batch Logic Outside Components

Batching operations should generally live outside of UI components. This keeps component logic clean and focused on UI concerns, while store-related logic stays with the store.

**Bad Pattern:**

```jsx
function ProfileForm({ userData }) {
  const handleSubmit = (e) => {
    e.preventDefault();

    // Batching inside component
    userStore.batch(() => {
      userStore.firstName = e.target.firstName.value;
      userStore.lastName = e.target.lastName.value;
      userStore.email = e.target.email.value;
    });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

**Good Pattern:**

```jsx
// userStore.js
export function updateUserProfile(userData) {
  userStore.batch(() => {
    userStore.firstName = userData.firstName;
    userStore.lastName = userData.lastName;
    userStore.email = userData.email;
  });
}

// ProfileForm.jsx
import { updateUserProfile } from "./userStore";

function ProfileForm() {
  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserProfile({
      firstName: e.target.firstName.value,
      lastName: e.target.lastName.value,
      email: e.target.email.value,
    });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### ✅ Use Custom Hooks for Batched Operations

Create custom hooks that encapsulate batched operations for reuse across components:

```jsx
// useUserActions.js
export function useUserActions() {
  return {
    updateProfile: (userData) => {
      userStore.batch(() => {
        userStore.firstName = userData.firstName;
        userStore.lastName = userData.lastName;
        userStore.email = userData.email;
      });
    },

    resetProfile: () => {
      userStore.batch(() => {
        userStore.firstName = "";
        userStore.lastName = "";
        userStore.email = "";
      });
    },
  };
}

// Usage in component
function ProfilePage() {
  const { updateProfile, resetProfile } = useUserActions();
  // Use these actions in event handlers
}
```

## Examples

### Complex Form Submission

```js
// cartStore.js
export const cartStore = store({
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
});

export function updateCart(newItems) {
  cartStore.batch(() => {
    // Update items
    cartStore.items = newItems;

    // Calculate subtotal
    cartStore.subtotal = newItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate tax
    cartStore.tax = cartStore.subtotal * 0.08;

    // Calculate shipping (free if over $100)
    cartStore.shipping = cartStore.subtotal > 100 ? 0 : 10;

    // Calculate total
    cartStore.total = cartStore.subtotal + cartStore.tax + cartStore.shipping;
  });
}

// Usage
updateCart([
  { id: 1, name: "Widget", price: 10, quantity: 2 },
  { id: 2, name: "Gadget", price: 25, quantity: 1 },
]);
```

### Multi-Step Process

```js
// orderStore.js
export const orderStore = store({
  status: "idle",
  currentStep: 0,
  steps: ["cart", "shipping", "payment", "confirmation"],
  shipping: {},
  payment: {},
  errors: {},
});

export function advanceToNextStep(stepData) {
  orderStore.batch(() => {
    // Save current step data
    const currentStepName = orderStore.steps[orderStore.currentStep];
    orderStore[currentStepName] = stepData;

    // Clear any previous errors
    orderStore.errors = {};

    // Update status
    orderStore.status = "advancing";

    // Move to next step
    orderStore.currentStep += 1;

    // If we've reached the end, complete the order
    if (orderStore.currentStep >= orderStore.steps.length) {
      orderStore.status = "complete";
    }
  });
}
```

## Batching and Framework Integration

When using jods with frameworks like React or Preact, the framework's own batching mechanisms work alongside jods batching.

- **React/Preact**: These frameworks already batch state updates within event handlers. jods batching complements this by ensuring all store updates are treated as a single change.
- **Framework Updates vs. Store Updates**: Framework batching is about reducing renders, while jods batching is about ensuring store consistency and optimizing subscriber notifications.

### React Example

```jsx
import { store } from "jods";
import { useStore } from "jods/react";

// Store with actions
const todoStore = store({
  todos: [],
  filter: "all",
  loading: false,
});

// Actions that use batching
export function addTodo(text) {
  todoStore.batch(() => {
    todoStore.loading = true;
    todoStore.todos = [
      ...todoStore.todos,
      { id: Date.now(), text, completed: false },
    ];
    todoStore.loading = false;
  });
}

export function toggleTodo(id) {
  todoStore.batch(() => {
    todoStore.todos = todoStore.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  });
}

// Component using actions
function TodoApp() {
  const { todos, filter, loading } = useStore(todoStore);

  const handleAddTodo = (text) => {
    addTodo(text); // Uses batching
  };

  return (
    <div>
      <TodoInput onAdd={handleAddTodo} disabled={loading} />
      <TodoList todos={todos} onToggle={toggleTodo} />
    </div>
  );
}
```

## Advanced Usage

### Error Handling in Batches

Batches automatically clean up if an error occurs during execution, and will apply any changes that happened before the error:

```js
try {
  userStore.batch(() => {
    userStore.name = "New Name"; // This update will be applied
    throw new Error("Something went wrong");
    userStore.email = "new@example.com"; // This won't be reached
  });
} catch (error) {
  console.error("Error during batch update:", error);
  // Store will have name="New Name" but email won't be changed
}
```

### Nested Batches

Batches can be nested, with changes from inner batches being collected in the parent batch:

```js
userStore.batch(() => {
  userStore.firstName = "Jane";

  // Nested batch
  userStore.batch(() => {
    userStore.lastName = "Smith";
    userStore.role = "Admin";
  });

  userStore.isActive = true;
});
// All four properties are updated in a single batch
```
