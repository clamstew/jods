---
sidebar_position: 2
---

# Framework Integrations Guide

This guide documents how jods integrates with popular frontend frameworks and provides best practices for using these integrations.

## Framework Integration Architecture

jods provides first-class support for several frontend frameworks through dedicated integration modules:

```
src/
  ├── frameworks/        # Framework integrations
  │   ├── react/         # React integration
  │   ├── preact/        # Preact integration
  │   └── remix/         # Remix integration
  │
  └── utils/ # Utility functions
```

Each framework integration follows a consistent pattern:

1. **Entry point**: `frameworks/{framework}/index.ts` exports all integration features
2. **Hooks**: Framework-specific hooks are located within their respective `src/frameworks/{framework}/` directories (e.g., `useJods.ts`, `useJodsPreact.ts`).
3. **Additional utilities**: Framework-specific utilities in their respective directories

## React Integration

React integration provides a seamless way to use jods stores in React components.

### Core Features

- **useJods hook**: Automatically subscribes to store changes and updates components
- **Computed value resolution**: Automatically resolves computed properties when accessed
- **React lifecycle integration**: Handles subscriptions with proper lifecycle methods

### Usage Example

```tsx
import { store } from "jods";
import { useJods } from "jods/react";

// Create a store
const userStore = store({
  firstName: "John",
  lastName: "Doe",
  fullName: computed(() => `${userStore.firstName} ${userStore.lastName}`),
});

// Use in a component
function UserProfile() {
  const user = useJods(userStore);

  return (
    <div>
      <h1>{user.fullName}</h1> {/* Computed property auto-resolved */}
      <input
        value={user.firstName}
        onChange={(e) => (user.firstName = e.target.value)}
      />
    </div>
  );
}
```

### Type Safety

When using the `useJods` hook with TypeScript, ensure proper type annotations:

```tsx
interface UserStore {
  firstName: string;
  lastName: string;
  fullName: string; // Type representing the computed value result
}

// Properly type the useJods hook
const user = useJods<UserStore>(userStore);
```

When rendering computed values, it's recommended to ensure they're the expected type:

```tsx
// Explicit conversion to string for computed values
return <div>{String(user.fullName)}</div>;
```

#### Enhanced Type Safety Patterns

For even better type safety with the `useJods` hook, follow these patterns:

1. **Explicit Type Imports**

   Import React types explicitly for maximum clarity:

   ```tsx
   import type { Dispatch, SetStateAction } from "react";
   ```

2. **Explicit Type Assertions for State Management**

   When defining state with `useState`, use explicit type assertions:

   ```tsx
   // Properly typed with explicit type assertion
   const [state, setState] = useState(() => store.getState()) as [
     T,
     Dispatch<SetStateAction<T>>
   ];
   ```

3. **Thorough Type Checking for Computed Values**

   When handling computed values in proxies, use comprehensive type checking:

   ```tsx
   get(obj, prop) {
     const value = Reflect.get(obj, prop);

     // Thorough type checking before resolving computed value
     if (value && typeof value === "function" && isComputed(value)) {
       return (value as any)();
     }

     return value;
   }
   ```

4. **Type Guards for Computed Values**

   Create type guards to safely check for computed values:

   ```tsx
   function isComputedFunction<T>(
     value: unknown
   ): value is (() => T) & { __computed: true } {
     return (
       !!value &&
       typeof value === "function" &&
       (value as any).__computed === true
     );
   }

   // Then use the guard
   if (isComputedFunction<string>(value)) {
     return value();
   }
   ```

## Preact Integration

Preact integration follows a similar pattern to React but is optimized for Preact's specific hooks API.

### Core Features

- **useJods hook**: Similar to React but using Preact's hooks
- **Smaller bundle size**: Optimized for Preact's smaller footprint
- **Equivalent API**: Same API as React integration for consistency

### Usage Example

```jsx
import { store } from "jods";
import { useJods } from "jods/preact";

// Create a store
const counterStore = store({ count: 0 });

// Use in a Preact component
function Counter() {
  const state = useJods(counterStore);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => counterStore.count++}>Increment</button>
    </div>
  );
}
```

## Remix Integration

Remix integration provides more complex features for server-side rendering support.

### Core Features

- **defineStore**: Creates a named store that can be registered with the Remix system
- **useJods**: Unified hook combining store state with form handlers
- **useJodsStore**: Provides reactive state updates with property tracking
- **useJodsForm**: Creates form components that connect to store handlers
- **Server-side rendering**: Supports hydration and dehydration of state

### Usage Example

