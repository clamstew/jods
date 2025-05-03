/**
 * Remix integration for JODS
 *
 * This file provides Remix-specific utilities for using JODS with Remix.
 *
 * @example
 * ```jsx
 * import { store } from 'jods';
 * import { useJodsForm, withJods } from 'jods/remix';
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
 *   const { Form } = useJodsForm(todoStore, "addTodo");
 *   return (
 *     <Form>
 *       <input name="task" />
 *       <button type="submit">Add</button>
 *     </Form>
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

// Remix-specific utilities
export * from "./remix/defineStore";
export * from "./remix/getJodsSnapshot";
export * from "./remix/rehydrateClient";
export * from "./remix/useJodsForm";
export * from "./remix/useJodsStore";
export * from "./remix/useJodsFetchers";
export * from "./remix/useJodsTransition";
export * from "./remix/useOptimisticUpdate";
export * from "./remix/withJods";
export * from "./remix/connectActionToJods";
export * from "./remix/cachingUtils";

// Internal utilities
export { parseFormData } from "./remix/internal/formUtils";
