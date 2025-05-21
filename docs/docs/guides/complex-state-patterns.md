---
sidebar_position: 3
title: Complex State Patterns
description: Best practices for managing complex state structures in jods
---

# Complex State Patterns

## Introduction

As applications grow in complexity, managing state becomes increasingly challenging. This guide explores optimal patterns for structuring and managing complex state in jods, helping you avoid common pitfalls and leverage the library's strengths.

## Structuring Complex State

### Domain-Based Organization

Organize your state based on domain concepts rather than UI components:

```js
import { store } from "jods";

// ✅ Domain-based organization
const appStore = store({
  users: {
    current: null,
    list: [],
    online: [],
  },
  products: {
    items: [],
    categories: [],
    featured: [],
  },
  cart: {
    items: [],
    discounts: [],
    summary: {},
  },
  ui: {
    theme: "light",
    sidebar: "expanded",
    modals: {},
  },
});
```

This approach makes your state more navigable and conceptually clear.

### Normalized State

For complex relational data, consider a normalized approach:

```js
// ❌ Nested and redundant
const messyStore = store({
  posts: [
    {
      id: 1,
      title: "First Post",
      author: { id: 101, name: "Alice", bio: "..." },
      comments: [
        { id: 201, text: "Great post!", author: { id: 102, name: "Bob" } },
      ],
    },
  ],
});

// ✅ Normalized
const normalizedStore = store({
  entities: {
    users: {
      101: { id: 101, name: "Alice", bio: "..." },
      102: { id: 102, name: "Bob", bio: "..." },
    },
    posts: {
      1: { id: 1, title: "First Post", authorId: 101, commentIds: [201] },
    },
    comments: {
      201: { id: 201, text: "Great post!", authorId: 102, postId: 1 },
    },
  },
  ui: {
    currentPostId: 1,
  },
});
```

Benefits of normalization:

- Eliminates data duplication
- Makes updates more predictable
- Improves performance for large datasets

### State Slices for Large Applications

For very large applications, consider splitting state into logical slices:

```js
import { store } from "jods";

const userStore = store({
  current: null,
  preferences: {},
  permissions: {},
  history: [],
});

const productStore = store({
  catalog: [],
  featured: [],
  filters: {},
});

const cartStore = store({
  items: [],
  shipping: {},
  payment: {},
});

// Connect stores when needed
userStore.subscribe(() => {
  if (userStore.current && userStore.current.cart) {
    cartStore.hydrate(userStore.current.cart);
  }
});
```

## Managing Complex State Updates

### Computed Properties for Derived State

Use computed properties for any state that can be derived from other state:

```js
import { store, computed } from "jods";

const appStore = store({
  cart: {
    items: [],
    taxRate: 0.08,
  },
});

// Add computed properties for derived values
appStore.cart.subtotal = computed(() => {
  return appStore.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
});

appStore.cart.tax = computed(() => {
  return appStore.cart.subtotal * appStore.cart.taxRate;
});

appStore.cart.total = computed(() => {
  return appStore.cart.subtotal + appStore.cart.tax;
});
```

### State Mutations with Helper Functions

For complex mutations, create helper functions:

```js
function addToCart(productId, quantity = 1) {
  const product = appStore.products.items.find((p) => p.id === productId);
  if (!product) return false;

  const existingItem = appStore.cart.items.find(
    (item) => item.id === productId
  );

  if (existingItem) {
    // Update existing item
    const index = appStore.cart.items.indexOf(existingItem);
    appStore.cart.items[index] = {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
    };
  } else {
    // Add new item
    appStore.cart.items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
    });
  }

  return true;
}
```

### Handling Asynchronous Updates

Pattern for handling async operations:

