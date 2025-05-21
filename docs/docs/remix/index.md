---
sidebar_position: 1
title: Remix Integration Overview
description: Complete guide to using jods with Remix
---

# 💿 🐿️ 🦆 Remix Integration Guide

## 🌟 Overview

The jods Remix 💿 integration provides a seamless way to manage your application state across server and client, replacing traditional loaders and actions with reactive stores.

## 🚀 Getting Started

### 📦 Installation

```bash
pnpm install jods zod
```

### 🔌 Basic Setup

1. Create a jods directory in your app root
2. Define your stores using `defineStore`
3. Use the `useJods` hook in your components

## 💭 Core Concepts

### 📦 Defining Stores

```typescript
// app/jods/user.jods.ts
import { defineStore } from "jods/remix";
import { j } from "jods/zod";

export const user = defineStore({
  name: "user",
  schema: j.object({
    name: j.string(),
    email: j.string().email(),
    preferences: j.object({
      theme: j.enum(["light", "dark", "system"]).default("system"),
    }),
  }),
  defaults: {
    name: "",
    email: "",
    preferences: { theme: "system" },
  },
  handlers: {
    async updateProfile({ current, form }) {
      return {
        ...current,
        name: form.get("name"),
        email: form.get("email"),
      };
    },
  },
  loader: async ({ request }) => {
    // Load user data from database
    return {
      name: "Burt Macklin",
      email: "burt.macklin@fbi.pawnee.city",
      preferences: { theme: "light" },
    };
  },
});
```

### 🛣️ Using in Routes

```tsx
// app/routes/profile.tsx
import { useJods } from "jods/remix";
import { user } from "~/jods/user.jods";

export default function Profile() {
  const { stores, actions } = useJods(user, ["updateProfile"]);

  return (
    <div>
      <h1>Profile</h1>
      <actions.updateProfile.Form>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={stores.name} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" defaultValue={stores.email} />
        </div>
        <button type="submit">Update Profile</button>
      </actions.updateProfile.Form>
    </div>
  );
}
```

## 🔄 Direct Mutations - The jods Way

One of the most powerful features of jods is the ability to directly mutate your store properties:

```tsx
import { useJods } from "jods/remix";
import { user } from "~/jods/user.jods";

function ThemeToggle() {
  const { stores } = useJods(user);

  return (
    <button
      onClick={() => {
        // Direct property mutation! 🪄
        stores.preferences.theme =
          stores.preferences.theme === "dark" ? "light" : "dark";
      }}
    >
      Switch to {stores.preferences.theme === "dark" ? "Light" : "Dark"} mode
    </button>
  );
}
```

## 🔧 Advanced Usage

### ⚡ Optimistic UI

```tsx
import { useOptimisticUpdate, useJods } from "jods/remix";
import { cart } from "~/jods/cart.jods";

export function AddToCartButton({ productId, productName }) {
  const optimisticCart = useOptimisticUpdate(
    cart,
    "addItem",
    (currentCart) => ({
      items: [
        ...currentCart.items,
        { id: productId, name: productName, quantity: 1 },
      ],
    })
  );

  const { actions } = useJods(cart, ["addItem"]);

  return (
    <>
      <div className="cart-preview">
        {optimisticCart.items.length} items in cart
      </div>
      <actions.addItem.Form>
        <input type="hidden" name="productId" value={productId} />
        <button type="submit">Add to Cart</button>
      </actions.addItem.Form>
    </>
  );
}
```

### 📊 Tracking Submission State

```tsx
import { useJodsFetchers } from "jods/remix";

function SubmitButton() {
  const { isSubmitting } = useJodsFetchers("cart.addItem");

  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

### 🔄 Form Transition States

```tsx
import { useJodsTransition } from "jods/remix";

function FormStatus() {
  const { isPending } = useJodsTransition("user.updateProfile");

  if (isPending) {
    return <div className="status">Saving changes...</div>;
  }

  return null;
}
```

### 👴 Individual Hooks (Legacy Approach)

While `useJods` is the recommended way to access jods data and actions, you can still use the individual hooks for specialized cases:

```tsx
// Legacy approach with separate hooks
import { useJodsStore, useJodsForm } from "jods/remix";
import { user } from "~/jods/user.jods";

export default function ProfileLegacy() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user, "updateProfile");

  return (
    <div>
      <h1>Profile</h1>
      <form.Form>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={userData.name} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" defaultValue={userData.email} />
        </div>
        <button type="submit">Update Profile</button>
      </form.Form>
    </div>
  );
}
```

## ✨ Key Features

- **🔄 Server-Client Synchronization**: State is automatically hydrated from server to client
- **📝 Form Handling**: Built-in form utilities with validation
- **🛡️ Type Safety**: Full TypeScript and schema support with `j`/`jod` aliases
- **⚡ Optimistic Updates**: Manage pending state with useJodsFetchers
- **✏️ Direct Mutations**: Update your state naturally with direct property assignments

## 🔐 Privacy Considerations

When using jods with Remix, it's important to understand how data flows between server and client:

```typescript
// app/jods/user.jods.ts
import { defineStore } from "jods/remix";
import { j } from "jods/zod";

export const user = defineStore({
  name: "user",
  schema: j.object({
    name: j.string(),
    email: j.string().email(),
    // Sensitive data that shouldn't be exposed to client
    role: j.string(),
    securityKey: j.string().optional(),
  }),
  // ...
});
```

:::danger Security Warning
By default, all store data loaded on the server is hydrated to the client. This means any sensitive data in your store will be available in client-side JavaScript.
:::

### Handling Sensitive Data

To protect sensitive information:

1. **Server-only properties**: Consider using a separate store for server-only data
2. **Data filtering**: Filter sensitive data before returning it from loaders
3. **Use jods persist** (coming in future release, see issue #57): Will allow specifying which properties should be persisted to client

```typescript
// Example: Filtering sensitive data in loader
loader: async ({ request }) => {
  const userData = await getUserData();

  // Don't send sensitive fields to client
  const { securityKey, internalNotes, ...safeUserData } = userData;

  return safeUserData;
};
```

## 📚 API Reference

### 🔌 `useJods`

The recommended unified hook for accessing both store data and actions. [Read more](/jods/remix/useJods)

### 📦 `defineStore`

Creates a jods store with server-side handlers and loaders. [Read more](/jods/remix/api-reference#definestoreoptions)

### 🔗 `withJods`

Higher-order function to integrate jods with Remix 💿 loaders and actions. [Read more](/jods/remix/api-reference#withjodsstores-loaderfn)

### 💧 `rehydrateClient`

Component to rehydrate jods stores on the client from server state. [Read more](/jods/remix/api-reference#rehydrateclientoptions)

### 🏪 `useJodsStore`

React hook to access the current state of a jods store. [Read more](/jods/remix/api-reference#usejodsstorestore)

### 📋 `useJodsForm`

React hook to create form bindings for a jods store action. [Read more](/jods/remix/api-reference#usejodsformactionhandler)

### 🔍 `useJodsFetchers`

React hook to track the state of all fetchers for a specific jods store action. [Read more](/jods/remix/api-reference#usejodsfetchersactionid)

### 🚦 `useJodsTransition`

React hook to track transition state for jods action submissions. [Read more](/jods/remix/api-reference#usejodstransitionactionid)

### 🚀 `useOptimisticUpdate`

React hook for implementing optimistic UI updates with jods stores. [Read more](/jods/remix/api-reference#useoptimisticupdatestore-actionname-optimisticdatafn)
