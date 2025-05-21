/**
 * This module provides a thin wrapper around Zod for jods users
 * It exports j and jod as aliases for Zod's z
 *
 * Note: This is primarily a playful feature to make the jods name make more sense,
 * as j/jod is a play on Zod's z.
 *
 * WARNING: Users still need to install and import Zod separately, this is just
 * a fun alias that logs a helpful message when used without Zod.
 */

import { getZ } from "./zodUtils";

// New: Define allowed Zod properties and methods
const ALLOWED_ZOD_PROPS: Set<string> = new Set([
  // Core types
  "string",
  "number",
  "boolean",
  "object",
  "array",
  "enum",
  "union",
  "intersection",
  "literal",
  "any",
  "unknown",
  "date",
  "bigint",
  "symbol",
  "void",
  "never",
  "undefined",
  "null",
  // Common modifiers / chainable
  "optional",
  "nullable",
  "default",
  "describe",
  "transform",
  "refine",
  "superRefine",
  "pipe",
  "catch",
  "brand",
  "readonly",
  // String specific
  "min",
  "max",
  "length",
  "email",
  "url",
  "uuid",
  "cuid",
  "cuid2",
  "ulid",
  "regex",
  "includes",
  "startsWith",
  "endsWith",
  "trim",
  "datetime",
  "ip",
  // Number specific (min, max, length already included)
  "gt",
  "gte",
  "lt",
  "lte",
  "int",
  "positive",
  "nonnegative",
  "negative",
  "nonpositive",
  "multipleOf",
  "finite",
  "safe",
  "step",
  // Array specific (min, max, length already included)
  "nonempty",
  // Object specific
  "extend",
  "merge",
  "pick",
  "omit",
  "partial",
  "deepPartial",
  "required",
  "passthrough",
  "strict",
  "strip",
  "keyof",
  "catchall",
  // Date specific (min, max already included)
  // Parsing
  "parse",
  "parseAsync",
  "safeParse",
  "safeParseAsync",
  // Properties/accessors often used with schemas
  "shape", // for z.object().shape
  "element", // for z.array().element / z.set().element
  "elements", // for z.tuple().elements
  "options", // for z.enum().options / z.union().options
  "value", // for z.literal().value
  "typeName", // Internal Zod type identifier e.g. z.string().typeName
  "_def", // Crucial for z.infer and other Zod internal workings / type utilities
  // Note: ZodError is typically imported `import { ZodError } from 'zod';` not accessed as z.ZodError
]);

// New: Helper function for disallowed property error
function getDisallowedPropError(propName: string): string {
  const availableProps = Array.from(ALLOWED_ZOD_PROPS).join(", ");
  return `Error: Property or method '${propName}' is not directly exposed via jods' j/jod alias.
For this functionality, please import and use Zod directly: \`import { z } from 'zod';\`
Available properties and methods via j/jod are: [${availableProps}].
If you believe '${propName}' should be exposed, please open an issue with the jods project.`;
}

// This interface mirrors the core Zod schema methods without importing Zod directly
interface ZodType {
  string: () => any;
  number: () => any;
  boolean: () => any;
  object: <T extends Record<string, any>>(shape?: T) => any;
  array: (schema?: any) => any;
  enum: (values: [string, ...string[]]) => any;
  union: (types: any[]) => any;
  intersection: (types: any[]) => any;
  literal: (value: any) => any;
  nullable: () => any;
  optional: () => any;
  [key: string]: any;
}