```js
import { store } from "jods";

const appStore = store({
  users: {
    list: [],
    loading: false,
    error: null,
  },
});

async function fetchUsers() {
  // Set loading state
  appStore.users.loading = true;
  appStore.users.error = null;

  try {
    const response = await fetch("/api/users");
    if (!response.ok) throw new Error("Failed to fetch users");

    const data = await response.json();
    // Update store with fetched data
    appStore.users.list = data;
    appStore.users.loading = false;
  } catch (err) {
    // Handle error state
    appStore.users.error = err.message;
    appStore.users.loading = false;
  }
}
```

## Handling Edge Cases

### Deep Objects with Circular References

jods handles circular references properly:

```js
const teamStore = store({
  members: [],
});

// Create a circular reference
const alice = { id: 1, name: "Alice" };
const bob = { id: 2, name: "Bob", manager: alice };
alice.reports = [bob];

// jods handles this correctly
teamStore.members = [alice, bob];

// Even snapshots work properly
const snapshot = teamStore.json();
// Circular references are preserved with special marking
```

### Large Collections

For large collections, consider pagination or virtualization strategies:

```js
const dataStore = store({
  allItems: [], // Full dataset (could be thousands of items)
  pagination: {
    pageSize: 20,
    currentPage: 1,
  },
  // Computed property for current page items
  currentPageItems: computed(() => {
    const { pageSize, currentPage } = dataStore.pagination;
    const startIndex = (currentPage - 1) * pageSize;
    return dataStore.allItems.slice(startIndex, startIndex + pageSize);
  }),
});
```

## Real-World Patterns

### Form State Management

```js
const formStore = store({
  values: {
    username: "",
    email: "",
    password: "",
  },
  touched: {
    username: false,
    email: false,
    password: false,
  },
  errors: {},
});

// Computed validation
formStore.errors = computed(() => {
  const errors = {};
  const { username, email, password } = formStore.values;

  if (!username) errors.username = "Username is required";
  if (!email) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email is invalid";
  if (!password) errors.password = "Password is required";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters";

  return errors;
});

formStore.isValid = computed(() => {
  return Object.keys(formStore.errors).length === 0;
});

// Field update function
function updateField(field, value) {
  formStore.values[field] = value;
  formStore.touched[field] = true;
}
```

### Authentication State

```js
const authStore = store({
  user: null,
  token: null,
  loading: false,
  error: null,
});

authStore.isAuthenticated = computed(() => {
  return !!authStore.token && !!authStore.user;
});

// Auth operations
async function login(credentials) {
  authStore.loading = true;
  authStore.error = null;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json();
    authStore.user = data.user;
    authStore.token = data.token;
    localStorage.setItem("auth_token", data.token);
  } catch (err) {
    authStore.error = err.message;
  } finally {
    authStore.loading = false;
  }
}
```

## Testing Complex State

Creating testable state structures:

```js
import { store } from "jods";

// Create a factory function for consistent store initialization
function createAppStore(initialState = {}) {
  return store({
    users: { list: [], current: null },
    products: { items: [] },
    ...initialState,
  });
}

// In tests
describe("App Store", () => {
  let testStore;

  beforeEach(() => {
    testStore = createAppStore({
      users: {
        list: [{ id: 1, name: "Test User" }],
      },
    });
  });

  test("should add a product to store", () => {
    const newProduct = { id: 1, name: "Test Product" };
    testStore.products.items.push(newProduct);
    expect(testStore.products.items).toContainEqual(newProduct);
  });
});
```

## Conclusion

Building complex applications with jods is straightforward when following these patterns. Remember that:

1. State organization should reflect your domain
2. Computed properties should handle derived state
3. Normalized state improves maintainability for relational data
4. Helper functions can encapsulate complex state transitions
5. Clear patterns for async operations keep your code predictable

By following these guidelines, you can build robust, maintainable applications of any complexity while leveraging jods' reactive capabilities.

## See Also

- [Performance Best Practices](./performance-best-practices.md)
- [API Reference](../api-reference.md)
- [Fine-Grained Reactivity](../fine-grained-reactivity.md)
