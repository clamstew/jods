---
sidebar_position: 7
---

# 🗄️ Storage Adapters

jods persistence works with any storage mechanism that implements the standard storage interface. This document covers the various storage adapters you can use with the `persist()` API.

## Storage Interface

A valid storage adapter must implement this interface:

```typescript
interface PersistStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

The storage interface supports both synchronous and asynchronous implementations - jods automatically detects which mode to use based on the return type of the methods.

## Built-in Browser Storage

### localStorage

Persists data indefinitely until explicitly cleared:

```js
import { store, persist } from "jods";
const settings = store({
  theme: "light",
  fontSize: 16,
});

// Persist to localStorage
persist(localStorage, settings, { key: "app-settings" });
```

### sessionStorage

Persists data for the duration of the page session (until the tab is closed):

```js
import { store, persist } from "jods";

const temporaryState = store({
  currentStep: 1,
  formValues: {},
});

// Persist to sessionStorage
persist(sessionStorage, temporaryState, { key: "wizard-state" });
```

## Custom Storage Adapters

### IndexedDB Adapter

You can use the built-in adapter:

```js
import { store, persist } from "jods";
import { createIndexedDBStorage } from "jods/persist/adapters";

const userStore = store({ name: "User", preferences: {} });
const dbStorage = createIndexedDBStorage("myAppDB", "userSettings");

persist(dbStorage, userStore, { key: "user-data" });
```

Or implement your own custom version:

```js
// IndexedDB storage adapter
const createIndexedDBStorage = (dbName, storeName) => {
  // Open database connection
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  return {
    async getItem(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);

        // Clean up by closing the database once transaction completes
        transaction.oncomplete = () => db.close();
      });
    },

    async setItem(key, value) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        // Clean up by closing the database once transaction completes
        transaction.oncomplete = () => db.close();
      });
    },

    async removeItem(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);

        // Clean up by closing the database once transaction completes
        transaction.oncomplete = () => db.close();
      });
    },
  };
};

// Usage
const indexedDBStorage = createIndexedDBStorage("myAppDB", "appState");
persist(indexedDBStorage, myStore, { key: "state" });
```

### Web API Storage Adapter

You can use the built-in adapter:

```js
import { store, persist } from "jods";
import { createAPIStorage } from "jods/persist/adapters";

const settingsStore = store({ theme: "dark", fontSize: 16 });
const apiStorage = createAPIStorage(
  "https://api.example.com/state",
  "user-auth-token"
);

