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
export { useJodsForm } from "./remix/useJodsForm";
export { withJods } from "./remix/withJods";
export { rehydrateClient } from "./remix/rehydrateClient";
export { getJodsSnapshot } from "./remix/getJodsSnapshot";
export { defineStore } from "./remix/defineStore";

// Internal utilities
export { parseFormData } from "./remix/internal/formUtils";
