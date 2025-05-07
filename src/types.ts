/**
 * Subscriber function type - called when state changes
 */
export type Subscriber<T> = (newState: T, oldState: T) => void;

/**
 * Unsubscribe function type - called to remove a subscriber
 */
export type Unsubscribe = () => void;

/**
 * Compute function type for calculated values
 */
export type ComputeFunction<T = any> = () => T;

/**
 * Diff result object that contains information about differences
 */
export interface DiffResult {
  [key: string]: any;
}
