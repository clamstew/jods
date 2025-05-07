---
sidebar_position: 4
---

# 🔍 Command Reference

This guide provides a comprehensive reference for all the commands available in the Design Iterations system.

## Core Commands

### Generate Design Iterations

```bash
pnpm docs:design-iterations:count-<number> --target="<component-name>" --skip-other-sections
```

Generates design variations for the specified target component.

| Parameter               | Description                                       | Default                                                      |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `--target`              | Target component(s) to redesign (comma-separated) | All available targets                                        |
| `--prompt`              | Custom design prompt to guide the AI              | "Improve the visual design while maintaining brand identity" |
| `--skip-other-sections` | Focus only on the target component(s)             | `false`                                                      |
| `--compare-with`        | Libraries to compare with (comma-separated)       | `[]`                                                         |

**Examples:**

```bash
# Generate 3 iterations of the hero section ONLY
pnpm docs:design-iterations:count-3 --target="hero-section" --skip-other-sections

# Generate 2 iterations with the base command and count flag
pnpm docs:design-iterations --count=2 --target="hero-section,features-section" --skip-other-sections

# Generate iteration with custom design direction
pnpm docs:design-iterations --count=1 --target="hero-section" --prompt="Make it more minimal with elegant typography" --skip-other-sections

# Generate refined iteration based on previous feedback
pnpm docs:design-iterations:refine --target="features-section"
```

### Apply Design Iteration

```bash
pnpm docs:design-iterations:apply --iteration=<number> --target="<component-name>"
```

Applies a specific design iteration to your codebase.

| Parameter     | Description                                  | Default  |
| ------------- | -------------------------------------------- | -------- |
| `--iteration` | Iteration number to apply                    | Required |
| `--target`    | Target component to apply (single component) | Required |
| `--force`     | Force apply even with uncommitted changes    | `false`  |

**Examples:**

```bash
# Apply iteration 3 to the features section
pnpm docs:design-iterations:apply --iteration=3 --target="features-section"

# Force apply iteration 2 to the hero section
pnpm docs:design-iterations:apply --iteration=2 --target="hero-section" --force
```

### Check Iteration Status

```bash
pnpm docs:design-iterations:status
```

Shows the status of current design iterations, including the number of iterations, targets, and feedback status.

**Example Output:**

```
🔍 Design Iterations Status

Current Iterations: 5
Active Targets: hero-section, features-section
Last Iteration: iteration-5 (2023-06-15T14:27:32Z)

Iteration Summary:
- iteration-1: hero-section, features-section [Feedback: ✅]
- iteration-2: hero-section, features-section [Feedback: ✅]
- iteration-3: hero-section, features-section [Feedback: ✅]
- iteration-4: hero-section, features-section [Feedback: ✅]
- iteration-5: hero-section, features-section [Feedback: ❌]

Ready for Refinement: Yes (based on feedback for iterations 1-4)
```

### Clean Up

```bash
pnpm docs:design-iterations:cleanup [--dry-run]
```

Removes temporary files and old screenshots to keep your workspace clean.

| Parameter   | Description                                          | Default |
| ----------- | ---------------------------------------------------- | ------- |
| `--dry-run` | Show what would be deleted without removing anything | `false` |

**Examples:**

```bash
# Clean up all temporary files
pnpm docs:design-iterations:cleanup

# Preview what would be deleted
pnpm docs:design-iterations:cleanup --dry-run
```

## Advanced Commands

### Clear Cache

```bash
pnpm docs:design-iterations:clear-cache
```

Clears browser cache to ensure clean screenshots in the next iteration.

### Rebaseline Screenshots

```bash
pnpm docs:design-iterations:rebaseline --iteration=<number> --target="<component-name>" --confirm
```

Updates the baseline screenshots with a specific iteration's screenshots. When `--confirm` is used, you'll be prompted to confirm each rebaseline action.

| Parameter     | Description                                         | Default                        |
| ------------- | --------------------------------------------------- | ------------------------------ |
| `--iteration` | Iteration number to use as new baseline             | Required                       |
| `--target`    | Target component(s) to rebaseline (comma-separated) | All targets from the iteration |
| `--confirm`   | Interactive confirmation for each rebaseline action | `false`                        |

**Example:**

```bash
# Update baseline screenshots with iteration 5, with confirmation prompts
pnpm docs:design-iterations:rebaseline --iteration=5 --target="hero-section,features-section" --confirm
```

## Command Options in Detail

### Target Components

The `--target` parameter accepts these component names:

- `hero-section` - The main hero section on the homepage
- `features-section` - The features grid on the homepage
- `framework-section-react` - The React framework comparison section
- `framework-section-remix` - The Remix framework section
- `compare-section` - The comparison section with other libraries

### Design Prompts

The `--prompt` parameter accepts custom design directions:

```bash
# Minimal design prompt
pnpm docs:design-iterations --count=2 --target="hero-section" --prompt="Create a minimal design with more whitespace" --skip-other-sections

# Bold typography prompt
pnpm docs:design-iterations --count=2 --target="features-section" --prompt="Use bold typography and emphasize visual hierarchy" --skip-other-sections

# Accessibility focus
pnpm docs:design-iterations --count=2 --target="framework-section-react" --prompt="Improve accessibility and increase contrast ratios" --skip-other-sections
```

### Compare With

The `--compare-with` parameter allows comparing with other libraries:

```bash
# Compare with React, Redux, and Zustand
pnpm docs:design-iterations --count=3 --target="compare-section" --compare-with="react,redux,zustand" --skip-other-sections
```

## Configuration

The design iterations system uses default configuration settings that can be adjusted by editing the `design-iterations.mjs` script:

```javascript
// Default configuration
const defaultConfig = {
  count: 1, // Number of iterations to run
  targets: [
    "hero-section",
    "features-section",
    "framework-section-react",
    "framework-section-remix",
  ],
  compareWith: [], // Libraries to compare with
  aiPrompt: "Improve the visual design while maintaining brand identity",
  baseScreenshotDir: path.join(rootDir, "static/screenshots/unified"),
  diffTool: "git diff", // Tool to generate diffs
  requireSignoff: true, // Require signoff for baseline changes
  skipOtherSections: false, // Default to capturing all sections
};
```

## Related Guides

- [Complete Workflow](./workflow.md)
- [AI-Assisted Design](./with-ai.md)
- [Feedback System](./feedback.md)
- [Screenshot System](../playwright-screenshots.md)
