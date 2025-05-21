/**
 * Connection status tracking for sync API
 *
 * This utility allows real-time monitoring of sync connection status
 * and provides hooks for UI components to display connection state.
 */

// Connection status enum
export enum SyncConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

/**
 * SyncStatusTracker provides utilities for tracking and reacting to
 * connection status changes in the sync API.
 */
export class SyncStatusTracker {
  private status: SyncConnectionStatus = SyncConnectionStatus.DISCONNECTED;
  private listeners = new Set<(status: SyncConnectionStatus) => void>();

  /**
   * Get the current connection status
   */
  getStatus(): SyncConnectionStatus {
    return this.status;
  }

  /**
   * Update the connection status and notify all listeners
   */
  setStatus(newStatus: SyncConnectionStatus): void {
    if (this.status === newStatus) return;

    this.status = newStatus;
    this.notifyListeners();
  }

  /**
   * Register a listener for status changes
   * @returns Function to unregister the listener
   */
  onStatusChange(listener: (status: SyncConnectionStatus) => void): () => void {
    this.listeners.add(listener);

    // Immediately call with current status
    listener(this.status);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all registered listeners about the current status
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (error) {
        console.error("Error in sync status listener:", error);
      }
    });
  }

  /**
   * Create a formatted string representation of the current status
   */
  toString(): string {
    switch (this.status) {
      case SyncConnectionStatus.CONNECTED:
        return "🟢 Connected";
      case SyncConnectionStatus.CONNECTING:
        return "🟡 Connecting...";
      case SyncConnectionStatus.DISCONNECTED:
        return "⚪ Disconnected";
      case SyncConnectionStatus.ERROR:
        return "🔴 Connection Error";
      default:
        return `Unknown status: ${this.status}`;
    }
  }
}

/**
 * Create a new sync status tracker instance
 */
export function createSyncStatusTracker(): SyncStatusTracker {
  return new SyncStatusTracker();
}
