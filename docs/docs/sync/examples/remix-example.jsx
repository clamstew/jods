/**
 * Real-time Collaborative Document Editor with jods sync API in Remix
 *
 * This example demonstrates how to use the jods sync API with Remix
 * to create a real-time collaborative document editor that synchronizes
 * content between users while respecting SSR and hydration.
 */

// app/routes/documents.$id.jsx

import { useEffect, useState, useCallback } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { defineStore } from "jods/remix";
import { useJodsStore, useJodsForm } from "jods/remix";
import { sync } from "jods";
import { z } from "zod"; // Or import { j } from 'jods';

// Mock database functions (would be actual database calls in real app)
async function getDocumentById(id) {
  // Simulate database access
  return {
    id,
    title: `Document ${id}`,
    content: `This is the content of document ${id}.\n\nEdit me to see real-time collaboration in action!`,
    lastModified: Date.now(),
    collaborators: [{ id: "user-1", name: "Demo User", color: "#4287f5" }],
  };
}

async function saveDocument(id, data) {
  // Simulate database save
  console.log(`Saving document ${id}:`, data);
  return {
    ...data,
    lastModified: Date.now(),
  };
}

// Define document store with Remix integration
export const documentStore = defineStore({
  name: "document",
  schema: z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    content: z.string(),
    lastModified: z.number(),
    collaborators: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      })
    ),
    // Client-side only properties (not synced with server)
    syncStatus: z.enum(["connected", "disconnected", "error"]).optional(),
    activeCollaborators: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          color: z.string(),
          cursor: z
            .object({
              position: z.number(),
              selection: z
                .object({
                  start: z.number(),
                  end: z.number(),
                })
                .optional(),
            })
            .optional(),
          lastActive: z.number(),
        })
      )
      .optional(),
    currentUser: z
      .object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      })
      .optional(),
  }),

  // Load document from server
  loader: async ({ params }) => {
    const document = await getDocumentById(params.id);
    return document;
  },

  // Handle title updates
  handlers: {
    async updateTitle({ current, form }) {
      const title = form.get("title");
      if (!title || typeof title !== "string") {
        return {
          ...current,
          formError: "Title is required",
        };
      }

      // Update title in database
      const updated = await saveDocument(current.id, {
        ...current,
        title,
      });

      return {
        ...updated,
        formSuccess: "Title updated successfully",
      };
    },

    // Handle content updates (autosave)
    async saveContent({ current, form }) {
      const content = form.get("content");
      if (typeof content !== "string") {
        return current;
      }

      // Update content in database
      const updated = await saveDocument(current.id, {
        ...current,
        content,
      });

      return updated;
    },
  },
});

// Remix loader function
export async function loader({ params }) {
  return json(await documentStore.loader({ params }));
}

