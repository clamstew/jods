---
sidebar_position: 3
title: Framework Integration
description: Using the sync API with React, Preact, and Remix
---

# Framework Integration

This guide shows how to use the jods `sync` API with React, Preact, and Remix frameworks.

## React Integration

React applications can leverage the jods sync API to create real-time collaborative experiences and cross-tab synchronization.

### Basic React Setup

```jsx
import { useEffect, useState } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Create a store
const chatStore = store({
  messages: [],
  users: [],
  status: "disconnected",
});

function ChatApp() {
  const state = useJods(chatStore);
  const [syncActive, setSyncActive] = useState(false);

  // Set up WebSocket connection and sync
  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket("wss://chat-server.example.com");

    // Start syncing when socket is connected
    const stopSync = sync(socket, chatStore, {
      // Secure sync by only allowing specific properties
      allowKeys: ["messages", "users", "status"],
      // Reduce network traffic by throttling updates
      throttleMs: 300,
      // Error handling
      onError: (err) => console.error("Sync error:", err),
    });

    setSyncActive(true);

    // Update connection status based on socket state
    socket.addEventListener("open", () => {
      chatStore.status = "connected";
    });

    socket.addEventListener("close", () => {
      chatStore.status = "disconnected";
    });

    // Clean up on component unmount
    return () => {
      stopSync();
      socket.close();
      setSyncActive(false);
    };
  }, []);

  return (
    <div>
      <div className={`status ${state.status}`}>
        {state.status === "connected" ? "Connected" : "Disconnected"}
        {syncActive && " (Sync Active)"}
      </div>

      <div className="messages">
        {state.messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          chatStore.messages.push({
            id: Date.now(),
            user: "Local User",
            text: `Message at ${new Date().toLocaleTimeString()}`,
          });
        }}
      >
        Send Message
      </button>
    </div>
  );
}
```

### Connection Status Hook

For reusable connection status management, you can create a custom hook:

```jsx
function useSyncConnection(store, socketUrl, options = {}) {
  const [status, setStatus] = useState("disconnected");

  useEffect(() => {
    const socket = new WebSocket(socketUrl);
    let stopSync = null;

    const handleOpen = () => {
      setStatus("connected");
      store.connectionStatus = "connected";

      // Start sync when connected
      stopSync = sync(socket, store, options);
    };

    const handleClose = () => {
      setStatus("disconnected");
      store.connectionStatus = "disconnected";
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("close", handleClose);

    // If already open, handle immediately
    if (socket.readyState === WebSocket.OPEN) {
      handleOpen();
    }

    return () => {
      if (stopSync) stopSync();
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
      socket.close();
    };
  }, [store, socketUrl, options]);

  return status;
}
```

## Preact Integration

The Preact integration is very similar to React, with minor differences in imports and hook usage.

```jsx
import { useEffect, useState } from "preact/hooks";
import { store, sync } from "jods";
import { useJods } from "jods/preact";

// Create a store
const todoStore = store({
  todos: [],
  filter: "all",
  syncStatus: "inactive",
});

function TodoApp() {
  const state = useJods(todoStore);

  // Set up sync with BroadcastChannel for cross-tab sync
  useEffect(() => {
    // Create a channel with a unique name for this app
    const channel = new BroadcastChannel("todo-app-sync");

    // Start syncing between tabs
    const stopSync = sync(channel, todoStore, {
      throttleMs: 100,
      onError: (err) => {
        console.error("Sync error:", err);
        todoStore.syncStatus = "error";
      },
    });

    todoStore.syncStatus = "active";

    return () => {
      stopSync();
      channel.close();
      todoStore.syncStatus = "inactive";
    };
  }, []);

  return (
    <div>
      <div class="sync-status">
        Sync Status: {state.syncStatus}
        {state.syncStatus === "active" && (
          <span> (Changes sync across browser tabs)</span>
        )}
      </div>

      <ul>
        {state.todos
          .filter((todo) => {
            if (state.filter === "completed") return todo.completed;
            if (state.filter === "active") return !todo.completed;
            return true; // 'all' filter
          })
          .map((todo) => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => {
                  todo.completed = !todo.completed;
                }}
              />
              <span
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                }}
              >
                {todo.text}
              </span>
            </li>
          ))}
      </ul>

      <div class="filters">
        <button onClick={() => (todoStore.filter = "all")}>All</button>
        <button onClick={() => (todoStore.filter = "active")}>Active</button>
        <button onClick={() => (todoStore.filter = "completed")}>
          Completed
        </button>
      </div>
    </div>
  );
}
```

