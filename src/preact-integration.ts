/**
 * Preact framework integration for Jods
 *
 * Provides hooks for using Jods stores in Preact applications
 * @packageDocumentation
 */

// Re-export core functionality
export { store, computed, isComputed, json, diff } from "./core";
export { onUpdate } from "./core/life-cycle/on-update";
export type { Subscriber, Unsubscribe, ComputedValue } from "./types";
export type { Store, StoreState } from "./core";
export { persist, clearPersisted, getPersisted, isPersisted } from "./persist";
export type {
  PersistOptions,
  PersistOperation,
  PersistStorage,
} from "./persist/types";

// Preact-specific hooks
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
export { useJods } from "./frameworks/preact/useJodsPreact";

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
export { usePersist } from "./frameworks/preact/usePersist";
