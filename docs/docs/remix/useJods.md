---
sidebar_position: 2
title: "useJods - The Unified Hook"
description: "Combine store data access and form handlers in one elegant hook"
---

# useJods

The unified way to access jods data and actions in Remix applications.

## 🤯 Direct Mutation Magic: The jods Way!

When working with jods in Remix applications, you typically need two things:

1. Access to your reactive store data
2. Form handlers to update your data

The `useJods` hook provides a clean, unified API for both, with a powerful direct mutation model that will change how you think about state management:

```tsx
// Multiple stores with direct mutation
import { useJods } from "jods/remix";

const { stores, actions } = useJods([userStore, todoStore], {
  user: ["updateProfile"],
  todos: ["addTodo"],
});

// Access state from different stores
console.log(stores.user.name);
console.log(stores.todos.items);

// Directly mutate properties (the jods way!)
stores.user.name = "New Name"; // Not setState()
stores.todos.items.push(newTodo); // Direct array mutation
stores.todos.completed = !stores.todos.completed; // Toggle boolean
```

This unified approach replaces multiple separate hooks with one elegant API:

```tsx
// Unified approach
import { useJods } from "jods/remix";
import todoStore from "todos.jods";

function TodoPage() {
  // Get both store data and actions in one hook call
  const { stores, actions, loaderData } = useJods(todoStore, [
    "addTodo",
    "deleteTodo",
  ]);

  return (
    <>
      <h1>{loaderData.title}</h1>
      <ul>
        {stores.items.map((item) => (
          <li key={item.id}>
            {item.text}
            <actions.deleteTodo.Form>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit">Delete</button>
            </actions.deleteTodo.Form>
          </li>
        ))}
      </ul>

      <actions.addTodo.Form>
        <input name="text" />
        <button type="submit">Add Todo</button>
      </actions.addTodo.Form>
    </>
  );
}
```

## 👴 The Old Way: Multiple Hooks and More Code

This replaces the previous approach that required multiple separate hooks:

```tsx
// Previous approach
import { useJodsStore, useJodsForm } from "jods/remix";

function TodoPage() {
  // Access store data
  const todoData = useJodsStore(todoStore);
  // Get loader data separately
  const loaderData = useLoaderData();

  // Access form handlers separately
  const addTodoForm = useJodsForm(todoStore, "addTodo");
  const deleteTodoForm = useJodsForm(todoStore, "deleteTodo");

  return (
    <>
      <h1>{loaderData.title}</h1>
      <ul>
        {todoData.items.map((item) => (
          <li key={item.id}>
            {item.text}
            <deleteTodoForm.Form>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit">Delete</button>
            </deleteTodoForm.Form>
          </li>
        ))}
      </ul>

      <addTodoForm.Form>
        <input name="text" />
        <button type="submit">Add Todo</button>
      </addTodoForm.Form>
    </>
  );
}
```

## 📚 API Reference

### 🔄 Basic Usage

```tsx
const { stores, actions, loaderData } = useJods(store, handlers?);
```

- `store`: A jods store or array of stores
- `handlers`: Optional. A handler name, array of handler names, or a mapping of store names to handler names
- Returns:
  - `stores`: Enhanced store object(s) with reactive state and original methods
  - `actions`: Form handlers and other actions
  - `loaderData`: Data from the route loader

### 🔍 Single Store Examples

**With a single handler:**

```tsx
const { stores, actions } = useJods(todoStore, "addTodo");

// Use stores.items to access store data
// Use stores.setState to call original store methods
// Use actions.addTodo.Form for the form
```

**With multiple handlers:**

```tsx
const { stores, actions } = useJods(todoStore, [
  "addTodo",
  "deleteTodo",
  "toggleTodo",
]);

// Access all forms via actions.addTodo, actions.deleteTodo, etc.
```

### 🔀 Multiple Stores

When working with multiple stores, you can specify handlers for each store:

```tsx
const { stores, actions } = useJods([userStore, todoStore], {
  user: ["updateProfile", "changePassword"],
  todos: ["addTodo", "deleteTodo"],
});

// Access data and methods via stores.user and stores.todos
// Example: stores.user.name, stores.todos.items
// Example: stores.user.setState({ name: "New Name" })
// Access forms via actions.user.updateProfile.Form, actions.todos.addTodo.Form, etc.
```

## 🔌 Integration with Loaders

The `useJods` hook automatically gives you access to loader data:

```tsx
// In your loader
export const loader = withJods([todoStore], async () => {
  return { title: "Todo List" };
});

// In your component
function TodoPage() {
  const { stores, actions, loaderData } = useJods(todoStore, "addTodo");

  return (
    <>
      <h1>{loaderData.title}</h1>
      {/* Rest of the component */}
    </>
  );
}
```

## ⚡ Enhanced Store Functionality

The `stores` object returned by `useJods` combines the reactive state with all the methods from the original store:

