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
 * Brand symbol for computed values (compile-time only)
 * @internal
 */
declare const ComputedBrand: unique symbol;

/**
 * Computed value type - designed for excellent DX!
 * 
 * This type is structured so that `ComputedValue<T>` is assignable to `T`,
 * meaning you can use computed properties just like regular values:
 * 
 * @example
 * ```ts
 * interface State {
 *   count: number;
 *   doubled?: ComputedValue<number>;
 * }
 * const s = store<State>({ count: 5 });
 * s.doubled = computed(() => s.count * 2);
 * 
 * // These all work with proper types!
 * console.log(s.doubled + 10);        // ✅ number operations work
 * console.log(s.doubled.toFixed(2));  // ✅ number methods work
 * ```
 * 
 * @public
 */
export type ComputedValue<T = any> = T & {
  /** @internal Brand to identify computed values */
  readonly [ComputedBrand]?: true;
  /** @internal The compute function (also callable at runtime) */
  (): T;
};

/**
 * Utility type to unwrap ComputedValue<T> to T
 * Used internally by Store types to provide correct access types
 * @public
 */
export type UnwrapComputedValue<T> = T extends ComputedValue<infer U> ? U : T;

/**
 * Utility type to unwrap all ComputedValue properties in an object type
 * @public  
 */
export type UnwrapComputedStore<T> = {
  [K in keyof T]: UnwrapComputedValue<T[K]>;
};

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
