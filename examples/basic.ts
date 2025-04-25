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

// Subscribe to changes
onUpdate(user, (newState) => {
  console.log("User updated!");
  console.log("Changes:", diff(oldState, newState));
  console.log("New state:", json(newState));
  // Expected output after firstName change:
  // User updated!
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

// Make some changes
user.firstName = "Burt Macklin";
user.notifications.push = true;
user.favorites.push("undercover missions");

// Show the final state
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
