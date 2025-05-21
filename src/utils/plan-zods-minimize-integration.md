# Plan: Minimize Zod Integration Maintenance Overhead

## Background

- Current concern: High maintenance overhead from wrapping Zod library
- Proposed solution: Selectively expose subset of Zod methods via `j`/`jod` aliases
- Strategy: Throw errors for unexposed methods to limit API surface

## Implementation Plan

### 1. Define Core Exposed Methods

- Schema constructors: `string`, `object`, `array`
- Essential modifiers: `optional`, `nullable`, `min`, `max`, `email`
- Parsing methods: `parse`, `safeParse`
- Required internal properties: `_def` (for type inference)

### 2. Update Proxy Logic in src/utils/zod.ts

- When Zod installed + allowed method: Forward to Zod instance
- When Zod missing + allowed method: Show warning, return chainable fallback
- When method not allowed (any case): Throw informative error with guidance

### 3. Modify Fallback Behavior

- Update `createZodMissingFallback` to respect allowed methods list
- Ensure consistent error handling in fallback chains
- Maintain chainability for allowed methods

### 4. Testing Updates in src/**tests**/utils/zod.test.ts

- Test allowed methods with/without Zod
- Verify error handling for non-allowed methods
- Check fallback chain behavior

### 5. Documentation Updates in docs/docs/zod-integration.md

- List exposed methods
- Document limited exposure rationale
- Add guidance for using Zod directly

### 6. Example Review

- Review examples/zod-wrapper.ts
- Ensure alignment with new approach
- Update examples if needed
