// src/core/store/store.test-hook-harness.ts
import { Subscriber } from "../../types";
import { StoreState } from "../../core/store/types"; // Assuming StoreState might be used by hooks or is a common type

// Minimal logger for this standalone file, or could import debug if no circular deps
const debugWarn = (message: string) => console.warn(message);
const debugError = (message: string) => console.error(message);

/**
 * Interface for internal test hooks.
 */
export interface InternalTestHooks<T extends StoreState = StoreState> {
  onTrackingCallbackDependencies?: (
    subscriber: Subscriber<T>,
    deps: Set<string>,
    storeAccessors: {
      isTestSubscriber: (sub: Subscriber<T>, mode?: any) => boolean;
      getTestDependencies: (sub: Subscriber<T>) => string[] | undefined;
      StoreTestModeEnum: any; // Actual StoreTestMode enum
    }
  ) => void;

  onInitialSubscription?: (
    subscriber: Subscriber<T>,
    deps: Set<string>,
    currentState: T,
    actions: {
      setCurrentSubscriber: (fn: (() => void) | null) => void;
      callOriginalSubscriber: (state: T, prevState?: T) => void;
      addGlobalSubscriber: (sub: Subscriber<T>) => void;
      getTrackingCallback: () => () => void;
    },
    storeAccessors: {
      isTestSubscriber: (sub: Subscriber<T>, mode?: any) => boolean;
      getTestDependencies: (sub: Subscriber<T>) => string[] | undefined;
      StoreTestModeEnum: any;
    }
  ) => { handledByTest: boolean };

  filterSubscriberNotification?: (
    subscriber: Subscriber<T>,
    notificationArgs: {
      key: string;
      currentState: T;
      previousState: T;
      isGlobal: boolean;
      deps?: Set<string>;
    },
    storeAccessors: {
      isTestSubscriber: (sub: Subscriber<T>, mode?: any) => boolean;
      getTestDependencies: (sub: Subscriber<T>) => string[] | undefined;
      StoreTestModeEnum: any;
    }
  ) => { skip: boolean };

  onComputedPropertyAdded?: (
    key: string,
    value: any, // This is the computed function itself
    storeAccessors: {
      getCurrentSubscriber: () => (() => void) | null;
      setCurrentSubscriber: (fn: (() => void) | null) => void;
    }
  ) => void;
}

/**
 * The active test hooks. This is intentionally exported so that core.ts can read it,
 * but it should only be modified by _setStoreTestHooks_FOR_TESTING_ONLY.
 */
export let activeTestHooks: InternalTestHooks<any> | null = null;

/**
 * (FOR TESTING ONLY) Sets active test hooks for the store.
 * This function should only be called by test adapters and is intended to be
 * removed from production bundles via dead code elimination along with activeTestHooks itself.
 * @param hooks - The test hooks to activate, or null to deactivate.
 */
export function _setStoreTestHooks_FOR_TESTING_ONLY(
  hooks: InternalTestHooks<any> | null
): void {
  if (process.env.NODE_ENV === "test") {
    activeTestHooks = hooks;
  } else {
    activeTestHooks = null;
    if (hooks !== null && process.env.NODE_ENV !== "production") {
      debugWarn(
        "_setStoreTestHooks_FOR_TESTING_ONLY was called in a non-test (development?) environment. Hooks will not be activated unless NODE_ENV is 'test'."
      );
    } else if (hooks !== null && process.env.NODE_ENV === "production") {
      debugError(
        "CRITICAL: _setStoreTestHooks_FOR_TESTING_ONLY was called in a PRODUCTION environment. This should NOT happen. Hooks will NOT be activated."
      );
    }
  }
}
