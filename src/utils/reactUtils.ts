/**
 * Utility functions for dynamically loading React
 * Allows for React to be a peer dependency and prevents bundling issues
 */

// Types for React hooks we need
type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;
type UseStateHook = <S>(
  initialState: S | (() => S)
) => [S, Dispatch<SetStateAction<S>>];
type UseEffectHook = (
  effect: () => void | (() => void),
  deps?: ReadonlyArray<any>
) => void;
type UseMemoHook = <T>(
  factory: () => T,
  deps: ReadonlyArray<any> | undefined
) => T;
type UseRefHook = <T>(initialValue: T) => { current: T };
type UseSyncExternalStoreType = <T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
) => T;

/**
 * Dynamically loads React
 * @returns The React module or throws an error if not available
 */
export function getReact() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("React is required but could not be loaded");
  }
}

/**
 * Gets React's useState hook
 * @returns The useState hook
 */
export function getUseState(): UseStateHook {
  return getReact().useState;
}

/**
 * Gets React's useEffect hook
 * @returns The useEffect hook
 */
export function getUseEffect(): UseEffectHook {
  return getReact().useEffect;
}

/**
 * Gets React's useMemo hook
 * @returns The useMemo hook
 */
export function getUseMemo(): UseMemoHook {
  return getReact().useMemo;
}

/**
 * Gets React's useRef hook
 * @returns The useRef hook
 */
export function getUseRef(): UseRefHook {
  return getReact().useRef;
}

/**
 * Gets React's createElement function
 * @returns The createElement function
 */
export function getCreateElement() {
  return getReact().createElement;
}

/**
 * Gets React's useSyncExternalStore hook with fallback for older React versions
 * @internal Utility function for React integration
 * @returns A function that works like useSyncExternalStore
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getUseSyncExternalStore(): UseSyncExternalStoreType {
  const React = getReact();

  // Return useSyncExternalStore if available (React 18+)
  if (typeof React.useSyncExternalStore === "function") {
    return React.useSyncExternalStore;
  }

  // Try experimental version (React 17 with experimental features)
  if (typeof React.unstable_useSyncExternalStore === "function") {
    return React.unstable_useSyncExternalStore;
  }

  // Create fallback implementation for React < 18
  return function syncExternalStoreFallback<T>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => T
  ): T {
    const useState = getUseState();
    const useEffect = getUseEffect();

    const [state, setState] = useState(getSnapshot());

    useEffect(() => {
      const handleChange = () => {
        setState(getSnapshot());
      };
      const unsubscribe = subscribe(handleChange);
      return unsubscribe;
    }, [subscribe, getSnapshot]);

    return state;
  };
}

/**
 * Gets the basic React hooks needed for a component
 * @returns Object containing common React hooks
 */
export function getBasicHooks() {
  return {
    useState: getUseState(),
    useEffect: getUseEffect(),
    useMemo: getUseMemo(),
    useRef: getUseRef(),
  };
}
