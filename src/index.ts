// Import and re-export core functionality only
export * from "./core";
export * from "./persist";
export * from "./sync";

// Export hooks
export { onUpdate } from "./core/life-cycle/on-update";

// Export types
export type {
  Subscriber,
  Unsubscribe,
  ComputeFunction,
  DiffResult,
} from "./types";
