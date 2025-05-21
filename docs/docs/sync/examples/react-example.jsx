/**
 * Real-time Chat Application with jods sync API
 *
 * This example demonstrates how to use the jods sync API with React
 * to create a real-time chat application that synchronizes state
 * between clients using WebSockets.
 */

import React, { useEffect, useState, useCallback } from "react";
import { store, sync } from "jods";
import { useJods } from "jods/react";

// Create a store for the chat application
const chatStore = store({
  messages: [],
  users: [],
  connectionStatus: "disconnected", // 'connected', 'disconnected', 'error'
  lastTyping: null,
  currentUser: {
    id: `user-${Date.now()}`,
    name: "Anonymous",
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  },
});

// Helper to generate message IDs
const generateId = () =>
  `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Main Chat Application
export function ChatApp() {
  const state = useJods(chatStore);
  const [message, setMessage] = useState("");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState(state.currentUser.name);
  const [stopSyncFn, setStopSyncFn] = useState(null);

  // Connect and setup sync
  const connectAndSync = useCallback(() => {
    if (socket) {
      socket.close();
    }

    if (stopSyncFn) {
      stopSyncFn();
    }

    // Create WebSocket connection
    const newSocket = new WebSocket("wss://chat-server.example.com");
    setSocket(newSocket);

    newSocket.addEventListener("open", () => {
      console.log("WebSocket connected");
      chatStore.connectionStatus = "connected";
      setReconnectAttempts(0);

      // Send join message
      newSocket.send(
        JSON.stringify({
          type: "join",
          user: chatStore.currentUser,
        })
      );

      // Start syncing with security measures
      const stopSync = sync(newSocket, chatStore, {
        // Only sync these properties (security)
        allowKeys: ["messages", "users", "lastTyping"],
        // Don't sync reconnectAttempts
        sensitiveKeys: ["currentUser.id"],
        // Throttle updates to reduce network traffic
        throttleMs: 300,
        // Handle errors
        onError: (err) => {
          console.error("Sync error:", err);
          chatStore.connectionStatus = "error";
        },
      });

      setStopSyncFn(() => stopSync);
    });

    newSocket.addEventListener("close", () => {
      console.log("WebSocket disconnected");
      chatStore.connectionStatus = "disconnected";

      // Attempt reconnection with exponential backoff
      const attempts = reconnectAttempts + 1;
      setReconnectAttempts(attempts);
      const delay = Math.min(30000, Math.pow(2, attempts) * 1000);

      console.log(
        `Reconnecting in ${delay / 1000} seconds (attempt ${attempts})`
      );
      setTimeout(connectAndSync, delay);
    });

    newSocket.addEventListener("error", (err) => {
      console.error("WebSocket error:", err);
      chatStore.connectionStatus = "error";
    });
  }, [socket, stopSyncFn, reconnectAttempts]);

  // Initial connection
  useEffect(() => {
    connectAndSync();

    return () => {
      if (stopSyncFn) stopSyncFn();
      if (socket) socket.close();
    };
  }, []);

  // Handle username change
  const handleChangeUsername = useCallback(() => {
    if (username && username !== state.currentUser.name) {
      const oldName = state.currentUser.name;

      // Update current user name
      chatStore.currentUser.name = username;

      // Add system message about name change
      chatStore.messages.push({
        id: generateId(),
        type: "system",
        text: `${oldName} changed their name to ${username}`,
        timestamp: Date.now(),
      });
    }
  }, [username, state.currentUser.name]);

  // Handle sending a message
  const handleSendMessage = useCallback(() => {
    if (!message.trim()) return;

    // Add message to local store
    chatStore.messages.push({
      id: generateId(),
      user: chatStore.currentUser,
      text: message,
      timestamp: Date.now(),
    });

    // Clear input
    setMessage("");
  }, [message]);

  // Handle typing status
  const handleTyping = useCallback(() => {
    chatStore.lastTyping = {
      userId: chatStore.currentUser.id,
      username: chatStore.currentUser.name,
      timestamp: Date.now(),
    };
  }, []);

  // Find current typing user (not current user)
  const typingUser =
    state.lastTyping &&
    state.lastTyping.userId !== state.currentUser.id &&
    state.lastTyping.timestamp > Date.now() - 3000
      ? state.lastTyping.username
      : null;

  return (
    <div className="chat-app">
      <header className={`status-bar ${state.connectionStatus}`}>
        <div className="connection-status">
          {state.connectionStatus === "connected"
            ? "Connected ✓"
            : state.connectionStatus === "disconnected"
            ? "Disconnected ✗"
            : "Error connecting ⚠️"}
        </div>

        <div className="user-profile">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={handleChangeUsername}
            placeholder="Your username"
          />
          <div
            className="user-color"
            style={{ backgroundColor: state.currentUser.color }}
          />
        </div>
      </header>

      <div className="messages-container">
        {state.messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${
              msg.type === "system"
                ? "system"
                : msg.user?.id === state.currentUser.id
                ? "own"
                : "other"
            }`}
          >
            {msg.type === "system" ? (
              <div className="system-message">{msg.text}</div>
            ) : (
              <>
                <div
                  className="user-icon"
                  style={{ backgroundColor: msg.user?.color || "#ccc" }}
                />
                <div className="message-content">
                  <div className="message-author">{msg.user?.name}</div>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {typingUser && (
        <div className="typing-indicator">{typingUser} is typing...</div>
      )}

      <div className="message-input">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Type a message..."
          disabled={state.connectionStatus !== "connected"}
        />
        <button
          onClick={handleSendMessage}
          disabled={state.connectionStatus !== "connected"}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// CSS (would typically be in a separate file)
const styles = `
.chat-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: system-ui, sans-serif;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.status-bar.connected { background-color: #e7f7e7; }
.status-bar.disconnected { background-color: #fff0f0; }
.status-bar.error { background-color: #fff7e0; }

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 80%;
}

.message.system {
  align-self: center;
  font-style: italic;
  color: #888;
}

.message.own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.other {
  align-self: flex-start;
}

.user-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  padding: 10px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.own .message-content {
  background-color: #e7f7ff;
}

.message-author {
  font-weight: bold;
  font-size: 0.9rem;
}

.message-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.typing-indicator {
  padding: 5px 10px;
  font-size: 0.9rem;
  color: #888;
  font-style: italic;
}

.message-input {
  display: flex;
  padding: 10px;
  background-color: white;
  border-top: 1px solid #ddd;
}

.message-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
}

.message-input button {
  padding: 10px 15px;
  background-color: #0080ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.message-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
`;

// Simulate React rendering
export const Demo = () => (
  <>
    <style>{styles}</style>
    <ChatApp />
  </>
);
