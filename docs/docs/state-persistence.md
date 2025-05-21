---
sidebar_position: 6
---

# 💾 State Persistence

jods includes built-in persistence capabilities, allowing state to be saved and restored across page reloads, browser sessions, or even different devices.

## Basic Usage

The `persist` function connects a jods store to a storage backend:

```js
import { store, persist } from "jods";

// Create a store
const counter = store({ count: 0 });

// Persist to localStorage
const cleanup = persist(localStorage, counter, {
  key: "counter-app", // Storage key
});

// Update the store - changes automatically persist
counter.count = 5;

// To stop persistence
cleanup();
```

This simple example:

1. Creates a store for a counter
2. Persists it to localStorage under the key "counter-app"
3. Automatically saves and reloads the state

## Storage Adapters

jods works with any storage mechanism that implements the standard storage interface:

### Built-in Browser Storage

```js
// Local storage (persists until cleared)
persist(localStorage, myStore);

// Session storage (persists until tab is closed)
persist(sessionStorage, myStore);
```

### Custom Storage Adapters

You can create custom adapters for any storage system:

```js
// Synchronous custom storage (like localStorage)
const customStorage = {
  getItem: (key) => {
    return window.customDB.get(key);
  },
  setItem: (key, value) => {
    window.customDB.set(key, value);
  },
  removeItem: (key) => {
    window.customDB.delete(key);
  },
};

// Use the custom storage
persist(customStorage, myStore);
```

### Async Storage

jods automatically detects async storage methods:

```js
// IndexedDB adapter example
const indexedDBStorage = {
  getItem: async (key) => {
    return new Promise((resolve) => {
      const request = indexedDB.open("myDatabase");
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["keyval"]);
        const store = transaction.objectStore("keyval");
        const getRequest = store.get(key);
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
      };
    });
  },
  setItem: async (key, value) => {
    return new Promise((resolve) => {
      const request = indexedDB.open("myDatabase");
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["keyval"], "readwrite");
        const store = transaction.objectStore("keyval");
        store.put(value, key);
        transaction.oncomplete = () => resolve();
      };
    });
  },
  removeItem: async (key) => {
    // Similar implementation to delete the item
  },
};

// Use async storage
persist(indexedDBStorage, myStore);
```

### API or Server-side Storage

For remote persistence:

```js
const apiStorage = {
  getItem: async (key) => {
    const response = await fetch(`/api/state/${key}`);
    if (!response.ok) return null;
    return response.text();
  },
  setItem: async (key, value) => {
    await fetch(`/api/state/${key}`, {
      method: "POST",
      body: value,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
  removeItem: async (key) => {
    await fetch(`/api/state/${key}`, {
      method: "DELETE",
    });
  },
};

// Use the API storage
persist(apiStorage, myStore);
```

## Configuration Options

The persist function accepts several options for fine-tuning behavior:

```js
persist(localStorage, myStore, {
  // Required options
  key: "my-app-state", // Storage key (default: "jods-state")

  // Selective persistence
  partial: ["theme", "fontSize"], // Only persist these properties
  exclude: ["authToken", "tempData"], // Don't persist these properties

  // Advanced options
  version: 2, // Schema version for migrations
  migrate: (oldState, oldVersion) => {
    // Convert from version 1 to version 2
    if (oldVersion === 1) {
      return {
        ...oldState,
        theme: oldState.theme || "system", // Add default
        fontSize: oldState.textSize, // Rename property
      };
    }
    return oldState;
  },

  // Performance options
  syncDebounce: 200, // Debounce writes (ms)

  // Mode options
  loadOnly: false, // Only load, don't save changes

  // Error handling
  onError: (error, operation) => {
    console.error(`Persistence error during ${operation}:`, error);
  },
});
```

### Key Option

The `key` option defines where data is stored:

```js
// Store different app sections separately
persist(localStorage, userSettings, { key: "user-settings" });
persist(localStorage, appState, { key: "app-state" });
```

### Selective Persistence

#### Include Only Specific Properties

```js
persist(localStorage, userStore, {
  key: "user-data",
  partial: ["name", "preferences", "theme"],
});
```

#### Exclude Sensitive Data

```js
persist(localStorage, userStore, {
  key: "user-data",
  exclude: ["authToken", "password", "sessionId"],
});
```

#### Dynamic Property Selection

