---
sidebar_position: 5
title: API Reference
description: Complete API documentation for jods/remix
---

# API Reference: jods/remix

This document provides detailed API documentation for all exports from the `jods/remix` package.

## Core Functions

### `defineStore(options)`

Creates a reactive store with server-side handlers and loaders.

**Parameters:**

| Name               | Type        | Description                                                     |
| ------------------ | ----------- | --------------------------------------------------------------- |
| `options`          | `Object`    | Configuration options for the store                             |
| `options.name`     | `string`    | Unique name for the store (required)                            |
| `options.schema`   | `ZodSchema` | Zod schema for type validation                                  |
| `options.defaults` | `Object`    | Default values for store properties                             |
| `options.handlers` | `Object`    | Form handler functions that process form submissions            |
| `options.loader`   | `Function`  | Async function that loads server data, similar to Remix loaders |

**Returns:** A store object with the following properties:

- `name`: The store name
- `getState()`: Function to get the current state
- `setState(newState)`: Function to update the state
- `actions`: Object containing all handler functions
- `store`: The underlying reactive store

**Example:**

```typescript
import { defineStore } from "jods/remix";
import { z } from "zod";

export const user = defineStore({
  name: "user",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  defaults: {
    name: "Guest",
    email: "",
  },
  handlers: {
    async updateProfile({ current, form }) {
      return {
        ...current,
        name: form.get("name"),
        email: form.get("email"),
      };
    },
  },
  loader: async ({ request }) => {
    // Load user data
    return { name: "Burt Macklin", email: "burt.macklin@fbi.pawnee.city" };
  },
});
```

## React Hooks

### `useJodsStore(store)`

React hook for subscribing to a jods store. This is the primary way to access jods data reactively in your components.

**Parameters:**

| Name    | Type     | Description                           |
| ------- | -------- | ------------------------------------- |
| `store` | `Object` | A jods store created with defineStore |

**Returns:** The current state of the store, updated reactively when:

- Form submissions happen via `useJodsForm()`
- Client-side store mutations occur
- Server fetches update the store

**Example:**

```tsx
import { useJodsStore } from "jods/remix";
import { user } from "~/jods/user.jods";

function ProfilePage() {
  const userData = useJodsStore(user);

  return (
    <div>
      <h1>Hello, {userData.name}</h1>
      <p>Email: {userData.email}</p>
    </div>
  );
}
```

### `useJodsForm(actionHandler)`

Creates form bindings for a jods store action.

**Parameters:**

| Name            | Type       | Description                          |
| --------------- | ---------- | ------------------------------------ |
| `actionHandler` | `Function` | A handler function from a jods store |

**Returns:** An object with the following properties:

- `props`: Form props (action, method, etc.)
- `submit(event)`: Function to submit the form programmatically
- `reset()`: Function to reset the form
- `formData`: Current form data (after submission)

**Example:**

```tsx
import { useJodsForm } from "jods/remix";
import { user } from "~/jods/user.jods";

function ProfileForm() {
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <form {...form.props}>
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

### `useJodsFetchers(actionId)`

Hook to track the state of all fetchers for a specific jods store action.

**Parameters:**

| Name       | Type     | Description                                  |
| ---------- | -------- | -------------------------------------------- |
| `actionId` | `string` | The action identifier (storeName.actionName) |

**Returns:** An object with the following properties:

- `isSubmitting`: Boolean indicating if any fetchers are submitting
- `isComplete`: Boolean indicating if all fetchers are complete
- `count`: Number of fetchers for this action
- `fetchers`: Array of fetcher objects

**Example:**

```tsx
import { useJodsFetchers } from "jods/remix";

