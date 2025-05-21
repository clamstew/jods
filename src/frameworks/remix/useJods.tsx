import { useJodsStore } from "./useJodsStore";
import { useJodsForm } from "./useJodsForm";
import { useLoaderData } from "@remix-run/react";

/**
 * A unified hook for accessing jods store data and action handlers in Remix applications.
 *
 * @param storeInput - The store or array of stores to connect to
 * @param handlers - Optional handler name or array of handler names to create forms for
 * @returns An object containing stores (enhanced store objects), actions (form handlers), and loaderData
 *
 * @example
 * ```tsx
 * // Single store, single handler
 * const { stores, actions, loaderData } = useJods(todoStore, "addTodo");
 * return (
 *   <>
 *     <ul>{stores.items.map(item => <li key={item.id}>{item.text}</li>)}</ul>
 *     <actions.addTodo.Form>
 *       <input name="text" />
 *       <button type="submit">Add</button>
 *     </actions.addTodo.Form>
 *   </>
 * );
 *
 * // Single store, multiple handlers
 * const { stores, actions } = useJods(todoStore, ["addTodo", "removeTodo"]);
 *
 * // Multiple stores
 * const { stores, actions } = useJods([userStore, todoStore], {
 *   user: ["updateProfile"],
 *   todo: ["addTodo", "removeTodo"]
 * });
 * // Access with stores.user.name, stores.todos.items, etc.
 * ```
 */
export function useJods(
  storeInput: any | any[],
  handlers?: string | string[] | Record<string, string[]>
) {
  // Get loader data (if any)
  const loaderData = useLoaderData<any>();

  // Handle single store case
  if (!Array.isArray(storeInput)) {
    // Get reactive state
    const storeState = useJodsStore(storeInput);

    // Create enhanced store that combines the original store methods with reactive state
    const enhancedStore = {
      ...storeInput, // Include all original store methods
      ...storeState, // Spread in the reactive state
    };

    // Process handlers if provided
    const actionHandlers: Record<string, any> = {};

    if (handlers) {
      if (typeof handlers === "string") {
        // Single handler
        actionHandlers[handlers] = useJodsForm(storeInput, handlers);
      } else if (Array.isArray(handlers)) {
        // Array of handlers
        handlers.forEach((handler) => {
          actionHandlers[handler] = useJodsForm(storeInput, handler);
        });
      }
    }

    return {
      stores: enhancedStore, // Return enhanced store
      actions: actionHandlers,
      loaderData,
    };
  }

  // Handle multiple stores case
  const combinedStores: Record<string, any> = {};
  const actions: Record<string, any> = {};

  // Enhance each store with its reactive state
  storeInput.forEach((s: any) => {
    if (s && s.name) {
      const storeState = useJodsStore(s);
      combinedStores[s.name] = {
        ...s, // Original store methods
        ...storeState, // Reactive state
      };
    }
  });

  // Process handlers for multiple stores
  if (handlers && typeof handlers === "object" && !Array.isArray(handlers)) {
    Object.entries(handlers).forEach(([storeName, storeHandlers]) => {
      const targetStore = storeInput.find((s: any) => s.name === storeName);
      if (targetStore) {
        actions[storeName] = {};
        if (Array.isArray(storeHandlers)) {
          storeHandlers.forEach((handler) => {
            actions[storeName][handler] = useJodsForm(targetStore, handler);
          });
        }
      }
    });
  }

  return {
    stores: combinedStores,
    actions,
    loaderData,
  };
}
