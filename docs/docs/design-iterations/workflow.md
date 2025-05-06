---
sidebar_position: 2
---

# 🔄 Complete Workflow

This guide walks you through the complete design iterations workflow, from generating initial design variations to implementing the final design.

## 🎯 Overview

The design iterations workflow consists of these key steps:

1. Generate design variations
2. Review and provide feedback
3. Refine based on feedback
4. Implement the final design
5. Clean up

## 📋 Prerequisites

Before starting:

- Ensure you're in the `/docs` directory of the jods project
- Make sure Playwright is installed: `pnpm install`
- Verify the docs development server can run: `pnpm start`

## Step 1: Generate Design Variations

Start by generating several design variations for a specific UI component:

```bash
pnpm design-iterations --count=3 --target="features-section"
```

This command:

- Creates 3 design variations for the features section
- Takes screenshots of each variation in light and dark mode
- Creates feedback templates for each iteration
- Stores git diffs of the changes

You can target multiple components at once by separating them with commas:

```bash
pnpm design-iterations --count=2 --target="hero-section,features-section"
```

### Advanced Generation Options

For more control over the design generation:

```bash
# Custom design prompt
pnpm design-iterations --count=2 --target="hero-section" --prompt="Make it more minimal with increased whitespace"

# Compare with other libraries
pnpm design-iterations --count=3 --target="compare-section" --compare-with="react,zustand,redux"
```

## Step 2: Review and Provide Feedback

After generating iterations:

1. Navigate to `temp/design-iterations/iteration-X/`
2. Review screenshots in the `screenshots` directory
3. Open the feedback template at `feedback-template.md`
4. Fill out the template, documenting what you like and dislike about each design aspect

### Effective Feedback Guidelines

When providing feedback:

- **Be specific** about visual elements you like/dislike
- **Consider both light and dark mode** appearances
- **Rate each iteration** on a scale (e.g., 1-10)
- **Document specific elements** to carry forward to future iterations
- **Note any accessibility concerns**
- **Consider mobile responsiveness**

Example feedback:

```markdown
### features-section

#### What works well:

- The increased spacing between cards improves readability
- The subtle gradient background adds depth without being distracting
- The new icon style is more consistent with our brand

#### What could be improved:

- The text contrast is still too low in dark mode
- Card shadows are too pronounced on small screens
- The animation feels slightly too slow

#### General notes:

The overall direction is promising, but needs refinement for dark mode.

#### Rating: 7/10
```

## Step 3: Refine Based on Feedback

Once you've reviewed and provided feedback, generate a refined iteration:

```bash
pnpm design-iterations --count=1 --target="features-section" --refine
```

The `--refine` flag tells the system to:

1. Read your feedback from previous iterations
2. Generate a new design that incorporates your feedback
3. Focus on addressing the specific points you mentioned

You can repeat this refinement process multiple times until you're satisfied with the design.

## Step 4: Implement Final Design

When you've found a design you're happy with, apply it to your codebase:

```bash
pnpm design-iterations:apply --iteration=4 --target="features-section"
```

This applies the changes from iteration 4 to your codebase. It's recommended to:

1. Review the changes in your code editor after applying
2. Test the implementation in both light and dark mode
3. Verify on different viewport sizes
4. Run the visual regression tests to confirm everything looks as expected

If needed, you can force the application even with uncommitted changes:

```bash
pnpm design-iterations:apply --iteration=4 --target="features-section" --force
```

## Step 5: Cleanup

After finalizing your design:

```bash
pnpm design-iterations:cleanup
```

This removes temporary files and old screenshots to keep your workspace clean.

You can preview what would be deleted without removing anything:

```bash
pnpm design-iterations:cleanup --dry-run
```

## 🔍 Checking Design Iteration Status

At any point, you can check the status of your current design iterations:

```bash
pnpm design-iterations:status
```

This shows:

- The number of iterations completed
- The targets being designed
- The most recent iteration's timestamp
- A summary of iterations with their feedback status

## 📂 Directory Structure

The design iterations system uses the following directory structure:

```
docs/
├── temp/
│   ├── design-iterations/        # All design iterations
│   │   ├── iteration-1/
│   │   │   ├── screenshots/      # Screenshots of this iteration
│   │   │   ├── diff.patch        # Git diff of changes
│   │   │   ├── metadata.json     # Metadata about the iteration
│   │   │   └── feedback-template.md  # Template for feedback
│   │   ├── iteration-2/
│   │   └── ...
│   └── possible-diffs/           # Storage for all diffs
├── static/
│   └── screenshots/
│       └── unified/              # Main screenshot directory
└── scripts/
    ├── design-iterations.mjs     # Main script
    ├── screenshot-unified.mjs    # Screenshot utility
    └── ...
```

## 🚀 Complete Example

Here's a complete workflow example:

```bash
# Generate 3 initial iterations of the features section
pnpm design-iterations --count=3 --target="features-section"

# Review the screenshots and fill out feedback

# Create 1 refined iteration based on feedback
pnpm design-iterations --count=1 --target="features-section" --refine

# Review the refined design

# If needed, make one more refinement
pnpm design-iterations --count=1 --target="features-section" --refine

# Apply the final design (iteration 5)
pnpm design-iterations:apply --iteration=5 --target="features-section"

# Clean up
pnpm design-iterations:cleanup
```

## 🔧 Troubleshooting

### Screenshots aren't being generated

- Make sure Playwright is installed: `pnpm install`
- Check browser installation: `npx playwright install chromium`
- Try running with verbose logging: `DEBUG=1 pnpm design-iterations --count=1 --target="features-section"`
- Ensure the documentation site is running (the script will attempt to start it if not)

### Can't see changes in screenshots

- Try clearing browser cache: `pnpm design-iterations:clear-cache`
- Ensure changes are significant enough to be visible
- Check the diff.patch file to verify changes were captured

### Error applying iteration

- Make sure you have no uncommitted changes: `git status`
- Try with the force flag: `pnpm design-iterations:apply --iteration=X --target="section" --force`
- Check if the iteration exists in the expected directory

## 📚 Related Guides

- [AI-Assisted Design](./with-ai.md)
- [Command Reference](./commands.md)
- [Feedback System](./feedback.md)
- [Screenshot System](../playwright-screenshots.md)
