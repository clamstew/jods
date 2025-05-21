import { defineStore, j } from "../../../src/remix";

// Define a schema for our user data
const userSchema = j.object({
  id: j.string().optional(),
  name: j.string().min(2),
  email: j.string().email(),
  role: j.enum(["admin", "user", "guest"]).default("user"),
  preferences: j.object({
    theme: j.enum(["light", "dark", "system"]).default("system"),
    notifications: j.boolean().default(true),
  }),
  lastLogin: j.string().optional(),
});

// Create the store with type safety using inferred type
export const user = defineStore({
  name: "user",
  schema: userSchema,
  defaults: {
    name: "Guest User",
    email: "guest@example.com",
    role: "guest",
    preferences: {
      theme: "system",
      notifications: true,
    },
  },
  // Server-side handlers for form submissions
  handlers: {
    async updateProfile({ current, form }) {
      // Update user profile with form data
      return {
        ...current,
        name: (form.get("name") as string) || current.name,
        email: (form.get("email") as string) || current.email,
      };
    },

    async updateTheme({ current, form }) {
      const theme = form.get("theme") as "light" | "dark" | "system";

      // Only update the theme preference, demonstrating fine-grained reactivity
      return {
        ...current,
        preferences: {
          ...current.preferences,
          theme,
        },
      };
    },

    async toggleNotifications({ current }) {
      // Toggle the notification preference
      return {
        ...current,
        preferences: {
          ...current.preferences,
          notifications: !current.preferences.notifications,
        },
      };
    },
  },
  // Optional server-side loader
  loader: async ({ request: _request }) => {
    // This would typically fetch user data from a database
    // For this example, just set the last login time
    return {
      name: "Burt Macklin",
      email: "burt.macklin@fbi.pawnee.city",
      role: "user" as const,
      preferences: {
        theme: "light" as const,
        notifications: true,
      },
      lastLogin: new Date().toISOString(),
    };
  },
});
