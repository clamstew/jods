import { store, onUpdate, diff } from "../dist/index.js";

// Create a user store
const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
  age: 32,
});

// Subscribe with diff tracking
const unsubscribe = onUpdate(user, (newUserState, oldUserState) => {
  console.log("Previous state:", oldUserState);
  console.log("New state:", newUserState);

  // Using diff to track specific changes
  const changes = diff(oldUserState, newUserState);
  console.log("Changes:", changes);
});

// Make some changes
console.log("Changing firstName...");
user.firstName = "Burt Macklin";

console.log("\nChanging mood...");
user.mood = "sneaky";

console.log("\nChanging age...");
user.age = 33;

// Cleanup
unsubscribe();
