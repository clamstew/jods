---
sidebar_position: 3
---

# Examples

Here are some practical examples showing how to use jods in different contexts.

## Basic Usage

This example demonstrates the core features of jods, including store creation, computed properties, change tracking, and JSON snapshots.

```ts
import { store, json, onUpdate, computed, diff } from "jods";

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

  oldState = json(newState); // Update oldState for next change
});

// Make some changes - each one triggers a separate onUpdate callback
user.firstName = "Burt Macklin";
user.notifications.push = true;
user.favorites.push("undercover missions");

// Show the final state
console.log(`Total updates triggered: ${updateCount}`);
console.log("Final state with computed values:", json(user));
```

## React Integration

This example shows how to use jods with React components using the `useJods` hook.

```tsx
import React, { ChangeEvent } from "react";
import { store, computed } from "jods";
import { useJods } from "jods/react";

// Define the User interface
interface User {
  firstName: string;
  lastName: string;
  occupation: string;
  isUndercover: boolean;
  skills: string[];
}

// Create a shared store
const userStore = store<User>({
  firstName: "Burt",
  lastName: "Macklin",
  occupation: "FBI",
  isUndercover: false,
  skills: ["investigation", "disguise"],
});

// Add computed properties
userStore.fullName = computed(
  () => `${userStore.firstName} ${userStore.lastName}`
);
userStore.displayTitle = computed(
  () =>
    `${userStore.fullName}, ${
      userStore.isUndercover ? "Undercover Agent" : userStore.occupation
    }`
);

// A component that displays user info
function UserProfile(): React.ReactElement {
  // Use the hook to get the latest state
  const user = useJods(userStore);

  return (
    <div className="user-profile">
      <h2>{user.displayTitle}</h2>

      <div className="user-skills">
        <h3>Skills:</h3>
        <ul>
          {user.skills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
        <button onClick={() => userStore.skills.push("surveillance")}>
          Add Surveillance Skill
        </button>
      </div>

      <div className="user-actions">
        <button onClick={() => (userStore.isUndercover = !user.isUndercover)}>
          {user.isUndercover ? "Blow Cover" : "Go Undercover"}
        </button>
      </div>
    </div>
  );
}

// A component that edits user info
function UserEditor(): React.ReactElement {
  const user = useJods(userStore);

  const handleFirstNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    userStore.firstName = e.target.value;
  };

  const handleLastNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    userStore.lastName = e.target.value;
  };

  return (
    <div className="user-editor">
      <h3>Edit Agent Profile</h3>
      <div>
        <label>
          First Name:
          <input
            type="text"
            value={user.firstName}
            onChange={handleFirstNameChange}
          />
        </label>
      </div>
      <div>
        <label>
          Last Name:
          <input
            type="text"
            value={user.lastName}
            onChange={handleLastNameChange}
          />
        </label>
      </div>
    </div>
  );
}

// Main app component
function App(): React.ReactElement {
  return (
    <div className="app">
      <h1>JODS React Example</h1>
      <UserProfile />
      <UserEditor />
    </div>
  );
}
```

## Using onUpdate for Event Handling

This example shows how to use the `onUpdate` function to track state changes.

```js
import { store, onUpdate } from "jods";

// Create a store
const todoStore = store({
  items: [],
  filter: "all",
});

// Add a task to the store
function addTask(title) {
  todoStore.items.push({
    id: Date.now(),
    title,
    completed: false,
  });
}

// Track changes and perform side effects
onUpdate(todoStore, (newState) => {
  // Save to localStorage whenever state changes
  localStorage.setItem("todos", JSON.stringify(newState.items));

  // You could also sync with a server, log changes, etc.
  console.log("Todo state updated:", newState);
});

// Add some tasks
addTask("Learn jods");
addTask("Build an app");
```

For more examples, check out the [GitHub repository](https://github.com/clamstew/jods/tree/main/examples).
