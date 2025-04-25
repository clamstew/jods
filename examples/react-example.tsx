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

// Add computed property
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
  // Get the latest state
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

// Main app component using the store
export function App(): React.ReactElement {
  return (
    <div className="app">
      <h1>JODS React Example</h1>
      <UserProfile />
      <UserEditor />
    </div>
  );
}
