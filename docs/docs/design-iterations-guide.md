---
sidebar_position: 7
---

import { Redirect } from '@docusaurus/router';

# 🔄 Redirecting...

<Redirect to="/docs/design-iterations/workflow" />

:::info Document Moved
This document has been moved to [Design Iterations Workflow](/docs/design-iterations/workflow).
:::

```bash
# From the /docs directory, run:
pnpm design-iterations --count=3 --target="features-section"

# Review the screenshots and provide feedback in the generated template
# Then run another iteration if needed:
pnpm design-iterations --count=1 --target="features-section" --refine
```

## What Are Design Iterations?

Design iterations are a systematic way to improve our documentation site's UI through multiple generated design variations, screenshot capture, feedback collection, and implementation.

This approach combines Playwright screenshots with AI assistance to rapidly evolve UI components through multiple iterations.

## Complete Workflow

### 1. Generate Design Variations

```bash
pnpm design-iterations --count=3 --target="features-section"
```

This command:

- Creates 3 design variations for the features section
- Takes screenshots of each variation in light and dark mode
- Creates feedback templates
- Stores git diffs of the changes

### 2. Review and Provide Feedback

After generating iterations:

1. Navigate to `temp/design-iterations/iteration-X/`
2. Review screenshots in the `screenshots` directory
3. Fill out the feedback template at `feedback-template.md`
4. Note what you like/dislike about each variation

### 3. Refine Based on Feedback

```bash
pnpm design-iterations --count=1 --target="features-section" --refine
```

This creates a new iteration that incorporates feedback from previous iterations.

### 4. Implement Final Design

Once you've found a design you're happy with:

```bash
pnpm design-iterations:apply --iteration=4 --target="features-section"
```

This applies the changes from iteration 4 to your codebase.

### 5. Cleanup

After finalizing your design:

```bash
pnpm design-iterations:cleanup
```

This removes temporary files and old screenshots.

## Command Reference

| Command                                                                 | Description                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `pnpm design-iterations --count=3 --target="features-section"`          | Generate 3 design iterations for the features section   |
| `pnpm design-iterations --count=1 --target="features-section" --refine` | Generate 1 refined iteration based on previous feedback |
| `pnpm design-iterations:apply --iteration=X --target="section"`         | Apply a specific iteration to the codebase              |
| `pnpm design-iterations:cleanup`                                        | Clean up temporary files and old screenshots            |
| `pnpm design-iterations:status`                                         | Show status of current iterations                       |

## Available Targets

The following UI components can be targeted for design iterations:

- `hero-section` - The main hero section on the homepage
- `features-section` - The features grid on the homepage
- `framework-section-react` - The React framework comparison section
- `framework-section-remix` - The Remix framework section
- `compare-section` - The comparison section with other libraries

## Directory Structure

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

## Best Practices

1. **Focus on one component** at a time rather than redesigning everything at once
2. **Be specific in your feedback** about what elements you like/dislike
3. **Try 3-5 iterations** before finalizing a design
4. **Evaluate in both light and dark mode**
5. **Save all feedback** for future reference
6. **Clean up** after finalizing to avoid cluttering your workspace

## Troubleshooting

### Screenshots aren't being generated

- Make sure Playwright is installed: `pnpm install`
- Check the browser installation: `npx playwright install chromium`
- Try running with verbose logging: `DEBUG=1 pnpm design-iterations --count=1 --target="features-section"`

### Can't see changes in screenshots

- Try clearing the browser cache: `pnpm design-iterations:clear-cache`
- Ensure your changes are significant enough to be visible
- Check the diff.patch file to verify your changes were captured

### Error applying iteration

- Make sure you have no uncommitted changes: `git status`
- Try with the force flag: `pnpm design-iterations:apply --iteration=X --target="section" --force`

## Advanced Usage

### Custom design prompts

```bash
pnpm design-iterations --count=2 --target="hero-section" --prompt="Make it more minimal with increased whitespace"
```

### Compare with other libraries

```bash
pnpm design-iterations --count=3 --target="compare-section" --compare-with="react,zustand,redux"
```

### Multiple targets at once

```bash
pnpm design-iterations --count=2 --target="hero-section,features-section"
```

## Related Documentation

- [AI-Assisted Design Workflow](./design-iterations-with-ai.md)
- [Screenshot System](./playwright-screenshots.md)