function SubmitButton() {
  const { isSubmitting } = useJodsFetchers("cart.addItem");

  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

### `useJodsTransition(actionId?)`

Hook to track transition state for jods action submissions.

**Parameters:**

| Name       | Type     | Description                                      |
| ---------- | -------- | ------------------------------------------------ |
| `actionId` | `string` | Optional action identifier to filter transitions |

**Returns:** An object with the following properties:

- `isSubmitting`: Boolean indicating if the transition is submitting
- `isPending`: Boolean indicating if the transition is pending
- `formData`: The form data being submitted

**Example:**

```tsx
import { useJodsTransition } from "jods/remix";

function FormStatus() {
  const { isPending } = useJodsTransition("user.updateProfile");

  return isPending ? <LoadingIndicator /> : null;
}
```

### `useOptimisticUpdate(store, actionName, optimisticDataFn)`

Hook for implementing optimistic UI updates with jods stores.

**Parameters:**

| Name               | Type       | Description                                       |
| ------------------ | ---------- | ------------------------------------------------- |
| `store`            | `Object`   | A jods store created with defineStore             |
| `actionName`       | `string`   | The name of the action being performed            |
| `optimisticDataFn` | `Function` | Function that returns the optimistic state update |

**Returns:** Either the optimistic state or the current state if not submitting

**Example:**

```tsx
import { useOptimisticUpdate } from "jods/remix";
import { todo } from "~/jods/todo.jods";

function TodoList() {
  const optimisticTodos = useOptimisticUpdate(
    todo,
    "toggleComplete",
    (currentState) => ({
      items: currentState.items.map((item) =>
        item.id === toggledId ? { ...item, completed: !item.completed } : item
      ),
    })
  );

  return (
    <ul>
      {optimisticTodos.items.map((item) => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
}
```

## Integration with Remix

### `withJods(stores, loaderFn?)`

Creates a Remix loader that integrates jods stores with Remix's data loading system. This enables server-loaded data to be available reactively on the client through `useJodsStore`.

**Parameters:**

| Name       | Type       | Description                                   |
| ---------- | ---------- | --------------------------------------------- |
| `stores`   | `Array`    | Array of jods stores created with defineStore |
| `loaderFn` | `Function` | Optional function to provide additional data  |

**Returns:** A Remix-compatible loader function

**Simplified Usage Pattern:**

The most common pattern is to define a store in a dedicated jods file and export ready-to-use loader and action functions:

```typescript
// app/jods/cart.jods.ts
import { defineStore, withJods } from "jods/remix";

export const cart = defineStore({
  name: "cart",
  defaults: { items: [] },
  handlers: {
    async addItem({ current, form }) {
      // Implementation
    },
  },
  loader: async ({ request }) => {
    // Load cart items
    return { items: await fetchCartItems(request) };
  },
});

// Export ready-to-use loader and action for routes
// You can export the loader in two equivalent ways:
export const loader = withJods([cart]); // Method 1: Using withJods
// export const loader = cart.loader;    // Method 2: Direct export (simpler for single store)
export const action = cart.action;
```

Then in your route file:

```typescript
// app/routes/cart.tsx
export { loader, action } from "~/jods/cart.jods";

import { useJodsStore, useJodsForm } from "jods/remix";
import { cart } from "~/jods/cart.jods";

export default function CartRoute() {
  const cartData = useJodsStore(cart);
  const addItemForm = useJodsForm(cart.actions.addItem);

  return (
    // UI implementation
  );
}
```

This pattern eliminates the need to write loader and action functions in your route files, making them much cleaner.

**Example with Additional Data:**

```typescript
import { withJods } from "jods/remix";
import { user } from "~/jods/user.jods";
import { cart } from "~/jods/cart.jods";

export const loader = withJods([user, cart], async ({ request }) => {
  // Return additional data
  return {
    flash: getFlashMessage(request),
  };
});

// In your component
import { useJodsStore } from "jods/remix";

export default function MyComponent() {
  const userData = useJodsStore(user);
  const cartData = useJodsStore(cart);

  // Use userData and cartData reactively
  return (
    // UI implementation
  );
}
```

## Server Components

### `rehydrateClient(options?)`

Component to rehydrate jods stores on the client from server state.

**Parameters:**

| Name              | Type            | Description                     |
| ----------------- | --------------- | ------------------------------- |
| `options`         | `Object`        | Optional configuration options  |
| `options.hydrate` | `Array<string>` | Array of store names to hydrate |

**Example:**

```tsx
import { rehydrateClient as RehydrateJodsStores } from "jods/remix";

export default function App() {
  return (
    <html>
      <head>{/* ... */}</head>
      <body>
        <RehydrateJodsStores hydrate={["user", "cart"]} />
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

## Utility Functions

### `getJodsSnapshot()`

Creates a snapshot of all registered jods stores.

**Returns:** An object containing all store states by name

**Example:**

```typescript
import { getJodsSnapshot } from "jods/remix";

// In your loader
export const loader = async () => {
  // ...load data and update stores

  // Get snapshot of all stores
  const storeSnapshot = getJodsSnapshot();

  return { snapshot: storeSnapshot };
};
```

### `connectActionToJods(store, actionHandler)`

Connects an existing Remix action to a jods store.

**Parameters:**

| Name            | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `store`         | `Object`   | A jods store created with defineStore |
| `actionHandler` | `Function` | The existing Remix action handler     |

**Returns:** A new action handler that updates the jods store

**Example:**

```typescript
import { connectActionToJods } from "jods/remix";
import { user } from "~/jods/user.jods";

// Existing action
const existingAction = async ({ request }) => {
  const form = await request.formData();
  const updatedUser = await updateUser(form);
  return updatedUser;
};

// Connect to jods
export const action = connectActionToJods(user, existingAction);
```

### `setJodsCacheControl(headers, options)`

Utility to set cache control headers for jods store loaders.

**Parameters:**

| Name                           | Type      | Description                                         |
| ------------------------------ | --------- | --------------------------------------------------- |
| `headers`                      | `Headers` | The headers object from the loader                  |
| `options`                      | `Object`  | Cache configuration options                         |
| `options.maxAge`               | `number`  | Maximum age in seconds (default: 0)                 |
| `options.staleWhileRevalidate` | `number`  | Stale-while-revalidate time in seconds (default: 0) |
| `options.private`              | `boolean` | Whether the response is private (default: true)     |

**Example:**

```typescript
import { setJodsCacheControl } from "jods/remix";

export const products = defineStore({
  name: "products",
  // ...
  loader: async ({ request }) => {
    const headers = new Headers();

    // Set cache for 5 minutes
    setJodsCacheControl(headers, {
      maxAge: 300,
      staleWhileRevalidate: 600,
      private: false,
    });

    return getProducts();
  },
});
```

## Advanced Techniques

### Accessing Initial Server Data via `useLoaderData()`

While `useJodsStore` is the recommended way to access jods data, you can also access the initial server-loaded data via `useLoaderData().__jods`. This is primarily useful for debugging and specialized use cases.

**When to use `useLoaderData().__jods`:**

- For debugging server/client state differences
- When implementing "reset to initial values" functionality
- When you specifically need to know what data was initially rendered by the server

```tsx
import { useLoaderData } from "@remix-run/react";
import { useJodsStore } from "jods/remix";
import { user } from "~/jods/user.jods";

export default function DebugComponent() {
  // Reactive store data that updates with form submissions/mutations
  const userData = useJodsStore(user);

  // Static snapshot of initial server data (never changes)
  const data = useLoaderData();
  const initialUserData = data.__jods?.user;

  // Compare current state to initial server state
  const hasChanged =
    JSON.stringify(userData) !== JSON.stringify(initialUserData);

  return (
    <div>
      <div>Current state: {JSON.stringify(userData)}</div>
      <div>Initial state: {JSON.stringify(initialUserData)}</div>
      {hasChanged && (
        <button onClick={() => user.setState(initialUserData)}>
          Reset to initial state
        </button>
      )}
    </div>
  );
}
```

## Internal Utilities

### `parseFormData(formData)`

Converts a FormData object into a structured JavaScript object.

**Parameters:**

| Name       | Type       | Description                  |
| ---------- | ---------- | ---------------------------- |
| `formData` | `FormData` | The FormData object to parse |

**Returns:** Parsed JavaScript object

**Example:**

```typescript
import { parseFormData } from "jods/remix";

const form = new FormData();
form.append("user.name", "Burt Macklin");
form.append("user.email", "burt.macklin@fbi.pawnee.city");

const parsed = parseFormData(form);
// Result: { user: { name: "Burt Macklin", email: "burt.macklin@fbi.pawnee.city" } }
```
