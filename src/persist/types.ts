import type { Store } from "../core/store";
import type { StoreState } from "../core/store/types";

/**
 * Storage interface for persist API
 */
export interface PersistStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem?(key: string): void | Promise<void>;
}

/**
 * Operation types for persist error handling
 */
export type PersistOperation = "load" | "save";

/**
 * Internal versioned state shape that includes a version property
 * @template T The store state type
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface VersionedState<T = any> extends Record<string, any> {
  version?: string | number;
  // T is used in function signatures that reference this interface
}

/**
 * Options for persist function
 */
export type PersistOptions<T> = {
  /** Storage key to use (default: "jods") */
  key?: string;

  /** Debounce interval in milliseconds for saves (default: 100ms) */
  debounceMs?: number;

  /** Alternative: throttle interval in milliseconds */
  throttleMs?: number;

  /** If true, only load state from storage without subscribing to future changes */
  loadOnlyMode?: boolean;

  /** Custom serialization function for state (default: JSON.stringify) */
  serialize?: (state: VersionedState<T>) => string;

  /** Custom deserialization function (default: JSON.parse) */
  deserialize?: (value: string) => VersionedState<T>;

  /** Schema version for migrations */
  version?: string | number;

  /** Migration function for handling schema changes */
  migrate?: (oldState: VersionedState<T>) => VersionedState<T>;

  /** Select partial state to persist */
  partial?: (state: VersionedState<T>) => Partial<VersionedState<T>>;

  /** Error handler for storage/parse errors */
  onError?: (error: Error, operation: PersistOperation) => void;

  /** List of keys that should never be persisted (supports dot notation for nested properties) */
  sensitiveKeys?: string[];

  /** Allow list of keys to persist (if provided, only these keys will be persisted) */
  allowList?: string[];

  /** Deny list of keys to exclude from persistence */
  denyList?: string[];

  /** Custom filter function to determine if a property should be persisted */
  persistenceFilter?: (key: string, value: any, path: string[]) => boolean;

  /** Validate persisted data when loading from storage */
  validate?: (
    state: VersionedState<T>
  ) => boolean | { valid: boolean; message?: string };
};

/**
 * Internal store metadata for persisted stores
 */
export interface PersistMeta {
  key: string;
  storage: PersistStorage;
}

// Re-exporting Store and StoreState for convenience if they are only used by PersistOptions
// If they are used more broadly, they should be imported directly where needed.
export type { Store, StoreState };