```js
persist(localStorage, stateStore, {
  key: "app-state",
  partial: (key, value) => {
    // Only persist properties that:
    // - Don't start with underscore (private)
    // - Aren't functions
    // - Aren't sensitive data
    return (
      !key.startsWith("_") &&
      typeof value !== "function" &&
      !["password", "token"].includes(key)
    );
  },
});
```

### Versioning and Migrations

When your state schema changes, use versioning to migrate old data:

```js
persist(localStorage, appStore, {
  key: "app-state",
  version: 3, // Current schema version
  migrate: (oldState, oldVersion) => {
    // Handle migrations for each version
    if (oldVersion === 1) {
      // Version 1 to 2 migration
      oldState = {
        ...oldState,
        theme: oldState.theme || "light", // Add missing field
        preferences: { fontSize: oldState.fontSize }, // Restructure
      };
      // Continue to next version
      oldVersion = 2;
    }

    if (oldVersion === 2) {
      // Version 2 to 3 migration
      oldState = {
        ...oldState,
        preferences: {
          ...oldState.preferences,
          colorScheme: oldState.theme, // Move property
        },
      };
      delete oldState.theme; // Remove old property
    }

    return oldState;
  },
});
```

### Performance Tuning

Control how frequently state is persisted:

```js
persist(localStorage, myStore, {
  // Write at most once every 500ms
  syncDebounce: 500,
});
```

### Load-Only Mode

Sometimes you only want to load state without persisting changes:

```js
// Load initial state but don't persist changes
persist(localStorage, initialState, {
  loadOnly: true,
});
```

This is useful for:

- One-time imports of configuration
- Loading defaults that might be modified without saving
- Testing with persistent data

### Error Handling

Handle storage errors gracefully:

```js
persist(localStorage, myStore, {
  onError: (error, operation) => {
    if (operation === "load") {
      // Handle load errors (corrupt data, migration failures)
      console.error("Failed to load persisted state:", error);
      // Maybe show a notification to the user
      notifyUser("Could not restore your previous settings");
    } else if (operation === "save") {
      // Handle save errors (quota exceeded, permission denied)
      console.error("Failed to save state:", error);
      // Maybe show a notification
      notifyUser("Could not save your settings (storage full?)");
    }
  },
});
```

## Multiple Stores

You can persist multiple stores under a single storage key:

```js
const userProfile = store({
  name: "User",
  avatar: "default.png",
});

const appSettings = store({
  theme: "dark",
  fontSize: 16,
});

// Persist both stores under one key
persist(localStorage, [userProfile, appSettings], {
  key: "app-data",
});

// Changes to either store will be persisted
userProfile.name = "New User";
appSettings.theme = "light";
```

This is useful for:

- Grouping related stores
- Ensuring atomic updates across stores
- Simplifying storage key management

## Helper Functions

jods provides additional utility functions for working with persisted state.

### Getting Persisted Data

```js
import { getPersisted } from "jods";

// Get persisted data without affecting any store
const savedState = getPersisted(localStorage, "app-state");
console.log("Saved state:", savedState);

// With options (like migrations)
const migratedState = getPersisted(localStorage, "app-state", {
  version: 2,
  migrate: (old, oldVersion) => {
    // Migration logic
    return transformed;
  },
});
```

### Clearing Persisted Data

```js
import { clearPersisted } from "jods";

// Clear persisted data
clearPersisted(localStorage, "app-state");
```

### Checking Persistence Status

```js
import { isPersisted, isPersistAvailable } from "jods";

// Check if a store is being persisted
if (isPersisted(myStore)) {
  console.log("Store is persisted");
}

// Check if persistence is available in this environment
if (isPersistAvailable()) {
  // Safe to use persistence
  setupPersistence();
} else {
  // Fall back to non-persistent mode
  setupNonPersistentMode();
}
```

## Framework Integration

### React

```jsx
import { store } from "jods";
import { useJods, usePersist } from "jods/react";

// Create a store
const settings = store({
  theme: "light",
  fontSize: 16,
});

function SettingsComponent() {
  // Use the store
  const state = useJods(settings);

  // Persist with localStorage - only runs once when component mounts
  usePersist(localStorage, settings, {
    key: "user-settings",
  });

  return (
    <div>
      <select
        value={state.theme}
        onChange={(e) => (state.theme = e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

### Preact

```jsx
import { store } from "jods";
import { useJods, usePersist } from "jods/preact";

// Create a store
const settings = store({
  theme: "light",
  fontSize: 16,
});

