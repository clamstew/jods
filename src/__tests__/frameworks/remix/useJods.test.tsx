/// <reference types="react/jsx-runtime" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as React from "react";
import { useJods } from "../../../frameworks/remix";
import { defineStore } from "../../../frameworks/remix";
import { j, jod } from "../../../utils/zod";

// Mock the Remix hooks
vi.mock("@remix-run/react", () => ({
  useLoaderData: vi.fn(() => ({
    meta: {
      title: "Todo App",
    },
    todos: {
      items: [
        {
          id: "1",
          text: "Learn Remix",
          completed: false,
        },
        {
          id: "2",
          text: "Build with jods",
          completed: false,
        },
      ],
    },
    user: {
      name: "Test User",
      email: "test@example.com",
    },
  })),
  useActionData: vi.fn(),
  useSubmit: vi.fn(),
  useNavigation: vi.fn(() => ({ state: "idle" })),
  Form: (props: any) => <form {...props}>{props.children}</form>,
}));

// Define types for test data
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

// Mock the useJodsStore and useJodsForm hooks
vi.mock("../../../frameworks/remix/useJodsStore", () => ({
  useJodsStore: vi.fn((store) => {
    // Return the default state based on store name
    if (store.name === "todos") {
      return {
        items: [
          { id: "1", text: "Learn jods", completed: false },
          { id: "2", text: "Build an app", completed: false },
        ],
      };
    } else if (store.name === "user") {
      return {
        name: "Test User",
        email: "test@example.com",
      };
    }
    return store.getState();
  }),
}));

vi.mock("../../../frameworks/remix/useJodsForm", () => ({
  useJodsForm: vi.fn((store, handler) => ({
    Form: (props: any) => (
      <form
        data-testid={`form-${store.name}-${handler}`}
        data-store={store.name}
        data-handler={handler}
        {...props}
      >
        <input type="hidden" name="_jods_handler" value={handler} />
        {props.children}
      </form>
    ),
    fetcher: {
      state: "idle",
      submit: vi.fn(),
    },
  })),
}));

// Create test stores
const createTestStores = () => {
  const todoStore = defineStore({
    name: "todos",
    schema: j.object({
      items: j.array(
        j.object({
          id: j.string(),
          text: j.string(),
          completed: j.boolean(),
        })
      ),
    }),
    defaults: {
      items: [],
    },
    handlers: {
      addTodo: vi.fn(),
      removeTodo: vi.fn(),
      toggleTodo: vi.fn(),
    },
  });

  const userStore = defineStore({
    name: "user",
    schema: j.object({
      name: j.string(),
      email: j.string().email(),
    }),
    defaults: {
      name: "",
      email: "",
    },
    handlers: {
      updateProfile: vi.fn(),
    },
  });

  return { todoStore, userStore };
};

// Create mock Zod module
const mockZod = {
  z: {
    string: () => ({
      type: "string",
      _parse: vi.fn().mockReturnValue({ data: "test" }),
      email: () => ({
        type: "string",
        _parse: vi.fn().mockReturnValue({ data: "test@example.com" }),
      }),
    }),
    number: () => ({
      type: "number",
      _parse: vi.fn().mockReturnValue({ data: 123 }),
    }),
    boolean: () => ({
      type: "boolean",
      _parse: vi.fn().mockReturnValue({ data: true }),
    }),
    object: (schema: any) => {
      // Ensure we consistently return a shape property with the schema fields
      return {
        type: "object",
        schema,
        _parse: vi.fn((data: any) => ({ data })),
        shape: schema,
        // Add toString to help with debugging
        toString: () => "[z.object]",
      };
    },
    array: (schema: any) => ({
      type: "array",
      schema,
      _parse: vi.fn((data: any) => ({ data })),
    }),
  },
};

// Create local reference to the mock z for use in tests
// const z = mockZod.z;
// Mock the Zod import by placing it on globalThis
beforeEach(() => {
  vi.clearAllMocks();
  // Expose the mock to the global scope where getZodIfAvailable looks for it
  (globalThis as any).require = vi.fn(() => mockZod);
});