```tsx
const { stores } = useJods(todoStore);

// Access reactive state
console.log(stores.items);

// Call original store methods
stores.setState({ items: [...stores.items, newItem] });

// Or use direct mutations
stores.items.push(newItem); // Direct array mutation
stores.theme = "dark"; // Direct property assignment
```

This means you don't need to keep a reference to both the original store and its state - everything is available in one place.

### 🪄 Direct Mutations

One of the most powerful features of jods is the ability to directly mutate your store properties:

```tsx
const { stores } = useJods([userStore, todoStore]);

// Directly assign to primitive values
stores.user.name = "New Name";
stores.user.isAdmin = true;

// Directly mutate arrays
stores.todos.items.push({ id: "new", text: "New todo", completed: false });
stores.todos.items.splice(2, 1); // Remove an item

// Directly mutate nested objects
stores.user.preferences.theme = "dark";
stores.user.preferences.notifications = false;

// Toggle boolean values
stores.ui.sidebarOpen = !stores.ui.sidebarOpen;
```

Unlike traditional React state management solutions that require immutable updates with `setState`, jods automatically tracks these mutations and triggers re-renders as needed. This gives you a more natural programming model while maintaining all the benefits of reactivity.

## 🎯 Why Use This Approach?

1. 📉 **Less Boilerplate**: Combine multiple hook calls into one
2. 💪 **Enhanced Store Objects**: Get reactive state and store methods in one place
3. 🛡️ **Type Safety**: Fully type-safe with TypeScript
4. 📈 **Better Scalability**: Easily add more handlers without cluttering your component
5. 🔄 **Unified Access**: Get loader data alongside your store data in one place
6. ✏️ **Direct Mutations**: Update your state naturally with direct property assignments

## 🚀 Full Example

Here's a complete example with multiple stores and handlers:

```tsx
import { useJods } from "jods/remix";
import { todoStore, uiStore } from "~/stores";

function TodoApp() {
  const { stores, actions, loaderData } = useJods([todoStore, uiStore], {
    todos: ["add", "delete", "toggle"],
    ui: ["setTheme", "toggleSidebar"],
  });

  // Example of directly manipulating store properties
  const toggleDarkMode = () => {
    // Direct mutation of store properties
    stores.ui.theme = stores.ui.theme === "dark" ? "light" : "dark";

    // You can also directly mutate nested properties or arrays
    if (stores.ui.recentThemes) {
      stores.ui.recentThemes.push(stores.ui.theme);
    }
  };

  // Use the direct store access for conditional logic
  const isNewUser = stores.todos.items.length === 0;
  const showWelcome = isNewUser && !stores.ui.welcomeDismissed;

  return (
    <div className={stores.ui.theme}>
      <header>
        <h1>{loaderData.title}</h1>
        {showWelcome && (
          <div className="welcome-banner">
            <h2>Welcome to your Todo List!</h2>
            <button onClick={() => (stores.ui.welcomeDismissed = true)}>
              Got it
            </button>
          </div>
        )}
        <button onClick={toggleDarkMode}>
          Switch to {stores.ui.theme === "dark" ? "Light" : "Dark"} Mode
        </button>
        <actions.ui.toggleSidebar.Form>
          <button type="submit">
            {stores.ui.sidebarOpen ? "Close" : "Open"} Sidebar
          </button>
        </actions.ui.toggleSidebar.Form>
      </header>

      <main>
        <ul>
          {stores.todos.items.map((todo) => (
            <li key={todo.id} className={todo.completed ? "completed" : ""}>
              {todo.text}
              <div className="actions">
                <actions.todos.toggle.Form>
                  <input type="hidden" name="id" value={todo.id} />
                  <button type="submit">
                    {todo.completed ? "Mark Incomplete" : "Mark Complete"}
                  </button>
                </actions.todos.toggle.Form>

                <actions.todos.delete.Form>
                  <input type="hidden" name="id" value={todo.id} />
                  <button type="submit">Delete</button>
                </actions.todos.delete.Form>
              </div>
            </li>
          ))}
        </ul>

        <actions.todos.add.Form>
          <input name="text" placeholder="Add a new todo..." />
          <button type="submit">Add</button>
        </actions.todos.add.Form>
      </main>

      <footer>
        <actions.ui.setTheme.Form>
          <select name="theme" defaultValue={stores.ui.theme}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <button type="submit">Change Theme</button>
        </actions.ui.setTheme.Form>
      </footer>
    </div>
  );
}
```

## 🤔 Wait, Did We Just...?

_"Did I just obsolete forms for client-side updates? 🤦 The data syncs back to the main store either way... Forms or direct mutations, jods handles it all!"_

With jods, you get the best of both worlds 🙌 - server-side form submissions for permanent data changes and direct client-side mutations for responsive UI updates. Direct mutations give you that immediate reactive feel 🤷, while forms handle the heavy lifting of server persistence. Use whichever fits your needs at the moment! 🙇
