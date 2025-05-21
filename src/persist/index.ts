export { persist } from "./core";
export {
  clearPersisted,
  getPersisted,
  isPersistAvailable,
  saveStateToStorage, // Exporting for advanced use or testing
  loadDataAsync, // Exporting for advanced use or testing
  loadDataSync, // Exporting for advanced use or testing
} from "./storage";
export {
  isPersistStorage,
  isPersisted,
  getPersistMeta,
  defaultErrorHandler, // Exporting for customization
  PERSIST_SYMBOL as _INTERNAL_PERSIST_SYMBOL_DO_NOT_USE_DIRECTLY,
} from "./utils";
export {
  NEVER_PERSIST,
  ALWAYS_PERSIST,
  shouldPersistProperty, // Potentially useful for custom persistence logic
  applySecurityFiltering, // Potentially useful for custom persistence logic
  filterNestedObject, // Potentially useful for custom persistence logic
} from "./security";
export type {
  PersistStorage,
  PersistOperation,
  VersionedState,
  PersistOptions,
  PersistMeta,
} from "./types";

// Export all storage adapters
export * from "./adapters";
