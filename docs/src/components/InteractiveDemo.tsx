import React, { useState, useEffect } from "react";
import CodeBlock from "@theme/CodeBlock";

// Import only jods core
import { store, json, computed, onUpdate } from "jods";

// Initialize a store outside the component to persist between renders
const userStore = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Add computed property
userStore.fullName = computed(
  () => `${userStore.firstName} ${userStore.lastName}`
);

// Create a custom hook that uses useState and useEffect instead of useSyncExternalStore
function useJodsState(jodsStore) {
  const [state, setState] = useState(() => ({ ...json(jodsStore) }));

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = onUpdate(jodsStore, () => {
      setState({ ...json(jodsStore) });
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, [jodsStore]);

  return state;
}

export default function InteractiveDemo(): React.ReactElement {
  // Use our custom hook instead of useJods
  const user = useJodsState(userStore);

  // Handle user input changes - directly update the store
  const handleInputChange = (field: string, value: string) => {
    userStore[field] = value;
  };

  // Get a JSON snapshot for display
  const snapshot = json(userStore);

  // Generate the code sample based on current state
  const code = `import { store, json, computed } from "jods";
import { useJods } from "jods/react";

// Create a reactive store
const user = store({
  firstName: "${user.firstName}",
  lastName: "${user.lastName}",
  mood: "${user.mood}"
});

// Add computed property
user.fullName = computed(() => 
  \`\${user.firstName} \${user.lastName}\`
);

// Use in a React component with the useJods hook
function UserProfile() {
  // Get the reactive state - auto-updates when store changes
  const userData = useJods(user);
  
  return (
    <div>
      <h2>{userData.fullName}</h2>
      <p>Mood: {userData.mood}</p>
    </div>
  );
}

// Get a JSON snapshot at any time
console.log(json(user));
/* Output: 
${JSON.stringify(snapshot, null, 2)}
*/`;

  return (
    <section
      className="features-container"
      id="try-jods-live"
      data-testid="jods-try-live-section"
    >
      <div className="container">
        <h2 className="section-title">
          🚀 Try jods <span className="gradient-text">live</span> 🧑‍💻
        </h2>
        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 1rem",
          }}
        >
          Edit the values below and see how jods reactively updates with the
          built-in React integration
        </p>

        <div className="demo-container">
          <div className="controls">
            <div className="control-group">
              <label>👤 First Name</label>
              <input
                type="text"
                value={user.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>👪 Last Name</label>
              <input
                type="text"
                value={user.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>🎭 Mood</label>
              <select
                value={user.mood}
                onChange={(e) => handleInputChange("mood", e.target.value)}
              >
                <option value="curious">😮 Curious</option>
                <option value="sneaky">😏 Sneaky</option>
                <option value="excited">🤩 Excited</option>
                <option value="focused">🧐 Focused</option>
              </select>
            </div>

            <div className="instruction-box">
              <p
                className="instruction-text"
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  lineHeight: 1.7,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontWeight: 700,
                  }}
                >
                  <span className="instruction-icon">✨</span>
                  <span>Go ahead and change these values!</span>
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontWeight: 700,
                  }}
                >
                  <span className="instruction-icon">🔍</span>
                  <span>Then explore the rest of the docs...</span>
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 700,
                  }}
                >
                  <span className="instruction-icon">🪄</span>
                  <span>Your changes will be here when you return!</span>
                </span>
              </p>
            </div>
          </div>

          <div className="code-preview">
            <CodeBlock language="jsx">{code}</CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}