## Remix Integration

Remix has special considerations for server-side rendering (SSR) and client hydration. The sync API should only activate after hydration is complete.

### Setting Up Sync in Remix

```jsx
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { defineStore } from "jods/remix";
import { useJodsStore } from "jods/remix";
import { sync } from "jods";

// Define a jods store for Remix
export const chatStore = defineStore({
  name: "chat",
  schema: z.object({
    messages: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        user: z.string(),
        timestamp: z.number(),
      })
    ),
    users: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(["online", "offline"]),
      })
    ),
    syncStatus: z.enum(["connected", "disconnected", "error"]).optional(),
  }),
  // Load initial data from server
  loader: async () => {
    return {
      messages: await loadMessagesFromDb(),
      users: await loadUsersFromDb(),
    };
  },
  // Handle form submissions
  handlers: {
    async addMessage({ current, form }) {
      const text = form.get("message");
      if (!text || typeof text !== "string") {
        return current;
      }

      const newMessage = {
        id: crypto.randomUUID(),
        text,
        user: "Current User",
        timestamp: Date.now(),
      };

      return {
        ...current,
        messages: [...current.messages, newMessage],
      };
    },
  },
});

export async function loader() {
  return json(await chatStore.loader());
}

export async function action({ request }) {
  const form = await request.formData();
  return json(await chatStore.actions.addMessage({ form }));
}

export default function ChatRoute() {
  const initialData = useLoaderData();
  const state = useJodsStore(chatStore);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncActive, setSyncActive] = useState(false);

  // Detect client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Only set up sync AFTER hydration is complete
  useEffect(() => {
    if (!isHydrated) return;

    const socket = new WebSocket("wss://chat-server.example.com");

    const stopSync = sync(socket, chatStore, {
      // Don't sync syncStatus property to server
      allowKeys: ["messages", "users"],
      throttleMs: 300,
      onError: (err) => {
        console.error("Sync error:", err);
        chatStore.syncStatus = "error";
      },
    });

    socket.addEventListener("open", () => {
      chatStore.syncStatus = "connected";
      setSyncActive(true);
    });

    socket.addEventListener("close", () => {
      chatStore.syncStatus = "disconnected";
      setSyncActive(false);
    });

    return () => {
      stopSync();
      socket.close();
    };
  }, [isHydrated]);

  return (
    <div>
      <div className="hydration-status">
        {isHydrated ? "Client Hydrated" : "Server Rendered"}
      </div>

      <div className="sync-status">
        {syncActive ? "Real-time sync active" : "Sync inactive"}
        {state.syncStatus && ` (${state.syncStatus})`}
      </div>

      <div className="messages">
        {state.messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.user}:</strong> {msg.text}
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <form method="post">
        <input name="message" placeholder="Type message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Remix Integration with Multiple Synced Stores

For more complex Remix applications, you may need to sync multiple stores with different sockets or channels:

```jsx
// In your route component
export default function Dashboard() {
  const [isHydrated, setIsHydrated] = useState(false);

  // Detect client hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Each component manages its own sync */}
      <UserList isHydrated={isHydrated} />
      <ChatPanel isHydrated={isHydrated} />
      <NotificationCenter isHydrated={isHydrated} />
    </div>
  );
}