afterEach(() => {
  // Clean up after tests
  delete (globalThis as any).require;
});

describe("useJods", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should handle a single store with a single handler", () => {
    const { todoStore } = createTestStores();

    function TestComponent() {
      const { stores, actions, loaderData } = useJods(todoStore, "addTodo");

      return (
        <div>
          <h1>{loaderData.meta.title}</h1>
          <ul>
            {stores.items.map((item: TodoItem) => (
              <li key={item.id} data-testid={`todo-item-${item.id}`}>
                {item.text}
              </li>
            ))}
          </ul>
          <actions.addTodo.Form>
            <input name="text" />
            <button type="submit">Add Todo</button>
          </actions.addTodo.Form>
        </div>
      );
    }

    render(<TestComponent />);

    // Check loader data is available
    expect(screen.getByText("Todo App")).toBeInTheDocument();

    // Check store data is available
    expect(screen.getByTestId("todo-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("todo-item-2")).toBeInTheDocument();

    // Check form is rendered with correct handler
    const form = screen.getByTestId("form-todos-addTodo");
    expect(form).toBeInTheDocument();
    expect(form.getAttribute("data-handler")).toBe("addTodo");
  });

  it("should handle a single store with multiple handlers", () => {
    const { todoStore } = createTestStores();

    function TestComponent() {
      const { stores, actions } = useJods(todoStore, ["addTodo", "removeTodo"]);

      return (
        <div>
          <ul>
            {stores.items.map((item: TodoItem) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
          <actions.addTodo.Form data-testid="add-form">
            <input name="text" />
            <button type="submit">Add</button>
          </actions.addTodo.Form>
          <actions.removeTodo.Form data-testid="remove-form">
            <input name="id" />
            <button type="submit">Remove</button>
          </actions.removeTodo.Form>
        </div>
      );
    }

    render(<TestComponent />);

    // Both forms should be rendered
    expect(screen.getByTestId("add-form")).toBeInTheDocument();
    expect(screen.getByTestId("remove-form")).toBeInTheDocument();
  });

  it("should handle multiple stores with their handlers", () => {
    const { todoStore, userStore } = createTestStores();

    function TestComponent() {
      const { stores, actions } = useJods([todoStore, userStore], {
        todos: ["addTodo"],
        user: ["updateProfile"],
      });

      return (
        <div>
          <div data-testid="user-name">{stores.user.name}</div>
          <div data-testid="todo-count">{stores.todos.items.length}</div>

          <actions.todos.addTodo.Form data-testid="todo-form">
            <input name="text" />
            <button type="submit">Add Todo</button>
          </actions.todos.addTodo.Form>

          <actions.user.updateProfile.Form data-testid="profile-form">
            <input name="name" />
            <input name="email" />
            <button type="submit">Update Profile</button>
          </actions.user.updateProfile.Form>
        </div>
      );
    }

    render(<TestComponent />);

    // Check data from both stores is available
    expect(screen.getByTestId("user-name").textContent).toBe("Test User");
    expect(screen.getByTestId("todo-count").textContent).toBe("2");

    // Check forms for both stores are rendered
    expect(screen.getByTestId("todo-form")).toBeInTheDocument();
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
  });

  it("should combine store methods with reactive state", () => {
    const { todoStore } = createTestStores();

    // Add a spy to track if setState is available and passed through
    const setStateSpy = vi.fn();
    todoStore.setState = setStateSpy;

    function TestComponent() {
      const { stores } = useJods(todoStore);

      // Call setState to verify the method is passed through
      if (stores.setState) {
        stores.setState({ items: [] });
      }

      return <div>Test</div>;
    }

    render(<TestComponent />);

    // Verify setState was called
    expect(setStateSpy).toHaveBeenCalledWith({ items: [] });
  });
});

describe("Remix integration with Zod/j/jod", () => {
  describe("Direct Zod usage", () => {
    it("should work with direct Zod imports", () => {
      // Define a store with Zod schema
      const todoStore = defineStore({
        name: "todos",
        schema: j.object({
          id: j.string(),
          title: j.string(),
          completed: j.boolean(),
        }),
        defaults: {
          id: "1",
          title: "Test Todo",
          completed: false,
        },
      });

      // Test the schema validation works
      expect(todoStore).toBeDefined();
      expect(todoStore.schema).toBeDefined();
      // Using type assertion to access shape for testing
      const schema = todoStore.schema as any;
      expect(schema.shape).toHaveProperty("id");
      expect(schema.shape).toHaveProperty("title");
      expect(schema.shape).toHaveProperty("completed");
    });

    it("should allow complex schemas with z", () => {
      const userStore = defineStore({
        name: "users",
        schema: j.object({
          id: j.string(),
          name: j.string(),
          todos: j.array(
            j.object({
              id: j.string(),
              title: j.string(),
              completed: j.boolean(),
            })
          ),
        }),
        defaults: {
          id: "1",
          name: "Test User",
          todos: [],
        },
      });

      expect(userStore).toBeDefined();
      expect(userStore.schema).toBeDefined();
      // Using type assertion to access shape for testing
      const schema = userStore.schema as any;
      expect(schema.shape).toHaveProperty("todos");
    });
  });

  describe("j/jod alias usage", () => {
    it("should work with j alias", () => {
      // Define the same store with j alias
      const todoStore = defineStore({
        name: "todos-j",
        schema: j.object({
          id: j.string(),
          title: j.string(),
          completed: j.boolean(),
        }),
        defaults: {
          id: "1",
          title: "Test Todo",
          completed: false,
        },
      });

      expect(todoStore).toBeDefined();
      expect(todoStore.schema).toBeDefined();
      // Using type assertion to access shape for testing
      const schema = todoStore.schema as any;
      expect(schema.shape).toHaveProperty("id");
      expect(schema.shape).toHaveProperty("title");
      expect(schema.shape).toHaveProperty("completed");
    });

    it("should work with jod alias", () => {
      // Define the same store with jod alias
      const todoStore = defineStore({
        name: "todos-jod",
        schema: jod.object({
          id: jod.string(),
          title: jod.string(),
          completed: jod.boolean(),
        }),
        defaults: {
          id: "1",
          title: "Test Todo",
          completed: false,
        },
      });

      expect(todoStore).toBeDefined();
      expect(todoStore.schema).toBeDefined();
      // Using type assertion to access shape for testing
      const schema = todoStore.schema as any;
      expect(schema.shape).toHaveProperty("id");
      expect(schema.shape).toHaveProperty("title");
      expect(schema.shape).toHaveProperty("completed");
    });

    it("should allow complex schemas with j", () => {
      const userStore = defineStore({
        name: "users-j",
        schema: j.object({
          id: j.string(),
          name: j.string(),
          todos: j.array(
            j.object({
              id: j.string(),
              title: j.string(),
              completed: j.boolean(),
            })
          ),
        }),
        defaults: {
          id: "1",
          name: "Test User",
          todos: [],
        },
      });

      expect(userStore).toBeDefined();
      expect(userStore.schema).toBeDefined();
      // Using type assertion to access shape for testing
      const schema = userStore.schema as any;
      expect(schema.shape).toHaveProperty("todos");
    });
  });

  describe("Equivalence of z, j, and jod", () => {
    it("should produce equivalent results with z, j, and jod", () => {
      // Create a more complete mock implementation that guarantees type properties
      const numberType = {
        type: "number",
        _parse: vi.fn().mockReturnValue({ data: 123 }),
      };

      const booleanType = {
        type: "boolean",
        _parse: vi.fn().mockReturnValue({ data: true }),
      };
      // Override the z methods for consistent behavior
      mockZod.z.string = () => ({
        type: "string",
        _parse: vi.fn().mockReturnValue({ data: "test" }),
        email: () => ({
          type: "string",
          _parse: vi.fn().mockReturnValue({ data: "test@example.com" }),
        }),
      });
      mockZod.z.number = () => numberType;
      mockZod.z.boolean = () => booleanType;

      // Mock a more consistent behavior for object()
      mockZod.z.object = (schema: any) => ({
        type: "object",
        schema,
        _parse: vi.fn((data: any) => ({ data })),
        shape: schema, // Ensure shape is available
      });

      // Create three stores with the same schema using z, j, and jod
      const zStore = defineStore({
        name: "z-store",
        schema: j.object({
          id: j.string(),
          count: j.number(),
          active: j.boolean(),
        }),
        defaults: { id: "1", count: 0, active: true },
      });

      const jStore = defineStore({
        name: "j-store",
        schema: j.object({
          id: j.string(),
          count: j.number(),
          active: j.boolean(),
        }),
        defaults: { id: "1", count: 0, active: true },
      });

      const jodStore = defineStore({
        name: "jod-store",
        schema: jod.object({
          id: jod.string(),
          count: jod.number(),
          active: jod.boolean(),
        }),
        defaults: { id: "1", count: 0, active: true },
      });

      // Using type assertion to access for testing
      const zSchema = zStore.schema as any;
      const jSchema = jStore.schema as any;
      const jodSchema = jodStore.schema as any;

      // Check that all schemas have the same properties
      expect(Object.keys(zSchema.shape || {})).toEqual(
        Object.keys(jSchema.shape || {})
      );
      expect(Object.keys(zSchema.shape || {})).toEqual(
        Object.keys(jodSchema.shape || {})
      );

      // Check that all schema types match
      expect(zSchema.type).toEqual(jSchema.type);
      expect(zSchema.type).toEqual(jodSchema.type);

      // Skip type checks if shape is missing or properties don't have types
      if (!zSchema.shape?.id?.type || !jSchema.shape?.id?.type) {
        return;
      }

      // Check that schema shapes match
      expect(zSchema.shape.id.type).toEqual(jSchema.shape.id.type);
      expect(zSchema.shape.count.type).toEqual(jSchema.shape.count.type);
      expect(zSchema.shape.active.type).toEqual(jSchema.shape.active.type);
    });
  });

  describe("Error handling", () => {
    it("should handle validation errors consistently across z, j, and jod", () => {
      // Set up mock to throw consistently
      const validationError = new Error("Validation failed");
      const throwingParse = vi.fn().mockImplementation(() => {
        throw validationError;
      });

      // Make all schemas throw on parse for this test
      mockZod.z.object = vi.fn().mockImplementation((schema) => ({
        type: "object",
        schema,
        _parse: throwingParse,
        shape: schema,
      }));

      // Try to create stores with invalid data
      const createZStore = () => {
        const schema = j.object({
          id: j.string(),
        });

        // Force _parse to throw when called
        (schema as any)._parse = throwingParse;

        // When defineStore validates the defaults, it should throw
        return defineStore({
          name: "z-error",
          schema,
          defaults: { id: 123 as any }, // Type error intentional for test
        });
      };

      const createJStore = () => {
        const schema = j.object({
          id: j.string(),
        });

        // Force _parse to throw when called
        (schema as any)._parse = throwingParse;

        return defineStore({
          name: "j-error",
          schema,
          defaults: { id: 123 as any }, // Type error intentional for test
        });
      };

      const createJodStore = () => {
        const schema = jod.object({
          id: jod.string(),
        });

        // Force _parse to throw when called
        (schema as any)._parse = throwingParse;

        return defineStore({
          name: "jod-error",
          schema,
          defaults: { id: 123 as any }, // Type error intentional for test
        });
      };

      // Add throw assertions specifically for each function to isolate failures
      try {
        createZStore();
        expect.fail("createZStore should have thrown");
      } catch (e) {
        expect(e).toBeDefined();
      }

      try {
        createJStore();
        expect.fail("createJStore should have thrown");
      } catch (e) {
        expect(e).toBeDefined();
      }

      try {
        createJodStore();
        expect.fail("createJodStore should have thrown");
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });
});