// Create a more comprehensive fallback object with chainable methods
const createZodMissingFallback = (methodName: string) => {
  // methodName has already been validated against ALLOWED_ZOD_PROPS by the caller (createZodProxyHandler)
  const warning = () => {
    console.warn(
      `Warning: You're using jods ${methodName}() without Zod installed.\n` +
        `To use validation with jods:\n` +
        `1. Install Zod: npm install zod\n` +
        `2. Import both: import { j, jod } from 'jods'; import { z } from 'zod';\n` +
        `This is just a fun way to use jods with Zod (j is to jods as z is to zod).`
    );
  };

  const warned = { warned: false };

  const fallbackObj = new Proxy(
    {
      // Minimal explicit properties for the fallback object.
      // Most chainable methods will be handled by the proxy's get trap.
      parse: () => undefined,
      safeParse: () => ({
        success: false,
        error: new Error("Zod is not installed"),
      }),
      _zodMissing: true,
      // 'type' property will be dynamically added to fallbackObj by initialMethodCall or chained calls
    },
    {
      get: (target, prop) => {
        if (typeof prop !== "string") {
          return undefined;
        }
        // Return any existing explicit properties on the target (like parse, safeParse, _zodMissing)
        if (prop in target) {
          return (target as any)[prop];
        }

        // Check if the chained property is allowed
        if (!ALLOWED_ZOD_PROPS.has(prop)) {
          throw new Error(getDisallowedPropError(prop));
        }

        // For any other allowed prop, return a function that allows further chaining.
        return (..._args: any[]) => {
          // Show warning only once per initial call that created this fallback chain
          if (!warned.warned) {
            warning();
            warned.warned = true;
          }
          const result = fallbackObj as any;
          // Update .type for known type creators if called on fallback
          // (e.g. if j.string().object() was called, type should become 'object')
          if (
            prop === "string" ||
            prop === "number" ||
            prop === "boolean" ||
            prop === "object" ||
            prop === "array"
          ) {
            result.type = String(prop);
          }
          return result; // Return the same fallback object for chaining.
        };
      },
      // No apply trap needed here as fallbackObj itself is not a function
    }
  );

  // This is the function returned for the initial call like j.string() or j.object() when Zod is missing.
  const initialMethodCall = (..._args: any[]) => {
    // Show warning only once for the initial method call (e.g. j.string())
    if (!warned.warned) {
      warning();
      warned.warned = true;
    }

    const result = fallbackObj as any;
    // Configure the 'type' property on the fallbackObj based on the initial methodName
    if (
      methodName === "string" ||
      methodName === "number" ||
      methodName === "boolean" ||
      methodName === "object" ||
      methodName === "array"
    ) {
      result.type = methodName;
    }
    return result; // Return the proxied fallbackObj for chaining
  };

  // Add .type property to the method itself (e.g. j.string has a .type property) to match Zod's behavior.
  // This applies to the function object for j.string, not the result of j.string().
  if (
    methodName === "string" ||
    methodName === "number" ||
    methodName === "boolean" ||
    methodName === "object" ||
    methodName === "array"
  ) {
    (initialMethodCall as any).type = methodName;
  }

  return initialMethodCall;
};

/**
 * Create a proxy handler that forwards to Zod's z if available
 * or provides helpful error messages if not
 */
const createZodProxyHandler = () => ({
  get(_target: any, prop: string | symbol) {
    // Only handle string property names
    if (typeof prop !== "string") {
      return undefined;
    }

    // Ignore special symbols or internal properties not explicitly allowed (like _def)
    // Allow _def as it's in ALLOWED_ZOD_PROPS.
    if (
      prop === "then" ||
      prop === "catch" ||
      prop === "finally" ||
      (prop.startsWith("_") && prop !== "_def")
    ) {
      return undefined;
    }

    // New: Check if the property is allowed
    if (!ALLOWED_ZOD_PROPS.has(prop)) {
      // console.error(getDisallowedPropError(prop)); // Optional: for debugging
      throw new Error(getDisallowedPropError(prop));
    }

    try {
      // Try to get Zod using the utility
      const z = getZ();

      // If we have z and the property exists, forward to it
      if (z && prop in z) {
        return z[prop];
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // If getZ() throws, Zod is not available.
      // Handle specific properties like _def directly when Zod is missing.
      if (prop === "_def") {
        return { _zodMissing: true }; // Directly return object for _def, no warning needed here per tests.
      }
      // For other allowed props when Zod is missing, fall through to createZodMissingFallback.
    }

    // If Zod is not installed (either getZ() threw and prop was not '_def', or z didn't have prop),
    // and prop was allowed, so we return a fallback.
    // The check for ALLOWED_ZOD_PROPS has already passed.
    return createZodMissingFallback(prop);
  },
});

/**
 * j - An alias for Zod's z that forwards to the real Zod if available
 * This is a playful feature to make the jods name make sense
 * (j is to jods as z is to zod)
 *
 * Users should install Zod separately and import it:
 * import { z } from 'zod';
 *
 * @public
 */
export const j = new Proxy({}, createZodProxyHandler()) as ZodType;

/**
 * jod - An alias for Zod's z
 * This is a playful feature to make the jods name make sense
 * (jod is to jods as z is to zod)
 *
 * Users should install Zod separately and import it:
 * import { z } from 'zod';
 *
 * @public
 * @alias j
 */
export const jod = j;

// Note: To use these with Zod, you need to:
// 1. Install Zod: npm install zod
// 2. Import both: import { j, jod } from 'jods'; import { z } from 'zod';
// 3. The j and jod exports are proxies that forward to Zod when available
// 4. If Zod is not installed, helpful warning messages will be shown for allowed methods,
//    and errors will be thrown for non-allowed methods.