// User list component with sync
function UserList({ isHydrated }) {
  const state = useJodsStore(userStore);

  // Only set up sync after hydration
  useEffect(() => {
    if (!isHydrated) return;

    const socket = new WebSocket('wss://users-api.example.com');
    const stopSync = sync(socket, userStore, {
      allowKeys: ['users', 'filter'],
      prefix: 'users', // Use prefix for multiplexing
    });

    return () => {
      stopSync();
      socket.close();
    };
  }, [isHydrated]);

  return (/* Component JSX */);
}
```

## Best Practices

### Security Considerations

1. **Always use `allowKeys` option** to limit which properties can be synced:

```jsx
const stopSync = sync(socket, store, {
  allowKeys: ["publicData", "sharedSettings"],
  // Don't sync these even if nested under allowKeys
  sensitiveKeys: ["publicData.apiKeys", "sharedSettings.tokens"],
});
```

2. **Never sync sensitive data** like authentication tokens, passwords, or personal information.

3. **Validate incoming data** before applying changes:

```jsx
const stopSync = sync(socket, store, {
  onPatchReceive: (patch) => {
    // Validate patch before applying
    try {
      MySchema.parse(patch.changes);
      return patch; // Valid, proceed with sync
    } catch (error) {
      console.error("Invalid incoming data:", error);
      return null; // Reject the patch
    }
  },
});
```

### Performance Optimization

1. **Use throttling** to reduce network traffic:

```jsx
const stopSync = sync(socket, store, {
  throttleMs: 300, // Only send updates every 300ms at most
});
```

2. **Sync only what's needed** to minimize payload size:

```jsx
// For fine-grained control over what gets synced
const stopSync = sync(socket, store, {
  filter: (changes) => {
    // Only sync changes that meet certain criteria
    if (changes.hugeDataArray) {
      // Don't sync the entire array, just a summary
      changes.hugeDataSummary = summarizeData(changes.hugeDataArray);
      delete changes.hugeDataArray;
    }
    return changes;
  },
});
```

3. **Consider syncing status separately** from data for more responsive UIs:

```jsx
// Separate stores for data and status
const dataStore = store({
  /* ... */
});
const statusStore = store({
  connected: false,
  lastSync: null,
});

// In component
useEffect(() => {
  const socket = new WebSocket("wss://example.com");

  socket.addEventListener("open", () => {
    statusStore.connected = true;
    statusStore.lastSync = Date.now();
  });

  const stopSync = sync(socket, dataStore, {
    onDiffSend: () => {
      statusStore.lastSync = Date.now();
    },
    onPatchReceive: () => {
      statusStore.lastSync = Date.now();
    },
  });

  return () => {
    stopSync();
    socket.close();
  };
}, []);
```

### Error Handling and Reconnection

For robust error handling and automatic reconnection:

```jsx
function ChatApp() {
  const state = useJods(chatStore);
  const [socket, setSocket] = useState(null);
  const [stopSyncFn, setStopSyncFn] = useState(null);

  // Connect and setup sync
  const connectAndSync = useCallback(() => {
    if (socket) {
      socket.close();
    }

    if (stopSyncFn) {
      stopSyncFn();
    }

    const newSocket = new WebSocket('wss://chat-server.example.com');
    setSocket(newSocket);

    newSocket.addEventListener('open', () => {
      chatStore.status = 'connected';
      const stopSync = sync(newSocket, chatStore, {
        allowKeys: ['messages', 'users', 'status'],
        onError: (err) => {
          console.error('Sync error:', err);
          chatStore.status = 'error';
        }
      });
      setStopSyncFn(() => stopSync);
    });

    newSocket.addEventListener('close', () => {
      chatStore.status = 'disconnected';
      // Attempt reconnection after delay
      setTimeout(connectAndSync, 3000);
    });

    newSocket.addEventListener('error', (err) => {
      console.error('Socket error:', err);
      chatStore.status = 'error';
      // Socket will close automatically after error
    });
  }, [socket, stopSyncFn]);

  // Initial connection
  useEffect(() => {
    connectAndSync();

    return () => {
      if (stopSyncFn) stopSyncFn();
      if (socket) socket.close();
    };
  }, []);

  return (/* Component JSX */);
}
```

## Custom Transport Adapters

You can create custom adapters for different transport mechanisms:

```jsx
// Socket.io adapter
function createSocketIOAdapter(socket) {
  return {
    send: (message) => {
      socket.emit("jods-sync", message);
    },
    // Set up event listener
    addEventListener: (type, listener) => {
      if (type === "message") {
        socket.on("jods-sync", (data) => {
          listener({ data: JSON.stringify(data) });
        });
      }
    },
    removeEventListener: (type, listener) => {
      if (type === "message") {
        socket.off("jods-sync");
      }
    },
  };
}

// Usage
const socket = io("https://example.com");
const socketAdapter = createSocketIOAdapter(socket);
const stopSync = sync(socketAdapter, store);
```
