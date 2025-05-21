import { Store, StoreState } from "../store";
import { diff } from "../diff";
import { DiffResult } from "../../types";
import { debug } from "../../utils/debug";
import { HistoryEntry, HistoryOptions, IHistory } from "./types";

/**
 * History implementation providing time-travel capabilities for stores
 */
export class History<T extends StoreState> implements IHistory<T> {
  private entries: HistoryEntry<T>[] = [];
  private currentIndex: number = -1;
  private maxEntries: number;
  private throttleMs: number;
  private active: boolean;
  private debugEnabled: boolean;
  private unsubscribe: (() => void) | null = null;
  private store: T & Store<T>;
  private isTimeTraveling = false;
  // private lastUpdateTime = 0;
  // private pendingUpdate = false;
  // Keep track of last processed state to avoid duplicate entries
  private lastProcessedState: string = "";

  constructor(store: T & Store<T>, options: HistoryOptions = {}) {
    this.store = store;
    this.maxEntries = options.maxEntries || 50;
    this.throttleMs = options.throttleMs || 0;
    this.active = options.active ?? process.env.NODE_ENV !== "production";
    this.debugEnabled = options.debug ?? false;

    if (this.active) {
      // Record initial state immediately
      const initialState = store.getState();
      this.lastProcessedState = JSON.stringify(initialState);

      // Debug log
      if (this.debugEnabled) {
        debug.log("history", "Initial state:", initialState);
      }

      // Add initial state as first entry
      this.addEntry(initialState, null);

      // Subscribe to store changes - global subscriber to catch all signal changes
      this.unsubscribe = store.subscribe((newState, prevState) => {
        if (this.isTimeTraveling) {
          if (this.debugEnabled) {
            debug.log("history", "Ignoring update during time travel");
          }
          return;
        }

        // In signal-based store, we need to get the full state
        const currentState = store.getState();
        const currentStateJson = JSON.stringify(currentState);

        // Check if we've already processed this exact state to avoid duplicate entries
        if (currentStateJson === this.lastProcessedState) {
          if (this.debugEnabled) {
            debug.log("history", "Duplicate state detected, skipping");
          }
          return;
        }

        if (this.debugEnabled) {
          debug.log(
            "history",
            "Store updated:",
            currentState,
            "Previous:",
            prevState
          );
        }

        // Update the last processed state
        this.lastProcessedState = currentStateJson;

        // Capture current state
        this.captureCurrentState(prevState);
      });
    }
  }

  // Capture the current state and add it to history if it's different
  private captureCurrentState(prevState?: T): void {
    // Get current state
    const currentState = this.store.getState();

    if (this.debugEnabled) {
      debug.log("history", "Capturing state:", currentState);
    }

    // Find last entry or use prevState
    const previousEntry =
      this.entries.length > 0 ? this.entries[this.currentIndex] : null;

    const previousState =
      prevState || (previousEntry ? previousEntry.state : null);

    if (!previousState) {
      if (this.debugEnabled) {
        debug.log("history", "No previous state, adding entry directly");
      }
      this.addEntry(currentState, null);
      return;
    }

    // Normal mode - check if state actually changed
    const currentJson = JSON.stringify(currentState);
    const prevJson = JSON.stringify(previousState);

    if (currentJson === prevJson) {
      if (this.debugEnabled) {
        debug.log("history", "State unchanged, skipping");
      }
      return;
    }

    // Calculate diff
    const diffResult = diff(previousState, currentState);

    if (this.debugEnabled) {
      debug.log("history", "Adding entry with diff:", diffResult);
    }

    // Add new entry
    this.addEntry(currentState, diffResult as DiffResult);
  }

  private addEntry(state: T, diffObj: DiffResult | null): void {
    // Create a deep clone of the state to ensure immutability
    const stateCopy = JSON.parse(JSON.stringify(state));

    const entry: HistoryEntry<T> = {
      state: stateCopy,
      timestamp: Date.now(),
    };

    if (diffObj) {
      entry.diff = diffObj;
    }

    // If we're in the middle of the history, truncate future entries
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    // Add the new entry
    this.entries.push(entry);
    this.currentIndex = this.entries.length - 1;

    if (this.debugEnabled) {
      debug.log("history", `Added entry ${this.currentIndex}:`, entry);
      debug.log("history", `Total entries: ${this.entries.length}`);
    }

    // Regular behavior - Remove oldest entries if we exceed maxEntries
    if (this.entries.length > this.maxEntries) {
      const overflow = this.entries.length - this.maxEntries;
      this.entries = this.entries.slice(overflow);
      this.currentIndex = this.entries.length - 1;

      if (this.debugEnabled) {
        debug.log("history", `Removed ${overflow} oldest entries`);
      }
    }
  }

  /**
   * Travel to a specific point in history
   */
  travelTo(index: number): void {
    if (
      index < 0 ||
      index >= this.entries.length ||
      index === this.currentIndex ||
      !this.active
    ) {
      if (this.debugEnabled) {
        debug.log("history", `Invalid travel to ${index}`);
      }
      return;
    }

    this.isTimeTraveling = true;

    try {
      const targetEntry = this.entries[index];

      if (this.debugEnabled) {
        debug.log("history", `Traveling to index ${index}:`, targetEntry.state);
      }

      // Create clean copy to avoid reference issues
      const stateCopy = JSON.parse(JSON.stringify(targetEntry.state));

      // Update store state
      this.store.setState(stateCopy);

      // Update last processed state to avoid duplicate entries
      this.lastProcessedState = JSON.stringify(stateCopy);

      // Update the current index
      this.currentIndex = index;
    } catch (error) {
      debug.error("history", "Travel error:", error);
    } finally {
      // Use setTimeout to ensure this happens after any state updates
      setTimeout(() => {
        this.isTimeTraveling = false;
        if (this.debugEnabled) {
          debug.log("history", "Time travel complete");
        }
      }, 10);
    }
  }

  /**
   * Go back one step in history
   */
  back(): void {
    if (this.currentIndex > 0) {
      if (this.debugEnabled) {
        debug.log(
          "history",
          `Going back from ${this.currentIndex} to ${this.currentIndex - 1}`
        );
      }
      this.travelTo(this.currentIndex - 1);
    }
  }

  /**
   * Go forward one step in history
   */
  forward(): void {
    if (this.currentIndex < this.entries.length - 1) {
      if (this.debugEnabled) {
        debug.log(
          "history",
          `Going forward from ${this.currentIndex} to ${this.currentIndex + 1}`
        );
      }
      this.travelTo(this.currentIndex + 1);
    }
  }

  /**
   * Get all history entries
   */
  getEntries(): HistoryEntry<T>[] {
    return this.entries;
  }

  /**
   * Get the current index in history
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Clear all history entries except the current one
   */
  clear(): void {
    if (this.currentIndex >= 0) {
      const currentEntry = this.entries[this.currentIndex];
      this.entries = [currentEntry];
      this.currentIndex = 0;

      if (this.debugEnabled) {
        debug.log("history", "Cleared all entries except current");
      }
    } else {
      this.entries = [];
      this.currentIndex = -1;

      if (this.debugEnabled) {
        debug.log("history", "Cleared all entries");
      }
    }
  }

  /**
   * Remove subscription to store updates
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;

      if (this.debugEnabled) {
        debug.log("history", "Destroyed");
      }
    }
  }
}
