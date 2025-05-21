/**
 * Configurable debug utility for jods
 * Replaces direct console.log statements with a configurable system
 * that can be disabled in production or filtered by category
 */

export type DebugCategory =
  | "store"
  | "history"
  | "computed"
  | "diff"
  | "json"
  | "react"
  | "preact"
  | "remix"
  | "persist"
  | "sync"
  | "*";

export interface DebugOptions {
  enabled: boolean;
  categories: DebugCategory[];
}

// Default configuration
const defaultOptions: DebugOptions = {
  enabled: process.env.NODE_ENV !== "production" && !process.env.GITHUB_ACTIONS,
  categories: ["*"],
};

// Current configuration
let options = { ...defaultOptions };

/**
 * Debug utility for controlled logging
 */
export const debug = {
  /**
   * Configure the debug utility
   */
  configure(newOptions: Partial<DebugOptions>): void {
    options = { ...options, ...newOptions };
  },

  /**
   * Check if debugging is enabled for a category
   */
  isEnabled(category: DebugCategory): boolean {
    if (!options.enabled) return false;
    return (
      options.categories.includes("*") || options.categories.includes(category)
    );
  },

  /**
   * Log a message if debugging is enabled for the category
   */
  log(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      console.log(`[jods:${category}] ${message}`, ...args);
    }
  },

  /**
   * Log a warning if debugging is enabled for the category
   */
  warn(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      console.warn(`[jods:${category}] ${message}`, ...args);
    }
  },

  /**
   * Log an error if debugging is enabled for the category
   */
  error(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      console.error(`[jods:${category}] ${message}`, ...args);
    }
  },
};

// Enable for tests automatically
if (process.env.NODE_ENV === "test") {
  debug.configure({ enabled: true });
}

// Parse DEBUG environment variable if available
if (typeof process !== "undefined" && process.env.DEBUG) {
  if (process.env.DEBUG === "none") {
    debug.configure({ enabled: false });
  } else {
    const categories = process.env.DEBUG.split(",") as DebugCategory[];
    debug.configure({ categories });
  }
}
