/**
 * One-liner utilities for common sync patterns
 *
 * This file provides simple, one-line sync operations for common use cases.
 */

import { Store, StoreState } from "../core";
import { sync, SyncOptions, SyncSocket } from "../sync";
import { SyncStatusTracker, SyncConnectionStatus } from "./SyncStatusTracker";

// BroadcastChannel adapter for jods sync API
class BroadcastChannelAdapter {
  private channel: BroadcastChannel;
  private _onmessageHandler: ((event: { data: string }) => void) | null = null;
  private listenerMap = new Map<
    (event: any) => void,
    (event: MessageEvent) => void
  >();

  constructor(channelName: string) {
    this.channel = new BroadcastChannel(channelName);

    // Native listener that calls the currently set _onmessageHandler (if any)
    this.channel.onmessage = (nativeEvent: MessageEvent) => {
      if (this._onmessageHandler) {
        const eventData = nativeEvent.data;
        const processedData =
          typeof eventData === "string" ? eventData : JSON.stringify(eventData);
        this._onmessageHandler({ data: processedData });
      }
    };
  }

  send(message: string): void {
    this.channel.postMessage(message);
  }

  // Conforms to SyncSocket.onmessage
  get onmessage(): ((event: { data: string }) => void) | null {
    return this._onmessageHandler;
  }
  set onmessage(handler: ((event: { data: string }) => void) | null) {
    this._onmessageHandler = handler;
  }

  // Conforms to SyncSocket.addEventListener
  addEventListener(
    type: "message" | "open" | "close" | "error",
    fn: (event: any) => void
  ): void {
    if (type === "message" && fn) {
      const wrappedFn = (nativeEvent: MessageEvent) => {
        const eventData = nativeEvent.data;
        const processedData =
          typeof eventData === "string" ? eventData : JSON.stringify(eventData);
        fn({ data: processedData });
      };
      this.listenerMap.set(fn, wrappedFn);
      this.channel.addEventListener("message", wrappedFn);
    }
    // Note: BroadcastChannel doesn't have 'open', 'close', 'error' events.
    // SyncSocket makes these event types optional for addEventListener, so it's fine.
  }

  // Conforms to SyncSocket.removeEventListener
  removeEventListener(
    type: "message" | "open" | "close" | "error",
    fn: (event: any) => void
  ): void {
    if (type === "message" && fn) {
      const wrappedFn = this.listenerMap.get(fn);
      if (wrappedFn) {
        this.channel.removeEventListener("message", wrappedFn);
        this.listenerMap.delete(fn);
      }
    }
  }

  close(): void {
    this.channel.close();
  }

  // readyState is optional in SyncSocket, BroadcastChannel doesn't have it.
}

/**
 * Sync store across browser tabs with BroadcastChannel
 *
 * @example
 * ```js
 * const myStore = store({ count: 0, text: 'Hello' });
 * const stopTabSync = syncAcrossTabs(myStore, 'my-app-state');
 * ```
 */
export function syncAcrossTabs<T extends StoreState>(
  store: T & Partial<Store<T>>,
  channelName: string,
  options: Omit<SyncOptions<T>, "autoReconnect"> = {}
): () => void {
  const channel = new BroadcastChannelAdapter(channelName);
  return sync(channel, store, {
    ...options,
    autoReconnect: false,
  });
}

/**
 * Sync store with a WebSocket
 *
 * @example
 * ```js
 * const myStore = store({ count: 0, messages: [] });
 * const socket = new WebSocket('wss://example.com/sync');
 * const { stop, status } = syncWithWebSocket(myStore, socket, {
 *   allowKeys: ['messages']
 * });
 * ```
 */
export function syncWithWebSocket<T extends StoreState>(
  store: T & Partial<Store<T>>,
  socket: WebSocket,
  options: SyncOptions<T> = {}
): { stop: () => void; status: SyncStatusTracker } {
  const statusTracker = new SyncStatusTracker();

  if (socket.readyState === globalThis.WebSocket.CLOSED) {
    statusTracker.setStatus(SyncConnectionStatus.DISCONNECTED);
    console.error("WebSocket is already closed");
    return {
      stop: () => {},
      status: statusTracker,
    };
  }

  // Set initial status based on WebSocket state
  switch (socket.readyState) {
    case globalThis.WebSocket.CONNECTING:
      statusTracker.setStatus(SyncConnectionStatus.CONNECTING);
      break;
    case globalThis.WebSocket.OPEN:
      statusTracker.setStatus(SyncConnectionStatus.CONNECTED);
      break;
    case globalThis.WebSocket.CLOSING:
    case globalThis.WebSocket.CLOSED:
      statusTracker.setStatus(SyncConnectionStatus.DISCONNECTED);
      break;
  }

  // Start syncing with WebSocket and track status
  const stop = sync(socket as SyncSocket, store, {
    ...options,
    onConnectionStatusChange: (status) => {
      statusTracker.setStatus(status);
      if (options.onConnectionStatusChange) {
        options.onConnectionStatusChange(status);
      }
    },
  });

  return { stop, status: statusTracker };
}

/**
 * Sync store with server-sent events (SSE)
 *
 * @example
 * ```js
 * const myStore = store({ updates: [] });
 * const { stop, status } = syncWithSSE(myStore, '/api/sse-endpoint', {
 *   receiveOnly: true // Only receive updates from server
 * });
 * ```
 */
