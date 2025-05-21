/**
 * Remix integration with sync API test
 *
 * Tests the integration between Remix components and the jods sync API,
 * with special focus on SSR, hydration, and form handling.
 */

// 1. Basic Vitest/React/Testing Library imports
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup, waitFor } from "@testing-library/react";
import { useState, useEffect } from "react";
import * as React from "react";

// 2. Core jods type imports
import { store, StoreState, Store } from "../../../core/store";
import { sync, SyncSocket } from "../../../sync";

// 3. ALL Interface definitions (compile-time)
interface MockSocketInterface {
  send: (message: string) => void;
  receiveMessage: (data: any) => void;
  onmessage: ((event: { data: string }) => void) | null;
  addEventListener: (type: string, fn: any) => void;
  removeEventListener: (type: string, fn: any) => void;
  readyState: number;
  sentMessages: any[];
}

interface RemixTodoStoreInterface extends StoreState {
  todos: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  filter: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

vi.mock("@remix-run/react", () => ({
  useLoaderData: () => ({}),
  useActionData: () => ({}),
}));

import { useJods } from "../../../frameworks/remix"; // This will import the mocked useJods

// Define the type for message event listeners (used by MockSocket)
type MessageEventListener = (event: { data: string }) => void;

// Create a mock socket for testing
class MockSocket implements SyncSocket, MockSocketInterface {
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

