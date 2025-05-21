/**
 * Batch Functionality Example
 *
 * This example demonstrates how to use jods batch functionality
 * to optimize state updates and reduce the number of notifications.
 */
import { store, onUpdate } from "../src";

// Create a test store with multiple fields
const userStore = store({
  name: "John Doe",
  email: "john@example.com",
  preferences: {
    theme: "light",
    notifications: true,
    fontSize: 14,
  },
  lastLogin: new Date().toISOString(),
});

// Add a subscription to track updates
const unsubscribe = onUpdate(userStore, (newState) => {
  console.log("User state updated:", newState);
  console.log("Current theme:", newState.preferences.theme);
  console.log("------");
});

// Without batching - each change triggers a separate notification
console.log("--- WITHOUT BATCHING ---");
userStore.name = "Jane Doe"; // First update
userStore.email = "jane@example.com"; // Second update
userStore.preferences.theme = "dark"; // Third update

// With functional batching - all changes are applied in a single update
console.log("\n--- WITH FUNCTIONAL BATCHING ---");
userStore.batch(() => {
  userStore.name = "Alice Smith";
  userStore.email = "alice@example.com";
  userStore.preferences.theme = "system";
  userStore.preferences.fontSize = 16;
}, "update-profile"); // Only one update

// With manual batching - useful for cases where operations might happen over time
console.log("\n--- WITH MANUAL BATCHING ---");
userStore.beginBatch("multi-step-update");

// These operations don't trigger notifications yet
userStore.name = "Bob Johnson";
userStore.email = "bob@example.com";

// Simulate async operation
setTimeout(() => {
  // These still don't trigger notifications
  userStore.preferences.theme = "light";
  userStore.preferences.notifications = false;

  // Now apply all changes and notify subscribers once
  userStore.commitBatch();
}, 1000);

// Clean up
setTimeout(() => {
  unsubscribe();
  console.log("Subscription removed");
}, 2000);

// Output should show:
// - Three separate updates without batching
// - One combined update with functional batching
// - One combined update with manual batching (after timeout)
