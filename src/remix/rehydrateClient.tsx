/** @jsxImportSource react */
import { useEffect } from "react";

export function rehydrateClient(
  jodsSnapshot: Record<string, any>,
  stores: any[]
) {
  useEffect(() => {
    for (const store of stores) {
      const snap = jodsSnapshot?.[store.name];
      if (snap) {
        store.setState(snap);
      }
    }
  }, []);
}
