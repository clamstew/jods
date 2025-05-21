import { getRegistry } from "./internal/registry";

/**
 * Connects an existing Remix action to a jods store
 * Useful for gradually migrating existing code to jods
 *
 * @param store The jods store
 * @param actionHandler The existing Remix action handler
 * @returns A new action handler that updates the jods store
 */
export function connectActionToJods(
  store: any,
  actionHandler: (...args: any[]) => Promise<any>
) {
  return async (...args: any[]) => {
    // Call the original action handler
    const result = await actionHandler(...args);

    // Get the registry and update the store
    const registry = getRegistry();
    if (registry.has(store.name)) {
      registry.update(store.name, result.data || result);
    }

    return result;
  };
}
