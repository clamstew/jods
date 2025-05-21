---
sidebar_position: 4
title: Performance Tips
description: Optimize your Remix application with jods
---

# 🚀 Performance Optimization

This guide provides tips and techniques for optimizing performance when using jods with Remix applications.

## 💧 Selective Hydration

Only hydrate stores that are needed for the current route:

```tsx
// In root.tsx
import { RehydrateJodsStores } from "jods/remix";

export default function App() {
  return (
    <html>
      <head>{/* ... */}</head>
      <body>
        {/* Only hydrate stores relevant to the current route */}
        <RehydrateJodsStores hydrate={["user", "settings"]} />
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

You can make the hydration dynamic based on the route:

```tsx
// In root.tsx
export default function App() {
  const location = useLocation();
  const storesForRoute = useCallback(() => {
    // Determine which stores to hydrate based on route
    if (location.pathname.startsWith("/admin")) {
      return ["user", "adminSettings", "permissions"];
    } else if (location.pathname.startsWith("/shop")) {
      return ["user", "cart", "products"];
    }

    // Default stores to hydrate
    return ["user", "settings"];
  }, [location.pathname]);

  return (
    <html>
      <head>{/* ... */}</head>
      <body>
        <RehydrateJodsStores hydrate={storesForRoute()} />
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

## 🦥 Lazy Loading Stores

Dynamically import stores only when needed:

```tsx
// Lazy load components that use jods stores
import { lazy, Suspense } from "react";

const AdminDashboard = lazy(() => import("./AdminDashboard"));

export default function AdminRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  );
}

// In AdminDashboard.tsx, import the store
import { adminStore } from "~/jods/admin.jods";
```

## 🗜️ Minimizing State Size

Keep your store state lean to optimize performance:

```typescript
export const userStore = defineStore({
  name: "user",
  schema: z.object({
    // Include only what you need
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    // Avoid including large blobs of data
    // avatar: z.string(), // Don't include large base64 encoded images
    // preferences: z.object({ ... }) // Split into separate store if large
  }),
  // ...
});

// Create separate stores for related but less frequently used data
export const userPreferencesStore = defineStore({
  name: "userPreferences",
  schema: z.object({
    userId: z.string(),
    theme: z.enum(["light", "dark", "system"]),
    notifications: z.boolean(),
    // ... other preferences
  }),
  // ...
});
```

## ⚡ Optimizing Computed Values

Use computed values efficiently:

```typescript
export const cart = defineStore({
  name: "cart",
  schema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })
    ),
  }),
  // ...
});

// Define computed values outside the component to avoid recreation
cart.itemCount = computed(() => cart.items.length);

// For expensive calculations, add memoization
cart.totalPrice = computed(() => {
  // This will only recalculate when cart.items changes
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// In your component
function CartSummary() {
  const cartData = useJodsStore(cart);

  return (
    <div>
      <span>{cartData.itemCount} items</span>
      <span>Total: ${cartData.totalPrice.toFixed(2)}</span>
    </div>
  );
}
```

## 📦 Optimizing Bundle Size

Split your jods configuration to minimize bundle size:

```typescript
// Instead of one large file with all stores
// Split into domain-specific files

// user.jods.ts
export const user = defineStore({
  name: "user",
  // ...
});

// cart.jods.ts
export const cart = defineStore({
  name: "cart",
  // ...
});

// Only import the stores you need in each route
import { user } from "~/jods/user.jods";
// No need to import cart store in user profile route
```

## 💾 Caching Strategies

Implement appropriate caching for your data:

```typescript
export const productCatalog = defineStore({
  name: "productCatalog",
  schema: productCatalogSchema,
  loader: async ({ request }) => {
    const url = new URL(request.url);
    const headers = new Headers();

    // Add cache headers for static data that rarely changes
    setJodsCacheControl(headers, {
      maxAge: 3600, // 1 hour
      staleWhileRevalidate: 86400, // 1 day
      private: false, // Can be cached by CDNs
    });

    return getProductCatalog();
  },
});

export const userCart = defineStore({
  name: "userCart",
  schema: userCartSchema,
  loader: async ({ request }) => {
    const headers = new Headers();

    // For user-specific dynamic data
    setJodsCacheControl(headers, {
      maxAge: 0, // Don't cache
      private: true, // User-specific data
    });

    return getUserCart(request);
  },
});
```

## 🔮 Prefetching Data

Prefetch data for routes the user is likely to visit next:

```tsx
import { prefetchJodsRoutes } from "jods/remix";

function ProductPage() {
  const { products } = useJodsStore(productStore);

  // Prefetch data for product detail pages
  const prefetchProduct = (productId) => {
    prefetchJodsRoutes(`/products/${productId}`);
  };

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id} onMouseEnter={() => prefetchProduct(product.id)}>
            <Link to={`/products/${product.id}`}>{product.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 📝 Optimizing Form Submissions

Reduce unnecessary form submissions:

```tsx
function ProfileForm() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);
  const { isSubmitting } = useJodsFetchers("user.updateProfile");

  // Track form state to prevent unnecessary submissions
  const [formState, setFormState] = useState({
    name: userData.name,
    email: userData.email,
  });

  // Only enable submit if values have changed
  const hasChanges =
    formState.name !== userData.name || formState.email !== userData.email;

  return (
    <form {...form.props}>
      <input
        name="name"
        value={formState.name}
        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
      />
      <input
        name="email"
        value={formState.email}
        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
      />
      <button type="submit" disabled={isSubmitting || !hasChanges}>
        Update Profile
      </button>
    </form>
  );
}
```

## ⏱️ Debouncing and Throttling

For real-time search or filtering, implement debouncing:

```tsx
import { useCallback, useState } from "react";
import { useJodsStore } from "jods/remix";
import { debounce } from "~/utils/debounce";

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const searchStore = useJodsStore(search);

  // Debounce the search function to avoid too many requests
  const debouncedSearch = useCallback(
    debounce((term) => {
      search.actions.search(term);
    }, 300),
    []
  );

  const handleChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  return (
    <div>
      <input
        type="search"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Search..."
      />
      {searchStore.loading && <LoadingIndicator />}
      <SearchResults results={searchStore.results} />
    </div>
  );
}
```

## 📊 Performance Monitoring

Add monitoring to identify performance bottlenecks:

```tsx
import { onUpdate } from "jods/remix";

// Monitor store update performance
onUpdate(userStore, (newState, oldState) => {
  const updateTime = performance.now();

  // Log large state changes
  const stateSize = JSON.stringify(newState).length;
  if (stateSize > 10000) {
    console.warn(`Large state update: ${stateSize} bytes`);
  }

  // Check for expensive updates
  const endTime = performance.now();
  const duration = endTime - updateTime;

  if (duration > 50) {
    console.warn(`Slow state update: ${duration}ms`);
  }
});
```

By applying these performance optimization techniques, you can ensure your Remix application with jods remains fast and responsive, even as your application grows in complexity.
