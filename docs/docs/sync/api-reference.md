---
sidebar_position: 2
title: API Reference
description: Complete reference for the jods sync API
---

# Sync API Reference

The `sync` API enables bidirectional state synchronization between jods stores over socket-like connections such as WebSockets, BroadcastChannel, or postMessage.

## Basic Usage

```javascript
import { store, sync } from "jods";

// Create a store
const myStore = store({
  count: 0,
  text: "Hello World",
  user: {
    name: "User",
    preferences: {
      theme: "light",
    },
  },
});

// Connect to a WebSocket
const socket = new WebSocket("wss://example.com");

// Start syncing store with the socket
const stopSync = sync(socket, myStore);

// Later, to stop syncing
stopSync();
```

## API Signature

```typescript
function sync<T extends StoreState>(
  socket: SyncSocket,
  store: T,
  options?: SyncOptions<T>
): () => void;
```

### Parameters

- **socket** (`SyncSocket`): A socket-like object with messaging capabilities
- **store** (`T`): A jods store created with the `store` function
- **options** (`SyncOptions<T>`): Optional configuration options
- **Returns**: A function that stops syncing and removes all listeners

## Type Definitions

### SyncSocket

Any object that provides the following methods:

```typescript
interface SyncSocket {
  // Send a message as a string
  send: (msg: string) => void;

  // Optional onmessage handler
  onmessage?: ((event: { data: string }) => void) | null;

  // Optional addEventListener/removeEventListener methods
  addEventListener?: (
    type: "message",
    fn: (event: { data: string }) => void
  ) => void;

  removeEventListener?: (
    type: "message",
    fn: (event: { data: string }) => void
  ) => void;

  // Optional readyState property (like WebSocket)
  readyState?: number;
}
```

This interface is compatible with:

- WebSocket
- BroadcastChannel
- Worker messaging
- iframe postMessage (with an adapter)
- Custom transport mechanisms

### SyncOptions

```typescript
interface SyncOptions<T extends StoreState> {
  /**
   * Number of milliseconds to wait before sending updates (throttling)
   * @default 100
   */
  throttleMs?: number;

  /**
   * Prefix for message type, useful for multiplexing multiple stores on one socket
   * @default "jods-sync"
   */
  prefix?: string;

  /**
   * Filter function to selectively sync parts of the store
   * Return true to allow changes, false to block them
   */
  filter?: (changes: Changes<T>) => boolean;

  /**
   * Called when a diff is sent to the remote
   */
  onDiffSend?: (message: SyncMessage<T>) => void;

  /**
   * Called when a patch is received from the remote
   * Return modified patch or null to prevent applying
   */
  onPatchReceive?: (message: SyncMessage<T>) => SyncMessage<T> | null;

  /**
   * Error handler for sync operations
   */
  onError?: (err: Error) => void;

  /**
   * Only receive updates, never send local changes
   * @default false
   */
  receiveOnly?: boolean;

  /**
   * Array of top-level keys that are allowed to be synced (for security)
   * If provided, only these properties will be synced
   */
  allowKeys?: Array<keyof T>;

  /**
   * Array of nested property paths that are allowed to be synced
   * Examples: ["user.settings", "preferences.*"]
   */
  allowPaths?: string[];

  /**
   * Array of property paths that should never be synced
   * Takes precedence over allowKeys and allowPaths
   * Examples: ["user.apiKey", "secrets"]
   */
  sensitiveKeys?: string[];

  /**
   * Maximum size of messages in bytes
   * @default 1048576 (1MB)
   */
  maxMessageSize?: number;

  /**
   * Schema to validate incoming patches
   * Must have a parse() method (like Zod schemas)
   */
  validateSchema?: {
    parse: (data: any) => any;
  };
}
```

### SyncMessage

The message format used by the sync API:

```typescript
interface SyncMessage<T extends StoreState> {
  /** Unique ID for the client that sent the message */
  clientId: string;

  /** Changes to apply to the store */
  changes: Changes<T>;

  /** Optional message namespace/channel */
  prefix?: string;

  /** Optional timestamp for debugging */
  timestamp?: number;
}
```

## Options Reference

### Security Options

#### `allowKeys`

Limits which top-level properties can be synced:

```javascript
// Only sync these properties
const stopSync = sync(socket, store, {
  allowKeys: ["messages", "users", "status"],
});
```

#### `allowPaths`

Controls which nested properties can be synced:

```javascript
// Only sync these nested paths
const stopSync = sync(socket, store, {
  allowPaths: [
    "user.profile", // Allow all of user.profile
    "settings.theme", // Allow only settings.theme
    "messages.*", // Allow all properties under messages
  ],
});
```

#### `sensitiveKeys`

Prevents specific properties from being synced:

```javascript
// Never sync these properties, even if they're under allowKeys
const stopSync = sync(socket, store, {
  allowKeys: ["user", "settings"],
  sensitiveKeys: ["user.apiKey", "user.password", "settings.authToken"],
});
```

#### `validateSchema`

Validates incoming data against a schema:

```javascript
import { z } from "zod";
// or import { j } from 'jods';

const schema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      user: z.string(),
    })
  ),
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});

const stopSync = sync(socket, store, {
  validateSchema: schema,
});
```

### Performance Options

#### `throttleMs`

Controls how frequently updates are sent:

```javascript
const stopSync = sync(socket, store, {
  throttleMs: 300, // Send at most one update every 300ms
});
```

#### `maxMessageSize`

Prevents transmitting excessively large messages:

```javascript
const stopSync = sync(socket, store, {
  maxMessageSize: 100 * 1024, // 100KB max
});
```

### Event Handlers

