/**
 * jods/zod - Zod Schema Integration
 *
 * This file provides the j and jod aliases for Zod integration.
 *
 * @example
 * ```ts
 * import { store } from 'jods';
 * import { j } from 'jods/zod';
 *
 * const TodoSchema = j.object({
 *   id: j.string(),
 *   title: j.string().min(3),
 *   completed: j.boolean().default(false),
 * });
 *
 * const todoStore = store({
 *   id: "1",
 *   title: "Learn jods",
 *   completed: false,
 * });
 * ```
 */

// Export j and jod for Zod integration
export { j, jod } from "./utils/zod";
