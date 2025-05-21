import { StoreState } from "../store";
import { DiffResult } from "../../types";

/**
 * History entry storing a state snapshot with timestamp and diff info
 */
export interface HistoryEntry<T extends StoreState> {
  state: T;
  timestamp: number;
  diff?: DiffResult;
}

/**
 * Configuration options for history module
 */
export interface HistoryOptions {
  maxEntries?: number;
  active?: boolean;
  throttleMs?: number;
  debug?: boolean;
}

/**
 * History interface defining time-travel capabilities
 */
export interface IHistory<T extends StoreState> {
  travelTo(index: number): void;
  back(): void;
  forward(): void;
  getEntries(): HistoryEntry<T>[];
  getCurrentIndex(): number;
  clear(): void;
  destroy(): void;
}
