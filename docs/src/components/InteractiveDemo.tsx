import React, { useState, useEffect, useRef } from "react";
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
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = onUpdate(jodsStore, () => {
      setState({ ...json(jodsStore) });
      // Visual feedback on update
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 400);
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, [jodsStore]);

  return { state, justUpdated };
}

export default function InteractiveDemo(): React.ReactElement {
  // Use our custom hook instead of useJods
  const { state: user, justUpdated } = useJodsState(userStore);
  const [activeTab, setActiveTab] = useState("edit"); // "edit" or "code"
  const valueUpdateRef = useRef(null);

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

  useEffect(() => {
    if (justUpdated && valueUpdateRef.current) {
      valueUpdateRef.current.classList.add("pulse-animation");
      setTimeout(() => {
        if (valueUpdateRef.current) {
          valueUpdateRef.current.classList.remove("pulse-animation");
        }
      }, 600);
    }
  }, [justUpdated]);

  return (
    <section
      className="features-container interactive-demo-section"
      id="try-jods-live"
      data-testid="jods-try-live-section"
    >
      <div className="container">
        <h2 className="section-title">
          <span className="emoji-icon">🚀</span> Try jods{" "}
          <span className="gradient-text">live</span>{" "}
          <span className="emoji-icon">🧑‍💻</span>
        </h2>
        <p className="section-subtitle">
          Edit the values below and see how jods reactively updates with the
          built-in React integration
        </p>

        <div className="modern-demo-container">
          <div className="demo-tabs">
            <button
              className={`demo-tab ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              <span className="tab-icon">✏️</span> Edit Values
            </button>
            <button
              className={`demo-tab ${activeTab === "code" ? "active" : ""}`}
              onClick={() => setActiveTab("code")}
            >
              <span className="tab-icon">💻</span> View Code
            </button>
          </div>

          <div className="demo-content-wrapper">
            <div
              className={`demo-edit-panel ${
                activeTab === "edit" ? "visible" : "hidden"
              }`}
            >
              <div className="card-header">
                <div className="reactive-value-preview" ref={valueUpdateRef}>
                  <h3>{user.fullName}</h3>
                  <div className="mood-badge">
                    {user.mood === "curious" && "😮 Curious"}
                    {user.mood === "sneaky" && "😏 Sneaky"}
                    {user.mood === "excited" && "🤩 Excited"}
                    {user.mood === "focused" && "🧐 Focused"}
                  </div>
                </div>
              </div>

              <div className="controls">
                <div className="control-group">
                  <label>
                    <span className="control-icon">👤</span> First Name
                  </label>
                  <input
                    type="text"
                    className="modern-input"
                    value={user.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                  />
                </div>

                <div className="control-group">
                  <label>
                    <span className="control-icon">👪</span> Last Name
                  </label>
                  <input
                    type="text"
                    className="modern-input"
                    value={user.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                  />
                </div>

                <div className="control-group">
                  <label>
                    <span className="control-icon">🎭</span> Mood
                  </label>
                  <select
                    className="modern-select"
                    value={user.mood}
                    onChange={(e) => handleInputChange("mood", e.target.value)}
                  >
                    <option value="curious">😮 Curious</option>
                    <option value="sneaky">😏 Sneaky</option>
                    <option value="excited">🤩 Excited</option>
                    <option value="focused">🧐 Focused</option>
                  </select>
                </div>

                <div className="instruction-card">
                  <div className="instruction-item">
                    <div className="instruction-icon">✨</div>
                    <p>Go ahead and change these values!</p>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon">🔍</div>
                    <p>Watch how the code updates in real-time</p>
                  </div>
                  <div className="instruction-item">
                    <div className="instruction-icon">🪄</div>
                    <p>Your changes will be here when you return!</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`demo-code-panel ${
                activeTab === "code" ? "visible" : "hidden"
              }`}
            >
              <div className="code-preview">
                <div className="code-header">
                  <div className="code-title">
                    <span className="code-icon">📄</span> Example Code
                  </div>
                  <div className="reactive-indicator">
                    <span
                      className={`reactive-dot ${justUpdated ? "active" : ""}`}
                    ></span>
                    <span>Reactive</span>
                  </div>
                </div>
                <CodeBlock language="jsx">{code}</CodeBlock>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .interactive-demo-section {
          padding: 3rem 0;
        }
        
        .section-subtitle {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 1.5rem;
          font-size: 1.1rem;
          opacity: 0.85;
          line-height: 1.6;
        }
        
        .emoji-icon {
          font-size: 1.2em;
          vertical-align: middle;
        }
        
        .modern-demo-container {
          background: var(--ifm-card-background-color);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          max-width: 1000px;
          margin: 0 auto;
          border: 1px solid var(--ifm-color-emphasis-200);
        }
        
        .demo-tabs {
          display: flex;
          background: var(--ifm-color-emphasis-100);
          border-bottom: 1px solid var(--ifm-color-emphasis-200);
        }
        
        .demo-tab {
          flex: 1;
          padding: 1rem;
          border: none;
          background: transparent;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--ifm-color-emphasis-700);
        }
        
        .demo-tab.active {
          background: var(--ifm-card-background-color);
          color: var(--ifm-color-primary);
          box-shadow: 0 2px 0 var(--ifm-color-primary);
        }
        
        .tab-icon {
          margin-right: 6px;
        }
        
        .demo-content-wrapper {
          position: relative;
          min-height: 500px;
        }
        
        .demo-edit-panel, .demo-code-panel {
          padding: 1.5rem;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .hidden {
          opacity: 0;
          transform: translateX(-10px);
          pointer-events: none;
        }
        
        .visible {
          opacity: 1;
          transform: translateX(0);
          z-index: 1;
        }
        
        .card-header {
          margin-bottom: 1.5rem;
        }
        
        .reactive-value-preview {
          background: var(--ifm-color-emphasis-100);
          padding: 1.2rem;
          border-radius: 8px;
          text-align: center;
          transition: all 0.2s ease;
        }
        
        .reactive-value-preview h3 {
          margin: 0 0 0.5rem;
          font-size: 1.8rem;
          background: linear-gradient(90deg, var(--ifm-color-primary), var(--ifm-color-primary-dark));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .mood-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: var(--ifm-color-emphasis-200);
          border-radius: 50px;
          font-weight: 500;
        }
        
        .controls {
          display: grid;
          gap: 1.25rem;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .control-group label {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .control-icon {
          font-size: 1.2em;
        }
        
        .modern-input, .modern-select {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--ifm-color-emphasis-300);
          background: var(--ifm-background-color);
          color: var(--ifm-font-color-base);
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        
        .modern-input:focus, .modern-select:focus {
          border-color: var(--ifm-color-primary);
          outline: none;
          box-shadow: 0 0 0 2px var(--ifm-color-primary-lightest);
        }
        
        .instruction-card {
          background: var(--ifm-color-emphasis-100);
          padding: 1.25rem;
          border-radius: 8px;
          margin-top: 1rem;
        }
        
        .instruction-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        
        .instruction-item:last-child {
          margin-bottom: 0;
        }
        
        .instruction-icon {
          font-size: 1.5rem;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }
        
        .instruction-item p {
          margin: 0;
          font-weight: 500;
          font-size: 1rem;
        }
        
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .code-title {
          font-weight: 600;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .reactive-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--ifm-color-emphasis-700);
        }
        
        .reactive-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--ifm-color-emphasis-500);
          transition: all 0.2s ease;
        }
        
        .reactive-dot.active {
          background: var(--ifm-color-success);
          box-shadow: 0 0 0 4px var(--ifm-color-success-lightest);
        }
        
        .pulse-animation {
          animation: pulse 0.6s ease;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--ifm-color-primary-rgb), 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(var(--ifm-color-primary-rgb), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--ifm-color-primary-rgb), 0);
          }
        }
        
        @media (min-width: 768px) {
          .demo-content-wrapper {
            display: flex;
            min-height: unset;
          }
          
          .demo-edit-panel, .demo-code-panel {
            position: relative;
            opacity: 1;
            transform: none;
            pointer-events: auto;
            min-height: 500px;
          }
          
          .demo-edit-panel {
            flex: 0 0 40%;
            max-width: 40%;
            border-right: 1px solid var(--ifm-color-emphasis-200);
          }
          
          .demo-code-panel {
            flex: 0 0 60%;
            max-width: 60%;
          }
          
          .demo-tabs {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
