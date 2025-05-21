import { describe, it, expect, vi } from "vitest";
import { store } from "../../core/store";
import { sync } from "../../sync";
import { patch } from "../../sync/patch";

/**
 * Helper to create a test socket for testing sync functionality
 */
function createTestSocket() {
  let messageHandler: ((event: { data: string }) => void) | null = null;

  const socket = {
    send: vi.fn(),
    onmessage: null as ((event: { data: string }) => void) | null,
    addEventListener: vi.fn(
      (
        type: "message" | string,
        handler: (event: { data: string }) => void
      ) => {
        if (type === "message") messageHandler = handler;
      }
    ),
    removeEventListener: vi.fn(),
    readyState: 1, // Open
    // Utility method to simulate receiving a message
    simulateMessage(data: unknown) {
      if (messageHandler) {
        messageHandler({
          data: typeof data === "string" ? data : JSON.stringify(data),
        });
      } else if (socket.onmessage) {
        socket.onmessage({
          data: typeof data === "string" ? data : JSON.stringify(data),
        });
      }
    },
  };

  return socket;
}

/**
 * Helper class for testing store-like objects
 */
class FakeStore {
  state: any;
  listeners: ((state: any, oldState: any) => void)[];

  constructor(initial: any) {
    this.state = initial;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(cb: (state: any, oldState: any) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  setState(newState: any) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((cb) => cb(this.state, oldState));
  }

  // Add a helper method to handle the special diff format
  patchState(changes: any) {
    const oldState = { ...this.state };
    const newState = { ...this.state };

    for (const key in changes) {
      const value = changes[key];

      // Handle the diff format
      if (value && typeof value === "object" && "__new" in value) {
        newState[key] = value.__new;
      } else if (value === null) {
        delete newState[key];
      } else if (value !== undefined) {
        newState[key] = value;
      }
    }

    this.state = newState;
    this.listeners.forEach((cb) => cb(this.state, oldState));
  }
}

describe("sync", () => {
  // Tests using the JODS store and the test socket
  describe("with JODS store", () => {
    it("should send local changes over socket", async () => {
      const s = store({ count: 0 });
      const socket = createTestSocket();
      sync(socket, s);

      s.count = 1;

      // Wait for the debounce
      await new Promise((r) => setTimeout(r, 150));

      expect(socket.send).toHaveBeenCalled();
      const sentData = JSON.parse(socket.send.mock.calls[0][0]);
      expect(sentData).toHaveProperty("clientId");
      expect(sentData.changes.count).toHaveProperty("__new", 1);
    });

    it("should apply incoming patches from socket", () => {
      const s = store({ count: 0 });
      const socket = createTestSocket();
      sync(socket, s);

      socket.simulateMessage({
        clientId: "remote-id",
        changes: { count: 5 },
      });

      expect(s.count).toBe(5);
    });

    it("should debounce local updates before syncing", async () => {
      const s = store({ msg: "hi" });
      const socket = createTestSocket();
      sync(socket, s, { throttleMs: 100 });

      s.msg = "hey";
      s.msg = "hello";

      await new Promise((r) => setTimeout(r, 150));

      expect(socket.send).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(socket.send.mock.calls[0][0]);
      expect(sentData.changes.msg).toHaveProperty("__new", "hello");
    });

    it("should ignore messages from self (no echo)", async () => {
      const s = store({ value: 10 });
      const socket = createTestSocket();
      const unsubscribe = sync(socket, s);

      s.value = 20;

      await new Promise((r) => setTimeout(r, 150));

      const sentData = JSON.parse(socket.send.mock.calls[0][0]);
      const clientId = sentData.clientId;

      // Reset the value
      s.value = 10;
      await new Promise((r) => setTimeout(r, 150));

      // Use the same clientId as the local sync
      socket.simulateMessage({
        clientId,
        changes: { value: 30 },
      });

      // Should ignore the update with our own clientId
      expect(s.value).toBe(10);

      unsubscribe();
    });

    it("should use the filter option to selectively sync", async () => {
      const s = store({ public: "hello", private: "secret" });
      const socket = createTestSocket();

      const filter = (changes: any) => !("private" in changes);
      sync(socket, s, { filter });

      s.public = "world";
      await new Promise((r) => setTimeout(r, 150));

      // Should send the public change
      expect(socket.send).toHaveBeenCalledTimes(1);

      // Reset mock
      socket.send.mockReset();

      s.private = "classified";
      await new Promise((r) => setTimeout(r, 150));

      // Should not send the private change
      expect(socket.send).not.toHaveBeenCalled();
    });

    it("should support allowKeys option for security", async () => {
      const s = store({ safe: "public", sensitive: "token" });
      const socket = createTestSocket();

      sync(socket, s, { allowKeys: ["safe"] });

      // Change both properties
      s.safe = "updated";
      s.sensitive = "new-token";

      await new Promise((r) => setTimeout(r, 150));

      // Should only include allowed keys
      const sentData = JSON.parse(socket.send.mock.calls[0][0]);
      expect(sentData.changes.safe).toHaveProperty("__new", "updated");
      expect(sentData.changes).not.toHaveProperty("sensitive");
    });

    it("should support receiveOnly mode", async () => {
      const s = store({ value: "initial" });
      const socket = createTestSocket();

      sync(socket, s, { receiveOnly: true });

      s.value = "changed";
      await new Promise((r) => setTimeout(r, 150));

      // Should not send any updates in receiveOnly mode
      expect(socket.send).not.toHaveBeenCalled();

      // But should still receive updates
      socket.simulateMessage({
        clientId: "remote",
        changes: { value: "remote-change" },
      });

      expect(s.value).toBe("remote-change");
    });

    it("should call onDiffSend and onPatchReceive callbacks", async () => {
      const s = store({ counter: 0 });
      const socket = createTestSocket();

      const onDiffSend = vi.fn();
      const onPatchReceive = vi.fn();

      sync(socket, s, { onDiffSend, onPatchReceive });

      s.counter = 5;
      await new Promise((r) => setTimeout(r, 150));

      expect(onDiffSend).toHaveBeenCalledTimes(1);

      socket.simulateMessage({
        clientId: "remote",
        changes: { counter: 10 },
      });

      expect(onPatchReceive).toHaveBeenCalledTimes(1);
      expect(s.counter).toBe(10);
    });

    it("should properly clean up listeners on unsubscribe", () => {
      const s = store({ test: true });
      const socket = createTestSocket();

      const unsubscribe = sync(socket, s);

      expect(socket.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function)
      );

      unsubscribe();

      expect(socket.removeEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function)
      );
    });
  });

