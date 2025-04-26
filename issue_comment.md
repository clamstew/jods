I've created tests to verify the behavior of `onUpdate` and can confirm that it fires **granularly** - once for each individual property change.

## Test Evidence

I added a test file in `src/__tests__/hooks.test.ts` that verifies this behavior:

```typescript
it("should match the README example behavior", () => {
  const user = store({
    firstName: "Burt",
    lastName: "Macklin",
    mood: "curious",
  });

  const updates = [];
  onUpdate(user, (newUserState) => {
    updates.push(json(newUserState));
  });

  // Perform the exact sequence from the README
  user.firstName = "Burt Macklin";
  user.mood = "sneaky";
  user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

  // Check how many updates were triggered (should be 3 if granular)
  expect(updates.length).toBe(3);
});
```

All tests pass, confirming that the `onUpdate` subscriber is called for each individual property change.

## Example Output

I also created a simple example file that demonstrates this behavior:

```javascript
// Create a user store
const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Track update count
let updateCount = 0;

// Subscribe to changes
onUpdate(user, (newState) => {
  updateCount++;
  console.log(`Update #${updateCount} triggered`);
  console.log("Current state:", json(newState));
});

// Each of these changes triggers a separate update
user.firstName = "Burt Macklin";
user.mood = "sneaky";
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(`Total updates triggered: ${updateCount}`); // Outputs: 3
```

## README Updates

I've updated the README to make this behavior clear:

- Added explicit notes that onUpdate fires granularly
- Included example logs showing all three updates
- Included clearer comments throughout the code examples

This matches the expectation in the new proposal in the issue, where `onUpdate` would trigger for outputs 2, 3, and 4 (but not output 1 since that's the initial state before any updates).
