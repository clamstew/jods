/**
 * Sync visualization components for developer tools
 *
 * These React components provide real-time visualization of sync activity
 * for use in debug panels and developer tools.
 */

import { getBasicHooks, getReact } from "./reactUtils";
import { SyncConnectionStatus, SyncStatusTracker } from "./SyncStatusTracker";

// Get React for JSX rendering
const React = getReact();

// Get React hooks
const { useState, useEffect, useRef } = getBasicHooks();

// Styles for sync visualizer
const styles = {
  container: {
    fontFamily: "monospace",
    fontSize: "12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "8px",
    margin: "8px 0",
    backgroundColor: "#f5f5f5",
    maxWidth: "500px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontWeight: "bold",
    borderBottom: "1px solid #ddd",
    paddingBottom: "4px",
  },
  logContainer: {
    maxHeight: "200px",
    overflow: "auto",
    backgroundColor: "#fff",
    border: "1px solid #eee",
    padding: "4px",
  },
  logEntry: {
    padding: "2px 4px",
    borderBottom: "1px solid #f0f0f0",
  },
  sendMessage: {
    borderLeft: "3px solid #4CAF50",
    backgroundColor: "#E8F5E9",
  },
  receiveMessage: {
    borderLeft: "3px solid #2196F3",
    backgroundColor: "#E3F2FD",
  },
  error: {
    borderLeft: "3px solid #F44336",
    backgroundColor: "#FFEBEE",
  },
  statusIndicator: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    marginRight: "6px",
  },
  statusConnected: {
    backgroundColor: "#4CAF50", // Green
  },
  statusConnecting: {
    backgroundColor: "#FFC107", // Yellow
  },
  statusDisconnected: {
    backgroundColor: "#9E9E9E", // Grey
  },
  statusError: {
    backgroundColor: "#F44336", // Red
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
  },
  button: {
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "3px",
    padding: "4px 8px",
    fontSize: "11px",
    cursor: "pointer",
  },
};

// Types for log entries
interface LogEntry {
  id: number;
  timestamp: number;
  type: "send" | "receive" | "error" | "connect" | "disconnect";
  message: string;
  details?: any;
}

/**
 * Props for SyncVisualizer component
 */
interface SyncVisualizerProps {
  /** Status tracker instance from sync */
  statusTracker: SyncStatusTracker;

  /** Name to identify this sync connection */
  name?: string;

  /** Maximum number of log entries to keep */
  maxEntries?: number;

  /** Whether to expand all entries by default */
  expandAll?: boolean;

  /** Whether to capture outgoing/incoming messages */
  onSend?: (message: any) => void;
  onReceive?: (message: any) => void;

  /** Custom CSS class */
  className?: string;
}

/**
 * React component for visualizing sync activity
 */