  // Tests with the FakeStore class
  describe("with fake store", () => {
    it("should send changes from local store to socket", async () => {
      const s = new FakeStore({ count: 0, text: "foo" });
      const socket = createTestSocket();

      sync(socket, s);
      s.setState({ count: 1 });

      // Wait for the debounce
      await new Promise((r) => setTimeout(r, 150));

      expect(socket.send).toHaveBeenCalled();
      const sentData = JSON.parse(socket.send.mock.calls[0][0]);
      expect(sentData).toHaveProperty("clientId");
      expect(sentData.changes.count).toHaveProperty("__new", 1);
    });

    it("should apply incoming changes to local store", () => {
      const s = new FakeStore({ a: 1, b: 2 });
      const socket = createTestSocket();

      sync(socket, s);

      // Simulate a message event
      socket.simulateMessage({
        clientId: "other",
        changes: { a: 5 },
      });

      expect(s.state).toEqual({ a: 5, b: 2 });
    });

    it("should ignore messages with own clientId", async () => {
      const s = new FakeStore({ x: 1 });
      const socket = createTestSocket();

      sync(socket, s);
      s.setState({ x: 2 });

      // Wait for the debounce
      await new Promise((r) => setTimeout(r, 150));

      const sentData = JSON.parse(socket.send.mock.calls[0][0]);
      const clientId = sentData.clientId;

      socket.simulateMessage({
        clientId,
        changes: { x: 3 },
      });

      // Should not apply changes from self
      expect(s.state).toEqual({ x: 2 });
    });

    it("should respect filter option", async () => {
      const s = new FakeStore({ p: 10, q: 20 });
      const socket = createTestSocket();

      const filter = (changes: any) => !("q" in changes);
      sync(socket, s, { filter });

      s.setState({ p: 11 });

      // Wait for the debounce
      await new Promise((r) => setTimeout(r, 150));

      expect(socket.send).toHaveBeenCalledTimes(1);

      // Reset the mock
      socket.send.mockReset();

      s.setState({ q: 21 });

      // Wait for the debounce
      await new Promise((r) => setTimeout(r, 150));

      // Should not send changes for q
      expect(socket.send).not.toHaveBeenCalled();
    });
  });

  // Tests for patch function
  describe("patch", () => {
    it("should modify object in-place", () => {
      const obj = { a: 1, b: 2 };
      const result = patch(obj, { a: 3 });

      expect(result).toBe(obj); // Same reference
      expect(obj).toEqual({ a: 3, b: 2 });
    });

    it("should handle deletions with null values", () => {
      const obj = { x: 1, y: 2, z: 3 };
      patch(obj, { y: null });

      expect(obj).toEqual({ x: 1, z: 3 });
      expect("y" in obj).toBe(false);
    });

    it("should skip undefined values", () => {
      const obj = { a: 1, b: 2 };
      patch(obj, { a: undefined, b: 3 });

      expect(obj).toEqual({ a: 1, b: 3 });
    });

    it("should handle empty or invalid changes", () => {
      const obj = { a: 1 };

      // Empty object
      patch(obj, {});
      expect(obj).toEqual({ a: 1 });

      // Null
      patch(obj, null as any);
      expect(obj).toEqual({ a: 1 });

      // Undefined
      patch(obj, undefined as any);
      expect(obj).toEqual({ a: 1 });
    });
  });
});
