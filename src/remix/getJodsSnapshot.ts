export function getJodsSnapshot(stores: any[]) {
  return stores.reduce((acc, store) => {
    if (
      store &&
      typeof store === "object" &&
      store.name &&
      typeof store.getState === "function"
    ) {
      acc[store.name] = store.getState();
    }
    return acc;
  }, {} as Record<string, any>);
}