```tsx
// Define a store
import { defineStore } from "jods/remix";
import { j } from "jods";

const todoStore = defineStore({
  name: "todos",
  schema: j.object({
    items: j.array(
      j.object({
        id: j.string(),
        text: j.string(),
        completed: j.boolean(),
      })
    ),
  }),
  initialState: {
    items: [],
  },
  handlers: {
    // Action handlers
    addTodo: (store, { text }) => {
      store.items.push({
        id: Math.random().toString(36).substr(2, 9),
        text,
        completed: false,
      });
    },
    toggleTodo: (store, { id }) => {
      const todo = store.items.find((item) => item.id === id);
      if (todo) todo.completed = !todo.completed;
    },
  },
});

// Use in a Remix component
import { useJods } from "jods/remix";

export default function TodoApp() {
  const { stores, actions } = useJods(todoStore, ["addTodo", "toggleTodo"]);

  return (
    <div>
      <h1>Todo List ({stores.items.length})</h1>

      <actions.addTodo.Form>
        <input name="text" placeholder="Add todo" />
        <button type="submit">Add</button>
      </actions.addTodo.Form>

      <ul>
        {stores.items.map((todo) => (
          <li key={todo.id}>
            <actions.toggleTodo.Form>
              <input type="hidden" name="id" value={todo.id} />
              <button type="submit">
                {todo.completed ? "✓" : "○"} {todo.text}
              </button>
            </actions.toggleTodo.Form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## AI-Optimized Framework Hooks

jods provides AI-optimized versions of framework hooks to improve context window efficiency when using AI assistants to work with the codebase.

### Available AI-Optimized Files

- `src/ai/react-useJods.ai.ts`: Simplified version of React hook
- `src/ai/preact-useJods.ai.ts`: Simplified version of Preact hook
- `src/ai/remix-useJods.ai.tsx`: Simplified version of Remix hook
- `src/ai/remix-useJodsStore.ai.tsx`: Simplified version of Remix store hook
- `src/ai/remix-useJodsForm.ai.tsx`: Simplified version of Remix form hook

### Key Differences in AI-Optimized Files

1. **Simplified implementations**: Less code with the same functionality
2. **Removal of test-specific code**: Clean production-focused code
3. **Consistent debug utilities**: Using the `debug` utility instead of console.log
4. **More concise comments**: Focusing on "why" not "what"

### When to Reference AI-Optimized Files

- **For understanding core concepts**: AI-optimized files are easier to understand
- **When working with AI assistants**: Reduces token usage for better responses
- **Learning the codebase**: Clearer picture of how integrations work

The standard implementation files should be referenced for:

- Implementation details that might be simplified in AI-optimized versions
- Test-specific behavior and edge cases
- Complete API surface area

## Common Integration Patterns

When working with framework integrations, you'll observe these common patterns:

### 1. Framework Detection

```typescript
// Detecting if running in a specific framework context
function isReactContext() {
  return (
    (typeof window !== "undefined" && !!(window as any).React) ||
    (typeof globalThis !== "undefined" && !!(globalThis as any).React)
  );
}

// Using framework detection
if (isReactContext()) {
  // Handle React-specific behavior
}
```

### 2. Hook Patterns

All framework hooks follow a consistent pattern:

```typescript
function useFrameworkHook(store) {
  // 1. Initialize state with current store state
  const [state, setState] = useState(() => store.getState());

  // 2. Subscribe to store changes on mount
  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });

    // 3. Unsubscribe on unmount
    return unsubscribe;
  }, [store]);

  // 4. Return state or enhanced state
  return state;
}
```

### 3. Computed Value Resolution

Automatic resolution of computed values using proxies:

```typescript
// Create a proxy to auto-resolve computed values
const proxiedState = new Proxy(state, {
  get(obj, prop) {
    const value = Reflect.get(obj, prop);

    // If property is a computed value, call it
    if (isComputed(value)) {
      return value();
    }

    return value;
  },
});
```

### 4. Debug Utilities

Framework integration code uses the debug utility with framework-specific categories:

```typescript
import { debug } from "../utils/debug";

// React-specific logging
debug.log("react", "Setting up store subscription");

// Preact-specific logging
debug.log("preact", "Store changed, updating component");

// Remix-specific logging
debug.log("remix", "Creating form for handler: " + handler);
```

## Best Practices

When working with framework integrations:

1. **Use the appropriate hook for your framework**:

   - React: `import { useJods } from 'jods/react'`
   - Preact: `import { useJods } from 'jods/preact'`
   - Remix: `import { useJods } from 'jods/remix'`

2. **Handle type safety explicitly**:

   - Provide generic type parameters to `useJods<T>`
   - Convert computed values to appropriate types before rendering
   - Use TypeScript interfaces to document expected store structure

3. **Maintain framework-specific patterns**:

   - Follow React's rules of hooks when working with the React integration
   - Use Preact's specific imports (`preact/hooks`) for Preact integration
   - Follow Remix conventions for Remix integration

4. **Debug efficiently with debug utility**:
   - Enable debug for specific framework categories as needed
   - Use consistent debug message formats
   - Provide meaningful context in debug messages

## Troubleshooting

Common issues when working with framework integrations:

1. **Component not updating when store changes**:

   - Check that you're using the `useJods` hook, not accessing the store directly
   - Verify the component is actually re-rendering when expected
   - Confirm you're not creating a new store on each render

2. **Type errors with computed values**:

   - Ensure computed values are properly typed
   - Use explicit type conversions when rendering (`String()`, etc.)
   - Define proper TypeScript interfaces for your stores

3. **React DevTools showing incorrect values**:

   - This is expected behavior for proxied values
   - The store itself contains the canonical state
   - Use the jods debugger for more accurate debugging

4. **Server/client hydration issues in Remix**:
   - Ensure proper hydration by using `withJods` in loaders
   - Check that your store definition is consistent between server and client
   - Use the rehydration utilities provided by jods/remix
