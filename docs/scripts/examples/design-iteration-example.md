# Design Iteration Walkthrough

This example demonstrates how to use the design iteration system to track UI changes over time and compare different approaches.

## Initial Setup

First, let's create a new design iteration to capture our current baseline:

```bash
# Initialize a new design iteration with a descriptive name
node scripts/design-iterations.mjs --init --name="hero-redesign-initial"
```

This creates a snapshot of our current design in `static/screenshots/iterations/hero-redesign-initial/`.

## Making UI Changes

Now, let's make some changes to our hero section component. For example, we might:

1. Change the background color
2. Update the headline text
3. Adjust the button styling

In our component code, we'd make changes like:

```jsx
// Before
<section className="hero">
  <h1>jods</h1>
  <p>Powerful features in a lightweight package</p>
  <button className="primary">Get Started</button>
</section>

// After
<section className="hero gradient-bg">
  <h1>jods - State Made Simple</h1>
  <p>Powerful reactive state for modern JavaScript apps</p>
  <button className="cta-button">Get Started Now</button>
</section>
```

## Capturing the Changes

After implementing our changes, let's capture the new design:

```bash
# Capture screenshots of just the hero section
npm run screenshots -- --components=hero-section
```

This will create new timestamped screenshots of our updated hero section.

## Creating a New Iteration

Let's save this as a new design iteration:

```bash
# Create a new iteration for our first design attempt
node scripts/design-iterations.mjs --init --name="hero-redesign-v1"
```

## Making Additional Changes

Let's say we got feedback and want to try a different approach. We might:

1. Use a different color scheme
2. Change the tagline
3. Add a secondary call-to-action

After implementing these changes, we capture them:

```bash
npm run screenshots -- --components=hero-section
node scripts/design-iterations.mjs --init --name="hero-redesign-v2"
```

## Comparing Iterations

Now we can compare our different approaches:

```bash
# Compare the two redesign attempts
node scripts/design-iterations.mjs --compare --iterations="hero-redesign-v1,hero-redesign-v2"
```

This generates a comparison report in `static/screenshots/iterations/comparison/` that shows:

- Side-by-side visual comparison
- Highlighting of key differences
- Metadata about each iteration

## Finalizing the Design

After reviewing the comparisons, we decide on the final design:

```bash
# Update our baselines with the chosen design
npm run screenshots:baseline -- --components=hero-section
```

## Complete Workflow Example

Here's a complete workflow for a design iteration process:

```bash
# 1. Initialize with current state
node scripts/design-iterations.mjs --init --name="button-redesign-initial"

# 2. Make changes to the button component
# ... edit code ...

# 3. Capture the changes
npm run screenshots -- --components=button-component

# 4. Save as first iteration
node scripts/design-iterations.mjs --init --name="button-redesign-v1"

# 5. Make another set of changes
# ... edit code ...

# 6. Capture the second approach
npm run screenshots -- --components=button-component
node scripts/design-iterations.mjs --init --name="button-redesign-v2"

# 7. Compare the iterations
node scripts/design-iterations.mjs --compare --iterations="button-redesign-v1,button-redesign-v2"

# 8. Choose the final design and update baselines
npm run screenshots:baseline -- --components=button-component
```

## Additional Features

### Adding Design Notes

You can add notes to iterations:

```bash
node scripts/design-iterations.mjs --add-notes --iteration="hero-redesign-v1" --notes="This approach uses a gradient background with higher contrast. The CTA button is larger and more prominent."
```

### Exporting Iterations

Export iterations for sharing with stakeholders:

```bash
node scripts/design-iterations.mjs --export --iterations="hero-redesign-v1,hero-redesign-v2" --format="html"
```

This creates a self-contained HTML report that can be shared without requiring the full codebase.
