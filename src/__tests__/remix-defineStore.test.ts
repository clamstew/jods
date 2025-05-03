import { describe, it, expect, vi } from "vitest";
import { defineStore } from "../remix/defineStore";
import { onUpdate } from "../index";
import { z } from "zod";

// Mock the Request and FormData
class MockRequest {
  private _formData: any;

  constructor(formData: any = {}) {
    this._formData = formData;
  }

  async formData() {
    // Convert simple object to FormData structure
    const formData = new FormData();

    for (const [key, value] of Object.entries(this._formData)) {
      formData.append(key, value as string);
    }

    return formData;
  }
}

// Helper to create a store for testing
function createTestStore() {
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
    settings: z.object({
      theme: z.enum(["light", "dark", "system"]).default("system"),
      notifications: z.boolean().default(true),
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
    const state = testStore.getState();
    expect(state.name).toBe("New User Name");
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

    // Check that state was updated correctly
    const state = testStore.getState();
    expect(state.settings.theme).toBe("dark");

    // Notification setting should still be the same
    expect(state.settings.notifications).toBe(true);

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

    // Should throw validation error
    await expect(
      testStore.action({
        request: mockRequest as unknown as Request,
      })
    ).rejects.toThrow();
  });
});
