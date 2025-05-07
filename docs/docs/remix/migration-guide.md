---
sidebar_position: 2
title: Migrating to jods
description: Step-by-step guide to migrate from Remix loaders/actions to jods
---

# 🚀 Migrating from Loaders/Actions to jods

This guide helps you incrementally migrate your existing Remix application to use jods stores for state management.

## 🛣️ Step-by-Step Migration

### 🔍 1. Identify Loaders to Convert

Look for loaders that fetch and return data that would benefit from reactivity:

```typescript
// Before: Traditional loader
export const loader = async ({ request }) => {
  const user = await getUserFromDatabase();
  return json({ user });
};
```

### 🏗️ 2. Create a jods Store

```typescript
// After: jods store
import { defineStore } from "jods/remix";
import { z } from "zod";

export const user = defineStore({
  name: "user",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    // other fields
  }),
  loader: async ({ request }) => {
    return await getUserFromDatabase();
  },
});

// Simplified loader
import { withJods } from "jods/remix";
export const loader = withJods([user]);
```

### 🔄 3. Convert Actions to Handlers

```typescript
// Before: Traditional action
export const action = async ({ request }) => {
  const form = await request.formData();
  const name = form.get("name");
  await updateUser({ name });
  return redirect("/profile");
};

// After: jods handler
export const user = defineStore({
  // ...existing store config
  handlers: {
    async updateProfile({ current, form }) {
      const name = form.get("name");
      await updateUser({ name });
      return { ...current, name };
    },
  },
});
```

### 🧩 4. Update Components

```tsx
// Before: Using useLoaderData
import { useLoaderData } from "@remix-run/react";

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Hello, {user.name}</h1>
      <Form method="post">
        <input name="name" defaultValue={user.name} />
        <button type="submit">Update Profile</button>
      </Form>
    </div>
  );
}

// After: Using jods hooks
import { useJodsStore, useJodsForm } from "jods/remix";
import { user } from "~/jods/user.jods";

export default function Profile() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <div>
      <h1>Hello, {userData.name}</h1>
      <form {...form.props}>
        <input name="name" defaultValue={userData.name} />
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
```

## 🔄 Incremental Adoption with `connectActionToJods`

Sometimes you can't migrate a whole action at once. Use `connectActionToJods` to gradually adopt jods:

```typescript
import { connectActionToJods } from "jods/remix";
import { user } from "~/jods/user.jods";

// Keep your existing action
const existingAction = async ({ request }) => {
  const form = await request.formData();
  const name = form.get("name");
  const updatedUser = await updateUser({ name });
  return updatedUser;
};

// Connect it to jods
export const action = connectActionToJods(user, existingAction);
```

## ✅ Migration Checklist

- [x] 🔍 **Identify state** that would benefit from reactivity
- [x] 📝 **Define schemas** using Zod for type safety
- [x] 🏗️ **Create jods stores** for each data domain
- [x] 🔄 **Convert loaders** to use `withJods`
- [x] 🛠️ **Migrate actions** to store handlers
- [x] 🧩 **Update components** to use jods hooks

## 🔀 Handling Redirects

When you need to redirect after a form submission:

```typescript
import { redirect } from "@remix-run/node";

export const user = defineStore({
  // ...
  handlers: {
    async createUser({ current, form }) {
      const user = await createUserInDb({
        name: form.get("name"),
        email: form.get("email"),
      });

      // Throw a redirect instead of returning state
      // This will be handled by Remix
      throw redirect(`/users/${user.id}`);
    },
  },
});
```

## 🔒 Handling Authorization

For protected routes and data:

```typescript
export const protectedData = defineStore({
  name: "protectedData",
  schema: z.object({
    /* ... */
  }),
  loader: async ({ request }) => {
    // Check authentication
    const user = await authenticateUser(request);
    if (!user) {
      throw redirect("/login");
    }

    // Get data for authenticated user
    return getProtectedData(user.id);
  },
});
```