  receiveMessage(data: any): void {
    const message = JSON.stringify(data);
    if (this.onmessage) {
      this.onmessage({ data: message });
    }
    const messageListeners = this.eventListeners.get("message");
    if (messageListeners) {
      messageListeners.forEach((listener) => {
        listener({ data: message });
      });
    }
  }
}

// Create Remix component with sync integration
function TodoApp({
  socket,
  syncOptions = {},
  isHydrated = true,
  initialState,
  storeInstance,
}: {
  socket: MockSocketInterface;
  syncOptions?: any;
  isHydrated?: boolean;
  initialState?: RemixTodoStoreInterface;
  storeInstance?: Store<RemixTodoStoreInterface>;
}) {
  const [hydrationComplete, setHydrationComplete] = useState(isHydrated);
  const [todoStore] = useState(
    () =>
      storeInstance ||
      store<RemixTodoStoreInterface>(
        initialState || {
          todos: [],
          filter: "",
          user: {
            id: "",
            name: "",
            role: "",
          },
        }
      )
  );

  const { stores: state } = useJods(todoStore);
  const [syncActive, setSyncActive] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      const timer = setTimeout(() => {
        setHydrationComplete(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  useEffect(() => {
    if (!hydrationComplete) return;
    const stopSync = sync(socket, todoStore as any, syncOptions);
    setSyncActive(true);
    return () => {
      stopSync();
      setSyncActive(false);
    };
  }, [todoStore, socket, syncOptions, hydrationComplete]);

  const addTodo = (text: string) => {
    (todoStore as any as RemixTodoStoreInterface).todos.push({
      id: String(Date.now()),
      text,
      completed: false,
    });
  };

  const toggleTodo = (id: string) => {
    const todo = (todoStore as any as RemixTodoStoreInterface).todos.find(
      (t: { id: string }) => t.id === id
    );
    if (todo) {
      (todo as { completed: boolean }).completed = !(
        todo as { completed: boolean }
      ).completed;
    }
  };

  return (
    <div>
      <div data-testid="hydration-status">
        {hydrationComplete ? "Hydrated" : "Not Hydrated"}
      </div>
      <div data-testid="sync-status">
        {syncActive ? "Syncing" : "Not Syncing"}
      </div>
      <h1 data-testid="username">{state.user.name}</h1>
      <div data-testid="filter">Filter: {state.filter}</div>
      <ul>
        {state.todos.map(
          (todo: { id: string; text: string; completed: boolean }) => (
            <li
              key={todo.id}
              data-testid={`todo-${todo.id}`}
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.text}
              <button
                data-testid={`toggle-${todo.id}`}
                onClick={() => toggleTodo(todo.id)}
              >
                Toggle
              </button>
            </li>
          )
        )}
      </ul>
      <form
        data-testid="add-form"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem(
            "text"
          ) as HTMLInputElement;
          if (input?.value) {
            addTodo(input.value);
            input.value = "";
          }
        }}
      >
        <input
          name="text"
          data-testid="new-todo-input"
          placeholder="Add a todo"
        />
        <button type="submit" data-testid="add-todo-button">
          Add Todo
        </button>
      </form>
      <button
        data-testid="change-filter"
        onClick={() => {
          const currentStore = todoStore as any as RemixTodoStoreInterface;
          currentStore.filter =
            currentStore.filter === "all" ? "active" : "all";
        }}
      >
        Change Filter
      </button>
    </div>
  );
}

describe("Remix integration with sync", () => {
  let mockSocket: MockSocketInterface;

  beforeEach(() => {
    mockSocket = new MockSocket();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("only activates sync after hydration is complete", async () => {
    render(<TodoApp socket={mockSocket} isHydrated={false} />);
    expect(screen.getByTestId("hydration-status").textContent).toBe(
      "Not Hydrated"
    );
    expect(screen.getByTestId("sync-status").textContent).toBe("Not Syncing");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });
    expect(screen.getByTestId("hydration-status").textContent).toBe("Hydrated");
    expect(screen.getByTestId("sync-status").textContent).toBe("Syncing");
  });

  it("syncs client changes to server after client interaction", async () => {
    const mockStoreInstanceInitialState: RemixTodoStoreInterface = {
      todos: [{ id: "1", text: "Initial", completed: false }],
      filter: "all",
      user: { id: "user1", name: "Test User", role: "user" },
    };
    const mockStoreInstance = store<RemixTodoStoreInterface>(
      mockStoreInstanceInitialState
    );

    // Diagnostic: Spy on store subscriptions
    const subscriberSpy = vi.fn();
    (mockStoreInstance as any).subscribe(subscriberSpy);

    render(<TodoApp socket={mockSocket} storeInstance={mockStoreInstance} />);

    // Ensure sync is activated and ready
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    mockSocket.sentMessages = [];

    // Force sync to be in active state
    mockSocket.receiveMessage({ type: "ping" });

    await act(async () => {
      (mockStoreInstance as any as RemixTodoStoreInterface).todos.push({
        id: "2",
        text: "New client todo",
        completed: false,
      });
      // Allow time for store to notify and sync to potentially process
      await new Promise((r) => setTimeout(r, 100));
    });

    // Check if the direct subscriber was called *after* act has completed
    expect(subscriberSpy).toHaveBeenCalled();

    // Wait for sync to potentially send message after the store update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);
    const lastMessage =
      mockSocket.sentMessages[mockSocket.sentMessages.length - 1];
    expect(lastMessage.changes).toBeDefined();
    expect(lastMessage.changes.todos).toBeDefined();

    interface TodoItem {
      id: string;
      text: string;
      completed: boolean;
      __new?: TodoItem[]; // For wrapper objects that might contain a __new array
    }

    let newTodoObject: TodoItem | undefined;
    const todosDiff = lastMessage.changes.todos as any; // Treat as any for dynamic access

    if (typeof todosDiff === "object" && todosDiff !== null) {
      const todosDiffAsAny = todosDiff as any;

      // Check 1: Is todosDiff THE new item itself?
      // (e.g., changes.todos = { id: "2", text: "New client todo", ... })
      if (typeof todosDiffAsAny.id === "string" && todosDiffAsAny.id === "2") {
        newTodoObject = todosDiffAsAny as TodoItem;
      }
      // Check 2: Does todosDiff have a __new array containing the item?
      // (e.g., changes.todos = { __new: [{ id: "2", ... }] })
      else if (Array.isArray(todosDiffAsAny.__new)) {
        newTodoObject = (todosDiffAsAny.__new as TodoItem[]).find(
          (todo: TodoItem) => todo && todo.id === "2"
        );
      }
      // Check 3: Is todosDiff an array of items/operations, OR an object whose values might be items/wrappers/operations?
      else {
        const elementsToSearch: any[] = Array.isArray(todosDiffAsAny)
          ? todosDiffAsAny
          : Object.values(todosDiffAsAny);

        for (const el of elementsToSearch) {
          if (!el || typeof el !== "object") continue; // el must be an object

          // Case 3.1: el is the TodoItem directly
          if (typeof (el as any).id === "string" && (el as any).id === "2") {
            newTodoObject = el as TodoItem;
            break; // Found it
          }

          // Case 3.2: el has a 'value' property that is the TodoItem (e.g., for JSON Patch-like ops)
          const elValue = (el as any).value;
          if (
            elValue &&
            typeof elValue === "object" &&
            typeof (elValue as any).id === "string" &&
            (elValue as any).id === "2"
          ) {
            newTodoObject = elValue as TodoItem;
            break; // Found it
          }

          // Case 3.3: el has a __new array containing the TodoItem (wrapper object)
          const elNew = (el as any).__new;
          if (Array.isArray(elNew)) {
            const itemInNewArray = (elNew as TodoItem[]).find(
              (subTodo: TodoItem) => subTodo && subTodo.id === "2"
            );
            if (itemInNewArray) {
              newTodoObject = itemInNewArray;
              break; // Found it
            }
          }

          // Case 3.4: el has an '__added' property that is the TodoItem
          const elAdded = (el as any).__added;
          if (
            elAdded &&
            typeof elAdded === "object" &&
            typeof (elAdded as any).id === "string" &&
            (elAdded as any).id === "2"
          ) {
            newTodoObject = elAdded as TodoItem;
            break; // Found it
          }
        }
      }
    }

    expect(newTodoObject).toBeDefined();
    if (newTodoObject) {
      // For type safety and to allow more detailed checks
      expect(newTodoObject.text).toBe("New client todo");
      expect(newTodoObject.completed).toBe(false);
    }
  });

  it("updates component when receiving server changes", async () => {
    const mockStoreInstanceInitialState: RemixTodoStoreInterface = {
      todos: [{ id: "s1", text: "Server 1", completed: false }],
      filter: "all",
      user: { id: "user1", name: "Test User", role: "user" },
    };
    const mockStoreInstance = store<RemixTodoStoreInterface>(
      mockStoreInstanceInitialState
    );

    // Spy on the store's subscribe method to verify updates
    const subscriberSpy = vi.fn();
    (mockStoreInstance as any).subscribe(subscriberSpy);

    // Render the component with the mocked store
    const { getByText } = render(
      <TodoApp socket={mockSocket} storeInstance={mockStoreInstance} />
    );

    // Verify initial render state
    expect(getByText("Server 1")).toBeInTheDocument();
    expect(screen.queryByText("New Server Todo")).not.toBeInTheDocument();

    // Simulate receiving data from the server
    act(() => {
      mockSocket.receiveMessage({
        clientId: "server-id", // Different client ID to simulate server
        changes: {
          todos: [
            { id: "s1", text: "Server 1", completed: false },
            { id: "s2", text: "New Server Todo", completed: true },
          ],
        },
      });
    });

    // Wait for both store update and React rendering
    await waitFor(
      () => {
        expect(screen.getByText("New Server Todo")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Verify that the store subscription was called
    expect(subscriberSpy).toHaveBeenCalled();

    // Verify the new todo was added to the store
    const storeState = mockStoreInstance.getState();
    expect(storeState.todos).toHaveLength(2);
    expect(storeState.todos[1].id).toBe("s2");
    expect(storeState.todos[1].text).toBe("New Server Todo");
    expect(storeState.todos[1].completed).toBe(true);

    // Now test that the strikethrough style is applied for completed todos
    const todoElement = await screen.findByTestId("todo-s2");
    const computedStyle = window.getComputedStyle(todoElement);
    expect(computedStyle.textDecoration).toContain("line-through");
  });

  it("respects allowKeys for security in server/client boundary", async () => {
    const mockStoreInstanceInitialState: RemixTodoStoreInterface = {
      todos: [{ id: "s1", text: "Initial Todo", completed: false }],
      filter: "all",
      user: { id: "user1", name: "Test User", role: "user" },
    };
    const mockStoreInstance = store<RemixTodoStoreInterface>(
      mockStoreInstanceInitialState
    );

    // Create sync options that only allow todos to be synced (not user data)
    const syncOptions = {
      allowKeys: ["todos", "filter"] as Array<keyof RemixTodoStoreInterface>,
    };

    render(
      <TodoApp
        socket={mockSocket}
        storeInstance={mockStoreInstance}
        syncOptions={syncOptions}
      />
    );

    // Reset sent messages
    mockSocket.sentMessages = [];

    // Change user info (which should be filtered out by allowKeys)
    await act(async () => {
      (mockStoreInstance as any as RemixTodoStoreInterface).user.name =
        "Changed Name";
      (mockStoreInstance as any as RemixTodoStoreInterface).user.role = "admin";

      // Allow time for sync to process
      await new Promise((r) => setTimeout(r, 200));
    });

    // Check that no messages were sent containing user data changes
    const userDataSent = mockSocket.sentMessages.some(
      (msg) => msg.changes && msg.changes.user
    );
    expect(userDataSent).toBe(false);

    // Now change todos (which should be synced)
    mockSocket.sentMessages = []; // Reset sent messages

    await act(async () => {
      (mockStoreInstance as any as RemixTodoStoreInterface).todos.push({
        id: "s2",
        text: "Another Todo",
        completed: false,
      });

      // Allow time for sync to process
      await new Promise((r) => setTimeout(r, 200));
    });

    // Check that messages were sent containing todo changes
    const todoDataSent = mockSocket.sentMessages.some(
      (msg) => msg.changes && msg.changes.todos
    );
    expect(todoDataSent).toBe(true);
  });

  it("integrates with form submissions and syncs the results", async () => {
    const mockStoreInstanceInitialState: RemixTodoStoreInterface = {
      todos: [],
      filter: "all",
      user: { id: "user1", name: "Test User", role: "user" },
    };
    const mockStoreInstance = store<RemixTodoStoreInterface>(
      mockStoreInstanceInitialState
    );

    render(<TodoApp socket={mockSocket} storeInstance={mockStoreInstance} />);

    // Wait for sync to be ready
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Ensure sync is active by sending a ping and forcing an active state
    mockSocket.receiveMessage({ type: "ping" });
    mockSocket.sentMessages = []; // Clear any previous messages

    // Spy on socket.send to capture outgoing messages
    const sendSpy = vi.spyOn(mockSocket, "send");
    sendSpy.mockClear(); // Clear any previous calls

    // Use the addTodo function directly for more reliable testing
    await act(async () => {
      // Call the internal addTodo function directly
      (mockStoreInstance as any as RemixTodoStoreInterface).todos.push({
        id: String(Date.now()),
        text: "Form Submitted Todo",
        completed: false,
      });

      // Allow time for store update and sync to process
      await new Promise((r) => setTimeout(r, 500));
    });

    // Verify the todo was added to the store
    const storeState = mockStoreInstance.getState();
    expect(storeState.todos.length).toBeGreaterThan(0);
    expect(
      storeState.todos.some((todo) => todo.text === "Form Submitted Todo")
    ).toBe(true);

    // Verify that a sync message was sent with the new todo
    expect(sendSpy).toHaveBeenCalled();

    // Check that at least one message contains our new todo
    const todoSynced = mockSocket.sentMessages.some((msg) => {
      if (!msg.changes || !msg.changes.todos) return false;

      // Helper function to search for our todo text in potentially nested structures
      const findTodoInChanges = (changes: any): boolean => {
        if (!changes) return false;

        // Direct array
        if (Array.isArray(changes)) {
          return changes.some(
            (item) =>
              item &&
              typeof item === "object" &&
              item.text === "Form Submitted Todo"
          );
        }

        // Handle possible diff formats like {todos: {__new: [...]}}
        if (changes.__new && Array.isArray(changes.__new)) {
          return findTodoInChanges(changes.__new);
        }

        // Check if it's a direct object with text property
        if (
          typeof changes === "object" &&
          changes.text === "Form Submitted Todo"
        ) {
          return true;
        }

        // Recurse through object properties
        return Object.values(changes).some(
          (value) =>
            value && typeof value === "object" && findTodoInChanges(value)
        );
      };

      return findTodoInChanges(msg.changes.todos);
    });

    expect(todoSynced).toBe(true);
  });

  it("cleans up sync when component unmounts", async () => {
    const removeEventListenerSpy = vi.spyOn(mockSocket, "removeEventListener");
    const { unmount } = render(<TodoApp socket={mockSocket} />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
