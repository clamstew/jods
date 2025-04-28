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
export { store, onUpdate, computed, isComputed, json, diff } from "./index";
export type {
  Store,
  StoreState,
  ComputedValue,
  Subscriber,
  Unsubscribe,
} from "./index";

// React-specific hooks
export { useJods } from "./hooks/useJods";

// Export debugger component
import { createDebugger } from "./react/debugger";
export { createDebugger };
