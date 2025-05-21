import { StoreState } from "../core/store";
import { Changes } from "./patch";

/**
 * Message format for sync communication
 */
export interface SyncMessage<T extends StoreState> {
  clientId: string;
  changes: Changes<T>;
  prefix?: string;
  timestamp?: number; // Optional timestamp for ordering/debugging
}

/**
 * Event object received from socket communication
 */
export interface SyncMessageEvent {
  data: string;
}

/**
 * Interface for socket-like objects that can be used with sync()
 */
export interface SyncSocket {
  send: (msg: string) => void;
  onmessage: ((event: SyncMessageEvent) => void) | null;
  addEventListener?: (
    type: "message" | "open" | "close" | "error",
    fn: (event: any) => void
  ) => void;
  removeEventListener?: (
    type: "message" | "open" | "close" | "error",
    fn: (event: any) => void
  ) => void;
  readyState?: number; // WebSocket readyState-like property
}

/**
 * Add connection status tracking
 */
export enum SyncConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

/**
 * Configuration options for the sync function
 */
export interface SyncOptions<T extends StoreState> {
  /**
   * Number of milliseconds to wait before sending updates
   * Set to 0 to send updates immediately
   */
  throttleMs?: number;

  /**
   * Prefix for message type, useful for multiplexing multiple stores on one socket
   */
  prefix?: string;

  /**
   * Filter function to selectively sync parts of the store
   */
  filter?: (patch: Changes<T>) => boolean;

  /**
   * Transform outgoing patches before sending
   */
  mapToPatch?: (event: Changes<T>) => Changes<T>;

  /**
   * Transform incoming patches before applying
   */
  mapFromPatch?: (patch: Changes<T>) => Changes<T>;

  /**
   * Error handler for sync operations
   */
  onError?: (err: Error) => void;

  /**
   * Called when a diff is sent to the remote
   */
  onDiffSend?: (message: SyncMessage<T>) => void;

  /**
   * Called when a patch is received from the remote
   */
  onPatchReceive?: (message: SyncMessage<T>) => void;

  /**
   * Only receive updates, never send local changes
   */
  receiveOnly?: boolean;

  /**
   * List of top-level keys that are allowed to be synced (for security)
   */
  allowKeys?: Array<keyof T>;

  /**
   * List of nested property paths that are allowed to be synced (e.g., 'user.settings.theme')
   */
  allowPaths?: string[];

  /**
   * List of property paths that should never be synced (e.g., 'user.password')
   */
  sensitiveKeys?: string[];

  /**
   * Maximum size in bytes for incoming messages
   * Default is 1MB
   */
  maxMessageSize?: number;

  /**
   * Validate incoming changes against a schema
   * Returns true if valid, or false if invalid
   */
  validateSchema?: (
    changes: Changes<T>
  ) => boolean | { valid: boolean; message?: string };

  /**
   * Sanitize incoming data before applying to store
   * This is applied after validation and filtering
   */
  sanitize?: (changes: Changes<T>) => Changes<T>;

  /**
   * Minimum time to wait between sending updates (in ms)
   * @default 100
   */
  throttle?: number;

  /**
   * Batch multiple updates into a single message when changes occur rapidly
   * @default false
   */
  batchUpdates?: boolean;

  /**
   * Maximum time to batch updates before sending (in ms)
   * @default 300
   */
  batchTimeWindow?: number;

  /**
   * Automatically attempt to reconnect if the connection is lost
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts
   * @default 5
   */
  maxReconnectAttempts?: number;

  /**
   * Base delay between reconnection attempts (in ms) - uses exponential backoff
   * @default 1000
   */
  reconnectDelay?: number;

  /**
   * Called when connection status changes
   */
  onConnectionStatusChange?: (status: SyncConnectionStatus) => void;
}
