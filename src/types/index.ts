/**
 * Subscriber function type - called when state changes
 * @public
 */
export type Subscriber<T = any> = (state: T, prevState?: T) => void;

/**
 * Unsubscribe function type - called to remove a subscriber
 * @public
 */
export type Unsubscribe = () => void;

/**
 * Compute function type for calculated values
 * @public
 */
export type ComputeFunction<T = any> = () => T;

/**
 * Computed value type
 * @public
 */
export type ComputedValue<T = any> = ComputeFunction<T>;

/**
 * Signal read function type
 * @public
 */
export type SignalReader<T> = () => T;

/**
 * Signal write function type
 * @public
 */
export type SignalWriter<T> = (value: T) => void;

/**
 * Signal tuple type [read, write]
 * @public
 */
export type Signal<T> = [SignalReader<T>, SignalWriter<T>];

/**
 * Diff result object that contains information about differences
 * @public
 */
export interface DiffResult {
  [key: string]: any;
}

/**
 * Type for stores that have computed properties
 * @public
 */
export type StoreWithComputed<T, C extends Record<string, any>> = T & {
  [K in keyof C]: ComputedValue<C[K]>;
};
