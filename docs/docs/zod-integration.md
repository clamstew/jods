# Zod Integration with jods

jods provides a lightweight integration with [Zod](https://github.com/colinhacks/zod), the TypeScript-first schema validation library. This enables you to validate your store data with powerful schemas.

## Installation

To use Zod with jods, you need to install Zod as a dependency:

```bash
npm install zod
# or
yarn add zod
# or
pnpm add zod
```

## Basic Usage

There are two ways to use Zod with jods:

### 1. Standard Zod Import

The most direct and **recommended way for full functionality** is to import Zod's `z` directly:

```typescript
import { store } from "jods";
import { z } from "zod";

// Define your schema with Zod
const TodoSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  completed: z.boolean().default(false),
});

// Create a store
const todoStore = store({
  id: "1",
  title: "Learn jods",
  completed: false,
});

// Validate data when needed
function validateTodo() {
  const todoData = todoStore.json();
  return TodoSchema.parse(todoData);
}
```

### 2. Using j/jod Aliases (Curated Subset)

jods provides `j` and `jod` exports that are aliases for a **curated subset** of Zod's `z` API. This is a playful feature that makes the jods name make more sense (j/jod is to jods as z is to zod). These aliases provide convenient access to the most commonly used Zod functionalities directly through jods.

```typescript
import { store } from "jods";
// Updated: Import j/jod from jods/zod
import { j } from "jods/zod";
// OR
import { jod } from "jods/zod";
import { z } from "zod"; // You still need to install and import Zod!

// Define schema using j (accesses a subset of Zod's z API)
const TodoSchema = j.object({
  id: j.string(),
  title: j.string().min(3), // .min() is an example of an exposed method
  completed: j.boolean().default(false),
});

// OR using jod
const TodoSchemaJod = jod.object({
  id: jod.string(),
  title: jod.string().min(3),
  completed: jod.boolean().default(false),
});

// The rest of your code remains the same
const todoStore = store({
  id: "1",
  title: "Learn jods",
  completed: false,
});
```

**Important**:

- The `j` and `jod` exports are proxies that forward to Zod's `z` when Zod is installed and the accessed method/property is part of the exposed set.
- You **must still install Zod separately** as a dependency (`pnpm install zod`).
- **For advanced or less common Zod features not exposed by `j`/`jod`, you should import and use `z` directly from Zod.**
- If you attempt to access a Zod method or property via `j` or `jod` that is not part of the curated set, jods will throw an error. This error message will list all available properties/methods through the alias and guide you to use Zod directly for the requested functionality.

This approach helps keep the jods wrapper lightweight and focused, reducing maintenance an encouraging direct use of Zod for its full power when needed.

## With Remix Integration

jods' Remix integration works seamlessly with Zod schemas. You can use Zod directly or the `j`/`jod` aliases (keeping in mind the curated API) when defining schemas for `defineStore`.

```typescript
import { defineStore } from "jods/remix";
import { z } from "zod";
// Or use the aliases (updated import path)
import { j, jod } from "jods/zod";

// Define schema with Zod
const todoSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  completed: z.boolean().default(false),
});

// Create a store with schema validation
const todoStore = defineStore({
  name: "todos",
  schema: todoSchema, // Use Zod schema for validation
  defaults: {
    id: "",
    title: "",
    completed: false,
  },
  handlers: {
    create: ({ form }) => {
      // Return data will be validated against the schema
      return {
        id: crypto.randomUUID(),
        title: form.get("title"),
        completed: false,
      };
    },
  },
});
```

## How It Works

The `j` and `jod` exports in jods are designed to offer convenient, albeit limited, access to Zod's API:

1.  They look for Zod in your environment.
2.  If Zod is available and you access an **exposed** method or property (e.g., `j.string()`, `j.object()`, `j.optional()`), they forward the call to Zod's `z`.
3.  If Zod is available but you attempt to access a method or property **not exposed** through the `j`/`jod` alias, an error is thrown. The error message will list the available functionalities and recommend using Zod directly.
4.  If Zod is **not available**:
    - Accessing an **exposed** method will result in a console warning and a chainable fallback object (where further allowed chained calls also use this fallback behavior).
    - Attempting to access a method or property **not exposed** will throw an error immediately.

This implementation ensures that:

- You get easy access to common Zod features through `j`/`jod`.
- You get clear error messages if Zod is missing or if you try to use a non-exposed feature via the alias.
- You are guided to use Zod directly (`import { z } from 'zod';`) for the full range of Zod's capabilities and for any features not part of the curated `j`/`jod` API.

## Type Inference

Zod's powerful type inference works with the `j` and `jod` aliases as well, provided you are using exposed methods and properties. Since `j` and `jod` proxy to actual Zod objects (when Zod is present), and critically expose the `_def` property, type inference with `z.infer` should work as expected for schemas constructed with `j` or `jod`.

```typescript
import { j } from "jods";

const UserSchema = j.object({
  id: j.string(),
  name: j.string(),
  email: j.string().email(),
  role: j.enum(["user", "admin"]),
});

// Infer the type from the schema
type User = z.infer<typeof UserSchema>;
// Equivalent to:
// type User = {
//   id: string;
//   name: string;
//   email: string;
//   role: 'user' | 'admin';
// };
```

## Important Notes

- `j` and `jod` provide access to a **curated subset** of Zod's `z` API.
- **For full Zod functionality, always use the main `z` export from Zod directly.**
- You must install Zod as a dependency: `npm install zod`.
- If Zod is not installed, `j`/`jod` will issue warnings for allowed methods and return fallback objects; errors will be thrown for non-allowed methods.
- If Zod is installed, attempting to use a non-exposed Zod feature via `j`/`jod` will result in an error guiding you to use `z` directly. The error message will list the exposed API.
- This feature is primarily a playful homage to Zod's naming convention, providing a convenient but intentionally limited wrapper.
