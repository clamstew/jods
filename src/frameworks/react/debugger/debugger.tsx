// Try to load React with safety for testing environments
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
let React: any;
try {
  React = require("react");
} catch (error) {
  // Create a mock React object for testing environments
  React = {
    createElement: () => null,
    useState: (initial: any) => [initial, () => {}],
    useEffect: (fn: any) => fn && fn(),
  };
}
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-unused-vars */

// Import types for TypeScript
import type { StoreState } from "../../../core/store";
// Import values
import { History } from "../../../core/history";
import type { Store } from "../../../core/store";

// Check if we're in a browser environment
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

export interface DebuggerOptions {
  showDiff?: boolean;
  position?: "bottom" | "right";
  maxEntries?: number;
}

interface TimelineMark {
  index: number;
  time: string;
}

interface TimelineProps {
  current: number;
  marks: TimelineMark[];
  onSelect: (index: number) => void;
}

// Use any for React components to avoid type issues with dynamic React import
const Timeline: any = ({ current, marks, onSelect }: TimelineProps) => {
  return (
    <div className="jods-timeline">
      <div className="jods-timeline-track">
        {marks.map((mark: TimelineMark) => (
          <div
            key={mark.index}
            className={`jods-timeline-mark ${
              current === mark.index ? "active" : ""
            }`}
            style={{ left: `${(mark.index / (marks.length - 1)) * 100}%` }}
            onClick={() => onSelect(mark.index)}
            title={mark.time}
          />
        ))}
      </div>
    </div>
  );
};

export interface DebuggerProps {
  history: any; // Use any to avoid type issues with History
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

// Use any for React components to avoid type issues with dynamic React import
export function JodsDebugger({
  history,
  showDiff = true,
  position = "bottom",
  width = position === "bottom" ? "100%" : "300px",
  height = position === "bottom" ? "200px" : "100%",
}: DebuggerProps): any {
  const [entries, setEntries] = React.useState(history.getEntries());
  const [currentIndex, setCurrentIndex] = React.useState(
    history.getCurrentIndex()
  );
  const [isOpen, setIsOpen] = React.useState(true);

  // Update entries when history changes
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setEntries(history.getEntries());
      setCurrentIndex(history.getCurrentIndex());
    }, 200);

    return () => clearInterval(intervalId);
  }, [history]);

  const handleTravelTo = (index: number) => {
    history.travelTo(index);
    setCurrentIndex(index);
  };

  const timeline = entries.map((entry, index) => ({
    index,
    time: formatTime(entry.timestamp),
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

          <div style={{ marginTop: "8px" }}>
            State {currentIndex + 1} of {entries.length} —{" "}
            {timeline[currentIndex]?.time}
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
  // If React is not properly loaded or we're not in a browser, return a null component
  if (!React || !React.createElement || !isBrowser) {
    return function StoreDebugger() {
      return null;
    };
  }

  const storeHistory =
    store.history ||
    new History(store, {
      maxEntries: options?.maxEntries || 50,
    });

  return function StoreDebugger() {
    if (process.env.NODE_ENV !== "development") {
      return null;
    }

    return React.createElement(JodsDebugger, {
      history: storeHistory,
      showDiff: options?.showDiff,
      position: options?.position,
    });
  };
}
