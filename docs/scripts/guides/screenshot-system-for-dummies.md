# Screenshot System for Dummies 🤯📸

So you need to work with this fancy screenshot system and have no idea where to start? No worries! Here's the absolute basics explained like you're five (well, maybe like you're a developer who's five).

## What Is This Thing?

Our screenshot system is like a robot photographer for our website. It:

1. Takes pictures of our UI components
2. Helps us see when something changes
3. Makes sure our website doesn't accidentally get ugly

## The ABCs of Screenshots

### A is for "Automated Capturing"

```bash
# The magic command to take pictures of everything
npm run screenshots
```

This will:

- Open a browser
- Go to our website
- Take pictures of all our components
- Save them with today's date in the filename

### B is for "Baseline"

Baselines are the "perfect" versions of component screenshots that we compare against.

```bash
# Make the latest screenshots the new "perfect" versions
npm run screenshots:baseline
```

This basically says "these screenshots look good, save them as the reference".

### C is for "Cleanup"

```bash
# Delete old screenshots to save space
npm run screenshots:cleanup
```

This keeps things tidy by removing old screenshots after we've reviewed them.

## Help! I Need To...

### Take a Screenshot of Just One Thing

```bash
npm run screenshots -- --components=hero-section
```

### Take Screenshots in Just Light Mode

Sorry, it always does both light and dark! That's how we roll.

### See What Changed

When you run `npm run screenshots`, it creates new screenshots with timestamps.
Just compare them with the baseline versions (the ones without timestamps) to see changes.

Or use:

```bash
npm run screenshots:diff
```

### Make the Test IDs Work Better

If your components have `data-testid` attributes (like `data-testid="jods-hero-section"`), you can generate selectors automatically:

```bash
npm run screenshots:generate-selectors
```

Then use them:

```bash
npm run screenshots -- --use-generated-selectors
```

## Common Problems and Magic Fixes

### "It Can't Find My Component!"

1. Check if your component is actually visible on the page
2. Add a unique `data-testid` attribute (like `data-testid="jods-your-component-name"`)
3. Try generating selectors (see above)

### "The Screenshots Look Cut Off!"

In `screenshot-selectors.mjs`, find your component and increase the `padding` and `minHeight` values:

```javascript
{
  name: "your-component",
  // ...
  padding: 100,  // Make this bigger!
  minHeight: 800  // Make this bigger too!
}
```

### "It's Taking Forever!"

Only screenshot what you need:

```bash
npm run screenshots -- --components=the-one-i-changed
```

## Designer Workflow in 5 Steps

1. Make changes to your component in the code
2. Run `npm run screenshots -- --components=your-component`
3. Look at the new screenshots with timestamps
4. If you like them, run `npm run screenshots:baseline -- --components=your-component`
5. If you don't like them, make more changes and go back to step 2

That's it! You're now a screenshot system expert! 🎓