#### `onDiffSend`

Called before sending changes to the remote:

```javascript
const stopSync = sync(socket, store, {
  onDiffSend: (message) => {
    console.log("Sending changes:", message.changes);
    // Optionally modify message
  },
});
```

#### `onPatchReceive`

Called when receiving changes, before applying them:

```javascript
const stopSync = sync(socket, store, {
  onPatchReceive: (message) => {
    console.log("Received changes:", message.changes);

    // Optionally modify the message
    if (message.changes.count < 0) {
      message.changes.count = 0; // Enforce non-negative count
    }

    return message; // Return modified message

    // Or return null to prevent applying the changes
    // if (hasInvalidData(message.changes)) return null;
  },
});
```

#### `onError`

Called when synchronization encounters an error:

```javascript
const stopSync = sync(socket, store, {
  onError: (error) => {
    console.error("Sync error:", error);
    store.status = "error";
  },
});
```

### Special Options

#### `prefix`

Multiplexes multiple stores over the same socket:

```javascript
// Same socket, different prefixes
const stopUserSync = sync(socket, userStore, {
  prefix: "users",
});

const stopMessageSync = sync(socket, messageStore, {
  prefix: "messages",
});
```

#### `receiveOnly`

Creates a read-only sync that never sends changes:

```javascript
// Only receive updates, never send
const stopSync = sync(socket, store, {
  receiveOnly: true,
});
```

#### `filter`

Provides custom filtering logic:

```javascript
const stopSync = sync(socket, store, {
  filter: (changes) => {
    // Only sync if certain conditions are met
    if (changes.hugeArray && changes.hugeArray.length > 1000) {
      return false; // Don't sync huge arrays
    }
    return true; // Sync everything else
  },
});
```

## Example: Secure Chat Application

```javascript
import { store, sync } from "jods";

// Create chat store
const chatStore = store({
  messages: [],
  users: [],
  privateNotes: {}, // Should not be synced
  authToken: "", // Should not be synced
  status: "disconnected",
});

// Connect to chat server
const socket = new WebSocket("wss://chat.example.com");

// Start secure sync
const stopSync = sync(socket, chatStore, {
  // Only sync messages, users and status
  allowKeys: ["messages", "users", "status"],

  // Never sync these sensitive paths
  sensitiveKeys: ["messages.*.privateFlag", "users.*.email"],

  // Limit update frequency
  throttleMs: 300,

  // Handle connection errors
  onError: (err) => {
    console.error("Sync error:", err);
    chatStore.status = "error";
  },

  // Filter outgoing messages
  onDiffSend: (message) => {
    // Log outgoing data
    console.log("Syncing:", Object.keys(message.changes));
  },

  // Validate incoming data
  onPatchReceive: (message) => {
    // Sanitize incoming messages
    if (message.changes.messages) {
      message.changes.messages.forEach((msg) => {
        // Remove any HTML to prevent XSS
        if (msg.text) {
          msg.text = msg.text.replace(/<[^>]*>/g, "");
        }
      });
    }
    return message;
  },
});

// Update store - changes will be synced
chatStore.status = "connected";
chatStore.messages.push({
  id: 1,
  text: "Hello!",
  timestamp: Date.now(),
});

// Won't be synced (not in allowKeys)
chatStore.privateNotes = { todo: "Remember to buy milk" };
chatStore.authToken = "jwt-token-123";

// Clean up when done
stopSync();
socket.close();
```

## Transport Adapters

### Socket.io Adapter

```javascript
function createSocketIOAdapter(socket) {
  return {
    send: (message) => {
      socket.emit("jods-sync", JSON.parse(message));
    },
    addEventListener: (type, listener) => {
      if (type === "message") {
        socket.on("jods-sync", (data) => {
          listener({ data: JSON.stringify(data) });
        });
      }
    },
    removeEventListener: (type) => {
      if (type === "message") {
        socket.off("jods-sync");
      }
    },
  };
}

// Usage
import io from "socket.io-client";
const socket = io("https://example.com");
const adapter = createSocketIOAdapter(socket);
const stopSync = sync(adapter, store);
```

### iframe postMessage Adapter

```javascript
function createIframeAdapter(iframe) {
  const handler = (event) => {
    if (
      event.source === iframe.contentWindow &&
      event.data &&
      event.data.type === "jods-sync"
    ) {
      if (adapter.onmessage) {
        adapter.onmessage({ data: JSON.stringify(event.data.payload) });
      }

      const listeners = adapter.eventListeners?.get("message") || [];
      listeners.forEach((fn) =>
        fn({ data: JSON.stringify(event.data.payload) })
      );
    }
  };

  window.addEventListener("message", handler);

  const adapter = {
    eventListeners: new Map([["message", []]]),
    onmessage: null,

    send: (message) => {
      iframe.contentWindow.postMessage(
        {
          type: "jods-sync",
          payload: JSON.parse(message),
        },
        "*"
      );
    },

    addEventListener: (type, fn) => {
      if (type === "message") {
        if (!adapter.eventListeners.has(type)) {
          adapter.eventListeners.set(type, []);
        }
        adapter.eventListeners.get(type).push(fn);
      }
    },

    removeEventListener: (type, fn) => {
      if (type === "message" && adapter.eventListeners.has(type)) {
        const listeners = adapter.eventListeners.get(type);
        const index = listeners.indexOf(fn);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    },

    close: () => {
      window.removeEventListener("message", handler);
      adapter.eventListeners.clear();
    },
  };

  return adapter;
}

// Usage
const iframe = document.getElementById("my-iframe");
const adapter = createIframeAdapter(iframe);
const stopSync = sync(adapter, store);
```
