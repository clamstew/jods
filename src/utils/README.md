# Utility Modules

This directory contains utility modules that provide shared functionality across the jods codebase.

## reactUtils.ts

This module provides utility functions for dynamically loading React, allowing:

1. **Tree-shakable imports**: Only import what you need from React
2. **Peer dependency**: React doesn't need to be bundled with jods
3. **Dynamic loading**: Handles React loading at runtime with error protection
4. **Consistent implementations**: Standardizes patterns for React hooks and functions
5. **Fallback mechanisms**: Provides compatibility with different React versions

### Example Usage

```typescript
import {
  getCreateElement,
  getUseState,
  getUseSyncExternalStore,
} from "../utils/reactUtils";

// Get React's createElement function
const createElement = getCreateElement();

// Get React's useState hook
const useState = getUseState();

// Get useSyncExternalStore (with fallbacks for older React versions)
const useSyncExternalStore = getUseSyncExternalStore();
```

### Available Functions

- `getReact()`: Dynamically loads React
- `getUseState()`: Gets React's useState hook
- `getUseEffect()`: Gets React's useEffect hook
- `getCreateElement()`: Gets React's createElement function
- `getUseSyncExternalStore()`: Gets React's useSyncExternalStore with fallbacks
- `getBasicHooks()`: Gets common React hooks (useState, useEffect)

## Future Improvements

The following hooks currently use their own implementations and should be updated to use reactUtils in the future:

- `useJodsStore.tsx`: Has issues with React.useSyncExternalStore and infinite loops
