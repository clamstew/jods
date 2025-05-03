/**
 * Client-side function to rehydrate jods stores from a snapshot
 * Call this function in your app's entry client file
 */
export function rehydrateClient(
  jodsSnapshot: Record<string, any>,
  stores: any[]
) {
  // No hooks needed, just update the stores directly
  for (const store of stores) {
    const snap = jodsSnapshot?.[store.name];
    if (snap) {
      store.setState(snap);
    }
  }
}
