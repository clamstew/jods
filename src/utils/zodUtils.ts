/**
 * Utility functions for dynamically loading Zod
 * Allows for Zod to be a peer dependency and prevents bundling issues
 *
 * @knipIgnore These utilities are part of the internal API surface and are kept
 * for backward compatibility and future extensibility. Even though some functions
 * are not currently imported elsewhere, they provide a standardized interface for
 * interacting with Zod that may be used by downstream projects.
 */

/**
 * Dynamically loads Zod
 * @returns The Zod module or throws an error if not available
 * @public
 */
export function getZod() {
  try {
    // eslint-disable-next-line
    return require("zod");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error("Zod is required but could not be loaded");
  }
}

/**
 * Gets Zod's z object
 * @returns The z object from Zod
 * @public
 */
export function getZ() {
  return getZod().z;
}
