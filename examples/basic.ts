import { store, json, onUpdate, computed, diff } from "../dist/index.js";

// Define the User interface
interface User {
  firstName: string;
  lastName: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  favorites: string[];
  // Don't specify the type for fullName, let TypeScript infer it
}

// Create a user store
const user = store<User>({
  firstName: "Burt",
  lastName: "Macklin",
  email: "Burt.Macklin@FBI.confidential",
  notifications: {
    email: true,
    push: false,
  },
  favorites: [],
});

// Add a computed property
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Get a JSON snapshot
console.log("Initial state:", json(user));
// Expected output:
// Initial state: {
//   firstName: 'Burt',
//   lastName: 'Macklin',
//   email: 'Burt.Macklin@FBI.confidential',
//   notifications: { email: true, push: false },
//   favorites: [],
//   fullName: 'Burt Macklin'
// }

// Create a reference to previous state
let oldState = json(user);

// Track update count to demonstrate granular updates
let updateCount = 0;

// Subscribe to changes - onUpdate fires ONCE for EACH property change
onUpdate(user, (newState) => {
  updateCount++;
  console.log(`User updated! (Update #${updateCount})`);
  console.log("Changes:", diff(oldState, newState));
  console.log("New state:", json(newState));
  // Each property change will trigger a separate update!
  // Example for firstName change (first update):
  // User updated! (Update #1)
  // Changes: {
  //   firstName: { __old: 'Burt', __new: 'Burt Macklin' },
  //   fullName: { __old: 'Burt Macklin', __new: 'Burt Macklin Macklin' }
  // }
  // New state: {
  //   firstName: 'Burt Macklin',
  //   lastName: 'Macklin',
  //   email: 'Burt.Macklin@FBI.confidential',
  //   notifications: { email: true, push: false },
  //   favorites: [],
  //   fullName: 'Burt Macklin Macklin'
  // }

  oldState = json(newState); // Update oldState for next change
});

// Make some changes - each one triggers a separate onUpdate callback
console.log("\n--- Making 3 changes, expect 3 separate updates ---\n");
user.firstName = "Burt Macklin";
user.notifications.push = true;
user.favorites.push("undercover missions");

// Show the final state
console.log(`\nTotal updates triggered: ${updateCount}`);
console.log("Final state with computed values:", json(user));
// Expected output:
// Final state with computed values: {
//   firstName: 'Burt Macklin',
//   lastName: 'Macklin',
//   email: 'Burt.Macklin@FBI.confidential',
//   notifications: { email: true, push: true },
//   favorites: [ 'undercover missions' ],
//   fullName: 'Burt Macklin Macklin'
// }
