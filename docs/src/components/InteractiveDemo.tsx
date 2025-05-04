import React, { useEffect, useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import useIsBrowser from "@docusaurus/useIsBrowser";

// Import jods directly - we're now using the published v0.1.2
import { store, json, computed, onUpdate } from "jods";

// For TypeScript - define the shape of our jods store
interface UserStore {
  firstName: string;
  lastName: string;
  mood: string;
  fullName?: string;
  [key: string]: any;
}

export default function InteractiveDemo(): React.ReactElement {
  // Flag to determine if we're in browser environment
  const isClient = useIsBrowser();

  // State for our UI
  const [stateSnapshot, setStateSnapshot] = useState({
    firstName: "Burt",
    lastName: "Macklin",
    mood: "curious",
    fullName: "Burt Macklin",
  });

  // Reference to our store
  const [userStore, setUserStore] = useState<UserStore | null>(null);

  // Initialize jods only on the client-side to avoid SSR issues
  useEffect(() => {
    if (isClient && !userStore) {
      try {
        // Create our store with the actual jods library
        const user = store({
          firstName: stateSnapshot.firstName,
          lastName: stateSnapshot.lastName,
          mood: stateSnapshot.mood,
        });

        // Add computed property
        user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

        // Subscribe to changes
        onUpdate(user, (newState: UserStore) => {
          // Update our React state with the new store values
          // Handle the case where fullName might be undefined
          const snapshot = json(newState);
          setStateSnapshot({
            firstName: snapshot.firstName,
            lastName: snapshot.lastName,
            mood: snapshot.mood,
            fullName:
              snapshot.fullName || `${snapshot.firstName} ${snapshot.lastName}`,
          });
        });

        // Save reference to our store
        setUserStore(user);
      } catch (err) {
        console.error("Error initializing jods:", err);
      }
    }
  }, [isClient, userStore]);

  // Handle user input changes
  const handleInputChange = (field: string, value: string) => {
    if (userStore) {
      // With real jods - just update the store property
      // The onUpdate subscription will automatically update our React state
      userStore[field] = value;
    } else {
      // Fallback for initial render or when jods isn't loaded yet
      setStateSnapshot((prev) => ({
        ...prev,
        [field]: value,
        fullName:
          field === "firstName" || field === "lastName"
            ? `${field === "firstName" ? value : prev.firstName} ${
                field === "lastName" ? value : prev.lastName
              }`
            : prev.fullName,
      }));
    }
  };

  // Generate the code sample based on current state
  const code = `import { store, json, computed, onUpdate } from "jods";

// Create a reactive store
const user = store({
  firstName: "${stateSnapshot.firstName}",
  lastName: "${stateSnapshot.lastName}",
  mood: "${stateSnapshot.mood}"
});

// Add computed property that reacts to changes
user.fullName = computed(() => 
  \`\${user.firstName} \${user.lastName}\`
);

// Subscribe to changes
onUpdate(user, (newState) => {
  console.log("State updated:", json(newState));
});

// Get a JSON snapshot at any time
console.log(json(user));
/* Output: 
${JSON.stringify(
  {
    firstName: stateSnapshot.firstName,
    lastName: stateSnapshot.lastName,
    mood: stateSnapshot.mood,
    fullName: stateSnapshot.fullName,
  },
  null,
  2
)}
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
          Edit the values below and see how jods reactively updates and
          generates JSON snapshots
        </p>
        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 2rem",
            fontSize: "0.9rem",
            opacity: 0.7,
          }}
        >
          (This is a simulated demo - install jods in your project for the full
          reactive experience!)
        </p>

        <div className="demo-container">
          <div className="controls">
            <div className="control-group">
              <label>First Name</label>
              <input
                type="text"
                value={stateSnapshot.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Last Name</label>
              <input
                type="text"
                value={stateSnapshot.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Mood</label>
              <select
                value={stateSnapshot.mood}
                onChange={(e) => handleInputChange("mood", e.target.value)}
              >
                <option value="curious">Curious</option>
                <option value="sneaky">Sneaky</option>
                <option value="excited">Excited</option>
                <option value="focused">Focused</option>
              </select>
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
