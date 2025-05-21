/**
 * Cross-Tab Synchronized Todo Application with jods sync API
 *
 * This example demonstrates how to use the jods sync API with Preact
 * to synchronize state between browser tabs using BroadcastChannel.
 */

import { h } from "preact";
import { useEffect, useState, useCallback } from "preact/hooks";
import { store, sync } from "jods";
import { useJods } from "jods/preact";

// Create a store for the todo application
const todoStore = store({
  todos: [],
  filter: "all", // 'all', 'active', 'completed'
  theme: "light", // 'light', 'dark'
  syncStatus: "inactive", // 'active', 'error'
  lastUpdate: {
    time: null,
    tabId: null,
  },
});

// Generate a unique ID for this tab
const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Todo Application
export function TodoApp() {
  const state = useJods(todoStore);
  const [newTodo, setNewTodo] = useState("");
  const [channel, setChannel] = useState(null);

  // Set up synchronization with BroadcastChannel
  useEffect(() => {
    // Create a BroadcastChannel for cross-tab communication
    const broadcastChannel = new BroadcastChannel("todo-app-sync");
    setChannel(broadcastChannel);

    // Start synchronization
    const stopSync = sync(broadcastChannel, todoStore, {
      // Properties to sync
      allowKeys: ["todos", "filter", "theme", "lastUpdate"],
      // Throttle updates
      throttleMs: 100,
      // Handle errors
      onError: (err) => {
        console.error("Sync error:", err);
        todoStore.syncStatus = "error";
      },
      // Called when changes are sent to other tabs
      onDiffSend: (diff) => {
        // Update lastUpdate information
        todoStore.lastUpdate = {
          time: Date.now(),
          tabId,
        };
      },
    });

    // Mark sync as active
    todoStore.syncStatus = "active";

    // Initialize with default todos if empty
    if (todoStore.todos.length === 0) {
      todoStore.todos = [
        { id: 1, text: "Try editing this todo", completed: false },
        {
          id: 2,
          text: "Open another browser tab to see sync",
          completed: false,
        },
        { id: 3, text: "Change theme or filter to test sync", completed: true },
      ];
    }

    // Cleanup on unmount
    return () => {
      stopSync();
      broadcastChannel.close();
      todoStore.syncStatus = "inactive";
    };
  }, []);

  // Add a new todo
  const handleAddTodo = useCallback(
    (e) => {
      e.preventDefault();

      if (!newTodo.trim()) return;

      // Find maximum ID to ensure unique IDs across tabs
      const maxId = state.todos.reduce(
        (max, todo) => Math.max(max, typeof todo.id === "number" ? todo.id : 0),
        0
      );

      // Add new todo to store
      todoStore.todos.push({
        id: maxId + 1,
        text: newTodo,
        completed: false,
      });

      // Clear input
      setNewTodo("");
    },
    [newTodo, state.todos]
  );

  // Toggle todo completion
  const toggleTodo = useCallback((id) => {
    const todo = todoStore.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }, []);

  // Delete a todo
  const deleteTodo = useCallback((id) => {
    const index = todoStore.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      todoStore.todos.splice(index, 1);
    }
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    todoStore.theme = todoStore.theme === "light" ? "dark" : "light";
  }, []);

  // Filter todos
  const filteredTodos = state.todos.filter((todo) => {
    if (state.filter === "active") return !todo.completed;
    if (state.filter === "completed") return todo.completed;
    return true; // 'all' filter
  });

  // Check if we have an update from another tab
  const isExternalUpdate =
    state.lastUpdate &&
    state.lastUpdate.tabId &&
    state.lastUpdate.tabId !== tabId;

  return (
    <div class={`todo-app theme-${state.theme}`}>
      <header>
        <h1>Todo List</h1>

        <div class="sync-status">
          {state.syncStatus === "active" ? (
            <span class="status active">Synced across tabs ✓</span>
          ) : state.syncStatus === "error" ? (
            <span class="status error">Sync error ⚠️</span>
          ) : (
            <span class="status inactive">Not synced</span>
          )}
        </div>

        {isExternalUpdate && (
          <div class="update-notice">
            Updated from another tab at{" "}
            {new Date(state.lastUpdate.time).toLocaleTimeString()}
          </div>
        )}

        <button class="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {state.theme === "light" ? "🔆" : "🌙"}
        </button>
      </header>

      <form onSubmit={handleAddTodo}>
        <input
          type="text"
          value={newTodo}
          onInput={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <div class="filters">
        <button
          class={state.filter === "all" ? "active" : ""}
          onClick={() => (todoStore.filter = "all")}
        >
          All
        </button>
        <button
          class={state.filter === "active" ? "active" : ""}
          onClick={() => (todoStore.filter = "active")}
        >
          Active
        </button>
        <button
          class={state.filter === "completed" ? "active" : ""}
          onClick={() => (todoStore.filter = "completed")}
        >
          Completed
        </button>
      </div>

      <ul class="todo-list">
        {filteredTodos.length === 0 ? (
          <li class="empty-state">No todos to display</li>
        ) : (
          filteredTodos.map((todo) => (
            <li key={todo.id} class={todo.completed ? "completed" : ""}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span class="todo-text">{todo.text}</span>
              <button
                class="delete-button"
                onClick={() => deleteTodo(todo.id)}
                title="Delete todo"
              >
                ×
              </button>
            </li>
          ))
        )}
      </ul>

      <footer>
        <div class="todo-count">
          {state.todos.filter((t) => !t.completed).length} items left
        </div>
        <div class="tab-info">Tab ID: {tabId.substr(-6)}</div>
      </footer>
    </div>
  );
}

