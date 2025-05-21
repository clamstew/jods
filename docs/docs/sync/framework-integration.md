# Framework Integration

The `sync` API is designed to work seamlessly with all jods framework integrations. This page shows how to integrate the sync API with React, Preact, and Remix frameworks.

## React Integration

### Basic Component-level Integration

In a React application, you typically want to set up the sync connection when your component mounts and clean it up when it unmounts:

```tsx
import React, { useEffect, useState } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Create your store
const counterStore = store({
  count: 0,
  user: {
    name: "User",
    status: "online",
  },
});

function Counter() {
  const state = useJods(counterStore);
  const [syncActive, setSyncActive] = useState(false);
  const [socket, setSocket] = useState(null);

  // Set up WebSocket and sync on mount
  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket("wss://yourapidomain.com/counters");

    // Wait for connection to open
    ws.addEventListener("open", () => {
      // Set up sync and get cleanup function
      const stopSync = sync(ws, counterStore, {
        // Only sync the count, not user information
        allowKeys: ["count"],
        // Throttle updates to reduce network traffic
        throttleMs: 300,
      });

      // Store socket for later and mark sync as active
      setSocket(ws);
      setSyncActive(true);

      // Return cleanup function for useEffect
      return () => {
        stopSync();
        ws.close();
        setSyncActive(false);
      };
    });

    // Handle socket closure
    ws.addEventListener("close", () => {
      setSyncActive(false);
    });

    // Clean up on unmount
    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <div>
      <div>{syncActive ? "Connected" : "Disconnected"}</div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => counterStore.count++}>Increment</button>
      <p>
        User: {state.user.name} ({state.user.status})
      </p>
    </div>
  );
}
```

### Custom Hook Pattern

For reusable sync functionality across components, create a custom hook:

```tsx
import { useEffect, useState } from "react";
import { sync, Store } from "jods";
import { useJods } from "jods/react";

// Custom hook for syncing a store with a WebSocket
function useSyncedStore<T>(store: T & Store<T>, url: string, options = {}) {
  const storeValue = useJods(store);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let stopSync: (() => void) | null = null;
    const socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      stopSync = sync(socket, store, {
        ...options,
        onError: (err) => {
          setError(err);
          if (options.onError) options.onError(err);
        },
      });
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("error", (event) => {
      setError(new Error("WebSocket error"));
      setIsConnected(false);
    });

    return () => {
      if (stopSync) stopSync();
      socket.close();
    };
  }, [store, url, options]);

  return { value: storeValue, isConnected, error };
}

// Usage in component
function ChatApp() {
  const chatStore = store({
    messages: [],
    activeUsers: [],
  });

  const { value, isConnected } = useSyncedStore(
    chatStore,
    "wss://example.com/chat",
    { allowKeys: ["messages", "activeUsers"] }
  );

  return (
    <div>
      <div className={isConnected ? "status-connected" : "status-disconnected"}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      <ul>
        {value.messages.map((msg, i) => (
          <li key={i}>{msg.text}</li>
        ))}
      </ul>

      <div>
        <h3>Active Users ({value.activeUsers.length})</h3>
        <ul>
          {value.activeUsers.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Cross-Tab Synchronization

Sync state across multiple tabs in the same browser using BroadcastChannel:

```tsx
import { useEffect } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Create a store with initial data
const appStore = store({
  theme: "light",
  sidebarOpen: true,
  notifications: [],
});

