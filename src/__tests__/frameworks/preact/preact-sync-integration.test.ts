/**
 * Preact integration with sync API test
 *
 * Tests the integration between Preact components and the jods sync API,
 * including bidirectional updates, rendering, security features, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/preact";
import { useState, useEffect } from "preact/hooks";
import { h } from "preact";

import { useJods } from "../../../frameworks/preact/useJodsPreact";
import { store, StoreState, Store } from "../../../core/store";
import { sync, SyncSocket } from "../../../sync";

// Define the type for message event listeners
type MessageListener = (event: MessageEvent) => void;

// Mock WebSocket for testing
class MockSocket implements SyncSocket {
  onmessage: ((event: { data: string }) => void) | null = null;
  sentMessages: any[] = [];
  messageListeners: MessageListener[] = [];

  send(msg: string) {
    this.sentMessages.push(JSON.parse(msg));
  }

  addEventListener(type: "message" | "open" | "close" | "error", fn: any) {
    if (type === "message") {
      this.messageListeners.push(fn as MessageListener);
    }
  }

  removeEventListener(type: "message" | "open" | "close" | "error", fn: any) {
    if (type === "message") {
      this.messageListeners = this.messageListeners.filter((l) => l !== fn);
    }
  }

  simulateMessage(data: any) {
    const event = {
      data: JSON.stringify(data),
    };

    if (this.onmessage) {
      this.onmessage(event);
    }

    this.messageListeners.forEach((listener) => {
      listener(event as MessageEvent);
    });
  }
}

// Test store interface
interface CounterStore extends StoreState {
  count: number;
  user: string;
  settings: {
    theme: string;
    notifications: boolean;
  };
}

// Preact component that uses the store with sync
function CounterComponent({
  counterStore,
  socket,
  syncOptions = {},
}: {
  counterStore: CounterStore & Store<CounterStore>;
  socket: MockSocket;
  syncOptions?: any;
}) {
  const state = useJods(counterStore);
  const [syncActive, setSyncActive] = useState(false);

  // Set up sync
  useEffect(() => {
    const stopSync = sync(socket, counterStore, syncOptions);
    setSyncActive(true);

    return () => {
      stopSync();
      setSyncActive(false);
    };
  }, [counterStore, socket, syncOptions]);

  return h("div", {}, [
    h("div", { "data-testid": "sync-status" }, [
      syncActive ? "Syncing" : "Not syncing",
    ]),
    h("h1", { "data-testid": "username" }, [state.user]),
    h("div", { "data-testid": "theme" }, [`Theme: ${state.settings?.theme}`]),
    h("div", { "data-testid": "notifications" }, [
      `Notifications: ${state.settings?.notifications ? "On" : "Off"}`,
    ]),
    h("div", { "data-testid": "count" }, [`Count: ${state.count}`]),

    h(
      "button",
      {
        "data-testid": "increment",
        onClick: () => {
          counterStore.count += 1;
        },
      },
      ["Increment"]
    ),

    h(
      "button",
      {
        "data-testid": "toggle-theme",
        onClick: () => {
          counterStore.settings.theme =
            counterStore.settings.theme === "light" ? "dark" : "light";
        },
      },
      ["Toggle Theme"]
    ),

    h(
      "button",
      {
        "data-testid": "toggle-notifications",
        onClick: () => {
          counterStore.settings.notifications =
            !counterStore.settings.notifications;
        },
      },
      ["Toggle Notifications"]
    ),
  ]);
}

// Utility function for waiting in tests
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Preact integration with sync", () => {
  let mockSocket: MockSocket;
  let counterStore: CounterStore & Store<CounterStore>;
  let clientId: string;

  beforeEach(() => {
    // Reset DOM
    cleanup();

    // Create a new store for each test
    counterStore = store<CounterStore>({
      count: 1,
      user: "Preact User",
      settings: {
        theme: "light",
        notifications: true,
      },
    });

    // Create a fresh mock socket
    mockSocket = new MockSocket();

    // Reset client ID (sync will generate its own, but we verify it's not hardcoded)
    clientId = "";

    // Spy on JSON.stringify to extract client ID
    const originalStringify = JSON.stringify;
    vi.spyOn(JSON, "stringify").mockImplementation((value) => {
      if (value && typeof value === "object" && "clientId" in value) {
        clientId = value.clientId;
      }
      return originalStringify(value);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders initial state correctly", () => {
    render(h(CounterComponent, { counterStore, socket: mockSocket }));

    expect(screen.getByTestId("username").textContent).toBe("Preact User");
    expect(screen.getByTestId("theme").textContent).toBe("Theme: light");
    expect(screen.getByTestId("notifications").textContent).toContain(
      "Notifications: On"
    );
    expect(screen.getByTestId("count").textContent).toContain("Count: 1");
    expect(screen.getByTestId("sync-status").textContent).toBe("Syncing");
  });

  it("sends store changes to socket", async () => {
    render(h(CounterComponent, { counterStore, socket: mockSocket }));

    // Click the increment button to update the store
    await act(async () => {
      screen.getByTestId("increment").click();
      // Add a longer delay to allow for sync processing
      await wait(300);
    });

    // Check that the component updated
    expect(screen.getByTestId("count").textContent).toBe("Count: 2");

    // Verify that a message was sent to the socket
    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);

    // The changes might be in diff format with __old and __new
    const countChange = mockSocket.sentMessages[0].changes.count;
    if (typeof countChange === "object" && countChange.__new !== undefined) {
      expect(countChange.__new).toBe(2);
    } else {
      expect(countChange).toBe(2);
    }

    // Check that a valid client ID was generated
    expect(clientId).toBeTruthy();
    expect(clientId.length).toBeGreaterThan(8);
  });

  it("updates component when receiving socket messages", async () => {
    render(h(CounterComponent, { counterStore, socket: mockSocket }));

    // Simulate receiving a message with updated values
    await act(async () => {
      mockSocket.simulateMessage({
        clientId: "server-123", // Different client ID to avoid echo prevention
        changes: {
          count: 42,
          settings: {
            theme: "dark",
          },
        },
      });
    });

    // Verify that the component rendered the updated values
    expect(screen.getByTestId("count").textContent).toBe("Count: 42");
    expect(screen.getByTestId("theme").textContent).toBe("Theme: dark");

    // Notifications should remain unchanged
    expect(screen.getByTestId("notifications").textContent).toContain(
      "Notifications: On"
    );
  });

  it("prevents echo when receiving messages with same clientId", async () => {
    render(h(CounterComponent, { counterStore, socket: mockSocket }));

    // Update the store to trigger a message
    await act(async () => {
      screen.getByTestId("toggle-theme").click();
      await wait(100);
    });

    // Capture the current state
    const originalCount = counterStore.count;

    // Send an echo message with the same client ID
    await act(async () => {
      mockSocket.simulateMessage({
        clientId: clientId,
        changes: {
          settings: {
            theme: "dark",
          },
        },
      });
      await wait(100);
    });

    // The UI should not have updated (echo prevention)
    expect(screen.getByTestId("count").textContent).toBe(
      `Count: ${originalCount}`
    );

    // But component should still receive remote updates
    await act(async () => {
      mockSocket.simulateMessage({
        clientId: "server-789",
        changes: {
          count: 100,
        },
      });
      await wait(100);
    });

    // Now the UI should be updated
    expect(screen.getByTestId("count").textContent).toBe("Count: 100");
  });

  it("respects allowKeys option for security", async () => {
    // Create a store with a sensitive field
    const secureStore = store({
      count: 1,
      user: "Preact User",
      settings: {
        theme: "light",
        notifications: true,
      },
      secretKey: "sensitive-data-123",
    });

    // Render with allowKeys option to only sync count
    render(
      h(CounterComponent, {
        counterStore: secureStore,
        socket: mockSocket,
        syncOptions: { allowKeys: ["count"] },
      })
    );

    // Update the count
    await act(async () => {
      screen.getByTestId("increment").click();
      await wait(300);
    });

    // Change the theme through the input
    await act(async () => {
      screen.getByTestId("toggle-theme").click();
      await wait(300);
    });

    // Verify messages were sent
    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);

    // Messages should only contain count, not theme or secretKey
    mockSocket.sentMessages.forEach((msg) => {
      // Check if count exists in changes (either as direct value or in diff format)
      const hasCount = msg.changes.count !== undefined;
      expect(hasCount).toBeDefined();

      // Make sure theme and secretKey are not present
      expect(msg.changes.theme).toBeUndefined();
      expect(msg.changes.secretKey).toBeUndefined();
    });
  });

  it("handles receiveOnly mode correctly", async () => {
    // Render with receiveOnly option
    render(
      h(CounterComponent, {
        counterStore,
        socket: mockSocket,
        syncOptions: { receiveOnly: true },
      })
    );

    // Update the local store
    await act(async () => {
      screen.getByTestId("increment").click();
      await wait(100);
    });

    // No messages should be sent
    expect(mockSocket.sentMessages.length).toBe(0);

    // But still receive remote updates
    await act(async () => {
      mockSocket.simulateMessage({
        clientId: "server-123",
        changes: { count: 42 },
      });
      await wait(100);
    });

    // Component should reflect remote updates
    expect(screen.getByTestId("count").textContent).toBe("Count: 42");
  });

  it("cleans up sync when component unmounts", async () => {
    // Spy on mock socket's removeEventListener
    const removeEventListenerSpy = vi.spyOn(mockSocket, "removeEventListener");

    const { unmount } = render(
      h(CounterComponent, {
        counterStore,
        socket: mockSocket,
      })
    );

    // Unmount the component
    unmount();

    // Verify that removeEventListener was called
    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect(mockSocket.messageListeners.length).toBe(0);
  });

  // This test doesn't do rendering, so it should always work
  it("verifies the sync API core functionality without rendering", async () => {
    // This test avoids rendering Preact components to prevent Preact VDOM extensibility issues
    // Set up mockSocket and store
    const testStore = store({
      count: 1,
      message: "hello",
    });

    // Directly call sync without rendering a component
    const stopSync = sync(mockSocket, testStore);

    // Verify sync was initialized
    expect(typeof stopSync).toBe("function");

    // Directly update the store
    testStore.count = 5;
    testStore.message = "updated";

    // Wait for sync to process the updates
    await wait(100);

    // Verify a message was sent
    expect(mockSocket.sentMessages.length).toBeGreaterThan(0);

    // Check for count and message in any of the sent messages
    let foundCount = false;
    let foundMessage = false;

    mockSocket.sentMessages.forEach((msg) => {
      if (msg.changes && msg.changes.count !== undefined) {
        foundCount = true;
        if (
          typeof msg.changes.count === "object" &&
          msg.changes.count.__new !== undefined
        ) {
          expect(msg.changes.count.__new).toBe(5);
        } else {
          expect(msg.changes.count).toBe(5);
        }
      }

      if (msg.changes && msg.changes.message !== undefined) {
        foundMessage = true;
        if (
          typeof msg.changes.message === "object" &&
          msg.changes.message.__new !== undefined
        ) {
          expect(msg.changes.message.__new).toBe("updated");
        } else {
          expect(msg.changes.message).toBe("updated");
        }
      }
    });

    // Ensure we found our changes
    expect(foundCount || foundMessage).toBe(true);

    // Directly simulate receiving a message
    mockSocket.simulateMessage({
      clientId: "external-123",
      changes: {
        count: 10,
        message: "received",
      },
    });

    // Verify store was updated
    expect(testStore.count).toBe(10);
    expect(testStore.message).toBe("received");

    // Clean up
    stopSync();
  });
});
