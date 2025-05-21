/**
 * Remix integration for JODS
 *
 * This file provides Remix-specific utilities for using JODS with Remix.
 *
 * @example
 * ```jsx
 * import { store } from 'jods';
 * import { useJods, withJods } from 'jods/remix';
 *
 * const todoStore = store({ items: [] });
 *
 * // In your loader
 * export const loader = withJods([todoStore], async () => {
 *   return { other data };
 * });
 *
 * // In your component
 * function TodoForm() {
 *   const { data, actions } = useJods(todoStore, "addTodo");
 *   return (
 *     <>
 *       <ul>{data.items.map(item => <li key={item.id}>{item.text}</li>)}</ul>
 *       <actions.addTodo.Form>
 *         <input name="text" />
 *         <button type="submit">Add</button>
 *       </actions.addTodo.Form>
 *     </>
 *   );
 * }
 * ```
 */

/**
 * jods/remix provides integration between jods stores and Remix applications.
 *
 * NOTE: This integration is compatible with both the current store implementation
 * and the upcoming signals-based implementation (PR #20).
 *
 * When signals are introduced, all APIs will remain backward compatible but will
 * gain improved performance and reduced bundle size.
 */

// Re-export core functionality with namespaces
import * as JodsCore from "../../core";
export { JodsCore };

// Re-export j and jod from utils/zod for convenience in Remix apps
export { j, jod } from "../../utils/zod";

export * from "./defineStore";
export * from "./getJodsSnapshot";
export * from "./rehydrateClient";
export * from "./useJods";
export * from "./useJodsForm";
export * from "./useJodsFetchers";
export * from "./useJodsStore";
export * from "./withJods";
export * from "./connectActionToJods";
export * from "./useJodsTransition";
export * from "./useOptimisticUpdate";
export * from "./createPersistedStore";
export * from "./createCookieStorage";

// Export a dedicated client-side usePersist hook for Remix
export { useClientPersist } from "./useClientPersist";

/**
 * Re-export from core to provide a clean API
 */
export const {
  store,
  computed,
  json,
  diff,
  // persist,
  // clearPersisted,
  // getPersisted,
  // isPersisted,
} = JodsCore;

// Export persistence API from core
export * from "../../persist";
