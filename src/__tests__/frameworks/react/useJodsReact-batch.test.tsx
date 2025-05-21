/// <reference types="react/jsx-runtime" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { useJods } from "../../../frameworks/react/useJods";
import { store } from "../../../core/store";
import * as React from "react";

// Mock the example from documentation
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: TodoItem[];
  filter: string;
  loading: boolean;
}

// Create the store
const todoStore = store<TodoStore>({
  todos: [],
  filter: "all",
  loading: false,
});

// Actions that use batching - from the documentation example
function addTodo(text: string) {
  todoStore.batch(() => {
    todoStore.loading = true;
    todoStore.todos = [
      ...todoStore.todos,
      { id: Date.now(), text, completed: false },
    ];
    todoStore.loading = false;
  });
}

function toggleTodo(id: number) {
  todoStore.batch(() => {
    todoStore.todos = todoStore.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  });
}

// Simplified test components
function TodoInput({
  onAdd,
  disabled,
}: {
  onAdd: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text);
      setText("");
    }
  };

  return (
    <form data-testid="todo-form" onSubmit={handleSubmit}>
      <input
        data-testid="todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button data-testid="add-button" type="submit" disabled={disabled}>
        Add
      </button>
    </form>
  );
}

function TodoList({
  todos,
  onToggle,
}: {
  todos: TodoItem[];
  onToggle: (id: number) => void;
}) {
  return (
    <ul data-testid="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} data-testid={`todo-item-${todo.id}`}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            data-testid={`todo-checkbox-${todo.id}`}
          />
          <span data-testid={`todo-text-${todo.id}`}>{todo.text}</span>
        </li>
      ))}
    </ul>
  );
}

// Component using actions - following the documentation example
function TodoApp() {
  const { todos, loading } = useJods(todoStore);

  const handleAddTodo = (text: string) => {
    addTodo(text); // Uses batching
  };

  return (
    <div>
      <TodoInput onAdd={handleAddTodo} disabled={loading} />
      <TodoList todos={todos} onToggle={toggleTodo} />
      <div data-testid="loading-state">{loading ? "Loading..." : "Ready"}</div>
    </div>
  );
}

describe("React Batching Integration", () => {
  beforeEach(() => {
    cleanup();
    // Reset store to initial state before each test
    todoStore.todos = [];
    todoStore.filter = "all";
    todoStore.loading = false;
    vi.resetAllMocks();
  });

  it("should subscribe to store changes with batching", () => {
    render(<TodoApp />);

    // Check initial state
    expect(screen.getByTestId("loading-state").textContent).toBe("Ready");
    expect(screen.queryAllByTestId(/todo-item/)).toHaveLength(0);

    // Add a todo which uses batching
    act(() => {
      const input = screen.getByTestId("todo-input");
      const form = screen.getByTestId("todo-form");

      fireEvent.change(input, { target: { value: "Test Todo" } });
      fireEvent.submit(form);
    });

    // After the batch operation, loading should be false and todo should be added
    expect(screen.getByTestId("loading-state").textContent).toBe("Ready");
    expect(screen.queryAllByTestId(/todo-item/)).toHaveLength(1);
    expect(screen.getByTestId(/todo-text/).textContent).toBe("Test Todo");
  });

  it("should handle toggle action with batching", async () => {
    // Add a todo first
    act(() => {
      // Simulate addTodo with a fixed ID for testing
      todoStore.batch(() => {
        todoStore.todos = [{ id: 123, text: "Test Todo", completed: false }];
      });
    });

    render(<TodoApp />);

    // Verify todo exists and is not completed
    const checkbox = screen.getByTestId("todo-checkbox-123");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Toggle todo completion
    act(() => {
      fireEvent.click(checkbox);
    });

    // Verify todo is now completed
    expect(screen.getByTestId("todo-checkbox-123")).toBeChecked();
  });

  it("should prevent multiple renders during batch operations", () => {
    // Create a spy to track renders
    const renderSpy = vi.fn();

    function RenderTrackingComponent() {
      const state = useJods(todoStore);

      // Count how many times this component renders
      React.useEffect(() => {
        renderSpy();
      });

      return (
        <div>
          <div data-testid="loading-indicator">
            {state.loading ? "Loading" : "Not Loading"}
          </div>
          <div data-testid="todo-count">{state.todos.length}</div>
        </div>
      );
    }

    render(<RenderTrackingComponent />);

    // Reset count after initial render
    renderSpy.mockClear();

    // Perform a batch operation
    act(() => {
      todoStore.batch(() => {
        todoStore.loading = true;
        todoStore.todos = [{ id: 1, text: "Test", completed: false }];
        todoStore.loading = false;
      });
    });

    // Should only render once for the batch, not for each property change
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Final state should reflect all changes
    expect(screen.getByTestId("loading-indicator").textContent).toBe(
      "Not Loading"
    );
    expect(screen.getByTestId("todo-count").textContent).toBe("1");
  });
});
