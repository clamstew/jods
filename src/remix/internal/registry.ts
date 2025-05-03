type StoreRegistry = Record<string, any>;

const storeRegistry: StoreRegistry = {};

export function registerStore(name: string, store: any) {
  storeRegistry[name] = store;
}

export function getStore(name: string) {
  return storeRegistry[name];
}

export function getAllStores() {
  return Object.values(storeRegistry);
}

/**
 * Gets the registry object with utility methods for interacting with stores
 */
export function getRegistry() {
  return {
    /**
     * Check if a store exists in the registry
     */
    has: (name: string) => name in storeRegistry,

    /**
     * Get a store from the registry
     */
    get: (name: string) => storeRegistry[name],

    /**
     * Update the state of a store in the registry
     */
    update: (name: string, newState: any) => {
      const store = storeRegistry[name];
      if (store && typeof store.setState === "function") {
        store.setState(newState);
      }
    },

    /**
     * Get all registered stores
     */
    getAll: () => Object.values(storeRegistry),
  };
}
