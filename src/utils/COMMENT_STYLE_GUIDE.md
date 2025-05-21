# Token-Efficient Comment Style Guide

This guide outlines the preferred comment style for the jods codebase to optimize for AI context window efficiency while maintaining readability.

## Goals

1. Reduce token usage in comments while preserving important information
2. Maintain human readability and clear documentation
3. Focus on explaining "why" more than "what" (code should be self-descriptive)
4. Standardize comment format and style

## Style Rules

### Function/Method Comments

#### ✅ Efficient Style

```typescript
/**
 * Creates a reactive store with fine-grained updates via signals.
 * Properties track dependencies automatically; subscribers receive updates only for used properties.
 * @param initialState Initial store state
 * @param options Configuration options
 * @returns Mutable proxy object with Store interface
 */
```

#### ❌ Inefficient Style

```typescript
/**
 * Creates a reactive store for state management with fine-grained updates.
 * Uses signals under the hood for improved performance.
 *
 * Each property in the store is backed by a signal, allowing for automatic
 * dependency tracking. Subscribers only receive updates for properties they
 * actually use, which optimizes performance especially in larger applications.
 *
 * @param initialState - The initial state of the store
 * @param options - Optional configuration for the store
 * @returns A proxy object that can be mutated directly
 */
```

### Inline Comments

#### ✅ Efficient Style

```typescript
// Update subscribers with dependencies on this property
subscribers.forEach((sub) => sub.update());
```

#### ❌ Inefficient Style

```typescript
// Now we need to iterate through all the subscribers that have registered
// a dependency on this property and call their update method to notify them
// that the property has changed.
subscribers.forEach((sub) => sub.update());
```

### Type/Interface Comments

#### ✅ Efficient Style

```typescript
/**
 * Store state with reactive properties and subscription capabilities
 * @template T State shape, must be a record of string keys to any values
 */
export interface Store<T extends Record<string, any>> {
  // Properties/methods...
}
```

#### ❌ Inefficient Style

```typescript
/**
 * Represents a store for maintaining state with reactive properties.
 * The store provides methods for retrieving the current state, updating it,
 * and subscribing to changes. When the state changes, subscribers are notified
 * only if properties they depend on have changed.
 *
 * @template T The shape of the state, which must be a record with string keys
 *             and any values. This allows for type safety when accessing state.
 */
export interface Store<T extends Record<string, any>> {
  // Properties/methods...
}
```

## Guidelines

1. **Single Responsibility**: Each comment line should convey a single idea
2. **Conciseness**: Remove unnecessary words like "the", "a", "an" when clarity isn't affected
3. **Active Voice**: Use active voice rather than passive voice
4. **Omit Obvious Information**: Don't explain what is already obvious from the code
5. **Parameter Descriptions**: Keep parameter descriptions brief and focused on purpose
6. **Separate Lines**: Each JSDoc tag should be on its own line for readability
7. **Imperative Mood**: Use imperative mood for function descriptions

## Examples

### Module Comments

#### ✅ Efficient

```typescript
/**
 * History module for time-travel debugging
 * Tracks state changes and provides navigation through history
 */
```

#### ❌ Inefficient

```typescript
/**
 * This module provides functionality for time-travel debugging.
 * It allows you to track the history of state changes in your application
 * and navigate backward and forward through that history, which can be
 * extremely useful for debugging purposes during development.
 */
```

## Implementation Strategy

1. Apply this guide to new code immediately
2. Update existing comments in high-traffic files gradually
3. Prioritize files over 400 lines for comment optimization
4. Use automated tools to help identify verbose comments

---

By following these guidelines, we can reduce token usage significantly while maintaining or even improving documentation quality.
