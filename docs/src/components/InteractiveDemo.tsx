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
    <section className="features-container" id="try-jods-live">
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
              <label
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "8px",
                  fontWeight: "600",
                  display: "block",
                }}
              >
                👤 First Name
              </label>
              <input
                type="text"
                value={user.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                style={{
                  borderRadius: "12px",
                  padding: "16px 18px",
                  border: "2px solid var(--ifm-color-primary-lightest)",
                  background: "rgba(var(--ifm-color-primary-rgb), 0.05)",
                  transition: "all 0.2s ease",
                  fontSize: "1.2rem",
                  width: "100%",
                  marginBottom: "20px",
                }}
              />
            </div>

            <div className="control-group">
              <label
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "8px",
                  fontWeight: "600",
                  display: "block",
                }}
              >
                👪 Last Name
              </label>
              <input
                type="text"
                value={user.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                style={{
                  borderRadius: "12px",
                  padding: "16px 18px",
                  border: "2px solid var(--ifm-color-primary-lightest)",
                  background: "rgba(var(--ifm-color-primary-rgb), 0.05)",
                  transition: "all 0.2s ease",
                  fontSize: "1.2rem",
                  width: "100%",
                  marginBottom: "20px",
                }}
              />
            </div>

            <div className="control-group">
              <label
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "8px",
                  fontWeight: "600",
                  display: "block",
                }}
              >
                🎭 Mood
              </label>
              <select
                value={user.mood}
                onChange={(e) => handleInputChange("mood", e.target.value)}
                style={{
                  borderRadius: "12px",
                  padding: "16px 18px",
                  border: "2px solid var(--ifm-color-primary-lightest)",
                  background: "rgba(var(--ifm-color-primary-rgb), 0.05)",
                  transition: "all 0.2s ease",
                  appearance: "none",
                  backgroundImage:
                    'url(\'data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4"><path fill="%236b3369" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.6 5.4-7.9 5.4-12.9 0-5-1.9-9.2-5.5-12.7z"/></svg>\')',
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 18px center",
                  backgroundSize: "16px",
                  paddingRight: "42px",
                  fontSize: "1.2rem",
                  width: "100%",
                  marginBottom: "20px",
                }}
              >
                <option value="curious">😮 Curious</option>
                <option value="sneaky">😏 Sneaky</option>
                <option value="excited">🤩 Excited</option>
                <option value="focused">🧐 Focused</option>
              </select>
            </div>

            <div
              className="instruction-box"
              style={{
                marginTop: "2rem",
                padding: "20px 24px",
                background:
                  "linear-gradient(135deg, rgba(var(--ifm-color-primary-rgb), 0.1), rgba(var(--ifm-color-primary-rgb), 0.2))",
                borderRadius: "14px",
                borderLeft: "4px solid var(--ifm-color-primary)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
              }}
            >
              <p
                className="instruction-text"
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  color: "var(--ifm-color-primary-darker)",
                  lineHeight: "1.8",
                }}
              >
                ✨ Go ahead and change these values! <br />
                🔍 Then explore the rest of the docs... <br />
                🪄 Your changes will be here when you return!
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
