# Understanding the Implementation Challenges with `useJodsStore` and Signal-Based Reactivity

## The Journey from `useSyncExternalStore` Back to `useState`/`useEffect`

We've just experienced a classic example of the gap between theoretical ideal implementation and practical solution development in React state management. This analysis breaks down what happened and why.

### The Original Goal

With PR #20 introducing signal-based reactivity to jods, our goal was to optimize `useJodsStore` by:

1. Using `useSyncExternalStore` to connect React components directly to the signal-based store
2. Taking advantage of fine-grained reactivity where components only re-render when accessed properties change
3. Achieving more efficient updates compared to the `useState`/`useEffect` pattern

### The Infinite Loop Problem

Our attempts to use `useSyncExternalStore` ran into consistent infinite loop issues:

```
Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

#### Root Causes:

1. **Reference Identity Issues**: Each time `useJodsStore` was called, we created new function references for:

   - The `subscribe` function passed to `useSyncExternalStore`
   - The `getSnapshot` function that retrieves state

2. **Store-within-Store Structure**: The jods Remix integration uses a unique structure:

   ```typescript
   // What we expected:
   const store = { count: 0, subscribe: fn }

   // What we got:
   const store = {
     store: { count: 0, subscribe: fn },
     getState: () => json(store.store),
     setState: (newState) => {...}
   }
   ```

   This nested structure complicated our attempts to connect cleanly with `useSyncExternalStore`.

3. **Memoization Challenges**: Even with `useMemo` to stabilize references, the memoization depended on `store.store` and `store`, which may have unstable identity in some scenarios.

### Why We Reverted to `useState`/`useEffect`/`useMemo`

We ultimately settled on a solution that:

1. Uses a memoized ref (`storeRef`) to maintain a stable reference to the store
2. Employs standard `useState` for the state object
3. Sets up a single subscription via `useEffect` to update when the store changes

```typescript
// Final working implementation
const storeRef = useMemo(() => ({ current: store }), []);
const [state, setState] = useState(() => store.getState());

useEffect(() => {
  const unsubscribe = storeRef.current.store.subscribe(() => {
    setState(storeRef.current.getState());
  });

  return unsubscribe;
}, [storeRef]);
```

This approach:

- Is more resilient to the nested store structure
- Avoids the infinite loop issues
- Still benefits from signal-based reactivity at the store level (subscribers only update when accessed properties change)

### Future with PR #20

The PR #20 introduces a significant shift to signal-based reactivity:

```diff
- // Subscribe to changes - callbacks trigger for EACH property change
+ // Subscribe to changes - only triggers when accessed properties change
```

After PR #20 is merged:

1. The store implementation will be fully signal-based, with:

   - Each property backed by a signal (read/write pair)
   - Automatic dependency tracking during subscriber execution
   - Targeted notifications only when accessed properties change

2. We might revisit `useSyncExternalStore` later if:
   - The store structure is simplified or standardized
   - We can ensure stable function references for `subscribe` and `getSnapshot`
   - The API stabilizes after the signal implementation

### Issues with `reactUtils`

The implementation also required enhancing `reactUtils.ts`:

1. Adding `useMemo` to the exported hooks:

   ```typescript
   export function getBasicHooks() {
     return {
       useState: getUseState(),
       useEffect: getUseEffect(),
       useMemo: getUseMemo(), // Added this
     };
   }
   ```

2. Creating a proper type for `useMemo`:
   ```typescript
   type UseMemoHook = <T>(
     factory: () => T,
     deps: ReadonlyArray<any> | undefined
   ) => T;
   ```

## Conclusion

This implementation journey highlights the complexity of building universal React hooks that work across different React environments while integrating with an evolving state management library.

While `useSyncExternalStore` would be theoretically ideal for the signal-based implementation in PR #20, practical constraints of the current codebase structure led us to use the more resilient `useState`/`useEffect` pattern while still benefiting from signal-based reactivity at the store level.

After PR #20 is merged and the signal-based reactivity system is established, the door remains open to revisit `useSyncExternalStore` implementation with a clearer understanding of the store structure and dependency tracking mechanisms.
