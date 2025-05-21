import { Store, StoreState } from "../core/store";
import { debug } from "../utils/debug";
import { sync } from "./core";
import { SyncOptions, SyncSocket, SyncConnectionStatus } from "./types";

// Helper function to create a sync connection status hook
export function createSyncStatusTracker() {
  let status = SyncConnectionStatus.DISCONNECTED;
  const listeners = new Set<(status: SyncConnectionStatus) => void>();

  return {
    getStatus: () => status,

    setStatus: (newStatus: SyncConnectionStatus) => {
      status = newStatus;
      listeners.forEach((listener) => {
        try {
          listener(status);
        } catch (e) {
          console.error("Error in sync status listener:", e);
        }
      });
    },

    onStatusChange: (listener: (status: SyncConnectionStatus) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Create a one-liner sync for BroadcastChannel
export function syncWithBroadcastChannel<T extends StoreState>(
  store: T & Partial<Store<T>>,
  channelName: string,
  options: Omit<SyncOptions<T>, "autoReconnect"> = {}
): () => void {
  // Create BroadcastChannel
  const channel = new BroadcastChannel(channelName);

  // Create an adapter that implements SyncSocket
  const channelAdapter: SyncSocket = {
    send: (msg: string) => {
      // Don't send if in receiveOnly mode
      if (options.receiveOnly) {
        debug.log("sync", "Not sending message due to receiveOnly mode");
        return;
      }
      channel.postMessage(msg);
    },
    onmessage: null,
    addEventListener: (type, listener) => {
      channel.addEventListener(type, listener);
    },
    removeEventListener: (type, listener) => {
      channel.removeEventListener(type, listener);
    },
  };

  // Set up sync with auto-reconnect disabled (BroadcastChannel handles this)
  const stopSync = sync(channelAdapter, store, {
    ...options,
    autoReconnect: false,
    onError: (err) => {
      console.error(`BroadcastChannel sync error:`, err);
      if (options.onError) options.onError(err);
    },
  });

  // Return a function that stops sync and closes the channel
  return () => {
    stopSync();
    channel.close();
  };
}
