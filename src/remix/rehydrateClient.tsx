/**
 * Client-side function to rehydrate jods stores from a snapshot
 * Call this function in your app's entry client file
 */
export function rehydrateClient(
  jodsSnapshot: Record<string, any>,
  stores: any[]
) {
  // Update each store with its snapshot data, properly triggering signals
  for (const store of stores) {
    const snap = jodsSnapshot?.[store.name];
    if (snap) {
      // Use Object.assign to update store properties and trigger proper signals
      Object.assign(store.store, snap);
    }
  }
}
