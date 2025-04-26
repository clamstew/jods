import { store, json, onUpdate, computed } from "../dist/index.js";

// Create a user store
const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Track update count to demonstrate granular updates
let updateCount = 0;

// Subscribe to changes - onUpdate fires ONCE for EACH property change
onUpdate(user, (newState) => {
  updateCount++;
  console.log(`Update #${updateCount} triggered`);
  console.log("Current state:", json(newState));
  console.log("----------------------------");
});

console.log("Initial state:", json(user));
console.log("\n--- Making 3 changes, expect 3 separate updates ---\n");

// Each of these changes should trigger a separate update
user.firstName = "Burt Macklin";
user.mood = "sneaky";
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(`\nTotal updates triggered: ${updateCount}`);
console.log("Final state:", json(user));
