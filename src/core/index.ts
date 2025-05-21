// Re-export all core functionality
export * from "./store";
export * from "./computed";
export * from "./diff";
export * from "./json";
export * from "./history";

// Add batch exports
export { isBatchActive } from "./batch";

// Export types
export type { Store, StoreState, StoreContextOptions } from "./store";
export type { ComputedValue } from "./computed";
export type { DiffResult } from "../types"; // Keep this one from root since we haven't moved types.ts yet
export type { HistoryEntry, HistoryOptions } from "./history";
