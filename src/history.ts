import { Store, StoreState } from "./store";
import { json } from "./json";
import { diff } from "./diff";
import { onUpdate } from "./hooks";
import { Subscriber, DiffResult } from "./types";

export interface HistoryEntry<T extends StoreState> {
  state: T;
  timestamp: number;
  diff?: Record<string, any>;
}

export interface HistoryOptions {
  maxEntries?: number;
  active?: boolean;
}

export class History<T extends StoreState> {
  private entries: HistoryEntry<T>[] = [];
  private currentIndex: number = -1;
  private maxEntries: number;
  private active: boolean;
  private unsubscribe: (() => void) | null = null;
  private store: T & Store<T>;
  private isTimeTraveling = false;

  constructor(store: T & Store<T>, options: HistoryOptions = {}) {
    this.store = store;
    this.maxEntries = options.maxEntries || 50;
    this.active = options.active ?? process.env.NODE_ENV !== "production";

    if (this.active) {
      // Capture initial state
      this.addEntry(json(store), null);

      // Subscribe to changes
      this.unsubscribe = onUpdate(store, ((newState: T) => {
        if (!this.isTimeTraveling) {
          // Get the old state from the latest entry, if available
          const oldState =
            this.entries.length > 0
              ? this.entries[this.currentIndex].state
              : null;
          const diffResult = oldState ? diff(oldState, newState) : null;
          this.addEntry(
            json(newState) as T,
            diffResult as Record<string, any> | null
          );
        }
      }) as Subscriber<T>);
    }
  }

  private addEntry(state: T, diffObj: Record<string, any> | null): void {
    const entry: HistoryEntry<T> = {
      state,
      timestamp: Date.now(),
      diff: diffObj || undefined,
    };

    // If we're not at the end of the history (due to time travel)
    // remove all future entries
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    // Add new entry and update index
    this.entries.push(entry);
    this.currentIndex = this.entries.length - 1;

    // Remove oldest entries if we exceed maxEntries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
      this.currentIndex--;
    }
  }

  /**
   * Travel to a specific point in time
   * @param index The history index to travel to
   */
  travelTo(index: number): void {
    if (index < 0 || index >= this.entries.length || !this.active) {
      return;
    }

    this.isTimeTraveling = true;
    const targetState = this.entries[index].state;

    // Apply the historical state to the store
    Object.keys(this.store).forEach((key) => {
      if (typeof this.store[key] !== "function") {
        // @ts-expect-error - We know this is a valid key but TypeScript doesn't
        this.store[key] = targetState[key];
      }
    });

    this.currentIndex = index;
    this.isTimeTraveling = false;
  }

  /**
   * Go back one step in history
   */
  back(): void {
    if (this.currentIndex > 0) {
      this.travelTo(this.currentIndex - 1);
    }
  }

  /**
   * Go forward one step in history
   */
  forward(): void {
    if (this.currentIndex < this.entries.length - 1) {
      this.travelTo(this.currentIndex + 1);
    }
  }

  /**
   * Get all history entries
   */
  getEntries(): HistoryEntry<T>[] {
    return [...this.entries];
  }

  /**
   * Get the current index in history
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Clear all history
   */
  clear(): void {
    // Keep only the latest entry
    if (this.entries.length > 0) {
      const latestEntry = this.entries[this.currentIndex];
      this.entries = [latestEntry];
      this.currentIndex = 0;
    }
  }

  /**
   * Destroy this history instance, unsubscribing from updates
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

/**
 * Create a history tracker for a store
 * @param store The store to track
 * @param options History options
 * @returns A history instance
 */
export function history<T extends StoreState>(
  store: T & Store<T>,
  options?: HistoryOptions
): History<T> {
  return new History(store, options);
}