// Remix action function
export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateTitle") {
    return json(await documentStore.actions.updateTitle({ form: formData }));
  }

  if (intent === "saveContent") {
    return json(await documentStore.actions.saveContent({ form: formData }));
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

// WebSocket setup - in a real app, this would be a proper WebSocket server
function createDocumentSocket(documentId, userId) {
  // For demo purposes, simulate a WebSocket using BroadcastChannel
  // In a real app, this would connect to a real WebSocket server
  const channel = new BroadcastChannel(`document-${documentId}`);

  // Add userId to connection for identification
  channel.userId = userId;

  return channel;
}

// Document Editor Component
export default function DocumentEditor() {
  const initialData = useLoaderData();
  const params = useParams();
  const state = useJodsStore(documentStore);
  const titleForm = useJodsForm(documentStore.actions.updateTitle);
  const contentForm = useJodsForm(documentStore.actions.saveContent);

  // Hydration and sync state
  const [isHydrated, setIsHydrated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  // Generate a consistent user ID
  const getUserId = useCallback(() => {
    const storedId = localStorage.getItem("document-user-id");
    if (storedId) return storedId;

    const newId = `user-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("document-user-id", newId);
    return newId;
  }, []);

  // Detect client-side hydration
  useEffect(() => {
    setIsHydrated(true);

    // Set up current user on client side only
    const userId = getUserId();
    const userName =
      localStorage.getItem("document-user-name") || `User ${userId.substr(-4)}`;

    // Generate a consistent color based on user ID
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };

    const generateColor = (id) => {
      const colors = [
        "#4287f5",
        "#f54242",
        "#42f59e",
        "#f5c842",
        "#d842f5",
        "#42c8f5",
        "#8c42f5",
        "#f5429e",
      ];

      // Use hash of ID to pick a color
      const index = Math.abs(hashCode(id)) % colors.length;
      return colors[index];
    };

    // Set current user in store
    documentStore.currentUser = {
      id: userId,
      name: userName,
      color: generateColor(userId),
    };

    // Initialize active collaborators if not set
    if (!documentStore.activeCollaborators) {
      documentStore.activeCollaborators = [];
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, []);

  // Set up sync AFTER hydration completes
  useEffect(() => {
    if (!isHydrated || !state.currentUser) return;

    // Create WebSocket/BroadcastChannel for document
    const docSocket = createDocumentSocket(params.id, state.currentUser.id);
    setSocket(docSocket);

    // Configure sync options
    const syncOptions = {
      // Only sync these properties (security & performance)
      allowKeys: ["content", "title", "collaborators", "activeCollaborators"],
      // Don't sync sensitive data
      sensitiveKeys: ["currentUser", "syncStatus"],
      // Throttle updates to prevent excessive network traffic
      throttleMs: 500,
      // Handle errors
      onError: (err) => {
        console.error("Sync error:", err);
        documentStore.syncStatus = "error";
      },
      // Use a prefix to avoid collisions
      prefix: `doc-${params.id}`,
    };

    // Start syncing
    const stopSync = sync(docSocket, documentStore, syncOptions);
    documentStore.syncStatus = "connected";

    // Add current user to active collaborators
    updateUserActivity();

    // Setup periodic activity updates
    const activityInterval = setInterval(updateUserActivity, 30000);

    // Clean up on unmount
    return () => {
      stopSync();

      // Remove from active collaborators when leaving
      const updatedCollaborators = (
        documentStore.activeCollaborators || []
      ).filter((user) => user.id !== state.currentUser.id);
      documentStore.activeCollaborators = updatedCollaborators;

      // Clean up
      clearInterval(activityInterval);
      docSocket.close();
      documentStore.syncStatus = "disconnected";
    };
  }, [isHydrated, params.id, state.currentUser]);

  // Update user activity status
  const updateUserActivity = useCallback(() => {
    if (!state.currentUser) return;

    // Get current collaborators
    const collaborators = documentStore.activeCollaborators || [];

    // Check if current user is already in list
    const existingIndex = collaborators.findIndex(
      (c) => c.id === state.currentUser.id
    );

    // Update user's timestamp
    const updatedUser = {
      ...state.currentUser,
      lastActive: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing user
      collaborators[existingIndex] = {
        ...collaborators[existingIndex],
        ...updatedUser,
      };
    } else {
      // Add new user
      collaborators.push(updatedUser);
    }

    // Clean up inactive users (more than 2 minutes)
    const activeCollaborators = collaborators.filter(
      (user) => user.lastActive > Date.now() - 2 * 60 * 1000
    );

    documentStore.activeCollaborators = activeCollaborators;
  }, [state.currentUser]);

  // Auto-save function
  const handleContentChange = useCallback(
    (e) => {
      // Update content in store immediately
      documentStore.content = e.target.value;

      // Clear any existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // Set new timer for auto-save
      const timer = setTimeout(() => {
        // Create a form data object to submit
        const formData = new FormData();
        formData.append("content", documentStore.content);
        formData.append("intent", "saveContent");

        // Submit the form
        contentForm.submit(formData);
      }, 2000);

      setAutoSaveTimer(timer);
    },
    [autoSaveTimer, contentForm]
  );

  // Filter active collaborators (remove current user, sort by name)
  const otherCollaborators = (state.activeCollaborators || [])
    .filter((user) => user.id !== state.currentUser?.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Format last modified date
  const formattedDate = new Date(state.lastModified).toLocaleString();

  return (
    <div className="document-editor">
      <header>
        {editingTitle ? (
          <form
            {...titleForm.props}
            onSubmit={(e) => {
              titleForm.submit(e);
              setEditingTitle(false);
            }}
          >
            <input type="hidden" name="intent" value="updateTitle" />
            <input
              type="text"
              name="title"
              defaultValue={state.title}
              autoFocus
              className="title-input"
              onBlur={() => {
                titleForm.submit();
                setEditingTitle(false);
              }}
            />
            <button type="submit" className="save-button">
              Save
            </button>
          </form>
        ) : (
          <h1
            className="document-title"
            onClick={() => setEditingTitle(true)}
            title="Click to edit"
          >
            {state.title}
          </h1>
        )}

        <div className="document-meta">
          <div className="sync-status">
            {state.syncStatus === "connected" ? (
              <span className="connected">Live collaboration active</span>
            ) : state.syncStatus === "disconnected" ? (
              <span className="disconnected">Offline mode</span>
            ) : (
              <span className="error">Connection error</span>
            )}
          </div>

          <div className="last-saved">Last saved: {formattedDate}</div>
        </div>
      </header>

      <div className="editor-container">
        {state.syncStatus === "connected" && otherCollaborators.length > 0 && (
          <div className="collaborators">
            <h3>Active collaborators:</h3>
            <ul>
              {otherCollaborators.map((user) => (
                <li key={user.id}>
                  <div
                    className="user-indicator"
                    style={{ backgroundColor: user.color }}
                  />
                  <span>{user.name}</span>
                  <span className="activity-time">
                    {new Date(user.lastActive).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="content-editor">
          <form {...contentForm.props} className="content-form">
            <textarea
              name="content"
              value={state.content}
              onChange={handleContentChange}
              className="content-textarea"
              spellCheck="true"
            />
          </form>
        </div>
      </div>

      <footer>
        <div className="user-info">
          {state.currentUser && (
            <>
              Editing as{" "}
              <span
                className="username"
                style={{ color: state.currentUser.color }}
              >
                {state.currentUser.name}
              </span>
              <button
                onClick={() => {
                  const newName = prompt(
                    "Enter your name:",
                    state.currentUser.name
                  );
                  if (newName && newName.trim()) {
                    // Update name in store and localStorage
                    documentStore.currentUser.name = newName.trim();
                    localStorage.setItem("document-user-name", newName.trim());
                    // Update in active collaborators
                    updateUserActivity();
                  }
                }}
                className="edit-name-button"
              >
                Edit
              </button>
            </>
          )}
        </div>

        <div className="hydration-status">
          {isHydrated ? "Client Hydrated" : "Server Rendered"}
        </div>
      </footer>
    </div>
  );
}

// CSS (would typically be in a separate file)
const styles = `
.document-editor {
  font-family: system-ui, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.document-title {
  margin: 0 0 10px;
  padding: 5px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.document-title:hover {
  border-color: #ddd;
  border-radius: 4px;
}

.title-input {
  font-size: 2rem;
  font-family: inherit;
  font-weight: bold;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: calc(100% - 100px);
}

.save-button {
  margin-left: 10px;
  padding: 5px 15px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.document-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.sync-status .connected {
  color: #1e8e3e;
}

.sync-status .disconnected {
  color: #ea4335;
}

.sync-status .error {
  color: #fbbc05;
}

.editor-container {
  display: flex;
  gap: 20px;
}

.collaborators {
  flex: 0 0 200px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.collaborators h3 {
  margin-top: 0;
  font-size: 1rem;
  color: #444;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.collaborators ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.collaborators li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.user-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.activity-time {
  margin-left: auto;
  font-size: 0.8rem;
  color: #888;
}

.content-editor {
  flex: 1;
}

.content-form {
  height: 100%;
}

.content-textarea {
  width: 100%;
  min-height: 500px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
}

footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  font-weight: bold;
  margin: 0 5px;
}

.edit-name-button {
  padding: 2px 6px;
  background-color: #f1f3f4;
  border: 1px solid #ddd;
  border-radius: 3px;
  margin-left: 5px;
  font-size: 0.8rem;
  cursor: pointer;
}

.hydration-status {
  font-size: 0.8rem;
  color: #999;
  padding: 3px 6px;
  background-color: #f8f9fa;
  border-radius: 3px;
}
`;

// Export styles for documentation
export const demoStyles = styles;