export function SyncVisualizer({
  statusTracker,
  name = "Sync",
  maxEntries = 50,
  expandAll = false,
  onSend,
  onReceive,
  className = "",
}: SyncVisualizerProps) {
  const [status, setStatus] = useState<SyncConnectionStatus>(
    statusTracker.getStatus()
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expanded, setExpanded] = useState(expandAll);
  const nextId = useRef(1);
  const logContainerRef = useRef(null);

  // Track connection status
  useEffect(() => {
    const unsubscribe = statusTracker.onStatusChange((newStatus) => {
      setStatus(newStatus);

      // Add log entry for status changes
      if (newStatus === SyncConnectionStatus.CONNECTED) {
        addLogEntry("connect", "Connected to sync");
      } else if (newStatus === SyncConnectionStatus.DISCONNECTED) {
        addLogEntry("disconnect", "Disconnected from sync");
      } else if (newStatus === SyncConnectionStatus.ERROR) {
        addLogEntry("error", "Sync connection error");
      }
    });

    return unsubscribe;
  }, [statusTracker]);

  // Register message handlers if provided
  useEffect(() => {
    if (onSend) {
      onSend((message: any) => {
        addLogEntry("send", "Message sent", message);
      });
    }

    if (onReceive) {
      onReceive((message: any) => {
        addLogEntry("receive", "Message received", message);
      });
    }
  }, [onSend, onReceive]);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (logContainerRef.current) {
      // Use type assertion for DOM operations
      const div = logContainerRef.current as any;
      div.scrollTop = div.scrollHeight;
    }
  }, [logs]);

  // Add a new log entry
  const addLogEntry = (
    type: LogEntry["type"],
    message: string,
    details?: any
  ) => {
    setLogs((currentLogs) => {
      const newLogs = [
        ...currentLogs,
        {
          id: nextId.current++,
          timestamp: Date.now(),
          type,
          message,
          details,
        },
      ];

      // Limit number of entries
      if (newLogs.length > maxEntries) {
        return newLogs.slice(newLogs.length - maxEntries);
      }

      return newLogs;
    });
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Get status indicator style
  const getStatusStyle = () => {
    switch (status) {
      case SyncConnectionStatus.CONNECTED:
        return styles.statusConnected;
      case SyncConnectionStatus.CONNECTING:
        return styles.statusConnecting;
      case SyncConnectionStatus.DISCONNECTED:
        return styles.statusDisconnected;
      case SyncConnectionStatus.ERROR:
        return styles.statusError;
      default:
        return styles.statusDisconnected;
    }
  };

  // Get log entry style
  const getLogEntryStyle = (type: LogEntry["type"]) => {
    switch (type) {
      case "send":
        return { ...styles.logEntry, ...styles.sendMessage };
      case "receive":
        return { ...styles.logEntry, ...styles.receiveMessage };
      case "error":
        return { ...styles.logEntry, ...styles.error };
      default:
        return styles.logEntry;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleTimeString([], { hour12: false }) +
      "." +
      date.getMilliseconds().toString().padStart(3, "0")
    );
  };

  return (
    <div style={styles.container} className={className}>
      <div style={styles.header}>
        <div>
          <span
            style={{ ...styles.statusIndicator, ...getStatusStyle() }}
            title={status}
          />
          {name} ({logs.length} events)
        </div>
        <div>
          <button
            onClick={toggleExpanded}
            style={styles.button}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▼" : "▶"}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div style={styles.logContainer} ref={logContainerRef}>
            {logs.map((log) => (
              <div key={log.id} style={getLogEntryStyle(log.type)}>
                <span style={{ color: "#666" }}>
                  {formatTimestamp(log.timestamp)}
                </span>{" "}
                <span style={{ fontWeight: "bold" }}>
                  {log.type === "send"
                    ? "↑"
                    : log.type === "receive"
                    ? "↓"
                    : log.type === "error"
                    ? "⚠"
                    : "•"}
                </span>{" "}
                {log.message}
                {log.details && (
                  <pre
                    style={{
                      margin: "2px 0 2px 20px",
                      fontSize: "11px",
                      maxHeight: "100px",
                      overflow: "auto",
                    }}
                  >
                    {typeof log.details === "string"
                      ? log.details
                      : JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div
                style={{ padding: "8px", color: "#666", textAlign: "center" }}
              >
                No sync activity yet
              </div>
            )}
          </div>

          <div style={styles.controls}>
            <button
              onClick={clearLogs}
              style={styles.button}
              title="Clear logs"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Minimal status indicator component
 */
export function SyncStatusIndicator({
  statusTracker,
  label = true,
  className = "",
}: {
  statusTracker: SyncStatusTracker;
  label?: boolean;
  className?: string;
}) {
  const [status, setStatus] = useState<SyncConnectionStatus>(
    statusTracker.getStatus()
  );

  useEffect(() => {
    return statusTracker.onStatusChange(setStatus);
  }, [statusTracker]);

  // Get status indicator style and emoji
  const getStatusInfo = () => {
    switch (status) {
      case SyncConnectionStatus.CONNECTED:
        return {
          style: styles.statusConnected,
          label: "Connected",
          emoji: "🟢",
        };
      case SyncConnectionStatus.CONNECTING:
        return {
          style: styles.statusConnecting,
          label: "Connecting",
          emoji: "🟡",
        };
      case SyncConnectionStatus.DISCONNECTED:
        return {
          style: styles.statusDisconnected,
          label: "Disconnected",
          emoji: "⚪",
        };
      case SyncConnectionStatus.ERROR:
        return {
          style: styles.statusError,
          label: "Error",
          emoji: "🔴",
        };
      default:
        return {
          style: styles.statusDisconnected,
          label: "Unknown",
          emoji: "⚪",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "12px",
        backgroundColor: "#f5f5f5",
        border: "1px solid #ddd",
        fontSize: "12px",
      }}
      title={statusInfo.label}
    >
      <span style={{ ...styles.statusIndicator, ...statusInfo.style }} />
      {label && statusInfo.label}
    </div>
  );
}
