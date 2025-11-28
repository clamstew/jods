/**
 * React integration for JODS
 *
 * This file is separated from the main package to avoid
 * requiring React as a dependency for non-React users.
 *
 * @example
 * ```jsx
 * import { store } from 'jods';
 * import { useJods } from 'jods/react';
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

// React-specific hooks
export { useJods } from "./frameworks/react/useJods";
export { usePersist } from "./frameworks/react/usePersist";

// Export debugger component
import { createDebugger } from "./frameworks/react/debugger";
export { createDebugger };
