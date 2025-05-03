export function getJodsSnapshot(stores: any[]) {
  return stores.reduce((acc, store) => {
    acc[store.name] = store.getState();
    return acc;
  }, {} as Record<string, any>);
}
