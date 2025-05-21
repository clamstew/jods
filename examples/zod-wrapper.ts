/**
 * Example showcasing the jods/Zod integration concept
 *
 * This example shows the usage of j/jod in jods, which are aliases
 * for a curated subset of Zod's `z` API.
 */

// Import from jods
import { store, j, jod } from "jods"; // j and jod can now be used for a subset of Zod's API

// Import Zod - still recommended for full functionality and required to be installed
import { z, ZodError } from "zod"; // Also importing ZodError for better error handling display

console.log("--- Using jods' `j` alias for Zod (curated subset) ---");

// Define schemas using jods' `j` (if methods are in the allowed set)
const J_UserSchema = j.object({
  id: j.string().uuid(), // .string(), .uuid() are exposed
  name: j.string().min(2), // .min() is exposed
  email: j.string().email(), // .email() is exposed
  age: j.number().optional(), // .number(), .optional() are exposed
  roles: j.array(j.string()), // .array() is exposed
});

// Type inference works with j/jod if Zod is installed and properties like _def are available
type J_User = z.infer<typeof J_UserSchema>; // z.infer still comes from Zod directly for inference

const jUserStore = store<J_User>({
  id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  name: "J User",
  email: "juser@example.com",
  roles: ["editor"],
  age: 30,
});

try {
  const jUserData = jUserStore.json();
  const validatedJUser = J_UserSchema.parse(jUserData); // .parse() is exposed
  console.log("Valid user (using j alias):");
  console.log(validatedJUser);
} catch (error: any) {
  if (error instanceof ZodError) {
    console.error(
      "Invalid user data (using j alias) Zod Errors:",
      error.errors
    );
  } else {
    console.error("Invalid user data (using j alias):", error.message);
  }
}

console.log("--- Using jods' `jod` alias as well ---");
const JOD_ItemSchema = jod.object({
  itemId: jod.string().length(5),
  quantity: jod.number().positive(),
});
type JOD_Item = z.infer<typeof JOD_ItemSchema>;
const jodItemStore = store<JOD_Item>({ itemId: "AB123", quantity: 10 });
console.log(
  "jod alias schema example (valid):",
  JOD_ItemSchema.parse(jodItemStore.json())
);

console.log("--- Using Zod's `z` directly (recommended for full API) ---");

// Define schemas using Zod's z directly (full API available)
const Z_UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional(), // Full Zod API available
  roles: z.array(z.string()).nonempty(), // .nonempty() is available
  lastLogin: z.date().nullable(), // More advanced/specific Zod features
});

// Type inference works directly with Zod
type Z_User = z.infer<typeof Z_UserSchema>;

const zUserStore = store<Partial<Z_User>>({
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Jane Doe",
  email: "jane@example.com",
  roles: ["user"],
  // age is missing initially, but schema has a default via optional or specific default value
});

interface StoreWithValue<T> {
  json: () => T;
  [key: string]: any;
} // Simple interface for casting store type

try {
  // Force cast to access .json() method, as TypeScript has trouble inferring it with Partial<T> & Store<Partial<T>> for zUserStore
  const zUserData = (
    zUserStore as unknown as StoreWithValue<Partial<Z_User>>
  ).json();
  const validatedZUser = Z_UserSchema.parse(zUserData);
  console.log("Valid user (using z directly):");
  console.log(validatedZUser);
} catch (error: any) {
  if (error instanceof ZodError) {
    console.error(
      "Invalid user data (using z directly) Zod Errors:",
      error.errors
    );
  } else {
    console.error("Invalid user data (using z directly):", error.message);
  }
  // Example: If roles were empty and .nonempty() was used.
  // zUserStore.setKey('roles', []);
  // Z_UserSchema.parse((zUserStore as unknown as StoreWithValue<Partial<Z_User>>).json()); // Would throw
}

console.log(
  "\n--- Attempting to use a non-exposed Zod method via `j` (will throw) ---"
);

try {
  // `z.custom()` is an example of a method likely not in the curated ALLOWED_ZOD_PROPS set.
  // This will throw an error from the jods proxy.
  const J_CustomSchema = (j as any).custom(
    (val: unknown) => typeof val === "string"
  );
  console.log(
    "J_CustomSchema created (THIS SHOULD NOT HAPPEN IF 'custom' IS NOT ALLOWED)",
    J_CustomSchema
  );
} catch (error: any) {
  console.warn(
    "Caught expected error when using non-exposed Zod method via `j`:"
  );
  console.warn(` -> ${error.message}`);
  console.warn(
    "This demonstrates that for non-exposed methods, you must use Zod directly:"
  );
  console.warn("   import { z } from 'zod'; const schema = z.custom(...);");
}

/**
 * About the j/jod feature:
 *
 * The `j` and `jod` exports in jods provide convenient aliases for a **curated subset**
 * of Zod's `z` API. This allows for quick use of common Zod functionalities.
 *
 * Key points:
 * 1. Zod must be installed: `npm install zod`
 * 2. For the full Zod API and advanced features, import and use `z` directly from 'zod'.
 *    Example: `import { z } from 'zod'; const mySchema = z.string().url();`
 * 3. If you try to use a Zod method/property via `j`/`jod` that isn't in the exposed set,
 *    jods will throw an error guiding you to use Zod directly. The error will list available methods.
 * 4. If Zod is not installed, using `j`/`jod` for exposed methods will show a console warning
 *    and return a fallback object; non-exposed methods will throw an error.
 */

console.log(`
--- Summary of jods Zod Integration --- 
The \`j\` and \`jod\` exports in jods offer a convenient but limited alias for Zod's \`z\`.\n
1. Install Zod: \`npm install zod\`
2. For simple, common validations, you can use \`j\` or \`jod\`:\n   \`import { j } from 'jods'; const schema = j.object({ name: j.string() });\`
3. For the full power of Zod or for methods not exposed by \`j\`/\`jod\`, use Zod directly:\n   \`import { z } from 'zod'; const schema = z.object({ name: z.string().email() });\`

If \`j.someMethod()\` throws an error saying it's not exposed, switch to \`z.someMethod()\`.`);

// Example of what happens if Zod is NOT installed (conceptual, run by removing Zod and node_modules)
// This can't be directly simulated here without actually uninstalling Zod.
/*
// Assuming Zod is NOT installed:
console.log("\n--- Simulating Zod not installed (conceptual) ---");
try {
  const schemaWithoutZod = j.string().min(5); // Should warn and return a fallback
  console.log("Fallback schema created (Zod not installed):", schemaWithoutZod);
  // schemaWithoutZod.parse("test"); // Would use fallback parse
} catch (e: any) {
  console.error("Error during no-Zod simulation (should be warning + fallback):", e.message);
}
try {
  (j as any).someNonExistentMethod(); // Should throw immediately, listing allowed methods
} catch (e: any) {
  console.error("Error for non-allowed method (Zod not installed):", e.message);
}
*/
