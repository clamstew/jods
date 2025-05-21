---
sidebar_position: 5
title: API Reference
description: Complete API documentation for jods/remix
---

# 📚 API Reference: jods/remix

This document provides detailed API documentation for all exports from the `jods/remix` package.

## 🧩 Core Functions

### 🏗️ `defineStore(options)`

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

- 📦 `name`: The store name
- 🔍 `getState()`: Function to get the current state
- 🔄 `setState(newState)`: Function to update the state
- ⚡ `actions`: Object containing all handler functions
- 🗄️ `store`: The underlying reactive store

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

## 🪝 React Hooks

### 🔌 `useJodsStore(store)`

React hook for subscribing to a jods store. This is the primary way to access jods data reactively in your components.

**Parameters:**

| Name    | Type     | Description                           |
| ------- | -------- | ------------------------------------- |
| `store` | `Object` | A jods store created with defineStore |

**Returns:** The current state of the store, updated reactively when:

- 📝 Form submissions happen via `useJodsForm()`
- 🖱️ Client-side store mutations occur
- 🌐 Server fetches update the store

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

### 📋 `useJodsForm(actionHandler)`

Creates form bindings for a jods store action.

**Parameters:**

| Name            | Type       | Description                          |
| --------------- | ---------- | ------------------------------------ |
| `actionHandler` | `Function` | A handler function from a jods store |

**Returns:** An object with the following properties:

- 🔧 `props`: Form props (action, method, etc.)
- 🚀 `submit(event)`: Function to submit the form programmatically
- 🔄 `reset()`: Function to reset the form
- 📊 `formData`: Current form data (after submission)

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

### 📡 `useJodsFetchers(actionId)`

Hook to track the state of all fetchers for a specific jods store action.

**Parameters:**

| Name       | Type     | Description                                  |
| ---------- | -------- | -------------------------------------------- |
| `actionId` | `string` | The action identifier (storeName.actionName) |

**Returns:** An object with the following properties:

- 🔄 `isSubmitting`: Boolean indicating if any fetchers are submitting
- ✅ `isComplete`: Boolean indicating if all fetchers are complete
- 🔢 `count`: Number of fetchers for this action
- 📦 `fetchers`: Array of fetcher objects

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

### 🔄 `useJodsTransition(actionId?)`

Hook to track transition state for jods action submissions.

**Parameters:**

| Name       | Type     | Description                                      |
| ---------- | -------- | ------------------------------------------------ |
| `actionId` | `string` | Optional action identifier to filter transitions |

**Returns:** An object with the following properties:

- 📤 `isSubmitting`: Boolean indicating if the transition is submitting
- ⏳ `isPending`: Boolean indicating if the transition is pending
- 📝 `formData`: The form data being submitted

**Example:**

```tsx
import { useJodsTransition } from "jods/remix";

function FormStatus() {
  const { isPending } = useJodsTransition("user.updateProfile");

  return isPending ? <LoadingIndicator /> : null;
}
```

### ⚡ `useOptimisticUpdate(store, actionName, optimisticDataFn)`

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

## 🔋 Batching with Remix

When using jods with Remix, you should organize batch operations in a way that separates UI components from store logic. This pattern works especially well with Remix's form-based architecture.

### 📦 Store Actions Pattern

The recommended pattern is to create a module with store actions that use batching, then import these into your Remix route components.

```tsx
// app/jods/todo.jods.js
import { defineStore } from "jods/remix";
import { z } from "zod";

export const todo = defineStore({
  name: "todo",
  schema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean(),
      })
    ),
    filter: z.enum(["all", "active", "completed"]).default("all"),
    loading: z.boolean().default(false),
  }),
  defaults: {
    items: [],
    filter: "all",
    loading: false,
  },
  // Handler for form submissions
  handlers: {
    async addTodo({ current, form }) {
      const text = form.get("text")?.toString() || "";

      // Use batching for consistent state updates
      current.store.batch(() => {
        current.loading = true;
        current.items = [
          ...current.items,
          { id: crypto.randomUUID(), text, completed: false },
        ];
        current.loading = false;
      });

      return current;
    },
  },
});

// Client-side actions that use batching
export function toggleTodo(id) {
  todo.store.batch(() => {
    const items = [...todo.store.items];
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], completed: !items[index].completed };
      todo.store.items = items;
    }
  });
}

export function clearCompleted() {
  todo.store.batch(() => {
    todo.store.items = todo.store.items.filter((item) => !item.completed);
  });
}
```

This approach keeps components clean and focused on the UI:

