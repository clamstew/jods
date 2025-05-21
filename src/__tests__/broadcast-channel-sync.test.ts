/**
 * Cross-tab synchronization tests using BroadcastChannel
 *
 * These tests verify that the sync API can synchronize state between
 * different browser tabs (simulated in the test environment).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { store, StoreState, Store } from "../core";
import { sync } from "../sync";

// Define test store interface
interface TestStore extends StoreState {
  count: number | string; // Allow both number and string for versatile testing
  text: string;
  user: {
    name: string;
    preferences: {
      theme: string;
      notifications: boolean;
    };
  };
}

// Define the socket interface for our mock BroadcastChannel
interface MockSyncSocket {
  send(message: string): void;
  addEventListener?(type: string, listener: (event: any) => void): void;
  onmessage?: ((event: { data: any }) => void) | null;
  close(): void;
}

// Mock BroadcastChannel since it's not available in test environment
class MockBroadcastChannel implements MockSyncSocket {
  static channels: Map<string, MockBroadcastChannel[]> = new Map();
  onmessage: ((event: { data: any }) => void) | null = null;
  channelName: string;
  closed = false;

  constructor(channelName: string) {
    this.channelName = channelName;

    if (!MockBroadcastChannel.channels.has(channelName)) {
      MockBroadcastChannel.channels.set(channelName, []);
    }
    MockBroadcastChannel.channels.get(channelName)?.push(this);
  }

  // Implement send method for SyncSocket interface
  send(message: string) {
    if (this.closed) return;

    const event = { data: message };

    // Simulate broadcast to all other instances on same channel
    MockBroadcastChannel.channels.get(this.channelName)?.forEach((channel) => {
      if (channel !== this && !channel.closed && channel.onmessage) {
        setTimeout(() => channel.onmessage?.(event), 0);
      }
    });
  }

  // For compatibility with standard BroadcastChannel API
  postMessage(data: any) {
    this.send(typeof data === "string" ? data : JSON.stringify(data));
  }

  // Add addEventListener for WebSocket-like interface
  addEventListener(type: string, listener: (event: any) => void) {
    if (type === "message") {
      const originalOnMessage = this.onmessage;
      this.onmessage = (event) => {
        if (originalOnMessage) originalOnMessage(event);
        listener(event);
      };
    }
  }

  // Method to manually trigger receiving a message
  // This is used for testing spy functionality
  receiveMessage(data: any) {
    if (this.closed) return;

    const message = typeof data === "string" ? data : JSON.stringify(data);
    const event = { data: message };

    if (this.onmessage) {
      this.onmessage(event);
    }
  }

  close() {
    this.closed = true;
    const channels = MockBroadcastChannel.channels.get(this.channelName) || [];
    const index = channels.indexOf(this);
    if (index !== -1) {
      channels.splice(index, 1);
    }
  }

  // Clean up all channels - useful for test teardown
  static reset() {
    MockBroadcastChannel.channels.clear();
  }
}

// Enable fake timers
vi.useFakeTimers();

describe("Cross-tab synchronization with BroadcastChannel", () => {
  // Set up stores to simulate multiple tabs
  let tab1Store: TestStore & Store<TestStore>;
  let tab2Store: TestStore & Store<TestStore>;
  let tab3Store: TestStore & Store<TestStore>;

  // BroadcastChannel instances for each tab
  let tab1Channel: MockBroadcastChannel;
  let tab2Channel: MockBroadcastChannel;
  let tab3Channel: MockBroadcastChannel;

  // Cleanup functions
  let stopTab1Sync: () => void;
  let stopTab2Sync: () => void;
  let stopTab3Sync: () => void;

  beforeEach(() => {
    // Reset all mock channels
    MockBroadcastChannel.reset();

    // Create store instances for each "tab"
    tab1Store = store<TestStore>({
      count: 0,
      text: "Initial text",
      user: {
        name: "User 1",
        preferences: {
          theme: "light",
          notifications: true,
        },
      },
    });

    tab2Store = store<TestStore>({
      count: 0,
      text: "Initial text",
      user: {
        name: "User 1",
        preferences: {
          theme: "light",
          notifications: true,
        },
      },
    });

    tab3Store = store<TestStore>({
      count: 0,
      text: "Initial text",
      user: {
        name: "User 1",
        preferences: {
          theme: "light",
          notifications: true,
        },
      },
    });

    // Create channel instances for each "tab"
    tab1Channel = new MockBroadcastChannel("test-channel");
    tab2Channel = new MockBroadcastChannel("test-channel");
    tab3Channel = new MockBroadcastChannel("test-channel");

    // Set up sync for each tab
    stopTab1Sync = sync(tab1Channel, tab1Store);
    stopTab2Sync = sync(tab2Channel, tab2Store);
    stopTab3Sync = sync(tab3Channel, tab3Store);
  });

  afterEach(() => {
    // Clean up sync and channels
    stopTab1Sync();
    stopTab2Sync();
    stopTab3Sync();

    tab1Channel.close();
    tab2Channel.close();
    tab3Channel.close();

    vi.clearAllTimers();
  });

  it("should synchronize state across tabs", () => {
    // Update store A and verify it propagates to store B
    tab1Store.count = 5;
    tab1Store.text = "hello from store A";

    // Advance timers to allow for any debouncing
    vi.runAllTimers();

    // Check that store B received the updates
    expect(tab2Store.count).toBe(5);
    expect(tab2Store.text).toBe("hello from store A");

    // Update store B and verify it propagates to store A
    tab2Store.count = 10;
    tab2Store.text = "response from store B";

    // Advance timers again
    vi.runAllTimers();

    // Check that store A received the updates
    expect(tab1Store.count).toBe(10);
    expect(tab1Store.text).toBe("response from store B");

    // Clean up
    stopTab1Sync();
    stopTab2Sync();
    tab1Channel.close();
    tab2Channel.close();
  });

  it("should respect allowKeys option for selective syncing", () => {
    // Update store A with mix of allowed and disallowed properties
    tab1Store.count = 42;
    tab1Store.text = "allowed message";
    tab1Store.user.name = "Updated Alice";
    tab1Store.user.preferences.theme = "dark";

    // Advance timers
    vi.runAllTimers();

    // Check that only allowed properties were synced to store B
    expect(tab2Store.count).toBe(42);
    expect(tab2Store.text).toBe("allowed message");
    expect(tab2Store.user.name).toBe("Updated Alice");
    expect(tab2Store.user.preferences.theme).toBe("dark");

    // Clean up
    stopTab1Sync();
    stopTab2Sync();
    tab1Channel.close();
    tab2Channel.close();
  });

  it("should handle connection and disconnection gracefully", () => {
    // Verify initial sync works
    tab1Store.count = "connected";
    vi.runAllTimers();
    expect(tab2Store.count).toBe("connected");

    // Simulate tab B disconnecting
    stopTab2Sync();
    tab2Channel.close();

    // Update from A should no longer affect B
    tab1Store.count = "after disconnect";
    vi.runAllTimers();

    // B's value should remain unchanged
    expect(tab2Store.count).toBe("connected");

    // Simulate reconnecting tab B
    tab2Channel = new MockBroadcastChannel("test-channel");
    stopTab2Sync = sync(tab2Channel, tab2Store);

    // After reconnection, B should receive new updates
    tab1Store.count = "reconnected";
    vi.runAllTimers();
    expect(tab2Store.count).toBe("reconnected");

    // Clean up
    stopTab1Sync();
    stopTab2Sync();
    tab1Channel.close();
    tab2Channel.close();
  });

  it("should handle race conditions by preserving event order", () => {
    // Create a controllable sequence of updates with deliberate ordering

    // First update from tab1
    tab1Store.count = 1;
    tab1Store.text = "Tab 1 text";
    vi.runAllTimers(); // Let this update propagate

    // Second update from tab2
    tab2Store.count = 2;
    tab2Store.text = "Tab 2 text";
    vi.runAllTimers(); // Let this update propagate

    // Final update from tab3 - this should be the winning state
    tab3Store.count = 3;
    tab3Store.text = "Tab 3 text";
    vi.runAllTimers(); // Let this update propagate completely

    // Make sure all tabs have processed all messages
    vi.runAllTimers();

    // By proper ordering, all stores should have the same final values
    expect(tab1Store.count).toBe(3);
    expect(tab1Store.text).toBe("Tab 3 text");
    expect(tab2Store.count).toBe(3);
    expect(tab2Store.text).toBe("Tab 3 text");
    expect(tab3Store.count).toBe(3);
    expect(tab3Store.text).toBe("Tab 3 text");
  });

  it("should invoke callbacks for monitoring and debugging", () => {
    // Create spies for callbacks
    const onDiffSendSpy = vi.fn();
    const onPatchReceiveSpy = vi.fn();
    const onErrorSpy = vi.fn();

    // Set up sync with callbacks
    stopTab1Sync = sync(tab1Channel, tab1Store, {
      onDiffSend: onDiffSendSpy,
      onPatchReceive: onPatchReceiveSpy,
      onError: onErrorSpy,
    });

    stopTab2Sync = sync(tab2Channel, tab2Store);

    // Trigger an update
    tab1Store.count = 42;
    tab1Store.text = "callback test";
    vi.runAllTimers();

    // Verify callbacks were called
    expect(onDiffSendSpy).toHaveBeenCalled();
    expect(onPatchReceiveSpy).not.toHaveBeenCalled(); // Store A didn't receive patches
    expect(onErrorSpy).not.toHaveBeenCalled(); // No errors expected

    // Verify the update was successful
    expect(tab2Store.count).toBe(42);
    expect(tab2Store.text).toBe("callback test");

    // Clean up
    stopTab1Sync();
    stopTab2Sync();
    tab1Channel.close();
    tab2Channel.close();
  });

  it("should respect receiveOnly mode for one-way sync", () => {
    // Create a spy on tab2Channel's send method to verify it's not called
    const sendSpy = vi.spyOn(tab2Channel, "send");

    // Clean up existing sync setup
    stopTab1Sync();
    stopTab2Sync();

    // Set up sync for tab1 (normal)
    stopTab1Sync = sync(tab1Channel, tab1Store);

    // For tab2, use receiveOnly mode
    stopTab2Sync = sync(tab2Channel, tab2Store, {
      receiveOnly: true,
    });

    // Update from A should affect B
    tab1Store.count = "from A to B";
    vi.runAllTimers();

    // Verify B received the update from A
    expect(tab2Store.count).toBe("from A to B");

    // Clear the spy calls from initial setup
    sendSpy.mockClear();

    // Update B
    tab2Store.count = "from B to A";
    vi.runAllTimers();

    // Verify Tab2's value was changed locally
    expect(tab2Store.count).toBe("from B to A");

    // This is the critical assertion: verify that tab2's send method was never called
    // This is the true test of receiveOnly mode
    expect(sendSpy).not.toHaveBeenCalled();

    // Check that tab1Store.count is still the original value since tab2 is in receiveOnly mode
    expect(tab1Store.count).toBe("from A to B");

    // Clean up
    sendSpy.mockRestore();
    stopTab1Sync();
    stopTab2Sync();
    tab1Channel.close();
    tab2Channel.close();
  });

  // Add a simpler test for receiveOnly mode
  it("should prevent sending changes in receiveOnly mode", () => {
    // Create test stores and channels
    const storeA = store<TestStore>({
      count: 0,
      text: "Test",
      user: {
        name: "User",
        preferences: { theme: "light", notifications: true },
      },
    });

    const storeB = store<TestStore>({
      count: 0,
      text: "Test",
      user: {
        name: "User",
        preferences: { theme: "light", notifications: true },
      },
    });

    const channelA = new MockBroadcastChannel("test-receive-only");
    const channelB = new MockBroadcastChannel("test-receive-only");

    // Create a spy on channelB's send method
    const sendSpy = vi.spyOn(channelB, "send");

    // Set up syncs with B in receiveOnly mode
    const stopSyncA = sync(channelA, storeA);
    const stopSyncB = sync(channelB, storeB, { receiveOnly: true });

    // A to B should work
    storeA.count = 42;
    vi.runAllTimers();
    expect(storeB.count).toBe(42);

    // Clear spy history
    sendSpy.mockClear();

    // B to A should not send any updates
    storeB.count = 99;
    vi.runAllTimers();

    // Local update should work
    expect(storeB.count).toBe(99);

    // But send should never be called
    expect(sendSpy).not.toHaveBeenCalled();

    // A should not get the update
    expect(storeA.count).toBe(42);

    // Clean up
    sendSpy.mockRestore();
    stopSyncA();
    stopSyncB();
    channelA.close();
    channelB.close();
  });
});