function AppSettings() {
  const state = useJods(appStore);

  // Set up cross-tab sync on mount
  useEffect(() => {
    // Create a channel with a unique name for your app
    const channel = new BroadcastChannel("app-state-sync");

    // Start syncing
    const stopSync = sync(channel, appStore);

    // Clean up on unmount
    return () => {
      stopSync();
      channel.close();
    };
  }, []);

  return (
    <div>
      <h1>Settings</h1>
      <div>
        <label>
          Theme:
          <select
            value={state.theme}
            onChange={(e) => {
              appStore.theme = e.target.value;
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>

      <button onClick={() => (appStore.sidebarOpen = !state.sidebarOpen)}>
        {state.sidebarOpen ? "Hide" : "Show"} Sidebar
      </button>

      <div>
        <h3>Notifications ({state.notifications.length})</h3>
        <button
          onClick={() => {
            appStore.notifications.push({
              id: Date.now(),
              text: "New notification at " + new Date().toLocaleTimeString(),
            });
          }}
        >
          Add Notification
        </button>
      </div>
    </div>
  );
}
```

## Preact Integration

The Preact integration follows the same patterns as React but uses Preact's hooks and components.

### Basic Component Example

```tsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { store, sync } from "jods";
import { useJods } from "jods/preact";

// Create store
const taskStore = store({
  tasks: [],
  filter: "all",
});

function TaskList() {
  const state = useJods(taskStore);
  const [isConnected, setIsConnected] = useState(false);

  // Set up sync on mount
  useEffect(() => {
    const socket = new WebSocket("wss://tasks-api.example.com");

    socket.addEventListener("open", () => {
      const stopSync = sync(socket, taskStore);
      setIsConnected(true);

      return () => {
        stopSync();
        setIsConnected(false);
      };
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    return () => {
      socket.close();
    };
  }, []);

  // Filter tasks based on the current filter
  const filteredTasks = state.tasks.filter((task) => {
    if (state.filter === "all") return true;
    if (state.filter === "active") return !task.completed;
    if (state.filter === "completed") return task.completed;
    return true;
  });

  return (
    <div>
      <div class={isConnected ? "connected" : "disconnected"}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      <h1>Tasks</h1>

      <div class="filters">
        <button
          class={state.filter === "all" ? "active" : ""}
          onClick={() => (taskStore.filter = "all")}
        >
          All
        </button>
        <button
          class={state.filter === "active" ? "active" : ""}
          onClick={() => (taskStore.filter = "active")}
        >
          Active
        </button>
        <button
          class={state.filter === "completed" ? "active" : ""}
          onClick={() => (taskStore.filter = "completed")}
        >
          Completed
        </button>
      </div>

      <ul class="task-list">
        {filteredTasks.map((task) => (
          <li key={task.id} class={task.completed ? "completed" : ""}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => {
                const t = taskStore.tasks.find((t) => t.id === task.id);
                if (t) t.completed = !t.completed;
              }}
            />
            <span>{task.text}</span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem(
            "task"
          ) as HTMLInputElement;
          if (input?.value) {
            taskStore.tasks.push({
              id: Date.now().toString(),
              text: input.value,
              completed: false,
            });
            input.value = "";
          }
        }}
      >
        <input name="task" placeholder="Add a task" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

### Custom Hook for Preact

Similar to the React custom hook, but using Preact's hooks:

```tsx
import { useEffect, useState } from "preact/hooks";
import { sync, Store } from "jods";
import { useJods } from "jods/preact";

// Custom hook for syncing a store with a WebSocket in Preact
function useSyncedStore<T>(store: T & Store<T>, url: string, options = {}) {
  const storeValue = useJods(store);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let stopSync: (() => void) | null = null;
    const socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      stopSync = sync(socket, store, {
        ...options,
        onError: (err) => {
          setError(err);
          if (options.onError) options.onError(err);
        },
      });
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("error", (event) => {
      setError(new Error("WebSocket error"));
      setIsConnected(false);
    });

    return () => {
      if (stopSync) stopSync();
      socket.close();
    };
  }, [store, url, options]);

  return { value: storeValue, isConnected, error };
}
```

## Remix Integration

Remix requires special handling due to its server-side rendering (SSR) and hydration process. The key is to only enable sync after hydration is complete.

### Basic Remix Integration

```tsx
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { store, sync } from "jods";
import { useJods } from "jods/remix";

// Server-side loader
export async function loader() {
  // Fetch initial data from API/database
  const todos = await fetchTodosFromDatabase();

  return json({ todos });
}

// Client store - create outside component
const todoStore = store({
  todos: [],
  filter: "all",
});

export default function TodoApp() {
  // Get initial data from loader
  const initialData = useLoaderData();

  // Track hydration status
  const [isHydrated, setIsHydrated] = useState(false);

  // Track sync status
  const [isConnected, setIsConnected] = useState(false);

  // Use the store with Remix's useJods hook
  const state = useJods(todoStore);

  // Initialize store with server data on mount
  useEffect(() => {
    // Only do this once on initial load
    if (!isHydrated) {
      // Populate store with server data
      todoStore.todos = initialData.todos;
      todoStore.filter = "all";

      // Mark as hydrated
      setIsHydrated(true);
    }
  }, [initialData]);

  // ONLY set up sync AFTER hydration is complete
  useEffect(() => {
    // Skip if not hydrated yet
    if (!isHydrated) return;

    // Now it's safe to set up WebSocket and sync
    const socket = new WebSocket("wss://remix-todos-api.example.com");

    socket.addEventListener("open", () => {
      const stopSync = sync(socket, todoStore, {
        // Sync options here
        throttleMs: 100,
      });

      setIsConnected(true);

      return () => {
        stopSync();
        socket.close();
        setIsConnected(false);
      };
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    return () => {
      socket.close();
    };
  }, [isHydrated]); // Only run when hydration state changes

  return (
    <div>
      <div className="status">
        {!isHydrated
          ? "Hydrating..."
          : isConnected
          ? "Connected"
          : "Disconnected"}
      </div>

      <h1>Todo List</h1>

      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => {
                const t = todoStore.todos.find((t) => t.id === todo.id);
                if (t) t.completed = !t.completed;
              }}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>

      {/* Form to add todos */}
      <form
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const text = formData.get("text") as string;

          // Update local store
          todoStore.todos.push({
            id: Date.now().toString(),
            text,
            completed: false,
          });

          // Reset form
          e.currentTarget.reset();
        }}
      >
        <input name="text" placeholder="What needs to be done?" />
        <button type="submit">Add Todo</button>
      </form>
    </div>
  );
}
```

### Integration with Remix Form Actions

For a more complete Remix integration with form actions:

```tsx
import { useEffect, useState } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { store, sync } from "jods";
import { useJods } from "jods/remix";

// Server-side loader
export async function loader() {
  // Fetch todos from database
  const todos = await fetchTodosFromDatabase();

  return json({ todos });
}

// Server-side action handler
export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add-todo") {
    const text = formData.get("text");

    // Create in database
    const newTodo = await createTodoInDatabase({
      text,
      completed: false,
    });

    return json({ success: true, todo: newTodo });
  }

  if (intent === "toggle-todo") {
    const id = formData.get("id");
    const completed = formData.get("completed") === "true";

    // Update in database
    await updateTodoInDatabase(id, { completed: !completed });

    return json({ success: true });
  }

  return json({ success: false, error: "Unknown intent" });
}

// Client store
const todoStore = store({
  todos: [],
  filter: "all",
});

export default function TodoApp() {
  const loaderData = useLoaderData();
  const actionData = useActionData();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Use the store with Remix's useJods hook
  const state = useJods(todoStore);

  // Initialize store with server data on mount
  useEffect(() => {
    if (!isHydrated) {
      todoStore.todos = loaderData.todos;
      setIsHydrated(true);
    }
  }, [loaderData]);

  // Handle action data updates
  useEffect(() => {
    if (actionData?.success && actionData?.todo) {
      // Check if todo already exists (to avoid duplicates from sync)
      const exists = todoStore.todos.some((t) => t.id === actionData.todo.id);

      if (!exists) {
        todoStore.todos.push(actionData.todo);
      }
    }
  }, [actionData]);

  // Set up sync AFTER hydration
  useEffect(() => {
    if (!isHydrated) return;

    const socket = new WebSocket("wss://remix-todos-api.example.com");

    socket.addEventListener("open", () => {
      const stopSync = sync(socket, todoStore);
      setIsConnected(true);

      return () => {
        stopSync();
        socket.close();
        setIsConnected(false);
      };
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    return () => {
      socket.close();
    };
  }, [isHydrated]);

  return (
    <div>
      <div className="status">
        {!isHydrated
          ? "Hydrating..."
          : isConnected
          ? "Connected"
          : "Disconnected"}
      </div>

      <h1>Todo List</h1>

      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id}>
            <Form method="post" className="inline-form">
              <input type="hidden" name="intent" value="toggle-todo" />
              <input type="hidden" name="id" value={todo.id} />
              <input
                type="hidden"
                name="completed"
                value={String(todo.completed)}
              />
              <button
                type="submit"
                className={todo.completed ? "completed" : ""}
                onClick={(e) => {
                  // Optimistic UI update
                  e.preventDefault();

                  // Update local state immediately
                  const t = todoStore.todos.find((t) => t.id === todo.id);
                  if (t) t.completed = !t.completed;

                  // Then submit the form programmatically
                  e.currentTarget.form.submit();
                }}
              >
                {todo.completed ? "✓" : "○"}
              </button>
            </Form>
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>

      <Form method="post" className="add-form">
        <input type="hidden" name="intent" value="add-todo" />
        <input name="text" placeholder="What needs to be done?" required />
        <button type="submit">Add Todo</button>
      </Form>
    </div>
  );
}
```

## Best Practices

### Connection Management

1. **Always clean up connections** when components unmount:

   ```jsx
   useEffect(() => {
     const socket = new WebSocket(url);
     const stopSync = sync(socket, store);

     return () => {
       stopSync(); // First stop syncing
       socket.close(); // Then close the socket
     };
   }, []);
   ```

2. **Handle connection errors and reconnection**:
   ```jsx
   useEffect(() => {
     let socket = null;
     let stopSync = null;
     let reconnectTimer = null;

     const connect = () => {
       socket = new WebSocket(url);

       socket.addEventListener("open", () => {
         stopSync = sync(socket, store);
         setIsConnected(true);
       });

       socket.addEventListener("close", () => {
         setIsConnected(false);
         // Try to reconnect after 3 seconds
         reconnectTimer = setTimeout(connect, 3000);
       });

       socket.addEventListener("error", () => {
         socket.close();
       });
     };

     connect();

     return () => {
       if (stopSync) stopSync();
       if (socket) socket.close();
       if (reconnectTimer) clearTimeout(reconnectTimer);
     };
   }, [url]);
   ```

### Security Best Practices

1. **Only sync necessary data** using the `allowKeys` option:

   ```jsx
   const stopSync = sync(socket, userStore, {
     // Only sync these properties
     allowKeys: ["preferences", "publicProfile"],
     // Never sync sensitive properties
     sensitiveKeys: ["password", "authTokens", "personalData.ssn"],
   });
   ```

2. **Use `receiveOnly` mode** for untrusted sources:

   ```jsx
   // For public displays that should never send data back
   const stopSync = sync(publicSocket, displayStore, {
     receiveOnly: true,
   });
   ```

3. **Validate incoming data**:
   ```jsx
   const stopSync = sync(socket, store, {
     validateSchema: (changes) => {
       // Use Zod, Yup, or custom validation
       try {
         mySchema.parse(changes);
         return true;
       } catch (error) {
         console.error("Invalid data received:", error);
         return false;
       }
     },
   });
   ```

### Performance Optimization

1. **Adjust throttling** based on your application's needs:

   ```jsx
   // For real-time collaborative editing, use low throttle
   const stopSync = sync(socket, documentStore, {
     throttleMs: 50, // Send updates quickly
   });

   // For less critical updates, use higher throttle
   const stopSync = sync(socket, analyticsStore, {
     throttleMs: 1000, // Only send every second
   });
   ```

2. **Filter unnecessary changes**:
   ```jsx
   const stopSync = sync(socket, store, {
     filter: (changes) => {
       // Only sync if changes are significant
       return Object.keys(changes).some(
         (key) =>
           key === "important" ||
           (changes[key] &&
             typeof changes[key] === "object" &&
             Object.keys(changes[key]).length > 0)
       );
     },
   });
   ```

### Framework-Specific Recommendations

1. **For React/Preact**: Create reusable custom hooks for sync functionality.

2. **For Remix**:

   - Always wait for hydration to complete before enabling sync
   - Coordinate with form submissions to avoid duplicate updates
   - Consider optimistic UI updates for better UX

3. **For all frameworks**:
   - Keep socket and sync logic in top-level components
   - Use connection status for visual feedback to users
   - Implement proper error handling and reconnection logic

## Debugging Tips

To help debug sync issues, use the `onDiffSend` and `onPatchReceive` callbacks:

```jsx
const stopSync = sync(socket, store, {
  onDiffSend: (message) => {
    console.log("Sending:", message);
  },
  onPatchReceive: (message) => {
    console.log("Received:", message);
  },
  onError: (error) => {
    console.error("Sync error:", error);
  },
});
```

For more advanced debugging, enable jods debug logging:

```jsx
import { debug } from "jods";

// Enable debug logging for sync operations
debug.configure({
  enabled: true,
  categories: ["sync"],
});
```

## Next Steps

- Check the [Sync API Reference](./api-reference.md) for all available options
- See [Socket Adapters](./socket-adapters.md) for integrating with different transport libraries
- Learn about [Security Best Practices](./security.md) when using sync with remote servers
