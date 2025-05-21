/**
 * Reconnection manager for sync sockets
 *
 * This utility provides automatic reconnection logic with
 * configurable backoff strategies for sync connections.
 */

import { SyncConnectionStatus } from "./SyncStatusTracker";

// Reconnection strategy types
export enum BackoffStrategy {
  CONSTANT = "constant", // Always use the same delay
  LINEAR = "linear", // Increase delay linearly (baseDelay * attemptCount)
  EXPONENTIAL = "exponential", // Exponential increase (baseDelay * 2^attemptCount)
  FIBONACCI = "fibonacci", // Fibonacci sequence (1,1,2,3,5,8,...)
  JITTER = "jitter", // Random jitter around exponential backoff
}

// Reconnection manager options
export interface ReconnectionOptions {
  /** Maximum number of reconnection attempts (default: Infinity) */
  maxAttempts?: number;

  /** Base delay between reconnection attempts in milliseconds (default: 1000) */
  baseDelay?: number;

  /** Maximum delay between reconnection attempts in milliseconds (default: 30000) */
  maxDelay?: number;

  /** Backoff strategy for increasing delays (default: EXPONENTIAL) */
  strategy?: BackoffStrategy;

  /** Function to call when reconnection succeeds */
  onSuccess?: () => void;

  /** Function to call when reconnection fails (all attempts exhausted) */
  onFailure?: () => void;

  /** Function to call on each reconnection attempt */
  onAttempt?: (attempt: number, delay: number) => void;

  /** Function to call when status changes */
  onStatusChange?: (status: SyncConnectionStatus) => void;
}

// Define WebSocket event handlers that can be passed in options
interface WebSocketHandlers {
  onopen?: (this: WebSocket, ev: Event) => any;
  onclose?: (this: WebSocket, ev: CloseEvent) => any;
  onerror?: (this: WebSocket, ev: Event) => any;
  onmessage?: (this: WebSocket, ev: MessageEvent) => any;
}

/**
 * ReconnectionManager handles automatic reconnection with configurable
 * backoff strategies for network connections.
 */
export class ReconnectionManager {
  private options: Required<ReconnectionOptions>;
  private attempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private status: SyncConnectionStatus = SyncConnectionStatus.DISCONNECTED;
  private isActive = false;

  constructor(options: ReconnectionOptions = {}) {
    // Set default options
    this.options = {
      maxAttempts: options.maxAttempts ?? Infinity,
      baseDelay: options.baseDelay ?? 1000,
      maxDelay: options.maxDelay ?? 30000,
      strategy: options.strategy ?? BackoffStrategy.EXPONENTIAL,
      onSuccess: options.onSuccess ?? (() => {}),
      onFailure: options.onFailure ?? (() => {}),
      onAttempt: options.onAttempt ?? (() => {}),
      onStatusChange: options.onStatusChange ?? (() => {}),
    };
  }

  /**
   * Start the reconnection process
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.attempts = 0;
    this.setStatus(SyncConnectionStatus.DISCONNECTED);
    this.scheduleReconnect();
  }

  /**
   * Stop all reconnection attempts
   */
  stop(): void {
    this.isActive = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.setStatus(SyncConnectionStatus.DISCONNECTED);
  }

  /**
   * Signal successful connection
   */
  setConnected(): void {
    this.attempts = 0;
    this.setStatus(SyncConnectionStatus.CONNECTED);

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.options.onSuccess();
  }

  /**
   * Signal connection lost - will trigger reconnection
   */
  setDisconnected(): void {
    if (!this.isActive) return;

    this.setStatus(SyncConnectionStatus.DISCONNECTED);
    this.scheduleReconnect();
  }

  /**
   * Signal connection error - will trigger reconnection
   */
  setError(): void {
    if (!this.isActive) return;

    this.setStatus(SyncConnectionStatus.ERROR);
    this.scheduleReconnect();
  }

  /**
   * Get current connection status
   */
  getStatus(): SyncConnectionStatus {
    return this.status;
  }

