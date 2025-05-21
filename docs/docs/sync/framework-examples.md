# Framework Integration Examples

This page provides practical, ready-to-use examples of the `sync` API with different frameworks. Each example demonstrates a common use case that you can adapt for your own applications.

## React Examples

### Real-time Chat Application

This example shows how to build a simple real-time chat application using React and the `sync` API:

```tsx
import React, { useState, useEffect, useRef } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Define our chat store structure
interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
  status: "online" | "offline" | "typing";
}

interface ChatStore {
  messages: Message[];
  users: User[];
  currentUser: User;
}

// Create the store
const chatStore = store<ChatStore>({
  messages: [],
  users: [],
  currentUser: {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: "Guest",
    status: "online",
  },
});

// Chat component
function ChatApp() {
  const state = useJods(chatStore);
  const [connected, setConnected] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages.length]);

  // Setup WebSocket and sync
  useEffect(() => {
    // Real app would use a server URL here
    const socket = new WebSocket("wss://chat-server.example.com/ws");

    // Connection status handlers
    socket.addEventListener("open", () => {
      setConnected(true);

      // Announce our user joined
      socket.send(
        JSON.stringify({
          type: "user-joined",
          payload: chatStore.currentUser,
        })
      );
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    // Setup sync when socket is ready
    let stopSync: (() => void) | null = null;

    socket.addEventListener("open", () => {
      stopSync = sync(socket, chatStore, {
        // Only sync these props for security
        allowKeys: ["messages", "users"],
        // Don't sync too frequently
        throttleMs: 300,
      });
    });

    // Clean up
    return () => {
      if (stopSync) stopSync();

      // Tell server we're leaving
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "user-left",
            payload: { id: chatStore.currentUser.id },
          })
        );
      }

      socket.close();
    };
  }, []);

  // Send a new message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    // Add to local store
    chatStore.messages.push({
      id: `msg-${Date.now()}`,
      user: chatStore.currentUser.name,
      text: inputText,
      timestamp: Date.now(),
    });

    setInputText("");
  };

  // Set typing status
  const handleTyping = () => {
    chatStore.currentUser.status = "typing";

    // Reset status after a delay
    setTimeout(() => {
      if (chatStore.currentUser.status === "typing") {
        chatStore.currentUser.status = "online";
      }
    }, 2000);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Room</h2>
        <div className={`status ${connected ? "connected" : "disconnected"}`}>
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="chat-main">
        <div className="message-list">
          {state.messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${
                msg.user === state.currentUser.name ? "own" : ""
              }`}
            >
              <div className="message-header">
                <strong>{msg.user}</strong>
                <span className="time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-body">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="users-list">
          <h3>Online Users ({state.users.length})</h3>
          <ul>
            {state.users.map((user) => (
              <li key={user.id}>
                {user.name}
                {user.status === "typing" && <span> (typing...)</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleTyping}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Collaborative Todo Application with Real-time Updates

This example demonstrates a collaborative todo application where multiple users can work on the same todo list:

```tsx
import React, { useEffect, useState } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Define todo types
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  assignee: string | null;
  createdBy: string;
  createdAt: number;
}

interface TodoStore {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  users: string[];
}

// Create the store
const todoStore = store<TodoStore>({
  todos: [],
  filter: "all",
  users: [],
});

// Generate a user ID (in a real app, this would come from authentication)
const userId = `user-${Math.random().toString(36).substr(2, 9)}`;

function TodoApp() {
  const state = useJods(todoStore);
  const [isConnected, setIsConnected] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");

  // Setup WebSocket and sync
  useEffect(() => {
    // Add current user
    if (!todoStore.users.includes(userId)) {
      todoStore.users.push(userId);
    }

    // Connect to WebSocket
    const socket = new WebSocket("wss://todos-api.example.com/collab");

    socket.addEventListener("open", () => {
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    // Start syncing
    let stopSync: (() => void) | null = null;

    socket.addEventListener("open", () => {
      stopSync = sync(socket, todoStore);
    });

    // Clean up
    return () => {
      // Remove this user
      todoStore.users = todoStore.users.filter((id) => id !== userId);

      if (stopSync) stopSync();
      socket.close();
    };
  }, []);

  // Get filtered todos
  const filteredTodos = state.todos.filter((todo) => {
    if (state.filter === "active") return !todo.completed;
    if (state.filter === "completed") return todo.completed;
    return true;
  });

  // Add a new todo
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodoText.trim()) return;

    todoStore.todos.push({
      id: `todo-${Date.now()}`,
      text: newTodoText,
      completed: false,
      assignee: null,
      createdBy: userId,
      createdAt: Date.now(),
    });

    setNewTodoText("");
  };

  // Toggle todo completion
  const toggleTodo = (id: string) => {
    const todo = todoStore.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  // Assign todo to yourself
  const assignToMe = (id: string) => {
    const todo = todoStore.todos.find((t) => t.id === id);
    if (todo) {
      todo.assignee = todo.assignee === userId ? null : userId;
    }
  };

  return (
    <div className="todo-app">
      <header>
        <h1>Collaborative Todo List</h1>
        <div className={`status ${isConnected ? "online" : "offline"}`}>
          {isConnected ? "Online" : "Offline"}
        </div>
        <div className="active-users">
          {state.users.length} user{state.users.length !== 1 ? "s" : ""} online
        </div>
      </header>

      <div className="filters">
        <button
          className={state.filter === "all" ? "active" : ""}
          onClick={() => {
            todoStore.filter = "all";
          }}
        >
          All
        </button>
        <button
          className={state.filter === "active" ? "active" : ""}
          onClick={() => {
            todoStore.filter = "active";
          }}
        >
          Active
        </button>
        <button
          className={state.filter === "completed" ? "active" : ""}
          onClick={() => {
            todoStore.filter = "completed";
          }}
        >
          Completed
        </button>
      </div>

      <form onSubmit={addTodo}>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {filteredTodos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "completed" : ""}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className="todo-text">{todo.text}</span>
            <button
              className={`assign ${todo.assignee === userId ? "assigned" : ""}`}
              onClick={() => assignToMe(todo.id)}
            >
              {todo.assignee === userId ? "Assigned to me" : "Assign to me"}
            </button>
            <span className="created-by">
              Created by: {todo.createdBy === userId ? "you" : todo.createdBy}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Preact Examples

### Cross-Tab Synchronization with BroadcastChannel

This example demonstrates how to synchronize data between different browser tabs using Preact and BroadcastChannel:

```tsx
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { store, sync } from "jods";
import { useJods } from "jods/preact";

// Define the store structure
interface PreferencesStore {
  theme: "light" | "dark" | "system";
  fontSize: number;
  notifications: boolean;
  lastUpdated: number;
  updatedBy: string;
}

// Create a store with initial values
const preferencesStore = store<PreferencesStore>({
  theme: "system",
  fontSize: 16,
  notifications: true,
  lastUpdated: Date.now(),
  updatedBy: "default",
});

// Generate a unique ID for this tab
const tabId = `tab-${Math.random().toString(36).substr(2, 9)}`;

function PreferencesApp() {
  const state = useJods(preferencesStore);
  const [syncActive, setSyncActive] = useState(false);

  // Set up cross-tab sync with BroadcastChannel
  useEffect(() => {
    // Create a broadcast channel
    const channel = new BroadcastChannel("app-preferences");

    // Start syncing
    const stopSync = sync(channel, preferencesStore);
    setSyncActive(true);

    // Clean up on unmount
    return () => {
      stopSync();
      channel.close();
      setSyncActive(false);
    };
  }, []);

  // Update a preference and mark who updated it
  const updatePreference = (key: keyof PreferencesStore, value: any) => {
    preferencesStore[key] = value;
    preferencesStore.lastUpdated = Date.now();
    preferencesStore.updatedBy = tabId;
  };

  return (
    <div class={`preferences-panel theme-${state.theme}`}>
      <header>
        <h1>User Preferences</h1>
        <div class="sync-status">
          {syncActive ? "Synced across tabs" : "Not synced"}
        </div>
        {state.updatedBy !== tabId && (
          <div class="updated-notice">
            Updated by another tab at{" "}
            {new Date(state.lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </header>

      <div class="preference-group">
        <h2>Appearance</h2>

        <div class="preference-item">
          <label for="theme">Theme:</label>
          <select
            id="theme"
            value={state.theme}
            onChange={(e) => updatePreference("theme", e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div class="preference-item">
          <label for="font-size">Font Size: {state.fontSize}px</label>
          <input
            id="font-size"
            type="range"
            min="12"
            max="24"
            value={state.fontSize}
            onChange={(e) =>
              updatePreference("fontSize", parseInt(e.target.value))
            }
          />
        </div>
      </div>

      <div class="preference-group">
        <h2>Notifications</h2>

        <div class="preference-item">
          <label for="notifications">Enable Notifications:</label>
          <input
            id="notifications"
            type="checkbox"
            checked={state.notifications}
            onChange={(e) =>
              updatePreference("notifications", e.target.checked)
            }
          />
        </div>
      </div>

      <div class="preview-panel">
        <h3>Preview</h3>
        <p style={{ fontSize: `${state.fontSize}px` }}>
          This text will display at {state.fontSize}px size with the{" "}
          {state.theme} theme. Notifications are{" "}
          {state.notifications ? "enabled" : "disabled"}.
        </p>
      </div>
    </div>
  );
}
```

### Real-time Kanban Board

This example shows a real-time kanban board with Preact and the sync API:

```tsx
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { store, sync } from "jods";
import { useJods } from "jods/preact";

// Define types
interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  assignee?: string;
  createdAt: number;
}

interface KanbanStore {
  tasks: Task[];
  users: string[];
}

// Create the store
const kanbanStore = store<KanbanStore>({
  tasks: [],
  users: [],
});

// Current user ID (in real app, from authentication)
const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
const userName = `User ${userId.slice(-4)}`;

function KanbanBoard() {
  const state = useJods(kanbanStore);
  const [isConnected, setIsConnected] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Connect to WebSocket and set up sync
  useEffect(() => {
    // Add current user to users list
    if (!kanbanStore.users.includes(userName)) {
      kanbanStore.users.push(userName);
    }

    // Connect to WebSocket
    const socket = new WebSocket("wss://kanban-api.example.com/board");

    socket.addEventListener("open", () => {
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    // Set up sync
    let stopSync: (() => void) | null = null;

    socket.addEventListener("open", () => {
      stopSync = sync(socket, kanbanStore);
    });

    // Clean up
    return () => {
      // Remove user from the list
      kanbanStore.users = kanbanStore.users.filter((u) => u !== userName);

      // Stop syncing and close socket
      if (stopSync) stopSync();
      socket.close();
    };
  }, []);

  // Group tasks by status
  const todoTasks = state.tasks.filter((task) => task.status === "todo");
  const doingTasks = state.tasks.filter((task) => task.status === "doing");
  const doneTasks = state.tasks.filter((task) => task.status === "done");

  // Add a new task
  const addTask = (e: Event) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) return;

    kanbanStore.tasks.push({
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: "",
      status: "todo",
      assignee: userName,
      createdAt: Date.now(),
    });

    setNewTaskTitle("");
  };

  // Move a task to a different status
  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    const task = kanbanStore.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = newStatus;
    }
  };

  // Render a task card
  const TaskCard = ({ task }: { task: Task }) => (
    <div class="task-card">
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div class="task-footer">
        <span class="assignee">{task.assignee || "Unassigned"}</span>
        <div class="actions">
          {task.status !== "todo" && (
            <button onClick={() => moveTask(task.id, "todo")}>← To Do</button>
          )}
          {task.status !== "doing" && (
            <button onClick={() => moveTask(task.id, "doing")}>
              In Progress
            </button>
          )}
          {task.status !== "done" && (
            <button onClick={() => moveTask(task.id, "done")}>Done →</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div class="kanban-board">
      <header class="board-header">
        <h1>Kanban Board</h1>
        <div class={`connection-status ${isConnected ? "online" : "offline"}`}>
          {isConnected ? "Online" : "Offline"}
        </div>
        <div class="users-online">
          {state.users.length} user{state.users.length !== 1 ? "s" : ""} online:
          {state.users.map((user) => (
            <span class="user-badge" key={user}>
              {user}
            </span>
          ))}
        </div>
      </header>

      <form class="new-task-form" onSubmit={addTask}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title..."
        />
        <button type="submit">Add Task</button>
      </form>

      <div class="board-columns">
        <div class="column todo-column">
          <h2>To Do ({todoTasks.length})</h2>
          {todoTasks.map((task) => (
            <TaskCard task={task} key={task.id} />
          ))}
        </div>

        <div class="column doing-column">
          <h2>In Progress ({doingTasks.length})</h2>
          {doingTasks.map((task) => (
            <TaskCard task={task} key={task.id} />
          ))}
        </div>

        <div class="column done-column">
          <h2>Done ({doneTasks.length})</h2>
          {doneTasks.map((task) => (
            <TaskCard task={task} key={task.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Remix Examples

### Collaborative Document Editor with Server Persistence

This example demonstrates a collaborative document editor in Remix that syncs changes in real-time between clients and persists to the server:

```tsx
import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/remix";

// Define our document structure
interface Document {
  id: string;
  title: string;
  content: string;
  lastEditedBy: string;
  lastEditedAt: number;
  collaborators: string[];
}

// Server-side loader function
export async function loader({ params }) {
  const docId = params.docId;

  // In a real app, fetch from database
  const document = await fetchDocumentFromDatabase(docId);

  return json({ document });
}

// Server-side action function
export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const docId = params.docId;

  if (intent === "save") {
    const title = formData.get("title");
    const content = formData.get("content");

    // In a real app, save to database
    await saveDocumentToDatabase(docId, { title, content });

    return json({ success: true });
  }

  return json({ success: false });
}

// Create the document store (outside component to persist between renders)
const documentStore = store<Document>({
  id: "",
  title: "",
  content: "",
  lastEditedBy: "",
  lastEditedAt: 0,
  collaborators: [],
});

// Current user (in a real app, from authentication)
const currentUser = `user-${Math.random().toString(36).substr(2, 9)}`;

export default function DocumentEditor() {
  const { document } = useLoaderData<{ document: Document }>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Use the store
  const state = useJods(documentStore);

  // Initialize the store with data from the server
  useEffect(() => {
    if (!isHydrated) {
      // Initialize with server data
      documentStore.id = document.id;
      documentStore.title = document.title;
      documentStore.content = document.content;
      documentStore.lastEditedBy = document.lastEditedBy;
      documentStore.lastEditedAt = document.lastEditedAt;
      documentStore.collaborators = [...document.collaborators];

      // Add current user to collaborators if not already there
      if (!documentStore.collaborators.includes(currentUser)) {
        documentStore.collaborators.push(currentUser);
      }

      setIsHydrated(true);
    }
  }, [document]);

  // Set up WebSocket connection and sync AFTER hydration
  useEffect(() => {
    if (!isHydrated) return;

    // WebSocket connection
    const socket = new WebSocket(
      `wss://docs-api.example.com/documents/${documentStore.id}`
    );

    socket.addEventListener("open", () => {
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    // Set up sync
    let stopSync: (() => void) | null = null;

    socket.addEventListener("open", () => {
      stopSync = sync(socket, documentStore, {
        // Don't sync too frequently (typing can generate many changes)
        throttleMs: 500,
      });
    });

    // Auto-save after changes are made
    let autoSaveTimeout: number | null = null;

    const setupAutoSave = () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      autoSaveTimeout = window.setTimeout(() => {
        saveDocument();
      }, 3000); // Save 3 seconds after last edit
    };

    // Subscribe to store changes
    const unsubscribe = documentStore.subscribe((newState) => {
      // Update last edited
      documentStore.lastEditedBy = currentUser;
      documentStore.lastEditedAt = Date.now();

      // Schedule auto-save
      setupAutoSave();
    });

    // Clean up
    return () => {
      if (stopSync) stopSync();
      if (unsubscribe) unsubscribe();
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

      // Remove from collaborators when leaving
      documentStore.collaborators = documentStore.collaborators.filter(
        (user) => user !== currentUser
      );

      socket.close();
    };
  }, [isHydrated]);

  // Save document to server
  const saveDocument = async () => {
    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      const formData = new FormData();
      formData.append("intent", "save");
      formData.append("title", documentStore.title);
      formData.append("content", documentStore.content);

      const response = await fetch(`/documents/${documentStore.id}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Error saving");
      }
    } catch (error) {
      setSaveStatus("Error saving");
      console.error("Error saving document:", error);
    } finally {
      setIsSaving(false);

      // Clear the status after a while
      setTimeout(() => {
        setSaveStatus("");
      }, 3000);
    }
  };

  return (
    <div className="document-editor">
      <header className="editor-header">
        <input
          type="text"
          className="title-input"
          value={state.title}
          onChange={(e) => {
            documentStore.title = e.target.value;
          }}
          placeholder="Document Title"
        />

        <div className="status-indicators">
          <div className={`connection ${isConnected ? "online" : "offline"}`}>
            {isConnected ? "Connected" : "Offline"}
          </div>

          <div className="save-status">{saveStatus}</div>

          <div className="collaborators">
            {state.collaborators.length} editing now
          </div>
        </div>

        <button
          onClick={saveDocument}
          disabled={isSaving}
          className="save-button"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </header>

      <div className="editor-main">
        <textarea
          className="content-editor"
          value={state.content}
          onChange={(e) => {
            documentStore.content = e.target.value;
          }}
          placeholder="Start typing here..."
        />
      </div>

      <footer className="editor-footer">
        <div className="last-edited">
          {state.lastEditedBy && (
            <>
              Last edited by{" "}
              {state.lastEditedBy === currentUser ? "you" : state.lastEditedBy}
              {" at "}
              {new Date(state.lastEditedAt).toLocaleString()}
            </>
          )}
        </div>

        <div className="word-count">
          {state.content.split(/\s+/).filter(Boolean).length} words
        </div>
      </footer>
    </div>
  );
}
```

### Real-time Dashboard with Server-Sent Events and WebSockets

This example shows how to build a dashboard in Remix that receives real-time updates through both SSE and WebSockets:

```tsx
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/remix";

// Define dashboard data types
interface DashboardStats {
  activeUsers: number;
  totalSales: number;
  conversionRate: number;
  pageViews: number;
  lastUpdated: string;
}

interface AlertMessage {
  id: string;
  type: "info" | "warning" | "error";
  message: string;
  timestamp: number;
}

interface DashboardStore {
  stats: DashboardStats;
  alerts: AlertMessage[];
  isDataStale: boolean;
}

// Server-side loader function
export async function loader() {
  // Fetch initial data from database or API
  const dashboardStats = await fetchDashboardStats();
  const recentAlerts = await fetchRecentAlerts();

  return json({
    stats: dashboardStats,
    alerts: recentAlerts,
  });
}

// Dashboard store (outside component to persist between renders)
const dashboardStore = store<DashboardStore>({
  stats: {
    activeUsers: 0,
    totalSales: 0,
    conversionRate: 0,
    pageViews: 0,
    lastUpdated: "",
  },
  alerts: [],
  isDataStale: false,
});

export default function Dashboard() {
  const initialData = useLoaderData();
  const fetcher = useFetcher();
  const [isHydrated, setIsHydrated] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  // Use the store with Remix hook
  const state = useJods(dashboardStore);

  // Initialize store with server data
  useEffect(() => {
    if (!isHydrated) {
      dashboardStore.stats = initialData.stats;
      dashboardStore.alerts = initialData.alerts;
      dashboardStore.isDataStale = false;
      setIsHydrated(true);
    }
  }, [initialData]);

  // Set up SSE for real-time statistics updates
  useEffect(() => {
    if (!isHydrated) return;

    const eventSource = new EventSource("/api/dashboard-stats/sse");

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    // Listen for stats updates
    eventSource.addEventListener("stats-update", (event) => {
      try {
        const data = JSON.parse(event.data);
        dashboardStore.stats = {
          ...dashboardStore.stats,
          ...data,
          lastUpdated: new Date().toISOString(),
        };
        dashboardStore.isDataStale = false;
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    });

    // Clean up
    return () => {
      eventSource.close();
      setSseConnected(false);
    };
  }, [isHydrated]);

  // Set up WebSocket for alerts and interactive features
  useEffect(() => {
    if (!isHydrated) return;

    const socket = new WebSocket("wss://dashboard-api.example.com/alerts");

    socket.addEventListener("open", () => {
      setWsConnected(true);
    });

    socket.addEventListener("close", () => {
      setWsConnected(false);
    });

    // Set up sync for bidirectional communication
    let stopSync: (() => void) | null = null;

    socket.addEventListener("open", () => {
      stopSync = sync(socket, dashboardStore, {
        // Only sync alerts, not stats (those come from SSE)
        allowKeys: ["alerts"],
      });
    });

    // After 60 seconds of no SSE updates, mark data as stale
    const staleDataCheck = setInterval(() => {
      const lastUpdateTime = new Date(
        dashboardStore.stats.lastUpdated
      ).getTime();
      const now = Date.now();
      const timeSinceUpdate = now - lastUpdateTime;

      if (timeSinceUpdate > 60000) {
        // 60 seconds
        dashboardStore.isDataStale = true;
      }
    }, 10000); // Check every 10 seconds

    // Clean up
    return () => {
      if (stopSync) stopSync();
      socket.close();
      clearInterval(staleDataCheck);
    };
  }, [isHydrated]);

  // Manual refresh button handler
  const refreshData = () => {
    fetcher.load("/dashboard?fresh=1");

    // When the data comes back, update our store
    if (fetcher.data) {
      dashboardStore.stats = fetcher.data.stats;
      dashboardStore.alerts = fetcher.data.alerts;
      dashboardStore.isDataStale = false;
    }
  };

  // Dismiss an alert
  const dismissAlert = (alertId: string) => {
    dashboardStore.alerts = dashboardStore.alerts.filter(
      (alert) => alert.id !== alertId
    );
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Real-time Dashboard</h1>

        <div className="connection-status">
          <div
            className={`sse-status ${
              sseConnected ? "connected" : "disconnected"
            }`}
          >
            Stats: {sseConnected ? "Live" : "Offline"}
          </div>
          <div
            className={`ws-status ${
              wsConnected ? "connected" : "disconnected"
            }`}
          >
            Alerts: {wsConnected ? "Live" : "Offline"}
          </div>
        </div>

        <button
          className="refresh-button"
          onClick={refreshData}
          disabled={fetcher.state === "loading"}
        >
          {fetcher.state === "loading" ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="dashboard-content">
        <div className="stats-panel">
          <h2>
            Live Statistics
            {state.isDataStale && <span className="stale-badge">Stale</span>}
          </h2>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Active Users</h3>
              <div className="stat-value">{state.stats.activeUsers}</div>
            </div>

            <div className="stat-card">
              <h3>Total Sales</h3>
              <div className="stat-value">
                ${state.stats.totalSales.toLocaleString()}
              </div>
            </div>

            <div className="stat-card">
              <h3>Conversion Rate</h3>
              <div className="stat-value">{state.stats.conversionRate}%</div>
            </div>

            <div className="stat-card">
              <h3>Page Views</h3>
              <div className="stat-value">
                {state.stats.pageViews.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="last-updated">
            Last updated: {new Date(state.stats.lastUpdated).toLocaleString()}
          </div>
        </div>

        <div className="alerts-panel">
          <h2>Alerts ({state.alerts.length})</h2>

          {state.alerts.length === 0 ? (
            <div className="no-alerts">No alerts at this time</div>
          ) : (
            <ul className="alerts-list">
              {state.alerts.map((alert) => (
                <li key={alert.id} className={`alert alert-${alert.type}`}>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    className="dismiss-alert"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Customizing Sync Behavior

These examples demonstrate basic integration, but the sync API offers many customization options:

### Security and Selective Syncing

```tsx
// Only sync specific properties
const stopSync = sync(socket, store, {
  // Only sync these top-level keys
  allowKeys: ["publicData", "sharedSettings"],

  // Block these specific paths
  sensitiveKeys: ["user.password", "user.email", "paymentInfo"],

  // Validate against schema
  validateSchema: (changes) => {
    try {
      mySchema.parse(changes);
      return true;
    } catch (error) {
      console.error("Schema validation failed:", error);
      return false;
    }
  },
});
```

### Performance Optimization

```tsx
// Throttle updates for better performance
const stopSync = sync(socket, store, {
  // Only send updates at most every 500ms
  throttleMs: 500,

  // Limit message size
  maxMessageSize: 100 * 1024, // 100KB

  // Custom filter to prevent unnecessary updates
  filter: (changes) => {
    // Only sync if changes match certain criteria
    if (Object.keys(changes).length === 0) return false;
    if (changes.debugData) return false;
    return true;
  },
});
```

### Custom Transformations

```tsx
// Transform data before sending/receiving
const stopSync = sync(socket, store, {
  // Transform outgoing patches
  mapToPatch: (changes) => {
    // Add metadata
    return {
      ...changes,
      _meta: {
        clientVersion: "1.2.3",
        timestamp: Date.now(),
      },
    };
  },

  // Transform incoming patches
  mapFromPatch: (changes) => {
    // Extract and use metadata
    const { _meta, ...actualChanges } = changes;
    console.log("Received update from version:", _meta?.clientVersion);
    return actualChanges;
  },
});
```

### Debugging and Monitoring

```tsx
// Add callbacks for debugging
const stopSync = sync(socket, store, {
  onDiffSend: (message) => {
    console.log("Sending update:", message);
  },

  onPatchReceive: (message) => {
    console.log("Received update:", message);
  },

  onError: (error) => {
    console.error("Sync error:", error);
  },
});
```
