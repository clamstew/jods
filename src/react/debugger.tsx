import React from "react";
import { Store, StoreState } from "../store";
import { History, HistoryEntry } from "../history";

export interface DebuggerOptions {
  showDiff?: boolean;
  position?: "bottom" | "right";
  maxEntries?: number;
}

interface TimelineMark {
  index: number;
  time: string;
  state: any; // Store the state reference for searching
}

interface TimelineProps {
  current: number;
  marks: TimelineMark[];
  onSelect: (index: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ current, marks, onSelect }) => {
  // Use a logarithmic spacing for marks if there are too many close together
  const markPositions = marks.map((mark) => {
    // If we have many entries, use a logarithmic scale to space them
    const position =
      marks.length <= 10
        ? (mark.index / (marks.length - 1)) * 100
        : (Math.log(mark.index + 1) / Math.log(marks.length)) * 100;

    return {
      ...mark,
      position: Math.max(0, Math.min(100, position)), // Clamp between 0-100%
    };
  });

  return (
    <div className="jods-timeline">
      <div className="jods-timeline-track">
        {markPositions.map((mark) => (
          <div
            key={mark.index}
            className={`jods-timeline-mark ${
              current === mark.index ? "active" : ""
            }`}
            style={{ left: `${mark.position}%` }}
            onClick={() => onSelect(mark.index)}
            title={`${mark.time} - State ${mark.index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export interface DebuggerProps<T extends StoreState> {
  history: History<T>;
  showDiff?: boolean;
  position?: "bottom" | "right";
  width?: string | number;
  height?: string | number;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

// Enhanced function to find an entry with a specific property value
// Handles nested properties and complex types better
const findEntryWithProperty = <T extends StoreState>(
  entries: HistoryEntry<T>[],
  propertyPath: string,
  value: any
): number => {
  // Parse property path (e.g., "user.name" -> ["user", "name"])
  const path = propertyPath.split(".");

  // Find the entry that matches the property value
  return entries.findIndex((entry) => {
    let current = entry.state;
    for (const key of path) {
      if (current === undefined || current === null) return false;
      current = current[key];
    }

    // Compare objects and arrays by stringify
    if (
      typeof current === "object" &&
      current !== null &&
      typeof value === "object" &&
      value !== null
    ) {
      return JSON.stringify(current) === JSON.stringify(value);
    }

    return current === value;
  });
};

// Find state by partial match
const findEntryWithPartialState = <T extends StoreState>(
  entries: HistoryEntry<T>[],
  partialState: Partial<T>
): number => {
  return entries.findIndex((entry) => {
    for (const key in partialState) {
      const entryValue = entry.state[key];
      const searchValue = partialState[key];

      // Skip if property doesn't exist
      if (entryValue === undefined) return false;

      // For objects, do deep comparison
      if (
        typeof entryValue === "object" &&
        entryValue !== null &&
        typeof searchValue === "object" &&
        searchValue !== null
      ) {
        // Compare JSON string representation
        if (JSON.stringify(entryValue) !== JSON.stringify(searchValue)) {
          return false;
        }
      } else if (entryValue !== searchValue) {
        // Simple value comparison
        return false;
      }
    }

    return true;
  });
};

export function JodsDebugger<T extends StoreState>({
  history,
  showDiff = true,
  position = "bottom",
  width = position === "bottom" ? "100%" : "300px",
  height = position === "bottom" ? "200px" : "100%",
}: DebuggerProps<T>): React.ReactElement {
  const [entries, setEntries] = React.useState<HistoryEntry<T>[]>(
    history.getEntries()
  );
  const [currentIndex, setCurrentIndex] = React.useState<number>(
    history.getCurrentIndex()
  );
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchProperty, setSearchProperty] = React.useState<string>("");
  const [searchMode, setSearchMode] = React.useState<"property" | "json">(
    "property"
  );

  // Use a ref to track the last history update
  const historyRef = React.useRef({
    entries: history.getEntries(),
    currentIndex: history.getCurrentIndex(),
    lastUpdateTime: Date.now(),
  });

  React.useEffect(() => {
    // Subscribe to history updates instead of using interval
    const updateFromHistory = () => {
      const newEntries = history.getEntries();
      const newIndex = history.getCurrentIndex();

      // Throttle updates to avoid excessive re-renders with signal-based updates
      const now = Date.now();
      if (now - historyRef.current.lastUpdateTime < 50) {
        return; // Skip update if less than 50ms has passed
      }

      // Only update if entries length changed, index changed, or content changed
      if (
        newEntries.length !== historyRef.current.entries.length ||
        newIndex !== historyRef.current.currentIndex ||
        JSON.stringify(newEntries[newIndex]?.state) !==
          JSON.stringify(
            historyRef.current.entries[historyRef.current.currentIndex]?.state
          )
      ) {
        historyRef.current = {
          entries: newEntries,
          currentIndex: newIndex,
          lastUpdateTime: now,
        };

        setEntries(newEntries);
        setCurrentIndex(newIndex);
      }
    };

    // Update immediately and set up an interval with lower frequency (reduced from 200ms to 500ms)
    updateFromHistory();
    const intervalId = setInterval(updateFromHistory, 500);

    return () => clearInterval(intervalId);
  }, [history]);

  const handleTravelTo = (index: number) => {
    if (index >= 0 && index < entries.length) {
      history.travelTo(index);
      setCurrentIndex(index);
    }
  };

  // Search for state with specific property value
  const handleSearchByProperty = () => {
    if (!searchProperty && !searchQuery) return;

    if (searchMode === "json" && searchQuery) {
      try {
        // Parse JSON query for complex state search
        const searchState = JSON.parse(searchQuery);
        const foundIndex = findEntryWithPartialState(entries, searchState);

        if (foundIndex >= 0) {
          handleTravelTo(foundIndex);
        } else {
          alert("No matching state found");
        }
      } catch (e) {
        alert("Invalid JSON format");
      }
    } else if (searchProperty && searchQuery) {
      try {
        // Try to parse the search query if it looks like JSON
        const searchValue =
          searchQuery.startsWith("{") ||
          searchQuery.startsWith("[") ||
          searchQuery === "true" ||
          searchQuery === "false" ||
          !isNaN(Number(searchQuery))
            ? JSON.parse(searchQuery)
            : searchQuery;

        const foundIndex = findEntryWithProperty(
          entries,
          searchProperty,
          searchValue
        );
        if (foundIndex >= 0) {
          handleTravelTo(foundIndex);
        } else {
          alert(`No state found with ${searchProperty} = ${searchQuery}`);
        }
      } catch (e) {
        // If JSON parsing fails, search as a string
        const foundIndex = findEntryWithProperty(
          entries,
          searchProperty,
          searchQuery
        );
        if (foundIndex >= 0) {
          handleTravelTo(foundIndex);
        } else {
          alert(`No state found with ${searchProperty} = ${searchQuery}`);
        }
      }
    }
  };

  const timeline = entries.map((entry, index) => ({
    index,
    time: formatTime(entry.timestamp),
    state: entry.state, // Include state for searching
  }));

  const currentEntry = entries[currentIndex];
  const prevEntry = currentIndex > 0 ? entries[currentIndex - 1] : null;

  // Styles
  const debuggerStyle: React.CSSProperties = {
    position: "fixed",
    background: "#1e1e1e",
    color: "#fff",
    fontFamily: "monospace",
    fontSize: "12px",
    zIndex: 9999,
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    display: isOpen ? "flex" : "none",
    flexDirection: position === "bottom" ? "column" : "row",
    ...(position === "bottom"
      ? { bottom: 0, left: 0, right: 0, height }
      : { right: 0, top: 0, bottom: 0, width }),
  };

  const togglerStyle: React.CSSProperties = {
    position: "fixed",
    background: "#1e1e1e",
    color: "#fff",
    padding: "4px 8px",
    cursor: "pointer",
    zIndex: 10000,
    fontSize: "12px",
    borderTopLeftRadius: "4px",
    ...(position === "bottom"
      ? {
          bottom: isOpen ? "auto" : 0,
          right: "20px",
          top: isOpen ? "auto" : "calc(100% - 230px)",
        }
      : {
          right: isOpen ? "auto" : 0,
          top: "20px",
          left: isOpen ? "auto" : "calc(100% - 330px)",
        }),
  };

  return (
    <>
      <div
        className="jods-debugger-toggler"
        style={togglerStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Hide" : "Show"} Debugger
      </div>

      <div className="jods-debugger" style={debuggerStyle}>
        <div
          className="jods-debugger-header"
          style={{ padding: "8px", borderBottom: "1px solid #333" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>JODS Time Travel 🔮</div>
            <div>
              <button
                disabled={currentIndex <= 0}
                onClick={() => handleTravelTo(currentIndex - 1)}
                style={{ marginRight: "8px" }}
              >
                ⏮️ Previous
              </button>
              <button
                disabled={currentIndex >= entries.length - 1}
                onClick={() => handleTravelTo(currentIndex + 1)}
              >
                Next ⏭️
              </button>
            </div>
          </div>

          <Timeline
            current={currentIndex}
            marks={timeline}
            onSelect={handleTravelTo}
          />

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              State {currentIndex + 1} of {entries.length} —{" "}
              {timeline[currentIndex]?.time}
            </div>

            <div
              className="jods-search-container"
              style={{ display: "flex", alignItems: "center" }}
            >
              <select
                value={searchMode}
                onChange={(e) =>
                  setSearchMode(e.target.value as "property" | "json")
                }
                style={{ marginRight: "4px" }}
              >
                <option value="property">Property</option>
                <option value="json">JSON</option>
              </select>

              {searchMode === "property" ? (
                <input
                  type="text"
                  placeholder="Property path (e.g. count)"
                  value={searchProperty}
                  onChange={(e) => setSearchProperty(e.target.value)}
                  style={{ width: "150px", marginRight: "4px" }}
                />
              ) : null}

              <input
                type="text"
                placeholder={searchMode === "property" ? "Value" : "JSON state"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: searchMode === "json" ? "250px" : "100px",
                  marginRight: "4px",
                }}
              />
              <button onClick={handleSearchByProperty}>Find</button>
            </div>
          </div>
        </div>

        <div
          className="jods-debugger-content"
          style={{
            padding: "8px",
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: position === "bottom" ? "row" : "column",
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "8px",
              borderRight: position === "bottom" ? "1px solid #333" : "none",
              borderBottom: position === "right" ? "1px solid #333" : "none",
            }}
          >
            <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Current State:
            </div>
            <pre>{JSON.stringify(currentEntry?.state || {}, null, 2)}</pre>
          </div>

          {showDiff && prevEntry && (
            <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
              <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
                Changes:
              </div>
              <pre>{JSON.stringify(currentEntry?.diff || {}, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .jods-timeline {
          margin-top: 12px;
          position: relative;
          height: 20px;
        }
        .jods-timeline-track {
          background: #333;
          height: 4px;
          width: 100%;
          position: relative;
          border-radius: 2px;
        }
        .jods-timeline-mark {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #666;
          border-radius: 50%;
          top: -3px;
          transform: translateX(-5px);
          cursor: pointer;
          transition: background 0.2s;
        }
        .jods-timeline-mark:hover {
          background: #999;
        }
        .jods-timeline-mark.active {
          background: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
        }
        .jods-debugger button {
          background: #333;
          color: #fff;
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 2px;
        }
        .jods-debugger button:hover:not(:disabled) {
          background: #444;
        }
        .jods-debugger button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .jods-debugger input, .jods-debugger select {
          background: #333;
          color: #fff;
          border: 1px solid #444;
          padding: 4px;
          font-size: 12px;
        }
      `}</style>
    </>
  );
}

/**
 * Create a debugger component for a store with time travel capabilities
 */
export function createDebugger<T extends StoreState>(
  store: T & Store<T>,
  options?: DebuggerOptions
) {
  // Only create the debugger in development mode
  if (process.env.NODE_ENV === "production") {
    return function NoopDebugger() {
      return null;
    };
  }

  // Create a history tracker for this store
  const historyTracker = new History<T>(store, {
    maxEntries: options?.maxEntries || 50,
    active: true,
  });

  // Store the historyTracker for use in the debugger
  return function StoreDebugger() {
    // This component renders the JodsDebugger with the historyTracker
    return React.createElement(JodsDebugger<T>, {
      history: historyTracker,
      showDiff: options?.showDiff,
      position: options?.position,
    });
  };
}
