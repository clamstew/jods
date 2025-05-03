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
