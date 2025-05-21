import React, { useState, useEffect, useRef } from "react";
import CodeBlock from "@theme/CodeBlock";
import Translate from "@docusaurus/Translate";
import styles from "./InteractiveDemo.module.css";
import InfoIcon from "../icons/Info";
import { Tooltip } from "./design-system/Tooltip";

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

// TODO: Replace with jods built-in persistence when available
// Custom utility for store persistence
const storeUtils = {
  // Save store data to localStorage
  saveStore: (storeData) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("jodsUserStore", JSON.stringify(storeData));
  },

  // Load store data from localStorage
  loadStore: () => {
    if (typeof window === "undefined") return null;
    const savedData = localStorage.getItem("jodsUserStore");
    return savedData ? JSON.parse(savedData) : null;
  },

  // Apply saved data to store
  rehydrateStore: (data) => {
    if (!data) return;
    // Update each field in the store
    Object.keys(data).forEach((key) => {
      if (key !== "fullName") {
        // Skip computed properties
        userStore[key] = data[key];
      }
    });
  },
};

// Create a custom hook that uses useState and useEffect instead of useSyncExternalStore
function useJodsState(jodsStore) {
  const [state, setState] = useState(() => ({ ...json(jodsStore) }));
  const [hasUpdated, setHasUpdated] = useState(false);
  const [updatedField, setUpdatedField] = useState(null);

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = onUpdate(jodsStore, () => {
      setState({ ...json(jodsStore) });
      setHasUpdated(true);
      // Reset the update indicator after a short delay
      setTimeout(() => setHasUpdated(false), 1000);
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, [jodsStore]);

  return { state, hasUpdated, updatedField, setUpdatedField };
}

// Simple React component preview
function ReactComponentPreview({ name, mood }) {
  // Get emoji based on mood
  const getMoodEmoji = () => {
    switch (mood) {
      case "curious":
        return "😮";
      case "sneaky":
        return "😏";
      case "excited":
        return "🤩";
      case "focused":
        return "🧐";
      default:
        return "😮";
    }
  };

  return (
    <div className={styles.reactPreviewComponent}>
      <h2 className={styles.reactPreviewName}>{name}</h2>
      <p className={styles.reactPreviewMood}>
        Mood: {getMoodEmoji()} {mood}
      </p>
    </div>
  );
}

// Format JSON with syntax highlighting
function JsonPreview({ data }) {
  // Function to render JSON with syntax highlighting
  const renderJson = (obj, indent = 0) => {
    if (obj === null) {
      return <span className={styles.jsonNull}>null</span>;
    }

    if (typeof obj === "undefined") {
      return <span className={styles.jsonNull}>undefined</span>;
    }

    if (typeof obj === "boolean") {
      return <span className={styles.jsonBoolean}>{obj.toString()}</span>;
    }

    if (typeof obj === "number") {
      return <span className={styles.jsonNumber}>{obj.toString()}</span>;
    }

    if (typeof obj === "string") {
      return <span className={styles.jsonString}>"{obj}"</span>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span className={styles.jsonBrace}>[]</span>;
      }

      return (
        <>
          <span className={styles.jsonBrace}>[</span>
          <div className={styles.jsonIndent}>
            {obj.map((item, i) => (
              <div key={i} className={styles.jsonLine}>
                {renderJson(item, indent + 1)}
                {i < obj.length - 1 && (
                  <span className={styles.jsonBrace}>,</span>
                )}
              </div>
            ))}
          </div>
          <span className={styles.jsonBrace}>]</span>
        </>
      );
    }

    // Must be an object
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return <span className={styles.jsonBrace}>{"{}"}</span>;
    }

    return (
      <>
        <span className={styles.jsonBrace}>{`{`}</span>
        <div className={styles.jsonIndent}>
          {keys.map((key, i) => (
            <div key={key} className={styles.jsonLine}>
              <span className={styles.jsonKey}>"{key}"</span>
              <span className={styles.jsonBrace}>: </span>
              {renderJson(obj[key], indent + 1)}
              {i < keys.length - 1 && (
                <span className={styles.jsonBrace}>,</span>
              )}
            </div>
          ))}
        </div>
        <span className={styles.jsonBrace}>{`}`}</span>
      </>
    );
  };

  return <div className={styles.jsonOutput}>{renderJson(data)}</div>;
}

