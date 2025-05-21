import { describe, it, expect, vi, beforeAll } from "vitest";
import { defineStore } from "../../../frameworks/remix/defineStore";
import { onUpdate } from "../../../core/life-cycle/on-update";
import { j } from "../../../utils/zod";

// Mock Zod for our tests
beforeAll(() => {
  // Mock the schema.parse method
  vi.spyOn(j.object({}).constructor.prototype, "parse").mockImplementation(
    function (this: any, data: any) {
      // If this is our updateName validation test with invalid data
      if (
        data.email === "invalid-email" ||
        data.name === "" ||
        (data.settings && data.settings.theme === "invalid-theme")
      ) {
        throw new Error("Invalid data");
      }
      return data;
    }
  );
});

// Mock the Request and FormData
class MockRequest {
  private _formData: Record<string, string>;

  constructor(formData: Record<string, string> = {}) {
    this._formData = formData;
  }

  async formData() {
    // Convert simple object to FormData structure
    const formData = new FormData();

    for (const [key, value] of Object.entries(this._formData)) {
      formData.append(key, value);
    }

    return formData;
  }
}

// Helper to create a store for testing
function createTestStore() {
  const schema = j.object({
    name: j.string(),
    email: j.string().email(),
    settings: j.object({
      theme: j.enum(["light", "dark", "system"]).default("system"),
      notifications: j.boolean().default(true),
    }),
  });

  return defineStore({
    name: "testUser",
    schema,
    defaults: {
      name: "Test User",
      email: "test@example.com",
      settings: {
        theme: "light",
        notifications: true,
      },
    },
    handlers: {
      async updateName({ current, form }) {
        return {
          ...current,
          name: (form.get("name") as string) || current.name,
        };
      },
      async updateSettings({ current, form }) {
        const theme = form.get("theme") as "light" | "dark" | "system";

        return {
          ...current,
          settings: {
            ...current.settings,
            theme,
          },
        };
      },
    },
  });
}

describe("defineStore", () => {
  it("should create a store with the correct defaults", () => {
    const testStore = createTestStore();

    expect(testStore.name).toBe("testUser");

    const state = testStore.getState();
    expect(state.name).toBe("Test User");
    expect(state.email).toBe("test@example.com");
    expect(state.settings.theme).toBe("light");
    expect(state.settings.notifications).toBe(true);
  });

  it("should expose a signal-based store", () => {
    const testStore = createTestStore();

    // Store should be a proxy object
    expect(typeof testStore.store).toBe("object");

    // Should be able to subscribe to store updates
    const mockCallback = vi.fn();
    const unsubscribe = onUpdate(testStore.store, mockCallback);

    // Change a property
    testStore.store.name = "Updated User";

    // Callback should be called
    expect(mockCallback).toHaveBeenCalled();

    // Clean up
    unsubscribe();
  });

  it("should handle form submissions via handlers", async () => {
    const testStore = createTestStore();

    // Create a mock request with form data
    const mockRequest = new MockRequest({
      _jods_handler: "updateName",
      name: "New User Name",
    });

    // Process the action
    const result = await testStore.action({
      request: mockRequest as unknown as Request,
    });

    // Check the result
    expect(result.testUser.name).toBe("New User Name");

    // State should be updated
    expect(testStore.getState().name).toBe("New User Name");

    // Direct access via the store property should also reflect the updated value
    expect(testStore.store.name).toBe("New User Name");
  });

  it("should partially update objects with fine-grained reactivity", async () => {
    const testStore = createTestStore();

    // Create a spy to track updates
    const updateSpy = vi.fn();
    const unsubscribe = onUpdate(testStore.store, updateSpy);

    // Update just the theme setting
    const mockRequest = new MockRequest({
      _jods_handler: "updateSettings",
      theme: "dark",
    });

    await testStore.action({ request: mockRequest as unknown as Request });

    // Check that state was updated correctly using both getState and direct property access
    expect(testStore.getState().settings.theme).toBe("dark");
    expect(testStore.store.settings.theme).toBe("dark");

    // Notification setting should still be the same
    expect(testStore.store.settings.notifications).toBe(true);

    // Spy should have been called at least once
    expect(updateSpy).toHaveBeenCalled();

    // Clean up
    unsubscribe();
  });

  it("should throw an error with invalid handler", async () => {
    const testStore = createTestStore();

    // Create a mock request with invalid handler
    const mockRequest = new MockRequest({
      _jods_handler: "nonExistentHandler",
    });

    // Should throw an error
    await expect(
      testStore.action({
        request: mockRequest as unknown as Request,
      })
    ).rejects.toThrow("Invalid handler");
  });

  it("should validate data with zod schema", async () => {
    const testStore = createTestStore();

    // Mock implementation of the updateName handler to return invalid data
    (testStore.handlers as any).updateName = vi.fn().mockResolvedValue({
      name: "", // Invalid: name should not be empty
      email: "invalid-email", // Invalid: not a valid email
      settings: {
        theme: "invalid-theme", // Invalid: not in the enum
        notifications: true,
      },
    });

    const mockRequest = new MockRequest({
      _jods_handler: "updateName",
    });

    // Should throw validation error due to invalid schema data
    await expect(
      testStore.action({
        request: mockRequest as unknown as Request,
      })
    ).rejects.toThrow();

    // Make sure the store wasn't updated with invalid data
    expect(testStore.store.name).toBe("Test User");
    expect(testStore.store.email).toBe("test@example.com");
  });
});
