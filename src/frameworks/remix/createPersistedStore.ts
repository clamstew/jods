import { store } from "../../core";
import type { Store } from "../../core";
import { debug } from "../../utils/debug";

/**
 * Options for creating a persisted store in Remix
 */
export interface CreatePersistedStoreOptions<T extends Record<string, any>> {
  /** Initial state for the store */
  initialState: T;

  /** Storage key for the store (default: "jods") */
  key?: string;

  /** Storage handler configuration */
  storage?: {
    /** Function to retrieve state from server context (cookies, headers, etc.) */
    getState?: (request: Request) => Promise<Partial<T> | null>;

    /** Function to persist state to response */
    setState?: (response: Response, state: T) => Promise<Response>;
  };
}

/**
 * Creates a jods store that can be persisted in Remix server context
 * and hydrated on the client side.
 *
 * @param options Configuration options
 * @returns Object with store and utility functions
 *
 * @example
 * ```tsx
 * // In app/utils/persistedStore.ts
 * export const { store: userStore, getState, persistState } = createPersistedStore({
 *   initialState: { name: '', email: '' }
 * });
 *
 * // In a route file
 * export async function loader({ request }) {
 *   const state = await getState(request);
 *   return json({ state });
 * }
 *
 * export async function action({ request }) {
 *   const formData = await request.formData();
 *   const values = Object.fromEntries(formData);
 *
 *   // Update store with form values
 *   Object.assign(userStore, values);
 *
 *   // Create response and persist state
 *   const response = redirect('/success');
 *   return persistState(response, userStore);
 * }
 * ```
 */
export function createPersistedStore<T extends Record<string, any>>(
  options: CreatePersistedStoreOptions<T>
): {
  store: Store<T>;
  getState: (request: Request) => Promise<T>;
  persistState: (response: Response, state: T) => Promise<Response>;
} {
  const key = options.key ?? "jods";

  // Create store with initial state
  const jodsStore = store<T>(options.initialState);

  debug.log("persist", `Created persistable Remix store with key: ${key}`);

  // Function to get state from request
  const getState = async (request: Request): Promise<T> => {
    debug.log("persist", `Getting Remix store state from request`);

    // Use custom storage handler if provided
    if (options.storage?.getState) {
      try {
        const storedState = await options.storage.getState(request);
        if (storedState) {
          // Update store with persisted data
          Object.assign(jodsStore, storedState);
        }
      } catch (err) {
        debug.error("persist", "Error getting state from request:", err);
      }
    }

    return jodsStore;
  };

  // Function to persist state to response
  const persistState = async (
    response: Response,
    state: T
  ): Promise<Response> => {
    debug.log("persist", `Persisting Remix store state to response`);

    // Use custom storage handler if provided
    if (options.storage?.setState) {
      try {
        return await options.storage.setState(response, state);
      } catch (err) {
        debug.error("persist", "Error persisting state to response:", err);
      }
    }

    return response;
  };

  return {
    store: jodsStore,
    getState,
    persistState,
  };
}