// Constants
const PERSISTENCE_EXPIRY_DAYS = 7; // Data expires after 7 days

export default function InteractiveDemo(): React.ReactElement {
  // Use our custom hook instead of useJods
  const {
    state: user,
    hasUpdated,
    updatedField,
    setUpdatedField,
  } = useJodsState(userStore);
  const [activeTab, setActiveTab] = useState<"basic" | "react">("basic");
  const [lastEditTime, setLastEditTime] = useState<Date | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [codeZoom, setCodeZoom] = useState(100);
  // Toggle state for persistence
  const [isPersistenceEnabled, setIsPersistenceEnabled] = useState(true);
  // Expiry info
  const [expiryInfo, setExpiryInfo] = useState<string | null>(null);
  // Tooltip visibility
  const [showPersistenceTooltip, setShowPersistenceTooltip] = useState(false);

  // Utility function to check if data has expired
  const isDataExpired = (timestamp: string) => {
    if (!timestamp) return true;

    const storedDate = new Date(timestamp);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - PERSISTENCE_EXPIRY_DAYS);

    return storedDate < expiryDate;
  };

  // Calculate and format time until expiry
  const getExpiryTimeRemaining = (timestamp: string) => {
    if (!timestamp) return null;

    const updateDate = new Date(timestamp);
    const expiryDate = new Date(updateDate);
    expiryDate.setDate(expiryDate.getDate() + PERSISTENCE_EXPIRY_DAYS);

    const now = new Date();
    const timeRemaining = expiryDate.getTime() - now.getTime();

    if (timeRemaining <= 0) return "Expired";

    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor(
      (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (daysRemaining > 0) {
      return `${daysRemaining}d ${hoursRemaining}h remaining`;
    } else {
      return `${hoursRemaining}h remaining`;
    }
  };

  // Update expiry info periodically
  useEffect(() => {
    if (!isPersistenceEnabled) {
      setExpiryInfo(null);
      return;
    }

    const updateExpiryInfo = () => {
      const lastUpdateTimestamp = localStorage.getItem(
        "jodsLastUpdateTimestamp"
      );
      if (lastUpdateTimestamp) {
        setExpiryInfo(getExpiryTimeRemaining(lastUpdateTimestamp));
      } else {
        setExpiryInfo(null);
      }
    };

    // Update immediately and then every minute
    updateExpiryInfo();
    const interval = setInterval(updateExpiryInfo, 60000);

    return () => clearInterval(interval);
  }, [isPersistenceEnabled]);

  // Load persistence settings from localStorage
  useEffect(() => {
    // Check persistence toggle state
    const storedPersistenceState = localStorage.getItem("jods_persist");
    if (storedPersistenceState) {
      setIsPersistenceEnabled(storedPersistenceState === "true");
    }

    // Only load saved data if persistence is enabled
    if (isPersistenceEnabled) {
      // Check for expiry timestamp
      const lastUpdateTimestamp = localStorage.getItem(
        "jodsLastUpdateTimestamp"
      );

      // If data has expired, clear all saved data
      if (isDataExpired(lastUpdateTimestamp)) {
        localStorage.removeItem("jodsLastEditTime");
        localStorage.removeItem("jodsLastUpdateTimestamp");
        localStorage.removeItem("jodsUserStore");
        // Reset store to defaults
        userStore.firstName = "Burt";
        userStore.lastName = "Macklin";
        userStore.mood = "curious";
      } else {
        // Load store data from localStorage
        const savedStoreData = storeUtils.loadStore();
        if (savedStoreData) {
          // Rehydrate the store with saved values
          storeUtils.rehydrateStore(savedStoreData);

          // Try to get last edit time from localStorage
          const storedLastEditTime = localStorage.getItem("jodsLastEditTime");
          if (storedLastEditTime) {
            setLastEditTime(new Date(storedLastEditTime));
          }

          // Record that this session is active
          sessionStorage.setItem("jods_session_active", "true");
        }
      }
    }
  }, [isPersistenceEnabled]);

  // Handle toggling persistence
  const handlePersistenceToggle = () => {
    const newState = !isPersistenceEnabled;
    setIsPersistenceEnabled(newState);
    localStorage.setItem("jods_persist", newState.toString());

    // If turning off persistence, clear the stored values
    if (!newState) {
      localStorage.removeItem("jodsLastEditTime");
      localStorage.removeItem("jodsLastUpdateTimestamp");
      localStorage.removeItem("jodsUserStore");
    } else {
      // If turning persistence on, check if there's existing data
      const savedStoreData = storeUtils.loadStore();
      const lastUpdateTimestamp = localStorage.getItem(
        "jodsLastUpdateTimestamp"
      );

      // If no saved data or data has expired, use default values
      if (!savedStoreData || isDataExpired(lastUpdateTimestamp)) {
        // Reset to defaults
        userStore.firstName = "Burt";
        userStore.lastName = "Macklin";
        userStore.mood = "curious";

        // Save these defaults to localStorage
        const newEditTime = new Date();
        localStorage.setItem("jodsLastEditTime", newEditTime.toISOString());
        localStorage.setItem(
          "jodsLastUpdateTimestamp",
          newEditTime.toISOString()
        );
        storeUtils.saveStore(json(userStore));
        setLastEditTime(newEditTime);
      }
    }
  };

  // Handle user input changes - directly update the store
  const handleInputChange = (field: string, value: string) => {
    userStore[field] = value;
    const newEditTime = new Date();
    setLastEditTime(newEditTime);

    // Only store in localStorage if persistence is enabled
    if (isPersistenceEnabled) {
      // Store the edit time
      localStorage.setItem("jodsLastEditTime", newEditTime.toISOString());

      // Update timestamp for expiry checking
      localStorage.setItem(
        "jodsLastUpdateTimestamp",
        newEditTime.toISOString()
      );

      // Save the entire store data
      storeUtils.saveStore(json(userStore));
    }

    setUpdatedField(field);
    setTimeout(() => setUpdatedField(null), 1000);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    if (editorRef.current) {
      setCodeZoom((prev) => Math.min(prev + 10, 150));
    }
  };

  const handleZoomOut = () => {
    if (editorRef.current) {
      setCodeZoom((prev) => Math.max(prev - 10, 70));
    }
  };

  // Get persistence tooltip content
  const getPersistenceTooltipContent = () => {
    const baseContent = isPersistenceEnabled
      ? "🟢 Browser Storage: ON - Changes persist across page reloads"
      : "🔵 Browser Storage: OFF - Changes only persist during navigation";

    const infoContent = isPersistenceEnabled
      ? "Using localStorage to save state permanently in the browser"
      : "Navigation only - state is lost on page reload";

    const expiryContent =
      expiryInfo && isPersistenceEnabled
        ? `Data expires in: ${expiryInfo}`
        : "";

    return (
      <div className={styles.persistenceTooltipContent}>
        <div className={styles.persistenceTooltipTitle}>{baseContent}</div>
        <div className={styles.persistenceTooltipInfo}>{infoContent}</div>
        {expiryContent && (
          <div className={styles.persistenceTooltipExpiry}>{expiryContent}</div>
        )}
        {lastEditTime && (
          <div className={styles.persistenceTooltipTime}>
            Last edit: {lastEditTime.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // Get a JSON snapshot for display
  const snapshot = json(userStore);

  // Basic example code
  const basicCode = `import { store, json, computed, onUpdate } from "jods";

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

// Subscribe to changes
const unsubscribe = onUpdate(user, () => {
  console.log("Store updated:", user.fullName);
  // Update UI or trigger other actions
});

// Get a JSON snapshot at any time 📸
console.log("📸 Snapshot:");
console.log(json(user));`;

  // React example code
  const reactCode = `import { store, json, computed } from "jods";
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
}`;

  // Get code based on active tab
  const code = activeTab === "basic" ? basicCode : reactCode;

  // Get an emoji based on the current mood
  const getMoodEmoji = () => {
    switch (user.mood) {
      case "curious":
        return "😮";
      case "sneaky":
        return "😏";
      case "excited":
        return "🤩";
      case "focused":
        return "🧐";
      default:
        return "😮";
    }
  };

  // Gets current section hash for scrolling
  const getSectionHash = () => {
    return window.location.hash;
  };

  // Scroll to current section if hash exists
  useEffect(() => {
    const hash = getSectionHash();
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  return (
    <section
      className={styles.sectionContainer}
      id="try-jods-live"
      data-testid="jods-try-live-section"
    >
      <div className="container">
        <h2 className={styles.sectionTitle}>
          <span className={styles.animatedRocketShake}>🚀</span>{" "}
          <Translate id="homepage.demo.title.prefix">{"Try jods "}</Translate>
          <span className="gradient-text">
            <Translate id="homepage.demo.title.gradient">{"live"}</Translate>
          </span>
          <Translate id="homepage.demo.title.suffix">{" 🧑‍💻"}</Translate>
        </h2>
        <p className={styles.sectionDescription}>
          <span className={styles.marketingText}>
            <Translate
              id="homepage.demo.tagline"
              description="Interactive demo tagline"
            >
              Simple. Reactive. Powerful.
            </Translate>
          </span>
          <span className={styles.screenReaderText}>
            <Translate
              id="homepage.demo.screenreader_text"
              description="Hidden text for screen readers explaining the demo"
            >
              Edit the values below and see how jods reactively updates with the
              built-in reactive state system
            </Translate>
          </span>
        </p>

        <div className={styles.editorContainer}>
          <div className={styles.editorHeader}>
            <div className={styles.tabsContainer}>
              <div
                className={`${styles.tab} ${
                  activeTab === "basic" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("basic")}
                role="tab"
                tabIndex={0}
                aria-selected={activeTab === "basic"}
              >
                basic.ts
              </div>
              <div
                className={`${styles.tab} ${
                  activeTab === "react" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("react")}
                role="tab"
                tabIndex={0}
                aria-selected={activeTab === "react"}
              >
                react.tsx
              </div>
            </div>
            <div className={styles.editorControls}>
              <Tooltip
                content={getPersistenceTooltipContent()}
                isVisible={showPersistenceTooltip}
              >
                <div
                  className={`${styles.persistenceToggle} ${
                    isPersistenceEnabled ? styles.persistenceEnabled : ""
                  }`}
                  onClick={handlePersistenceToggle}
                  onMouseEnter={() => setShowPersistenceTooltip(true)}
                  onMouseLeave={() => setShowPersistenceTooltip(false)}
                  role="button"
                  aria-label={`Toggle browser storage: ${
                    isPersistenceEnabled ? "on" : "off"
                  }`}
                >
                  {isPersistenceEnabled ? "🔒" : "🧭"}
                </div>
              </Tooltip>
              <div
                className={styles.editorButton}
                onClick={handleZoomIn}
                role="button"
                aria-label="Zoom in"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 12H16M12 8V16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div
                className={styles.editorButton}
                onClick={handleZoomOut}
                role="button"
                aria-label="Zoom out"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 12H21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.editorContent}>
            {/* Left panel - Input form */}
            <div className={styles.editorPanel}>
              <div className={styles.editorForm}>
                <div className={styles.floatingPanel}>
                  <div className={styles.panelHeading}>
                    <h3 className={styles.panelTitle}>
                      <span className={styles.panelIcon}>⚙️</span>
                      Edit Store Values
                    </h3>
                    <div className={styles.liveBadge}>
                      <span className={styles.pulseDot}></span>
                      Live
                    </div>
                  </div>

                  <div className={styles.formControls}>
                    <div className={styles.formGroup}>
                      <label htmlFor="firstName">
                        <span className={styles.labelText}>First Name</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={user.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className={
                          updatedField === "firstName"
                            ? styles.updatedInput
                            : ""
                        }
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="lastName">
                        <span className={styles.labelText}>Last Name</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={user.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className={
                          updatedField === "lastName" ? styles.updatedInput : ""
                        }
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="mood">
                        <span className={styles.labelText}>Mood</span>
                      </label>
                      <select
                        id="mood"
                        value={user.mood}
                        onChange={(e) =>
                          handleInputChange("mood", e.target.value)
                        }
                        className={
                          updatedField === "mood" ? styles.updatedInput : ""
                        }
                        autoComplete="off"
                        spellCheck="false"
                      >
                        <option value="curious">😮 Curious</option>
                        <option value="sneaky">😏 Sneaky</option>
                        <option value="excited">🤩 Excited</option>
                        <option value="focused">🧐 Focused</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.computedResults}>
                  <h3 className={styles.formGroupTitle}>Computed Values:</h3>
                  <div
                    className={`${styles.computedItem} ${
                      hasUpdated ? styles.computedUpdated : ""
                    }`}
                  >
                    <span className={styles.computedLabel}>fullName</span>
                    <span className={styles.computedValue}>
                      {user.fullName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle panel - Code display */}
            <div className={styles.editorPanel}>
              <div
                className={styles.codePreview}
                ref={editorRef}
                style={{ fontSize: `${codeZoom}%` }}
              >
                <CodeBlock language="jsx">{code}</CodeBlock>
              </div>
            </div>

            {/* Right panel - Output sidebar */}
            <div className={styles.editorPanel}>
              <div className={styles.outputPanel}>
                <div className={styles.outputPanelTitle}>
                  {activeTab === "basic" ? "JSON Output" : "React Preview"}{" "}
                  {getMoodEmoji()}
                </div>

                {activeTab === "basic" && (
                  <div className={styles.jsonPreviewContainer}>
                    <div className={styles.jsonPreviewHeader}>
                      <div className={styles.jsonPreviewDot}></div>
                      <div className={styles.jsonPreviewDot}></div>
                      <div className={styles.jsonPreviewDot}></div>
                      <span className={styles.jsonPreviewTitle}>Console</span>
                    </div>
                    <div className={styles.jsonPreviewContent}>
                      <div className={styles.consoleOutput}>
                        <div className={styles.consoleLogLine}>
                          <span className={styles.consoleMethod}>
                            {">"} console.log
                          </span>
                          <span className={styles.consoleText}>
                            "Store updated:", "{user.fullName}"
                          </span>
                        </div>
                        <div className={styles.consoleLogLine}>
                          <span className={styles.consoleMethod}>
                            {">"} console.log
                          </span>
                          <span className={styles.consoleText}>
                            "📸 Snapshot:"
                          </span>
                        </div>
                      </div>
                      <JsonPreview data={snapshot} />
                    </div>
                  </div>
                )}

                {activeTab === "react" && (
                  <div className={styles.previewCard}>
                    <div className={styles.previewAvatar}>{getMoodEmoji()}</div>
                    <ReactComponentPreview
                      name={user.fullName}
                      mood={user.mood}
                    />
                  </div>
                )}

                <div className={styles.jsonPreviewExplanation}>
                  {activeTab === "basic" ? (
                    <p>
                      JSON snapshot of your store from <code>json(user)</code>.
                      Updates automatically when values change.
                    </p>
                  ) : (
                    <p>
                      React component using data via <code>useJods</code> hook.
                      Updates automatically when store changes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.editorFooter}>
            <div className={styles.editorStatus}>
              <span>
                jods reactive store {hasUpdated ? "updated!" : "ready"}
              </span>
              <span
                className={`${styles.statusDot} ${
                  hasUpdated ? styles.statusActive : ""
                }`}
              ></span>
            </div>
            <div className={styles.editorInfo}>
              <InfoIcon />
              <span>
                Try changing values above to see the code update in real-time
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
