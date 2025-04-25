/**
 * Preact integration for JODS
 *
 * This file is optimized for Preact's native hooks API.
 *
 * @example
 * ```jsx
 * import { store } from 'jods';
 * import { useJods } from 'jods/preact';
 *
 * const userStore = store({ name: 'Burt Macklin' });
 *
 * function UserProfile() {
 *   const user = useJods(userStore);
 *   return <div>{user.name}</div>;
 * }
 * ```
 */

// Re-export core functionality
export { store, onUpdate, computed, isComputed, json, diff } from "./index";
export type {
  Store,
  StoreState,
  ComputedValue,
  Subscriber,
  Unsubscribe,
  ComputeFunction,
  DiffResult,
} from "./index";

// Preact-specific hooks
export { useJods } from "./hooks/useJodsPreact";
