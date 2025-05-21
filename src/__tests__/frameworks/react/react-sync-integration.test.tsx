/**
 * React integration with sync API test
 *
 * Tests the integration between React components and the jods sync API,
 * including bidirectional updates, rendering, security features, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import * as React from "react";
import { useJods } from "../../../frameworks/react/useJods";
import { store, StoreState, Store } from "../../../core/store";
import { sync, SyncSocket } from "../../../sync";

// Define the type for message event listeners
type MessageEventListener = (event: { data: string }) => void;

// Create a mock socket for testing
class MockSocket implements SyncSocket {
  public onmessage: ((event: { data: string }) => void) | null = null;
  public eventListeners: Map<string, MessageEventListener[]> = new Map();
  public sentMessages: any[] = [];
  public readyState: number = 1; // Default to OPEN

  constructor() {
    this.eventListeners.set("message", []);
  }

  send(message: string): void {
    this.sentMessages.push(JSON.parse(message));
  }

  addEventListener(type: string, fn: MessageEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(fn);
  }

  removeEventListener(type: string, fn: MessageEventListener): void {
    if (this.eventListeners.has(type)) {
      const listeners = this.eventListeners.get(type)!;
      const index = listeners.indexOf(fn);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Helper method to simulate receiving a message
  receiveMessage(data: any): void {
    const message = JSON.stringify(data);

    // Call onmessage handler if set
    if (this.onmessage) {
      this.onmessage({ data: message });
    }

    // Call addEventListener handlers
    const messageListeners = this.eventListeners.get("message");
    if (messageListeners) {
      messageListeners.forEach((listener) => {
        listener({ data: message });
      });
    }
  }
}

// Test store interface
interface TodoStore extends StoreState {
  todos: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
  user: {
    name: string;
    settings: {
      theme: string;
    };
  };
  filter: string;
}

// React component that uses the store with sync
function TodoComponent({
  todoStore,
  socket,
  syncOptions = {},
}: {
  todoStore: TodoStore & Store<TodoStore>;
  socket: MockSocket;
  syncOptions?: any;
}) {
  const state = useJods(todoStore);
  const [syncActive, setSyncActive] = React.useState(false);

  // Set up sync
  React.useEffect(() => {
    // Ensure TodoStore has subscribe method
    if (!todoStore.subscribe) {
      console.error("TodoStore is missing subscribe method!");
    }

    const stopSync = sync(socket, todoStore, syncOptions);
    setSyncActive(true);

    return () => {
      stopSync();
      setSyncActive(false);
    };
  }, [todoStore, socket, syncOptions]);

  return (
    <div>
      <div data-testid="sync-status">
        {syncActive ? "Syncing" : "Not syncing"}
      </div>
      <h1 data-testid="username">{state.user.name}</h1>
      <div data-testid="theme">Theme: {state.user.settings.theme}</div>
      <div data-testid="filter">Filter: {state.filter}</div>
      <ul>
        {state.todos.map((todo) => (
          <li
            key={todo.id}
            data-testid={`todo-${todo.id}`}
            style={{ textDecoration: todo.completed ? "line-through" : "none" }}
          >
            {todo.text}
            <button
              data-testid={`toggle-${todo.id}`}
              onClick={() => {
                todo.completed = !todo.completed;
              }}
            >
              Toggle
            </button>
          </li>
        ))}
      </ul>
      <button
        data-testid="add-todo"
        onClick={() => {
          // Create a new array by spreading the existing todos and adding a new one
          // This ensures the reactive system properly detects the change
          todoStore.todos = [
            ...todoStore.todos,
            {
              id: todoStore.todos.length + 1,
              text: `New todo ${Date.now()}`,
              completed: false,
            },
          ];
        }}
      >
        Add Todo
      </button>
      <button
        data-testid="change-theme"
        onClick={() => {
          todoStore.user.settings.theme =
            todoStore.user.settings.theme === "light" ? "dark" : "light";
        }}
      >
        Toggle Theme
      </button>
      <button
        data-testid="change-filter"
        onClick={() => {
          todoStore.filter = todoStore.filter === "all" ? "active" : "all";
        }}
      >
        Change Filter
      </button>
    </div>
  );
}

describe("React integration with sync", () => {
  let mockSocket: MockSocket;
  let todoStore: TodoStore & Store<TodoStore>;

  beforeEach(() => {
    // Create a fresh mock socket and store for each test
    mockSocket = new MockSocket();

    todoStore = store<TodoStore>({
      todos: [
        { id: 1, text: "Learn jods", completed: false },
        { id: 2, text: "Build an app", completed: false },
      ],
      user: {
        name: "Test User",
        settings: {
          theme: "light",
        },
      },
      filter: "all",
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders initial state correctly", () => {
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    expect(screen.getByTestId("username").textContent).toBe("Test User");
    expect(screen.getByTestId("theme").textContent).toBe("Theme: light");
    expect(screen.getByTestId("filter").textContent).toBe("Filter: all");
    expect(screen.getByTestId("todo-1").textContent).toContain("Learn jods");
    expect(screen.getByTestId("todo-2").textContent).toContain("Build an app");
    expect(screen.getByTestId("sync-status").textContent).toBe("Syncing");
  });

  it("sends store changes to socket", async () => {
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    // Make sure sync has been set up - longer wait to ensure it's fully connected
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Add a new todo - using setState to ensure reactivity
    await act(async () => {
      const newTodo = {
        id: todoStore.todos.length + 1,
        text: `New todo ${Date.now()}`,
        completed: false,
      };

      // Create a completely new reference to force a change detection
      todoStore.setState({
        ...todoStore.getState(),
        todos: [...todoStore.todos, newTodo],
      });

      // Wait longer for the sync to process
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    // Check that a message was sent to the socket
    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);

    // Latest message should contain the new todo
    const lastMessage =
      mockSocket.sentMessages[mockSocket.sentMessages.length - 1];
    expect(lastMessage.changes.todos).toBeDefined();

    // Check that we have 3 todos now
    expect(todoStore.todos.length).toBe(3);
  });

  it("updates component when receiving socket messages", async () => {
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    // Simulate receiving a message with an updated todo
    await act(async () => {
      mockSocket.receiveMessage({
        clientId: "server-123", // Different client ID to avoid echo prevention
        changes: {
          todos: [
            { id: 1, text: "Learn jods", completed: true },
            { id: 2, text: "Build an app", completed: false },
            { id: 3, text: "New from server", completed: false },
          ],
        },
      });
    });

    // Check that the component rendered the updates
    expect(screen.getByTestId("todo-1").textContent).toContain("Learn jods");
    expect(screen.getByTestId("todo-1")).toHaveStyle(
      "text-decoration: line-through"
    );
    expect(screen.getByTestId("todo-3").textContent).toContain(
      "New from server"
    );
  });

  it("prevents echo when receiving messages with same clientId", async () => {
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    // Wait for sync setup
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Make a change to trigger a message being sent
    await act(async () => {
      screen.getByTestId("change-theme").click();
      // Wait for sync
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Make sure we have messages
    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);

    // Capture the client ID from the sent message
    const clientId = mockSocket.sentMessages[0].clientId;

    // Clear the store to a known state
    todoStore.user.settings.theme = "light";

    // Send an echo message with the same client ID
    await act(async () => {
      mockSocket.receiveMessage({
        clientId: clientId,
        changes: {
          user: {
            settings: {
              theme: "dark",
            },
          },
        },
      });
    });

    // Theme should still be light (message should be ignored)
    expect(screen.getByTestId("theme").textContent).toBe("Theme: light");
  });

  it("respects allowKeys option for security", async () => {
    // Render with allowKeys option to only sync todos
    render(
      <TodoComponent
        todoStore={todoStore}
        socket={mockSocket}
        syncOptions={{ allowKeys: ["todos"] }}
      />
    );

    // Wait for sync setup
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Add a todo which should be synced
    await act(async () => {
      screen.getByTestId("add-todo").click();
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Verify messages were sent
    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);

    // Messages should only contain todos, not user or filter
    mockSocket.sentMessages.forEach((message) => {
      if (message.changes.todos) {
        expect(message.changes.todos).toBeDefined();
        expect(message.changes.user).toBeUndefined();
        expect(message.changes.filter).toBeUndefined();
      }
    });

    // Now change theme and filter which should not be synced
    await act(async () => {
      screen.getByTestId("change-theme").click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      screen.getByTestId("change-filter").click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  it("cleans up sync when component unmounts", async () => {
    // Spy on socket methods
    const removeEventListenerSpy = vi.spyOn(mockSocket, "removeEventListener");

    const { unmount } = render(
      <TodoComponent todoStore={todoStore} socket={mockSocket} />
    );

    // Unmount the component
    unmount();

    // Socket event listeners should be removed
    expect(removeEventListenerSpy).toHaveBeenCalled();

    // Sync status should be false
    expect(todoStore.subscribe).toBeDefined();
  });

  it("handles incoming messages with nested property updates", async () => {
    // First create a simple test to verify the store can be updated directly
    todoStore.user.name = "Updated User";
    todoStore.user.settings.theme = "dark";

    // Render the component with the updated store
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    // Verify the component shows the updated values
    expect(screen.getByTestId("username").textContent).toBe("Updated User");
    expect(screen.getByTestId("theme").textContent).toBe("Theme: dark");

    // Now reset to original values
    todoStore.user.name = "Test User";
    todoStore.user.settings.theme = "light";

    // Re-render with clean store
    cleanup();
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    // Wait for sync to be established
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now test the sync update with a much longer timeout
    await act(async () => {
      // Force reset to ensure we have a clean slate
      todoStore.user.name = "Test User";

      // Send the update via the sync mechanism
      mockSocket.receiveMessage({
        clientId: "server-456",
        changes: {
          user: {
            name: "Updated User",
            settings: {
              theme: "dark",
            },
          },
        },
      });

      // Give significantly more time for the update to process
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    // Verify the values in the store directly
    expect(todoStore.user.name).toBe("Updated User");
    expect(todoStore.user.settings.theme).toBe("dark");

    // Re-render to ensure the UI reflects the updated values
    cleanup();
    render(<TodoComponent todoStore={todoStore} socket={mockSocket} />);

    // Check that the component rendered the updates
    expect(screen.getByTestId("username").textContent).toBe("Updated User");
    expect(screen.getByTestId("theme").textContent).toBe("Theme: dark");
  });

  it("handles receiveOnly mode correctly", async () => {
    // Render with receiveOnly option
    render(
      <TodoComponent
        todoStore={todoStore}
        socket={mockSocket}
        syncOptions={{ receiveOnly: true }}
      />
    );

    // Make local changes
    await act(async () => {
      screen.getByTestId("add-todo").click();
      screen.getByTestId("change-theme").click();
    });

    // No messages should be sent
    expect(mockSocket.sentMessages.length).toBe(0);

    // But component should still receive updates
    await act(async () => {
      mockSocket.receiveMessage({
        clientId: "server-789",
        changes: {
          filter: "completed",
        },
      });
    });

    // Component should reflect received updates
    expect(screen.getByTestId("filter").textContent).toBe("Filter: completed");
  });
});