export function syncWithSSE<T extends StoreState>(
  store: T & Partial<Store<T>>,
  endpoint: string,
  options: SyncOptions<T> & {
    fetchOptions?: RequestInit;
    reconnectDelay?: number;
  } = {}
): { stop: () => void; status: SyncStatusTracker } {
  const statusTracker = new SyncStatusTracker();
  let isActive = true;
  let eventSource: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // SSE adapter that implements SyncSocket interface
  const sseAdapter = {
    send(message: string) {
      // For send-only operations, we use a separate fetch
      if (!isActive || options.receiveOnly === false) return;

      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: message,
        ...options.fetchOptions,
      }).catch((error) => {
        console.error("Error sending data to SSE endpoint:", error);
        if (options.onError) {
          options.onError(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      });
    },

    onmessage: null as ((event: { data: string }) => void) | null,

    addEventListener(type: string, listener: (event: any) => void) {
      if (type !== "message" || !eventSource) return;

      eventSource.addEventListener("message", (event) => {
        listener({ data: event.data });
      });
    },

    removeEventListener(type: string, listener: (event: any) => void) {
      if (eventSource) {
        eventSource.removeEventListener(type, listener as any);
      }
    },

    close() {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      isActive = false;
    },
  };

  // Connect to SSE
  const connect = () => {
    if (!isActive) return;

    statusTracker.setStatus(SyncConnectionStatus.CONNECTING);

    try {
      eventSource = new EventSource(endpoint);

      eventSource.onopen = () => {
        statusTracker.setStatus(SyncConnectionStatus.CONNECTED);
      };

      eventSource.onerror = (_error) => {
        statusTracker.setStatus(SyncConnectionStatus.ERROR);

        if (options.onError) {
          options.onError(new Error("SSE connection error"));
        }

        // Auto reconnect
        if (isActive && eventSource) {
          eventSource.close();
          eventSource = null;

          const delay = options.reconnectDelay || 3000;
          reconnectTimer = setTimeout(connect, delay);
        }
      };

      eventSource.onmessage = (event) => {
        if (sseAdapter.onmessage) {
          sseAdapter.onmessage({ data: event.data });
        }
      };
    } catch (error) {
      statusTracker.setStatus(SyncConnectionStatus.ERROR);

      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error(String(error))
        );
      }

      // Try to reconnect
      if (isActive) {
        const delay = options.reconnectDelay || 3000;
        reconnectTimer = setTimeout(connect, delay);
      }
    }
  };

  // Initialize connection
  connect();

  // Start syncing
  const stop = sync(sseAdapter, store, {
    ...options,
    onConnectionStatusChange: (status) => {
      statusTracker.setStatus(status);
      if (options.onConnectionStatusChange) {
        options.onConnectionStatusChange(status);
      }
    },
  });

  return {
    stop: () => {
      stop();
      sseAdapter.close();
    },
    status: statusTracker,
  };
}

/**
 * Sync store between iframe and parent window
 *
 * @example
 * ```js
 * // In parent window
 * const parentStore = store({ shared: 'data' });
 * const { stop } = syncWithIframe(parentStore, 'iframe-id');
 *
 * // In iframe
 * const iframeStore = store({ shared: '' });
 * const { stop } = syncWithParentWindow(iframeStore);
 * ```
 */
export function syncWithIframe<T extends StoreState>(
  store: T & Partial<Store<T>>,
  iframeId: string,
  options: SyncOptions<T> = {}
): { stop: () => void } {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;

  if (!iframe || !iframe.contentWindow) {
    console.error(`Iframe with id "${iframeId}" not found or not accessible`);
    return { stop: () => {} };
  }

  // Create an adapter for postMessage
  const iframeAdapter = {
    send(message: string) {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
      }
    },

    onmessage: null as ((event: { data: string }) => void) | null,
  };

  // Set up event listener
  const messageHandler = (event: MessageEvent) => {
    // Only process messages from our iframe
    if (event.source !== iframe.contentWindow) return;

    if (iframeAdapter.onmessage) {
      iframeAdapter.onmessage({ data: event.data });
    }
  };

  window.addEventListener("message", messageHandler);

  // Start syncing
  const stopSync = sync(iframeAdapter as any, store, options);

  return {
    stop: () => {
      stopSync();
      window.removeEventListener("message", messageHandler);
    },
  };
}

/**
 * Sync store between iframe and parent window (iframe side)
 */
export function syncWithParentWindow<T extends StoreState>(
  store: T & Partial<Store<T>>,
  options: SyncOptions<T> = {},
  targetOrigin = "*"
): { stop: () => void } {
  if (!window.parent || window.parent === window) {
    console.error("Not running in an iframe or parent is not accessible");
    return { stop: () => {} };
  }

  // Create an adapter for postMessage
  const parentAdapter = {
    send(message: string) {
      window.parent.postMessage(message, targetOrigin);
    },

    onmessage: null as ((event: { data: string }) => void) | null,
  };

  // Set up event listener
  const messageHandler = (event: MessageEvent) => {
    // Only process messages from parent
    if (event.source !== window.parent) return;

    if (parentAdapter.onmessage) {
      parentAdapter.onmessage({ data: event.data });
    }
  };

  window.addEventListener("message", messageHandler);

  // Start syncing
  const stopSync = sync(parentAdapter as any, store, options);

  return {
    stop: () => {
      stopSync();
      window.removeEventListener("message", messageHandler);
    },
  };
}
