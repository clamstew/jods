---
sidebar_position: 1
title: Remix Integration Overview
description: Complete guide to using jods with Remix
---

# Remix Integration Guide

## Overview

The jods Remix integration provides a seamless way to manage your application state across server and client, replacing traditional loaders and actions with reactive stores.

## Getting Started

### Installation

```bash
npm install jods zod
```

### Basic Setup

1. Create a jods directory in your app root
2. Define your stores using `defineStore`
3. Use the hooks in your components

## Core Concepts

### Defining Stores

```typescript
// app/jods/user.jods.ts
import { defineStore } from "jods/remix";
import { z } from "zod";

export const user = defineStore({
  name: "user",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    preferences: z.object({
      theme: z.enum(["light", "dark", "system"]).default("system"),
    }),
  }),
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
      name: "John Doe",
      email: "john@example.com",
      preferences: { theme: "light" },
    };
  },
});
```

### Using in Routes

```tsx
// app/routes/profile.tsx
import { useJodsStore, useJodsForm } from "jods/remix";
import { user } from "~/jods/user.jods";

export default function Profile() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <div>
      <h1>Profile</h1>
      <form {...form.props}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" defaultValue={userData.name} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" defaultValue={userData.email} />
        </div>
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
```

## Advanced Usage

### Optimistic UI

```tsx
import { useOptimisticUpdate } from "jods/remix";
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

  const form = useJodsForm(cart.actions.addItem);

  return (
    <>
      <div className="cart-preview">
        {optimisticCart.items.length} items in cart
      </div>
      <form {...form.props}>
        <input type="hidden" name="productId" value={productId} />
        <button type="submit">Add to Cart</button>
      </form>
    </>
  );
}
```

### Tracking Submission State

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

### Form Transition States

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

## Key Features

- **Server-Client Synchronization**: State is automatically hydrated from server to client
- **Form Handling**: Built-in form utilities with validation
- **Type Safety**: Full TypeScript and Zod schema support
- **Optimistic Updates**: Manage pending state with useJodsFetchers

## API Reference

### defineStore

Creates a jods store with server-side handlers and loaders. [Read more](/jods/remix/api-reference#definestoreoptions)

### useJodsStore

React hook to access the current state of a jods store. [Read more](/jods/remix/api-reference#usejodsstorestore)

### useJodsForm

React hook to create form bindings for a jods store action. [Read more](/jods/remix/api-reference#usejodsformactionhandler)

### useJodsFetchers

React hook to track the state of all fetchers for a specific jods store action. [Read more](/jods/remix/api-reference#usejodsfetchersactionid)

### useJodsTransition

React hook to track transition state for jods action submissions. [Read more](/jods/remix/api-reference#usejodstransitionactionid)

### useOptimisticUpdate

React hook for implementing optimistic UI updates with jods stores. [Read more](/jods/remix/api-reference#useoptimisticupdatestore-actionname-optimisticdatafn)

### withJods

Higher-order function to integrate jods with Remix loaders and actions. [Read more](/jods/remix/api-reference#withjodsstores-loaderfn)

### rehydrateClient

Component to rehydrate jods stores on the client from server state. [Read more](/jods/remix/api-reference#rehydrateclientoptions)