function SettingsComponent() {
  // Use the store
  const state = useJods(settings);

  // Persist with localStorage
  usePersist(localStorage, settings, {
    key: "user-settings",
  });

  return (
    <div>
      <select
        value={state.theme}
        onChange={(e) => (state.theme = e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
```

### Server-Side Rendering (SSR)

When using persistence with SSR frameworks like Next.js or Remix, follow these patterns:

```jsx
import { useEffect } from "react";
import { store } from "jods";
import { useJods, usePersist } from "jods/react";

// Create store outside component
const appStore = store({ count: 0 });

export default function Page({ initialData }) {
  // First hydrate from SSR data
  useEffect(() => {
    if (initialData) {
      Object.assign(appStore, initialData);
    }
  }, [initialData]);

  // Then set up client-side persistence
  usePersist(
    // Only use localStorage in browser
    typeof window !== "undefined" ? localStorage : null,
    appStore,
    { key: "app-data" }
  );

  return <div>{/* Your component */}</div>;
}
```

For Remix-specific persistence patterns, see the [Remix Integration Guide](/remix-integration).

## Security Considerations

### Sensitive Data

Never store sensitive data like authentication tokens in localStorage or sessionStorage:

```js
// BAD: storing sensitive data in localStorage
persist(localStorage, userStore);

// GOOD: excluding sensitive data
persist(localStorage, userStore, {
  exclude: ["authToken", "password", "personalInfo"],
});
```

### Data Validation

Always validate loaded data before using it:

```js
import { z } from "zod";
// Or use jods' aliases
// import { j, jod } from "jods";

// Define a schema for your data
const SettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.number().min(8).max(32),
  notifications: z.boolean(),
});

// Use with persistence
persist(localStorage, settingsStore, {
  onError: (error, operation) => {
    console.error(`Persistence error: ${error}`);
  },
  // Custom load transformation that validates data
  transform: {
    load: (data) => {
      try {
        // Validate data against schema
        return SettingsSchema.parse(data);
      } catch (error) {
        // If validation fails, return default values
        console.error("Invalid persisted data:", error);
        return {
          theme: "system",
          fontSize: 16,
          notifications: true,
        };
      }
    },
  },
});
```

## Best Practices

1. **Selective Persistence**: Only persist what's needed using `partial` or `exclude` options.

2. **Version Your State**: Always include a `version` option for future-proofing your state schema.

3. **Handle Errors**: Provide an `onError` handler to gracefully handle storage failures.

4. **Security First**: Exclude sensitive data from persistence, especially with localStorage.

5. **Use Debouncing**: For frequently changing state, use `syncDebounce` to prevent excessive writes.

6. **Clean Up**: Always store and use the cleanup function to prevent memory leaks:

   ```js
   const cleanup = persist(localStorage, myStore);

   // Later when component unmounts or when no longer needed
   cleanup();
   ```

7. **SSR Compatibility**: When using with SSR, always check for browser environment:

   ```js
   // Only use browser storage on the client
   const storage = typeof window !== "undefined" ? localStorage : null;
   persist(storage, myStore);
   ```

8. **Test Resilience**: Test your application with corrupt or missing persistence data to ensure it recovers gracefully.

## Use Cases

### User Preferences

```js
const preferences = store({
  theme: "light",
  fontSize: 16,
  notifications: true,
  lastVisitedPage: "/home",
});

persist(localStorage, preferences, {
  key: "user-prefs",
});
```

### Form State

```js
const formState = store({
  values: {
    name: "",
    email: "",
    message: "",
  },
  dirty: false,
  submitted: false,
});

// Save draft as user types
persist(localStorage, formState, {
  key: "contact-form-draft",
  // Don't persist submission status
  exclude: ["submitted", "errors"],
});
```

### Shopping Cart

```js
const cart = store({
  items: [],
  total: 0,
  currency: "USD",
});

persist(localStorage, cart, {
  key: "shopping-cart",
});

// Add computed properties that don't get persisted
cart.itemCount = computed(() => cart.items.length);
```

### Multi-App State

```js
const userProfile = store({
  id: null,
  name: "",
  preferences: {},
});

const orderHistory = store({
  orders: [],
  lastOrderDate: null,
});

const uiState = store({
  sidebarOpen: true,
  activeTab: "profile",
});

// Group related stores under one key
persist(localStorage, [userProfile, orderHistory], {
  key: "user-data",
});

// Keep UI state separate
persist(localStorage, uiState, {
  key: "ui-state",
});
```
