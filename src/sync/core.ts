import { Store, StoreState } from "../core/store";
import { diff } from "../core/diff";
import { patch, Changes } from "./patch";
import { json } from "../core/json";
import { debug } from "../utils/debug";
import { onUpdate } from "../core/life-cycle/on-update";
import {
  SyncMessage,
  SyncSocket,
  SyncConnectionStatus,
  SyncOptions,
} from "./types";

/**
 * Bidirectional syncing of store state with a socket-like channel.
 * Detects local changes and sends them to the remote, while
 * also applying incoming changes from the remote to the local store.
 *
 * @example
 * ```ts
 * // Create a store
 * const store = { count: 0, user: { name: 'John' } };
 *
 * // Connect to WebSocket
 * const socket = new WebSocket('wss://example.com');
 *
 * // Set up sync with default options
 * const unsubscribe = sync(socket, store);
 *
 * // Later, clean up when done
 * unsubscribe();
 * ```
 *
 * @param socket - Socket-like object with send() and onmessage
 * @param store - JODS store to sync
 * @param options - Configuration options
 * @returns Cleanup function that stops syncing and removes listeners
 */
export function sync<T extends StoreState>(
  socket: SyncSocket,
  store: T & Partial<Store<T>>,
  options: SyncOptions<T> = {}
): () => void {
  // Basic setup
  const clientId = Math.random().toString(36).substring(2);
  let lastSnapshot = json(store);
  let queued = false;
  let batchTimeout: ReturnType<typeof setTimeout> | null = null;
  let batchedChanges: Changes<T> | null = null;
  let connectionStatus = SyncConnectionStatus.DISCONNECTED;
  let reconnectAttempts = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Configuration values
  const throttleMs = options.throttle ?? 100;
  const maxMessageSize = options.maxMessageSize ?? 1048576; // 1MB default
  const batchUpdates = options.batchUpdates ?? false;
  const batchTimeWindow = options.batchTimeWindow ?? 300;
  const autoReconnect = options.autoReconnect ?? true;
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  const reconnectDelay = options.reconnectDelay ?? 1000;
  const prefix = options.prefix || "jods-sync";

  // Initialize
  let isActive = true;

  // Update and notify about connection status changes
  const setConnectionStatus = (status: SyncConnectionStatus) => {
    if (connectionStatus === status) return;

    connectionStatus = status;
    debug.log("sync", `Connection status changed to: ${status}`);

    if (options.onConnectionStatusChange) {
      try {
        options.onConnectionStatusChange(status);
      } catch (err) {
        debug.error(
          "sync",
          `Error in onConnectionStatusChange callback: ${err}`
        );
      }
    }
  };

  // Check if socket is likely open
  const isSocketOpen = (): boolean => {
    // For WebSocket-like objects with readyState
    if (
      "readyState" in socket &&
      typeof (socket as any).readyState === "number"
    ) {
      // WebSocket.OPEN is 1
      return (socket as any).readyState === 1;
    }

    // No reliable way to check - assume it's open
    return true;
  };

  // Attempt reconnection with exponential backoff
  const attemptReconnect = () => {
    if (
      !autoReconnect ||
      !isActive ||
      reconnectAttempts >= maxReconnectAttempts
    ) {
      setConnectionStatus(SyncConnectionStatus.DISCONNECTED);
      return;
    }

    setConnectionStatus(SyncConnectionStatus.CONNECTING);
    const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
    reconnectAttempts++;

    debug.log(
      "sync",
      `Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`
    );

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    reconnectTimeout = setTimeout(() => {
      if (!isActive) return;

      // For WebSocket-like objects, try reconnecting
      if (
        "reconnect" in socket &&
        typeof (socket as any).reconnect === "function"
      ) {
        try {
          (socket as any).reconnect();
        } catch (err) {
          debug.error("sync", `Error reconnecting: ${err}`);
          attemptReconnect();
        }
      } else if (isSocketOpen()) {
        // Socket is already open or has auto-reconnected
        setConnectionStatus(SyncConnectionStatus.CONNECTED);
        reconnectAttempts = 0;
      } else {
        // Can't reconnect
        attemptReconnect();
      }
    }, delay);
  };

  // Handle incoming messages
  const handleMessage = (event: any) => {
    if (!isActive) return;

    try {
      const rawData = event.data;
      if (!rawData) {
        debug.warn("sync", "Received empty message, ignoring");
        return;
      }

      // Parse the message
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (err) {
        debug.error("sync", `Error parsing message: ${err}`);
        return;
      }

      // Reset reconnect attempts on successful message
      reconnectAttempts = 0;
      setConnectionStatus(SyncConnectionStatus.CONNECTED);

      // Ignore if no data or not a sync message
      if (!data || !data.changes) {
        debug.log("sync", "Received non-sync message, ignoring");
        return;
      }

      // Check prefix
      if (prefix && data.prefix && data.prefix !== prefix) {
        debug.log(
          "sync",
          `Ignoring message with different prefix: ${data.prefix} (expected ${prefix})`
        );
        return;
      }

      // Ignore own messages via clientId
      if (data.clientId === clientId) {
        debug.log("sync", "Ignoring own message");
        return;
      }

      // Validate incoming changes
      const changes = data.changes as Changes<T>;

      // Apply security filtering
      const filteredChanges = applySecurityFiltering(changes);
      if (!filteredChanges || Object.keys(filteredChanges).length === 0) {
        debug.log("sync", `No changes left after security filtering, ignoring`);
        return;
      }

      // Custom transform if provided
      let finalChanges = filteredChanges;
      if (options.mapFromPatch) {
        try {
          finalChanges = options.mapFromPatch(filteredChanges);
        } catch (e) {
          debug.error("sync", `Error in mapFromPatch callback: ${e}`);
        }
      }

      // Sanitize incoming changes
      finalChanges = sanitizeChanges(finalChanges);

      // Notify listeners
      if (options.onPatchReceive) {
        try {
          options.onPatchReceive({
            clientId: data.clientId,
            changes: finalChanges,
            prefix: data.prefix,
            timestamp: data.timestamp,
          });
        } catch (e) {
          debug.error("sync", `Error in onPatchReceive callback: ${e}`);
        }
      }

      // Apply changes to store
      debug.log(
        "sync",
        `Applying remote changes: ${JSON.stringify(finalChanges).substring(
          0,
          100
        )}`
      );

      // Check if the store has a patchState method which knows how to handle our change format
      if (typeof (store as any).patchState === "function") {
        (store as any).patchState(finalChanges);
      } else {
        // Otherwise use the standard patch function
        patch(store, finalChanges);
      }

      // Update lastSnapshot to avoid re-sending the changes we just received
      lastSnapshot = json(store);
    } catch (err) {
      debug.error("sync", `Error handling message: ${err}`);
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  // Apply security filtering to changes
  const applySecurityFiltering = (changes: Changes<T>): Changes<T> | null => {
    if (!changes) return null;

    // If allowKeys is provided, only allow those keys
    if (options.allowKeys && options.allowKeys.length > 0) {
      const filteredChanges: Changes<T> = {} as Changes<T>;
      let hasChanges = false;

      for (const allowedKey of options.allowKeys) {
        const key = String(allowedKey);

        // Handle nested paths (e.g., "user.settings.theme")
        if (key.includes(".")) {
          const pathParts = key.split(".");
          const rootKey = pathParts[0] as keyof T;

          // Check if root key exists in changes
          if (rootKey in changes) {
            // Create the nested structure in filteredChanges
            if (!(rootKey in filteredChanges)) {
              filteredChanges[rootKey] = {} as any;
            }

            // Deep copy the object from changes to filteredChanges
            const deepCopy = (
              source: any,
              target: any,
              parts: string[],
              index: number
            ) => {
              if (index >= parts.length) return;

              const part = parts[index];

              // Last part in the path
              if (index === parts.length - 1) {
                if (part in source) {
                  target[part] = source[part];
                  hasChanges = true;
                }
                return;
              }

              // Not the last part, continue building path
              if (!(part in source) || typeof source[part] !== "object") {
                return;
              }

              if (!(part in target)) {
                target[part] = {};
              }

              deepCopy(source[part], target[part], parts, index + 1);
            };

            deepCopy(
              changes[rootKey],
              filteredChanges[rootKey],
              pathParts.slice(1),
              0
            );

            // If no changes were added for this root key, remove the empty object
            if (Object.keys(filteredChanges[rootKey] || {}).length === 0) {
              delete filteredChanges[rootKey];
            }
          }
        } else {
          // Direct property access
          if (key in changes) {
            filteredChanges[key as keyof T] = changes[key as keyof T];
            hasChanges = true;
          }
        }
      }

      return hasChanges ? filteredChanges : null;
    }

    // If filter is provided, apply it
    if (options.filter && !options.filter(changes)) {
      return null;
    }

    return changes;
  };

  // Sanitize incoming changes
  const sanitizeChanges = (changes: Changes<T>): Changes<T> => {
    if (!options.sanitize) return changes;

    try {
      return options.sanitize(changes);
    } catch (err) {
      debug.error("sync", `Error in sanitize function: ${err}`);
      return changes; // Return original if sanitization fails
    }
  };

  // Send batched changes
  const sendBatchedChanges = () => {
    if (!batchedChanges || Object.keys(batchedChanges || {}).length === 0) {
      return;
    }

    // Prepare and send the message
    const message: SyncMessage<T> = {
      clientId,
      changes: batchedChanges,
      prefix,
      timestamp: Date.now(),
    };

    if (options.onDiffSend) {
      try {
        options.onDiffSend(message);
      } catch (e) {
        debug.error("sync", `Error in onDiffSend callback: ${e}`);
      }
    }

    try {
      const payload = JSON.stringify(message);

      // Check message size
      const estimatedSize = payload.length * 2; // Rough estimate, chars can be 1-4 bytes
      if (estimatedSize > maxMessageSize) {
        const error = new Error(
          `Message size (${estimatedSize} bytes) exceeds maximum allowed size (${maxMessageSize} bytes)`
        );
        debug.error("sync", error.message);
        if (options.onError) {
          options.onError(error);
        }
        return;
      }

      socket.send(payload);
      debug.log(
        "sync",
        `Sent batched changes: ${payload.substring(0, 100)}${
          payload.length > 100 ? "..." : ""
        }`
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      debug.error("sync", `Error sending sync message: ${error.message}`);

      if (
        error.message.includes("closed") ||
        error.message.includes("CLOSED")
      ) {
        setConnectionStatus(SyncConnectionStatus.DISCONNECTED);
        attemptReconnect();
      }

      if (options.onError) {
        options.onError(error);
      }
    }

    // Reset batched changes
    batchedChanges = null;
  };

  // Helper to consistently check whether we should send changes
  const shouldSendChanges = () => isActive && !options.receiveOnly;

  // Process changes and decide whether to send immediately or batch
  const processChanges = (changes: Changes<T>) => {
    // Don't send any changes if in receiveOnly mode
    if (!shouldSendChanges()) {
      debug.log("sync", "Not sending changes: inactive or receiveOnly mode");
      return;
    }

    if (batchUpdates) {
      // Start or add to batch
      batchedChanges = batchedChanges || ({} as Changes<T>);
      Object.assign(batchedChanges, changes);

      // Schedule a batch send if not already scheduled
      if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          if (batchedChanges && Object.keys(batchedChanges || {}).length > 0) {
            sendBatchedChanges();
            batchedChanges = null;
          }
          batchTimeout = null;
        }, batchTimeWindow);
      }
    } else {
      // Send immediately
      const message: SyncMessage<T> = {
        clientId,
        changes,
        prefix,
        timestamp: Date.now(),
      };

      if (options.onDiffSend) {
        try {
          options.onDiffSend(message);
        } catch (e) {
          debug.error("sync", `Error in onDiffSend callback: ${e}`);
        }
      }

      try {
        const payload = JSON.stringify(message);

        // Check message size
        const estimatedSize = payload.length * 2; // Rough estimate, chars can be 1-4 bytes
        if (estimatedSize > maxMessageSize) {
          const error = new Error(
            `Message size (${estimatedSize} bytes) exceeds maximum allowed size (${maxMessageSize} bytes)`
          );
          debug.error("sync", error.message);
          if (options.onError) {
            options.onError(error);
          }
          return;
        }

        socket.send(payload);
        debug.log(
          "sync",
          `Sent diff: ${payload.substring(0, 100)}${
            payload.length > 100 ? "..." : ""
          }`
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        debug.error("sync", `Error sending sync message: ${error.message}`);

        if (
          error.message.includes("closed") ||
          error.message.includes("CLOSED")
        ) {
          setConnectionStatus(SyncConnectionStatus.DISCONNECTED);
          attemptReconnect();
        }

        if (options.onError) {
          options.onError(error);
        }
      }
    }
  };

  // Throttled send of patch
  const sendDiff = () => {
    if (!shouldSendChanges()) {
      debug.log("sync", "Not sending diff: inactive or receiveOnly mode");
      return;
    }

    if (!isSocketOpen()) {
      debug.warn("sync", `Cannot send diff: socket is not open`);
      return;
    }

    const next = json(store);
    const rawChanges = diff(lastSnapshot, next);

    if (!rawChanges || Object.keys(rawChanges).length === 0) {
      debug.log("sync", `No changes detected, skipping diff send`);
      return;
    }

    // Cast to proper type
    let changes = rawChanges as Changes<T>;

    // Apply security filtering
    const filteredChanges = applySecurityFiltering(changes);

    // Only proceed if we have changes to send after filtering
    if (!filteredChanges || Object.keys(filteredChanges).length === 0) {
      debug.log(
        "sync",
        `No changes left after security filtering, skipping diff send`
      );
      return;
    }

    changes = filteredChanges;

    // Apply custom filter if provided
    if (options.filter && !options.filter(changes)) {
      debug.log("sync", `Custom filter rejected changes, skipping diff send`);
      return;
    }

    // Apply custom transform if provided
    if (options.mapToPatch) {
      try {
        changes = options.mapToPatch(changes);
        debug.log("sync", `Applied custom mapToPatch transform`);
      } catch (e) {
        debug.error("sync", `Error in mapToPatch callback: ${e}`);
      }
    }

    lastSnapshot = next;

    // Process the changes (either send immediately or batch)
    processChanges(changes);
  };

  // Throttle function to limit the rate of updates
  const schedule = () => {
    if (queued) return;

    if (throttleMs <= 0) {
      // Send immediately if throttle is disabled
      sendDiff();
    } else {
      // Otherwise throttle
      queued = true;
      setTimeout(() => {
        queued = false;
        sendDiff();
      }, throttleMs);
    }
  };

  // Listen for local changes
  let unobserve: () => void;

  const setupSync = () => {
    // Set up socket listeners
    let onMessageHandler: (event: any) => void;

    if (socket.addEventListener) {
      // WebSocket-like interface
      onMessageHandler = handleMessage;
      socket.addEventListener("message", onMessageHandler);

      // Listen for connection events if available
      const openHandler = () => {
        setConnectionStatus(SyncConnectionStatus.CONNECTED);
        reconnectAttempts = 0;
      };

      const closeHandler = () => {
        setConnectionStatus(SyncConnectionStatus.DISCONNECTED);
        attemptReconnect();
      };

      const errorHandler = (err: any) => {
        setConnectionStatus(SyncConnectionStatus.ERROR);
        if (options.onError && err) {
          options.onError(err instanceof Error ? err : new Error(String(err)));
        }
        attemptReconnect();
      };

      if (socket.addEventListener) {
        socket.addEventListener("open", openHandler);
        socket.addEventListener("close", closeHandler);
        socket.addEventListener("error", errorHandler);
      }
    } else if ("onmessage" in socket) {
      // Basic socket interface
      onMessageHandler = handleMessage;
      socket.onmessage = onMessageHandler;

      // Set up basic error handling if available
      if ("onerror" in socket) {
        (socket as any).onerror = (err: any) => {
          setConnectionStatus(SyncConnectionStatus.ERROR);
          if (options.onError && err) {
            options.onError(
              err instanceof Error ? err : new Error(String(err))
            );
          }
          attemptReconnect();
        };
      }

      if ("onclose" in socket) {
        (socket as any).onclose = () => {
          setConnectionStatus(SyncConnectionStatus.DISCONNECTED);
          attemptReconnect();
        };
      }

      if ("onopen" in socket) {
        (socket as any).onopen = () => {
          setConnectionStatus(SyncConnectionStatus.CONNECTED);
          reconnectAttempts = 0;
        };
      }
    } else {
      debug.error("sync", "Socket must have addEventListener or onmessage");
      return () => {};
    }

    // Listen for store changes only if not in receiveOnly mode
    if (options.receiveOnly) {
      // No-op function for cleanup if receiveOnly
      unobserve = () => {};
      debug.log("sync", "In receiveOnly mode, not observing store changes");
    } else {
      // Normal case - observe store changes for sending
      unobserve = onUpdate(store, schedule);
    }

    // Initial connection status check
    if (isSocketOpen()) {
      setConnectionStatus(SyncConnectionStatus.CONNECTED);
    } else {
      attemptReconnect();
    }

    // Return cleanup function
    return () => {
      isActive = false;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }

      unobserve();

      if (socket.removeEventListener && onMessageHandler) {
        socket.removeEventListener("message", onMessageHandler);
        socket.removeEventListener("open", () => {});
        socket.removeEventListener("close", () => {});
        socket.removeEventListener("error", () => {});
      } else if ("onmessage" in socket) {
        socket.onmessage = null;

        if ("onerror" in socket) {
          (socket as any).onerror = null;
        }

        if ("onclose" in socket) {
          (socket as any).onclose = null;
        }

        if ("onopen" in socket) {
          (socket as any).onopen = null;
        }
      }

      debug.log("sync", "Sync stopped and cleaned up");
    };
  };

  // Start sync and return cleanup function
  return setupSync();
}