// CSS (would typically be in a separate file)
const styles = `
.todo-app {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
  transition: background-color 0.3s, color 0.3s;
}

.theme-light {
  background-color: #f9f9f9;
  color: #333;
}

.theme-dark {
  background-color: #222;
  color: #eee;
}

header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

h1 {
  margin: 0;
  flex: 1;
}

.sync-status {
  font-size: 0.8rem;
  margin-right: 10px;
}

.status {
  padding: 3px 6px;
  border-radius: 3px;
}

.status.active {
  background-color: #e7f7e7;
  color: #2a682a;
}

.status.error {
  background-color: #fff0f0;
  color: #c42b2b;
}

.status.inactive {
  background-color: #f0f0f0;
  color: #666;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
}

.update-notice {
  position: absolute;
  top: 100%;
  right: 0;
  font-size: 0.8rem;
  color: #0080ff;
  background-color: rgba(255,255,255,0.9);
  padding: 3px 6px;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  animation: fadeIn 0.3s ease-out;
}

.theme-dark .update-notice {
  background-color: rgba(40,40,40,0.9);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

form {
  display: flex;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.theme-dark input {
  background-color: #333;
  color: #eee;
  border-color: #444;
}

button {
  padding: 10px 15px;
  background-color: #0080ff;
  color: white;
  border: none;
  cursor: pointer;
}

button[type="submit"] {
  border-radius: 0 4px 4px 0;
}

.filters {
  display: flex;
  margin-bottom: 15px;
  gap: 5px;
}

.filters button {
  flex: 1;
  background-color: #f0f0f0;
  color: #333;
  border-radius: 4px;
}

.theme-dark .filters button {
  background-color: #444;
  color: #eee;
}

.filters button.active {
  background-color: #0080ff;
  color: white;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: white;
  margin-bottom: 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.theme-dark .todo-list li {
  background-color: #333;
}

.todo-list li.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.theme-dark .todo-list li.completed .todo-text {
  color: #777;
}

.todo-list .empty-state {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

.todo-text {
  flex: 1;
  margin: 0 10px;
}

.delete-button {
  background: none;
  border: none;
  color: #ff4d4d;
  font-size: 1.2rem;
  padding: 0 5px;
}

footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 0.9rem;
  color: #777;
}

.theme-dark footer {
  color: #aaa;
}

.tab-info {
  font-family: monospace;
  padding: 2px 5px;
  background-color: #f0f0f0;
  border-radius: 3px;
}

.theme-dark .tab-info {
  background-color: #444;
}
`;

// Simulate Preact rendering
export const Demo = () => (
  <>
    <style>{styles}</style>
    <TodoApp />
  </>
);
