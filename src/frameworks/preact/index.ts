/**
 * Preact framework integration for Jods
 *
 * Provides hooks for using Jods stores in Preact applications
 * @packageDocumentation
 */

// Import from core libraries
import { StoreState, Store } from "../../core/store";
import type { PersistOptions, PersistStorage } from "../../persist/types";

// Re-export from frameworks/preact with additional JSDoc comments
/**
 * Preact hook to subscribe to a Jods store
 *
 * Provides state from the store with basic properties and computed values
 *
 * @template T - Type of the store state
 * @param store - Jods store to subscribe to
 * @returns Current state with computed properties available
 *
 * @remarks
 * IMPORTANT: Computed properties are returned as functions that must be
 * called to access their values. For example:
 *
 * ```tsx
 * const state = useJods(userStore);
 *
 * // Access a regular property
 * const name = state.name;
 *
 * // Access a computed property (must be called)
 * const fullName = typeof state.fullName === 'function'
 *   ? state.fullName()
 *   : state.fullName;
 * ```
 */
export { useJods } from "./useJodsPreact";

/**
 * Preact hook for persisting Jods stores
 *
 * Handles loading and saving store data to the provided storage
 *
 * @template T - Type of the store state
 * @param storage - Storage adapter (like localStorage)
 * @param storeOrStores - Single store or array of stores to persist
 * @param options - Optional persist configuration
 * @returns Object with loading state, error state, and clear function
 *
 * @example
 * ```tsx
 * // Persist a single store
 * const { isLoading, error, clear } = usePersist(localStorage, todoStore);
 *
 * // Persist multiple stores
 * const { isLoading, error, clear } = usePersist(localStorage, [userStore, todoStore]);
 * ```
 */
export { usePersist } from "./usePersist";

// Also re-export types for convenience
export type { StoreState, Store };
export type { PersistOptions, PersistStorage };
