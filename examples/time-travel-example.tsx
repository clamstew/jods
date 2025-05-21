import React, { useState } from "react";
import { store } from "jods";
import { useJods } from "jods/react";
import { createDebugger } from "jods/react";

// Create a store with nested data to demonstrate search by property and JSON state
const appStore = store({
  counter: 0,
  user: {
    name: "Burt",
    role: "admin",
    preferences: {
      theme: "light",
      notifications: true,
    },
  },
  todos: [
    { id: 1, text: "Learn jods", completed: false },
    { id: 2, text: "Build amazing app", completed: false },
  ],
});

// Create the debugger with increased throttle time to reduce history entries
const TimeTravel = createDebugger(appStore, {
  showDiff: true,
  position: "bottom",
  maxEntries: 30,
});

function App() {
  // Use the store in the component
  const state = useJods(appStore);
  const [newTodo, setNewTodo] = useState("");

  // Increment counter
  const incrementCounter = () => {
    appStore.counter++;
  };

  // Change user preferences
  const toggleTheme = () => {
    appStore.user.preferences.theme =
      state.user.preferences.theme === "light" ? "dark" : "light";
  };

  // Add a new todo
  const addTodo = () => {
    if (newTodo.trim()) {
      appStore.todos.push({
        id: state.todos.length + 1,
        text: newTodo,
        completed: false,
      });
      setNewTodo("");
    }
  };

  // Toggle todo completion
  const toggleTodo = (id) => {
    const todoIndex = state.todos.findIndex((todo) => todo.id === id);
    if (todoIndex >= 0) {
      // Create a new todos array with the toggled item
      const updatedTodos = [...state.todos];
      updatedTodos[todoIndex] = {
        ...updatedTodos[todoIndex],
        completed: !updatedTodos[todoIndex].completed,
      };
      appStore.todos = updatedTodos;
    }
  };

  // Update user name
  const updateUserName = (name) => {
    appStore.user.name = name;
  };

  return (
    <div className="app">
      <h1>jods Time-Travel Example</h1>

      <div className="section">
        <h2>Counter: {state.counter}</h2>
        <button onClick={incrementCounter}>Increment</button>
      </div>

      <div className="section">
        <h2>User Profile</h2>
        <div>
          <label>
            Name:
            <input
              value={state.user.name}
              onChange={(e) => updateUserName(e.target.value)}
            />
          </label>
        </div>
        <div>Role: {state.user.role}</div>
        <div>
          Theme: {state.user.preferences.theme}
          <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
      </div>

      <div className="section">
        <h2>Todo List</h2>
        <div className="add-todo">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo"
          />
          <button onClick={addTodo}>Add</button>
        </div>
        <ul className="todo-list">
          {state.todos.map((todo) => (
            <li
              key={todo.id}
              className={todo.completed ? "completed" : ""}
              onClick={() => toggleTodo(todo.id)}
            >
              {todo.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="help-section">
        <h3>Using the Time-Travel Debugger</h3>
        <p>The debugger at the bottom of the screen allows you to:</p>
        <ul>
          <li>Navigate through state history with Previous/Next buttons</li>
          <li>Click points on the timeline to jump to specific states</li>
          <li>
            Use Property search to find states with specific property values
          </li>
          <li>
            Use JSON search to find complex state patterns, for example:
            <pre>{`{"user":{"preferences":{"theme":"dark"}}}`}</pre>
            or
            <pre>{`{"todos":[{"completed":true}]}`}</pre>
          </li>
        </ul>
      </div>

      {/* Render the time-travel debugger */}
      <TimeTravel />

      <style>{`
        .app {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, "Helvetica Neue", sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          padding-bottom: 250px; /* Space for the debugger */
        }
        .section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        .todo-list li {
          cursor: pointer;
          padding: 8px;
          margin: 4px 0;
          border-radius: 4px;
          background: #f5f5f5;
        }
        .todo-list li.completed {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .add-todo {
          display: flex;
          margin-bottom: 10px;
        }
        .add-todo input {
          flex: 1;
          padding: 8px;
          margin-right: 8px;
        }
        button {
          background: #4a90e2;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 8px;
        }
        button:hover {
          background: #3a80d2;
        }
        .help-section {
          background: #fffaf0;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 30px;
        }
        pre {
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

export default App;