```tsx
// app/routes/todos.tsx
import { useJodsStore, useJodsForm } from "jods/remix";
import { todo, toggleTodo, clearCompleted } from "~/jods/todo.jods";

export default function TodosRoute() {
  // Get the current state
  const todoState = useJodsStore(todo);
  // Create form bindings for the addTodo handler
  const form = useJodsForm(todo.actions.addTodo);

  return (
    <div>
      <form {...form.props}>
        <input name="text" />
        <button type="submit" disabled={todoState.loading}>
          Add Todo
        </button>
      </form>

      <ul>
        {todoState.items.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleTodo(item.id)}
            />
            {item.text}
          </li>
        ))}
      </ul>

      <button onClick={clearCompleted}>Clear Completed</button>
    </div>
  );
}
```

## 🔄 Integration with Remix

### 🔗 `withJods(stores, loaderFn?)`

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

## 🖥️ Server Components

### 🔁 `rehydrateClient(jodsSnapshot, stores)`

A crucial client-side function to rehydrate jods stores from server-generated snapshots. This function should be called in your app's entry client file to ensure that server-rendered state is properly synchronized with client-side jods stores.

**Why is this needed?**
**You must use this function in every Remix app that uses jods stores.** During the Remix SSR lifecycle, data is loaded on the server through loaders, then sent to the client as part of the initial HTML. Without explicit hydration, your client-side jods stores would start empty, regardless of what was loaded on the server. The `rehydrateClient` function establishes this critical server-to-client data bridge.

**When do you need this?**

- ✅ **Always required** when using any jods stores with Remix, even with a single store
- ✅ Add it to your `entry.client.tsx` file as shown in the example below
- ✅ Include all your jods stores in the stores array parameter
- ❌ There is no "batteries-included" version that does this automatically

**Alternative approaches:**

- For simpler projects, you could create a custom wrapper function in your app that imports all stores and calls `rehydrateClient` automatically
- A future version of jods may provide a simplified API like `setupJodsRemix()` that handles this automatically. (see [issue jods#28](https://github.com/clamstew/jods/issues/28))

**Parameters:**

| Name           | Type                  | Description                                               |
| -------------- | --------------------- | --------------------------------------------------------- |
| `jodsSnapshot` | `Record<string, any>` | An object mapping store names to their initial state data |
| `stores`       | `Array<Store>`        | Array of jods store instances to be hydrated              |

**When to use:**

- In your app's entry client file (`entry.client.tsx`)
- After the initial render, to hydrate jods stores with server data
- Before user interactions that might depend on reactive store data

**Implementation Example:**

```tsx
// app/entry.client.tsx
import { hydrateRoot } from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";
import { rehydrateClient } from "jods/remix";
import { user } from "./jods/user.jods";
import { cart } from "./jods/cart.jods";

// Get the server snapshot from window.__JODS_DATA__
// This is typically injected by the server renderer
const jodsSnapshot = window.__JODS_DATA__ || {};

// Rehydrate all jods stores with their initial server data
rehydrateClient(jodsSnapshot, [user, cart]);

// Then proceed with standard Remix hydration
hydrateRoot(document, <RemixBrowser />);
```

**Root Layout Component Example:**

To make the server snapshot available on the client, include it in your root layout:

```tsx
// app/root.tsx
import { json } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import { withJods } from "jods/remix";
import { user } from "./jods/user.jods";
import { cart } from "./jods/cart.jods";

// Integrate jods with your root loader
export const loader = withJods([user, cart]);

export default function App() {
  const data = useLoaderData();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />

        {/* This makes the jods data available to the client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__JODS_DATA__ = ${JSON.stringify(
              data.__jods || {}
            )};`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
```

**Technical Details:**

- The `rehydrateClient` function uses `Object.assign` to update store properties, which properly triggers signals in the reactive system
- It handles missing or partial snapshots gracefully, only updating stores that have matching data
- This is essential for the "hydration" phase of a Remix application, where server-rendered HTML becomes interactive

## 🛠️ Utility Functions

### 📸 `getJodsSnapshot()`

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

### 🔌 `connectActionToJods(store, actionHandler)`

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

### 🔒 `setJodsCacheControl(headers, options)`

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

## 🧠 Advanced Techniques

### 🔍 Accessing Initial Server Data via `useLoaderData()`

While `useJodsStore` is the recommended way to access jods data, you can also access the initial server-loaded data via `useLoaderData().__jods`. This is primarily useful for debugging and specialized use cases.

**When to use `useLoaderData().__jods`:**

- 🐞 For debugging server/client state differences
- 🔄 When implementing "reset to initial values" functionality
- 🔎 When you specifically need to know what data was initially rendered by the server

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

## 🧰 Internal Utilities

### 🔄 `parseFormData(formData)`

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
