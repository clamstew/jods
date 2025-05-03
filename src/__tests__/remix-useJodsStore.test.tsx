/** @jsxImportSource react */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { useJodsStore } from "../remix/useJodsStore";
import { defineStore } from "../remix/defineStore";
import { z } from "zod";
import * as React from "react";

// Define type and schema for the test store
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
  }),
});

// Mock defineStore
function mockDefineStore() {
  return defineStore({
    name: "testUser",
    schema: userSchema,
    defaults: {
      name: "Test User",
      email: "test@example.com",
      preferences: {
        theme: "light",
      },
    },
    handlers: {
      async updateName({ current, form }) {
        return {
          ...current,
          name: (form.get("name") as string) || current.name,
        };
      },
    },
  });
}

// Test component using useJodsStore
function TestComponent({ store }: { store: any }) {
  const userData = useJodsStore(store);

  return (
    <div>
      <div data-testid="name">{userData.name}</div>
      <div data-testid="email">{userData.email}</div>
      <div data-testid="theme">{userData.preferences.theme}</div>
      <button
        data-testid="update-name"
        onClick={() => {
          store.store.name = "Updated Name";
        }}
      >
        Update Name
      </button>
      <button
        data-testid="update-theme"
        onClick={() => {
          store.store.preferences.theme = "dark";
        }}
      >
        Update Theme
      </button>
    </div>
  );
}

describe("useJodsStore", () => {
  beforeEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("should render the initial state", () => {
    const testStore = mockDefineStore();
    render(<TestComponent store={testStore} />);

    expect(screen.getByTestId("name").textContent).toBe("Test User");
    expect(screen.getByTestId("email").textContent).toBe("test@example.com");
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("should update when store properties change", async () => {
    const testStore = mockDefineStore();
    render(<TestComponent store={testStore} />);

    // Update name
    await act(async () => {
      fireEvent.click(screen.getByTestId("update-name"));
    });

    expect(screen.getByTestId("name").textContent).toBe("Updated Name");

    // Email should remain unchanged
    expect(screen.getByTestId("email").textContent).toBe("test@example.com");
  });

  it("should update when nested properties change", async () => {
    const testStore = mockDefineStore();
    render(<TestComponent store={testStore} />);

    // Initial theme
    expect(screen.getByTestId("theme").textContent).toBe("light");

    // Update theme
    await act(async () => {
      fireEvent.click(screen.getByTestId("update-theme"));
    });

    expect(screen.getByTestId("theme").textContent).toBe("dark");

    // Other properties should remain unchanged
    expect(screen.getByTestId("name").textContent).toBe("Test User");
  });

  it("should update only properties that are used in the component", async () => {
    const testStore = mockDefineStore();

    // Create a spy to count renders
    const renderSpy = vi.fn();

    function SelectiveComponent() {
      const userData = useJodsStore(testStore);

      // This will be called on each render
      renderSpy();

      // Only use the name property
      return <div data-testid="selective-name">{userData.name}</div>;
    }

    render(<SelectiveComponent />);

    // Initial render
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Update name - should trigger re-render
    await act(async () => {
      testStore.store.name = "Changed Name";
    });

    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("selective-name").textContent).toBe(
      "Changed Name"
    );

    // Update theme - should NOT trigger re-render since the component doesn't use it
    await act(async () => {
      testStore.store.preferences.theme = "system";
    });

    // Render count should still be 2
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });
});
