import React, { useState, useEffect } from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./InteractiveDemo.module.css";

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
  const [activeTab, setActiveTab] = useState("setup");

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

  const moodEmojis = {
    curious: "😮",
    sneaky: "😏",
    excited: "🤩",
    focused: "🧐",
  };

  const tabContent = {
    setup: (
      <>
        <h3 className={styles.stepTitle}>Step 1: Setup your jods store</h3>
        <p className={styles.stepDescription}>
          Create a store that contains reactive state for your application.
        </p>
        <div className={styles.inputGroup}>
          <div className={styles.inputContainer}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={user.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className={styles.textInput}
            />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={user.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className={styles.textInput}
            />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="mood">Current Mood</label>
            <select
              id="mood"
              value={user.mood}
              onChange={(e) => handleInputChange("mood", e.target.value)}
              className={styles.selectInput}
            >
              <option value="curious">Curious 😮</option>
              <option value="sneaky">Sneaky 😏</option>
              <option value="excited">Excited 🤩</option>
              <option value="focused">Focused 🧐</option>
            </select>
          </div>
        </div>
        <div className={styles.nextStepButtonContainer}>
          <button
            className={styles.nextStepButton}
            onClick={() => setActiveTab("computed")}
          >
            Next: Computed Values
          </button>
        </div>
      </>
    ),
    computed: (
      <>
        <h3 className={styles.stepTitle}>Step 2: Add computed values</h3>
        <p className={styles.stepDescription}>
          Derive new values from your store state automatically.
        </p>
        <div className={styles.computedPreview}>
          <div className={styles.computedCode}>
            <CodeBlock language="jsx">{`user.fullName = computed(() => 
  \`\${user.firstName} \${user.lastName}\`
);`}</CodeBlock>
          </div>
          <div className={styles.computedResult}>
            <div className={styles.resultLabel}>Computed Result:</div>
            <div className={styles.resultValue}>
              {user.fullName}{" "}
              <span className={styles.moodEmoji}>{moodEmojis[user.mood]}</span>
            </div>
          </div>
        </div>
        <div className={styles.stepNavigation}>
          <button
            className={styles.prevStepButton}
            onClick={() => setActiveTab("setup")}
          >
            Previous: Setup
          </button>
          <button
            className={styles.nextStepButton}
            onClick={() => setActiveTab("react")}
          >
            Next: React Integration
          </button>
        </div>
      </>
    ),
    react: (
      <>
        <h3 className={styles.stepTitle}>Step 3: Use in React components</h3>
        <p className={styles.stepDescription}>
          Integrate your jods store with React using the useJods hook.
        </p>
        <div className={styles.reactExample}>
          <div className={styles.codeContainer}>
            <CodeBlock language="jsx">{`// React component with jods integration
function UserProfile() {
  // Auto-updates when store changes
  const userData = useJods(user);
  
  return (
    <div>
      <h2>{userData.fullName}</h2>
      <p>Mood: {userData.mood}</p>
    </div>
  );
}`}</CodeBlock>
          </div>
          <div className={styles.componentPreview}>
            <div className={styles.previewHeader}>Component Preview</div>
            <div className={styles.previewContent}>
              <h2 className={styles.previewTitle}>{user.fullName}</h2>
              <p className={styles.previewSubtitle}>
                Mood: {user.mood} {moodEmojis[user.mood]}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.stepNavigation}>
          <button
            className={styles.prevStepButton}
            onClick={() => setActiveTab("computed")}
          >
            Previous: Computed Values
          </button>
          <button
            className={styles.nextStepButton}
            onClick={() => setActiveTab("json")}
          >
            Next: JSON Snapshots
          </button>
        </div>
      </>
    ),
    json: (
      <>
        <h3 className={styles.stepTitle}>Step 4: Create JSON snapshots</h3>
        <p className={styles.stepDescription}>
          Generate serializable snapshots of your store at any time.
        </p>
        <div className={styles.jsonExample}>
          <div className={styles.codeContainer}>
            <CodeBlock language="jsx">{`// Get a clean JSON snapshot
const snapshot = json(user);
console.log(snapshot);`}</CodeBlock>
          </div>
          <div className={styles.jsonPreview}>
            <div className={styles.jsonHeader}>JSON Output</div>
            <div className={styles.jsonContent}>
              <CodeBlock language="json">
                {JSON.stringify(snapshot, null, 2)}
              </CodeBlock>
            </div>
          </div>
        </div>
        <div className={styles.stepNavigation}>
          <button
            className={styles.prevStepButton}
            onClick={() => setActiveTab("react")}
          >
            Previous: React Integration
          </button>
          <button
            className={styles.viewCodeButton}
            onClick={() => setActiveTab("fullCode")}
          >
            View Full Code Example
          </button>
        </div>
      </>
    ),
    fullCode: (
      <>
        <h3 className={styles.stepTitle}>Complete Example</h3>
        <p className={styles.stepDescription}>
          Here's the complete code with all the features we've explored.
        </p>
        <div className={styles.fullCodeContainer}>
          <CodeBlock language="jsx">{code}</CodeBlock>
        </div>
        <div className={styles.stepNavigation}>
          <button
            className={styles.startOverButton}
            onClick={() => setActiveTab("setup")}
          >
            Start Over
          </button>
        </div>
      </>
    ),
  };

  return (
    <section
      className={styles.sectionContainer}
      id="try-jods-live"
      data-testid="jods-try-live-section"
    >
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Try jods <span className="gradient-text">live</span>
          </h2>
          <p className={styles.sectionDescription}>
            Follow the steps below to learn how jods works
          </p>
        </div>

        <div className={styles.stepByStepContainer}>
          <div className={styles.tabsContainer}>
            <div
              className={`${styles.tab} ${
                activeTab === "setup" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("setup")}
            >
              <span className={styles.tabNumber}>1</span>
              <span className={styles.tabText}>Setup</span>
            </div>
            <div
              className={`${styles.tab} ${
                activeTab === "computed" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("computed")}
            >
              <span className={styles.tabNumber}>2</span>
              <span className={styles.tabText}>Computed</span>
            </div>
            <div
              className={`${styles.tab} ${
                activeTab === "react" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("react")}
            >
              <span className={styles.tabNumber}>3</span>
              <span className={styles.tabText}>React</span>
            </div>
            <div
              className={`${styles.tab} ${
                activeTab === "json" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("json")}
            >
              <span className={styles.tabNumber}>4</span>
              <span className={styles.tabText}>JSON</span>
            </div>
            <div
              className={`${styles.tab} ${
                activeTab === "fullCode" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("fullCode")}
            >
              <span className={styles.tabIcon}>💻</span>
              <span className={styles.tabText}>Code</span>
            </div>
          </div>
          <div className={styles.contentContainer}>{tabContent[activeTab]}</div>
        </div>
      </div>
    </section>
  );
}
