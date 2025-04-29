/**
 * Subscriber function type - called when state changes
 */
export type Subscriber<T> = (state: T) => void;

/**
 * Unsubscribe function type - called to remove a subscriber
 */
export type Unsubscribe = () => void;

/**
 * Compute function type for calculated values
 */
export type ComputeFunction<T = any> = () => T;

/**
 * Signal read function type
 */
export type SignalReader<T> = () => T;

/**
 * Signal write function type
 */
export type SignalWriter<T> = (value: T) => void;

/**
 * Signal tuple type [read, write]
 */
export type Signal<T> = [SignalReader<T>, SignalWriter<T>];

/**
 * Diff result object that contains information about differences
 */
export interface DiffResult {
  [key: string]: any;
}
