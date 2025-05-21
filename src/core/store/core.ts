import { Signal, Subscriber } from "../../types";
// import { isComputed, ComputedValue } from "../computed"; // Removed as no longer used
import { Store, StoreContextOptions, StoreState, ProxyContext } from "./types";
import { debug, DebugCategory } from "../../utils/debug";

import { initializeStateAndSignals } from "./state";
import { SubscriptionContext } from "./subscription";
import { createProxyHandler } from "./proxy";
import {
  batch,
  beginBatch,
  commitBatch,
  BatchStoreContext,
  setIsReactContext,
} from "../batch";

// Store type definitions

// Framework context tracking
let reactContextGlobal = false;
const pendingChangesGlobal = new Map<string, any>();
let updateScheduledGlobal = false;

/**
 * Helper to trigger React-specific updates for useSyncExternalStore
 */
function triggerReactUpdateGlobal(changes: Map<string, any>) {
  for (const [key, value] of changes.entries()) {
    debug.log("store" as DebugCategory, `Batched change: ${key} = ${value}`);
  }
  // Actual React update logic would be here, e.g., via a scheduler or an external callback
}

function scheduleReactUpdate() {
  if (!updateScheduledGlobal && reactContextGlobal) {
    updateScheduledGlobal = true;
    Promise.resolve().then(() => {
      const changes = new Map(pendingChangesGlobal);
      pendingChangesGlobal.clear();
      triggerReactUpdateGlobal(changes);
      updateScheduledGlobal = false;
    });
  }
}

/**
 * Creates a reactive store with fine-grained updates via signals.
 * Properties track dependencies automatically; subscribers receive updates only for used properties.
 * @param initialState Initial store state
 * @param options Configuration options
 * @returns Mutable proxy object with Store interface
 */
export function createStore<T extends StoreState>(
  initialState: T,
  options: StoreContextOptions = {}
): T & Store<T> {
  reactContextGlobal =
    options.context === "react" || options.context === "remix";

  // Sync the React context status to the batch module
  setIsReactContext(reactContextGlobal);

  // Signals for reactive state
  const signals = new Map<string, Signal<any>>();
  // Keys that are getters that return computed values
  const definedComputedKeys = new Set<string>();

  // Initialize signals and computed properties
  initializeStateAndSignals(initialState, signals, definedComputedKeys);

  // Subscriber tracking
  const subscriberDeps = new Map<Subscriber<T>, Set<string>>();
  const allSubscribers = new Set<Subscriber<T>>();
  const trackingInProgress = new Set<Subscriber<T>>();
  const subscriberCallbacks = new Map<Subscriber<T>, () => void>();
  const callbackToSubscriber = new Map<() => void, Subscriber<T>>();
  const activeSubscriptions = new Set<Subscriber<T>>();
  const previousStateContainer = { value: {} as T };

  // Placeholder for the store proxy, which will be created below
  let storeProxy: T & Store<T>;

  // This context will be passed to the proxy handler.
  // It needs storeInstance, which is the proxy itself. We set it after the proxy is created.
  const liveProxyHandlerContext: ProxyContext<T> & {
    subscriptionContext: SubscriptionContext<T>;
  } = {
    signals,
    definedComputedKeys,
    subscriberDeps,
    previousStateContainer,
    reactContext: reactContextGlobal,
    pendingChanges: pendingChangesGlobal,
    scheduleReactUpdate,
    storeInstance: null as any, // Will be set to storeProxy later
    subscriptionContext: null as any, // Will be set later
  };

  const subscriptionCtx: SubscriptionContext<T> = {
    signals,
    definedComputedKeys,
    storeProxy: null as any, // Will be set to storeProxy later
    previousStateContainer,
    subscriberDeps,
    allSubscribers,
    trackingInProgress,
    subscriberCallbacks,
    callbackToSubscriber,
    activeSubscriptions,
    suppressNotifications: false, // Initialize explicitly
  };

  // Assign subscriptionContext to the liveProxyHandlerContext
  liveProxyHandlerContext.subscriptionContext = subscriptionCtx;

  const handler = createProxyHandler<T>(liveProxyHandlerContext);
  const proxyTarget = { ...initialState } as T;

  storeProxy = new Proxy(proxyTarget, handler) as T & Store<T>;

  // Now that storeProxy is created, set it in the contexts that need it.
  liveProxyHandlerContext.storeInstance = storeProxy;
  subscriptionCtx.storeProxy = storeProxy;

  // Initialize previousStateContainer with initial state
  previousStateContainer.value = { ...storeProxy };

  // Create the batch store context
  const batchStoreContext: BatchStoreContext<T> = {
    proxyContext: liveProxyHandlerContext,
    storeProxy,
  };

  // Add batch methods to store
  (storeProxy as any).batch = function <R>(fn: () => R, batchName?: string): R {
    return batch(batchStoreContext, fn, batchName);
  };

  (storeProxy as any).beginBatch = function (batchName?: string): void {
    beginBatch(batchStoreContext, batchName);
  };

  (storeProxy as any).commitBatch = function (): void {
    commitBatch();
  };

  return storeProxy;
}
