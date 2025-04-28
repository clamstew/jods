import { store, json, onUpdate, computed, history } from "../src/index";

// Create a counter store
const counter = store({
  count: 0,
  lastOperation: null as string | null,
});

// Add a computed property
counter.doubleCount = computed(() => counter.count * 2);

// Create a history tracker
const counterHistory = history(counter, {
  maxEntries: 10, // Keep only the last 10 states
  active: true, // Explicitly enable history tracking
});

// Log the current state
console.log("Initial state:", json(counter));

// Track changes to the counter
onUpdate(counter, (state) => {
  console.log("Counter updated:", json(state));
});

// Make some changes to the counter
counter.count += 1;
counter.lastOperation = "increment";

counter.count += 2;
counter.lastOperation = "increment by 2";

counter.count -= 1;
counter.lastOperation = "decrement";

// Print the history
console.log("\nHistory entries:");
const entries = counterHistory.getEntries();
entries.forEach((entry, index) => {
  console.log(`Entry ${index}:`, entry.state);
  if (entry.diff) {
    console.log(`Changes:`, entry.diff);
  }
});

// Time travel to the first state
console.log("\nTime travel to the first state:");
counterHistory.travelTo(0);
console.log("Current state after time travel:", json(counter));

// Time travel forward
console.log("\nTime travel forward one step:");
counterHistory.forward();
console.log("Current state after forward:", json(counter));

// Time travel to the latest state
console.log("\nTime travel to the latest state:");
counterHistory.travelTo(entries.length - 1);
console.log("Current state after going to latest:", json(counter));

// Create a function to demonstrate user interaction with time travel
function demo() {
  console.log("\n--- Time Travel Demo ---");

  // Make a new change
  counter.count = 100;
  counter.lastOperation = "set to 100";

  console.log("Current state:", json(counter));

  // Go back 2 steps
  console.log("\nGoing back 2 steps:");
  counterHistory.back();
  counterHistory.back();
  console.log("Current state:", json(counter));

  // Now make a change, which will erase the future history
  console.log("\nMaking a change at this point:");
  counter.count = 42;
  counter.lastOperation = "set to 42";
  console.log("Current state:", json(counter));

  // Check our history entries - the future states should be gone
  console.log("\nHistory entries after branching:");
  const entriesAfterBranch = counterHistory.getEntries();
  console.log(`History now has ${entriesAfterBranch.length} entries`);

  entriesAfterBranch.forEach((entry, index) => {
    console.log(`Entry ${index}:`, entry.state);
  });
}

// Run the demo
demo();