persist(apiStorage, settingsStore, { key: "settings" });
```

Or implement your own custom version:

```js
// REST API storage adapter
const createAPIStorage = (endpoint, authToken) => {
  return {
    async getItem(key) {
      try {
        const response = await fetch(`${endpoint}/${key}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Item not found
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.text();
        return data;
      } catch (error) {
        console.error("Failed to get item:", error);
        return null;
      }
    },

    async setItem(key, value) {
      try {
        const response = await fetch(`${endpoint}/${key}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: value,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to set item:", error);
        throw error;
      }
    },

    async removeItem(key) {
      try {
        const response = await fetch(`${endpoint}/${key}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to remove item:", error);
        throw error;
      }
    },
  };
};

// Usage
const apiStorage = createAPIStorage(
  "https://api.example.com/state",
  "user-auth-token"
);
persist(apiStorage, userSettings, { key: "settings" });
```

### In-Memory Storage Adapter

Useful for testing or temporary storage:

You can use the built-in adapter:

```js
import { store, persist } from "jods";
import { createMemoryStorage } from "jods/persist/adapters";

const tempStore = store({ value: "temporary" });
const memoryStorage = createMemoryStorage();

persist(memoryStorage, tempStore, { key: "temp" });

// The memory storage has additional helper methods
memoryStorage.clear(); // Clear all data
const allData = memoryStorage.getAll(); // Get all stored data
```

Or implement your own custom version:

```js
// In-memory storage adapter
const createMemoryStorage = (initialData = {}) => {
  let storage = { ...initialData };

  return {
    getItem(key) {
      return storage[key] || null;
    },

    setItem(key, value) {
      storage[key] = value;
    },

    removeItem(key) {
      delete storage[key];
    },

    // Helper method to clear all data (not required by the interface)
    clear() {
      storage = {};
    },
  };
};

// Usage
const memoryStorage = createMemoryStorage();
persist(memoryStorage, tempStore, { key: "temp" });
```

## Framework-Specific Storage Adapters

### Remix Cookie Storage

For server-side persistence in Remix applications:

```js
import { createCookieStorage } from "jods/remix";
import { json } from "@remix-run/node";

// Create cookie storage
const cookieStorage = createCookieStorage({
  cookie: {
    name: "app_session",
    secrets: ["your-secret-key"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
});

// In your loader
export async function loader({ request }) {
  // Load persisted data from cookie
  const persistedData = await cookieStorage.getItem("user-prefs");

  // Parse and use the data
  if (persistedData) {
    try {
      const parsedData = JSON.parse(persistedData);
      // Do something with the data...
    } catch (e) {
      console.error("Failed to parse persisted data", e);
    }
  }

  return json({
    /* your response */
  });
}

// In your action
export async function action({ request }) {
  // Update data
  const formData = await request.formData();

  // Create response with headers
  const headers = new Headers();
  await cookieStorage.setItem(
    "user-prefs",
    JSON.stringify({
      theme: formData.get("theme"),
    }),
    { headers }
  );

  return json({ success: true }, { headers });
}
```

## Storage Patterns

### Composite Storage

Combine multiple storage mechanisms:

You can use the built-in adapter:

```js
import { store, persist } from "jods";
import {
  createFallbackStorage,
  createMemoryStorage,
} from "jods/persist/adapters";

// Create a storage that tries localStorage first, falls back to sessionStorage,
// and finally falls back to memory storage
const fallbackStorage = createFallbackStorage([
  localStorage,
  sessionStorage,
  createMemoryStorage(),
]);

const appState = store({
  theme: "light",
  fontSize: 16,
});

persist(fallbackStorage, appState, { key: "app-state" });
```

Or implement your own custom version:

```js
// Storage that tries localStorage first, falls back to sessionStorage,
// and finally falls back to memory storage
const createFallbackStorage = () => {
  const memoryStorage = createMemoryStorage();

  const isStorageAvailable = (storage) => {
    try {
      storage.setItem("test", "test");
      storage.removeItem("test");
      return true;
    } catch (e) {
      return false;
    }
  };

  const localStorageAvailable =
    typeof window !== "undefined" && isStorageAvailable(localStorage);
  const sessionStorageAvailable =
    typeof window !== "undefined" && isStorageAvailable(sessionStorage);

  return {
    async getItem(key) {
      if (localStorageAvailable) {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
      }

      if (sessionStorageAvailable) {
        const value = sessionStorage.getItem(key);
        if (value !== null) return value;
      }

      return memoryStorage.getItem(key);
    },

    async setItem(key, value) {
      if (localStorageAvailable) {
        try {
          localStorage.setItem(key, value);
          return;
        } catch (e) {
          console.warn(
            "localStorage setItem failed, falling back to sessionStorage"
          );
        }
      }

      if (sessionStorageAvailable) {
        try {
          sessionStorage.setItem(key, value);
          return;
        } catch (e) {
          console.warn(
            "sessionStorage setItem failed, falling back to memory storage"
          );
        }
      }

      memoryStorage.setItem(key, value);
    },

    async removeItem(key) {
      if (localStorageAvailable) {
        localStorage.removeItem(key);
      }

      if (sessionStorageAvailable) {
        sessionStorage.removeItem(key);
      }

      memoryStorage.removeItem(key);
    },
  };
};

// Usage
const fallbackStorage = createFallbackStorage();
persist(fallbackStorage, appState, { key: "app-state" });
```

### Encrypted Storage

Add encryption for sensitive data:

You can use the built-in adapter (note that the built-in encryption is basic and for demonstration purposes only):

```js
import { store, persist } from "jods";
import { createEncryptedStorage } from "jods/persist/adapters";

// Basic usage with built-in encryption (for non-sensitive data only)
const secureStorage = createEncryptedStorage(localStorage, "my-secret-key");

// For production/sensitive data, use a proper encryption library
import CryptoJS from "crypto-js";

const productionSecureStorage = createEncryptedStorage(
  localStorage,
  "my-secret-key",
  {
    encrypt: (text, secret) => CryptoJS.AES.encrypt(text, secret).toString(),
    decrypt: (encrypted, secret) => {
      try {
        const bytes = CryptoJS.AES.decrypt(encrypted, secret);
        return bytes.toString(CryptoJS.enc.Utf8);
      } catch (e) {
        return null;
      }
    },
  }
);

const appSettings = store({
  username: "user123",
  preferences: { theme: "dark" },
});

persist(productionSecureStorage, appSettings, { key: "secure-settings" });
```

Or implement your own custom version:

```js
// Simple encryption example (NOTE: not production-ready)
const createEncryptedStorage = (baseStorage, secret) => {
  // Simple encryption/decryption functions
  const encrypt = (text) => {
    // In a real app, use a proper encryption library
    // This is just a demonstration
    return btoa(
      text
        .split("")
        .map((char) =>
          String.fromCharCode(char.charCodeAt(0) + (secret.charCodeAt(0) % 10))
        )
        .join("")
    );
  };

  const decrypt = (encryptedText) => {
    try {
      // In a real app, use a proper encryption library
      // This is just a demonstration
      return atob(encryptedText)
        .split("")
        .map((char) =>
          String.fromCharCode(char.charCodeAt(0) - (secret.charCodeAt(0) % 10))
        )
        .join("");
    } catch (e) {
      console.error("Failed to decrypt data");
      return null;
    }
  };

  return {
    async getItem(key) {
      const encryptedData = await baseStorage.getItem(key);
      if (!encryptedData) return null;
      return decrypt(encryptedData);
    },

    async setItem(key, value) {
      const encryptedValue = encrypt(value);
      await baseStorage.setItem(key, encryptedValue);
    },

    async removeItem(key) {
      await baseStorage.removeItem(key);
    },
  };
};

// Usage
const encryptedStorage = createEncryptedStorage(localStorage, "my-secret-key");
persist(encryptedStorage, appSettings, { key: "secure-settings" });
```

### Quota Management Storage

Handle storage quota limits:

```js
// Storage adapter that handles quota exceeded errors
const createQuotaManagementStorage = (baseStorage, quotaErrorHandler) => {
  return {
    async getItem(key) {
      return baseStorage.getItem(key);
    },

    async setItem(key, value) {
      try {
        await baseStorage.setItem(key, value);
      } catch (error) {
        // Check if it's a quota error
        if (
          error instanceof DOMException &&
          (error.code === 22 ||
            error.code === 1014 ||
            error.name === "QuotaExceededError" ||
            error.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          // Call the handler to deal with the quota error
          if (quotaErrorHandler) {
            await quotaErrorHandler(key, value, baseStorage);
          } else {
            throw error; // Re-throw if no handler
          }
        } else {
          throw error; // Other errors
        }
      }
    },

    async removeItem(key) {
      return baseStorage.removeItem(key);
    },
  };
};

// Example handler that removes old items to make space
const handleQuotaError = async (key, value, storage) => {
  try {
    // Get a list of all keys (implementation depends on your storage)
    const allKeys = Object.keys(localStorage);

    // Sort by some priority (example: older items first)
    const oldestKey = allKeys
      .filter((k) => k !== key && k.startsWith("app-"))
      .sort()[0];

    if (oldestKey) {
      // Remove an old item to make space
      await storage.removeItem(oldestKey);
      console.log(`Removed ${oldestKey} to make space`);

      // Try again
      await storage.setItem(key, value);
    } else {
      throw new Error("Storage quota exceeded and no items to remove");
    }
  } catch (e) {
    console.error("Failed to handle quota error:", e);
    throw e;
  }
};

// Usage
const quotaStorage = createQuotaManagementStorage(
  localStorage,
  handleQuotaError
);
persist(quotaStorage, largeDataStore, { key: "large-data" });
```

## Best Practices

### Error Handling

Always include error handling with your storage adapters:

```js
const createRobustStorage = (baseStorage) => {
  return {
    async getItem(key) {
      try {
        return await baseStorage.getItem(key);
      } catch (error) {
        console.error(`Failed to get item ${key}:`, error);
        return null;
      }
    },

    async setItem(key, value) {
      try {
        await baseStorage.setItem(key, value);
      } catch (error) {
        console.error(`Failed to set item ${key}:`, error);
        // You might want to retry, fallback to another storage, or notify the user
        throw error;
      }
    },

    async removeItem(key) {
      try {
        await baseStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove item ${key}:`, error);
        // Handle error appropriately
      }
    },
  };
};
```

### Storage Availability Detection

Always check if storage is available before using it:

```js
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const testKey = "__storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Usage
const storage = isStorageAvailable("localStorage")
  ? localStorage
  : createMemoryStorage();
persist(storage, myStore, { key: "app-data" });
```

### Data Compression

For large state objects, consider compressing the data:

```js
// Example using a simple compression library (you would need to include such a library)
const createCompressedStorage = (baseStorage) => {
  return {
    async getItem(key) {
      const compressedData = await baseStorage.getItem(key);
      if (!compressedData) return null;

      try {
        // Use your compression library here
        return decompressData(compressedData);
      } catch (error) {
        console.error("Failed to decompress data:", error);
        return null;
      }
    },

    async setItem(key, value) {
      try {
        // Use your compression library here
        const compressed = compressData(value);
        await baseStorage.setItem(key, compressed);
      } catch (error) {
        console.error("Failed to compress or save data:", error);
        throw error;
      }
    },

    async removeItem(key) {
      await baseStorage.removeItem(key);
    },
  };
};

// These functions would use your chosen compression library
function compressData(data) {
  // Example implementation with a hypothetical compression library
  return LZString.compress(data);
}

function decompressData(compressedData) {
  // Example implementation with a hypothetical compression library
  return LZString.decompress(compressedData);
}
```

## Testing Storage Adapters

Create mock storage adapters for testing:

```js
// Mock storage for testing
const createMockStorage = (initialData = {}) => {
  let storage = { ...initialData };

  return {
    getItem: jest.fn((key) => storage[key] || null),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
    }),

    // Helper methods for testing
    _getData: () => ({ ...storage }),
    _clear: () => {
      storage = {};
    },
    _resetMocks: () => {
      jest.clearAllMocks();
    },
  };
};

// Usage in tests
describe("persistence tests", () => {
  let mockStorage;
  let testStore;

  beforeEach(() => {
    mockStorage = createMockStorage({ "existing-key": "existing-value" });
    testStore = store({ count: 0 });
  });

  test("should persist store changes to storage", () => {
    persist(mockStorage, testStore, { key: "test-store" });

    // Modify the store
    testStore.count = 42;

    // Check that setItem was called with the correct data
    expect(mockStorage.setItem).toHaveBeenCalled();
    expect(JSON.parse(mockStorage.setItem.mock.calls[0][1])).toEqual({
      count: 42,
    });
  });
});
```

## Conclusion

By implementing custom storage adapters, you can persist jods state to virtually any storage mechanism, from browser storage to remote APIs, databases, or even custom systems. The flexible interface makes it easy to add persistence to your application while maintaining control over where and how your data is stored.
