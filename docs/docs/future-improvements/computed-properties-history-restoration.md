# Issue: Computed Properties Lost During History Time-Travel

## Status: Open
## Priority: Medium
## Discovered: 2024-11-28

---

## Problem Description

When using `history()` for time-travel debugging, computed properties become `undefined` after restoring a snapshot. This happens because:

1. `json()` serializes stores to plain data (computed values become their evaluated results)
2. `history()` stores these JSON snapshots
3. When restoring/time-traveling to a snapshot, the computed **functions** are lost - only the serialized data values exist

## Reproduction

```typescript
import { store, computed, history, json } from "jods";

interface AppState {
  count: number;
  doubled?: ComputedValue<number>;
}

const appState = store<AppState>({ count: 5 });
appState.doubled = computed(() => appState.count * 2);

const appHistory = history(appState);

// Works fine:
console.log(appState.doubled); // 10

// Make some changes
appState.count = 10;
appState.count = 15;

// Time-travel back
appHistory.goBack();
appHistory.goBack();

// BROKEN: Computed property is now undefined!
console.log(appState.doubled); // undefined ❌
```

## Current Workaround

Users must calculate derived values directly from source data instead of relying on computed properties after time-travel:

```typescript
// Instead of:
console.log(appState.stats.total); // undefined after time-travel

// Do this:
const total = appState.todos.length; // Always works
```

## Proposed Solutions

### Option 1: Track and Re-apply Computed Definitions (Recommended)

Store computed property definitions separately and re-apply them after history restoration:

```typescript
// Internal tracking
const computedDefinitions = new Map<string, ComputeFunction>();

// When computed is assigned:
computedDefinitions.set('doubled', () => appState.count * 2);

// After history restoration:
for (const [key, fn] of computedDefinitions) {
  if (appState[key] === undefined) {
    appState[key] = computed(fn);
  }
}
```

**Pros:**
- Transparent to users
- Computed properties "just work" after time-travel
- No API changes needed

**Cons:**
- More complex internal tracking
- Need to handle nested computed properties
- Memory overhead for storing definitions

### Option 2: History-Aware Computed Properties

Create a new `persistentComputed()` that survives time-travel:

```typescript
appState.doubled = persistentComputed(() => appState.count * 2);
```

**Pros:**
- Opt-in behavior
- Clear distinction between regular and persistent computed

**Cons:**
- New API to learn
- Users must remember to use the right function

### Option 3: Snapshot Metadata

Include computed property metadata in snapshots:

```typescript
// Snapshot format:
{
  data: { count: 5, doubled: 10 },
  computed: ['doubled'], // Track which props were computed
  computedDefinitions: { doubled: '() => this.count * 2' } // Optional: store as string
}
```

**Pros:**
- Full reconstruction possible
- Self-documenting snapshots

**Cons:**
- Larger snapshot size
- Serializing functions is fragile
- Security concerns with eval-like reconstruction

### Option 4: Documentation Only

Document this as expected behavior and recommend the workaround.

**Pros:**
- No code changes
- Simple

**Cons:**
- Poor DX
- Unexpected behavior for users

## Implementation Plan (Option 1)

1. **Phase 1: Tracking**
   - Add internal `computedDefinitions` WeakMap keyed by store
   - Track when `computed()` values are assigned to stores
   - Store the compute function reference

2. **Phase 2: History Integration**
   - Modify `history()` to be aware of computed definitions
   - After `goBack()`/`goForward()`/`goTo()`, re-apply computed functions

3. **Phase 3: Testing**
   - Add tests for computed property restoration
   - Test nested computed properties
   - Test computed properties that depend on other computed properties

4. **Phase 4: Documentation**
   - Document the behavior
   - Add examples showing time-travel with computed properties

## Related Files

- `src/core/computed.ts` - Computed property implementation
- `src/core/history/core.ts` - History/time-travel implementation
- `src/core/json.ts` - JSON serialization

## Notes

- This issue was discovered while building a todo app example with time-travel debugging
- The workaround of calculating directly from source data is valid but not ideal DX
- This affects any use of `history()` with stores that have computed properties