  /**
   * Check if manager is actively trying to reconnect
   */
  isReconnecting(): boolean {
    return this.isActive && this.timer !== null;
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(): number {
    return this.attempts;
  }

  /**
   * Reset attempt counter
   */
  resetAttempts(): void {
    this.attempts = 0;
  }

  /**
   * Set the connection status and notify listeners
   */
  private setStatus(status: SyncConnectionStatus): void {
    if (this.status === status) return;

    this.status = status;
    this.options.onStatusChange(status);
  }

  /**
   * Schedule the next reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.isActive) return;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Check if we've exceeded max attempts
    if (this.attempts >= this.options.maxAttempts) {
      this.options.onFailure();
      return;
    }

    // Calculate delay based on strategy
    const delay = this.calculateDelay();
    this.attempts++;

    // Notify listener about the attempt
    this.options.onAttempt(this.attempts, delay);

    // Set connecting status
    this.setStatus(SyncConnectionStatus.CONNECTING);

    // Schedule the reconnection
    this.timer = setTimeout(() => {
      this.timer = null;

      // Trigger the actual reconnect (handled by consumer)
      this.options.onAttempt(this.attempts, delay);
    }, delay);
  }

  /**
   * Calculate the delay based on the selected backoff strategy
   */
  private calculateDelay(): number {
    const { baseDelay, maxDelay, strategy } = this.options;
    let delay = baseDelay;

    switch (strategy) {
      case BackoffStrategy.CONSTANT:
        delay = baseDelay;
        break;

      case BackoffStrategy.LINEAR:
        delay = baseDelay * this.attempts;
        break;

      case BackoffStrategy.EXPONENTIAL:
        delay = baseDelay * Math.pow(2, this.attempts);
        break;

      case BackoffStrategy.FIBONACCI:
        // Calculate fibonacci number (1, 1, 2, 3, 5, 8, ...)
        const fibonacci = (n: number): number => {
          if (n <= 1) return 1;

          let a = 1,
            b = 1;
          for (let i = 2; i <= n; i++) {
            const temp = a + b;
            a = b;
            b = temp;
          }
          return b;
        };

        delay = baseDelay * fibonacci(this.attempts);
        break;

      case BackoffStrategy.JITTER:
        // Exponential backoff with random jitter (between 50% and 100% of calculated value)
        const expDelay = baseDelay * Math.pow(2, this.attempts);
        const jitterFactor = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
        delay = expDelay * jitterFactor;
        break;
    }

    // Cap at maximum delay
    return Math.min(delay, maxDelay);
  }
}

/**
 * Create a reconnection manager with the given options
 */
export function createReconnectionManager(
  options: ReconnectionOptions = {}
): ReconnectionManager {
  return new ReconnectionManager(options);
}

/**
 * Utility to add reconnection capabilities to a WebSocket
 *
 * @example
 * ```js
 * const { socket, status, reconnect, disconnect } = createReconnectingWebSocket('wss://example.com');
 *
 * // Connect to sync
 * const store = createStore({ count: 0 });
 * const stopSync = sync(socket, store);
 *
 * // Get status updates
 * status.onStatusChange((newStatus) => {
 *   console.log(`Connection status: ${newStatus}`);
 * });
 * ```
 */
export function createReconnectingWebSocket(
  url: string,
  protocols?: string | string[],
  options: ReconnectionOptions & WebSocketHandlers = {}
): {
  socket: WebSocket;
  status: SyncConnectionStatus;
  reconnect: () => void;
  disconnect: () => void;
} {
  let socket: WebSocket;

  // Create the WebSocket and set up event handlers
  const createSocket = () => {
    const newSocket = new WebSocket(url, protocols);

    newSocket.onopen = (event) => {
      reconnManager.setConnected();
      if (options.onopen) options.onopen.call(newSocket, event);
    };

    newSocket.onclose = (event) => {
      reconnManager.setDisconnected();
      if (options.onclose) options.onclose.call(newSocket, event);
    };

    newSocket.onerror = (event) => {
      reconnManager.setError();
      if (options.onerror) options.onerror.call(newSocket, event);
    };

    if (options.onmessage) {
      newSocket.onmessage = (event: MessageEvent) => {
        options.onmessage!.call(newSocket, event);
      };
    }
    return newSocket;
  };

  const userOnAttempt = options.onAttempt || (() => {});
  const onAttemptHandler = (attempt: number, delay: number) => {
    userOnAttempt(attempt, delay);

    try {
      if (
        socket &&
        (socket.readyState === globalThis.WebSocket.OPEN ||
          socket.readyState === globalThis.WebSocket.CONNECTING)
      ) {
        socket.close();
      }
    } catch (e) {
      console.error("Error closing previous WebSocket:", e);
    }
    socket = createSocket();
  };

  const managerOptions: ReconnectionOptions = {
    ...options,
    onAttempt: onAttemptHandler,
  };

  const reconnManager = createReconnectionManager(managerOptions);

  // Initial socket creation
  socket = createSocket();

  // Set up reconnection hooks
  reconnManager.start();

  return {
    socket,
    status: reconnManager.getStatus(),
    reconnect: () => {
      // Force reconnection (useful after network changes)
      reconnManager.resetAttempts();
      reconnManager.setDisconnected();
    },
    disconnect: () => {
      // Stop reconnection and close socket
      reconnManager.stop();
      socket.close();
    },
  };
}
