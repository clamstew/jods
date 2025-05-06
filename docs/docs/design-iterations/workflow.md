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
pnpm docs:design-iterations:count-3 --target="features-section" --skip-other-sections
```

This command:

- Creates 3 design variations for the features section
- Takes screenshots of each variation in light and dark mode
- Creates feedback templates for each iteration
- Stores git diffs of the changes

You can target multiple components at once by separating them with commas:

```bash
pnpm docs:design-iterations --count=2 --target="hero-section,features-section" --skip-other-sections
```

### Advanced Generation Options

For more control over the design generation:

```bash
# Custom design prompt
pnpm docs:design-iterations --count=2 --target="hero-section" --prompt="Make it more minimal with increased whitespace" --skip-other-sections

# Compare with other libraries
pnpm docs:design-iterations --count=3 --target="compare-section" --compare-with="react,zustand,redux" --skip-other-sections
```

## Critical: Understanding Component Styling Conventions

Before making any design changes, it's **essential** to analyze how styling is implemented in the target component:

### Step 1: Check for CSS/Style Files

First, look for existing style files associated with the component:

```bash
# Check if there's a CSS module file for the component
find docs/src/components -name "ComponentName*.css"

# Look at style files in the components directory
find docs/src/components -type f -name "*.css" | head -5
```

### Step 2: Analyze Component Imports and Usage

Examine the component file's imports and className usage to determine the styling approach:

```tsx
// Look for these import patterns at the top of the file:

// CSS Modules approach
import styles from './ComponentName.module.css';

// Global CSS approach
import './ComponentName.css';

// CSS-in-JS library imports
import styled from 'styled-components';
import { css } from '@emotion/react';

// Then check how className is used in the JSX:

// CSS Modules usage
<div className={styles.container}>

// Global CSS usage
<div className="component-container">

// Inline styles usage
<div style={{ display: 'flex', padding: '1rem' }}>
```

### Step 3: Follow the Established Convention

Always follow the existing styling approach:

| If the component uses... | Then you should... |
|--------------------------|-------------------|
| **CSS Modules** (.module.css files) | Create or update the module file and use `className={styles.element}` |
| **Global CSS** (regular .css files) | Update the CSS file and use `className="element-name"` |
| **Inline styles** | Use the `style={{ property: 'value' }}` approach |
| **CSS-in-JS** (styled-components, emotion) | Use the same library's API |

### Common Mistakes to Avoid

❌ **Do not mix styling approaches** within a single component
❌ **Do not add inline styles** to a component using CSS modules
❌ **Do not create a new CSS module** for a component using global CSS
❌ **Do not ignore existing style patterns** in the codebase

✅ **Always analyze first** before making style changes
✅ **Respect the existing architecture** of the component
✅ **Match variable naming conventions** for consistency

## Step 2: Review and Provide Feedback

After generating iterations:

1. Navigate to `temp/design-iterations/iteration-X/`
2. Review screenshots in two locations:
   - Primary screenshots: `static/screenshots/unified/` with names like `02-features-section-light-20250506-140715.png`
   - Iteration copies: `temp/design-iterations/iteration-X/screenshots/`
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
pnpm docs:design-iterations:refine --target="features-section" --skip-other-sections
```

The `--refine` flag tells the system to:

1. Read your feedback from previous iterations
2. Generate a new design that incorporates your feedback
3. Focus on addressing the specific points you mentioned

You can repeat this refinement process multiple times until you're satisfied with the design.

## Proper Timing Between Iterations

For reliable results, follow this procedure for each iteration:

1. **Make design changes** to component files following the established styling convention
2. **Save all changes** to both component and style files
3. **Wait 15-20 seconds** for DocuSaurus to fully rebuild with your changes
4. **Verify in browser** that your changes are visible (check http://localhost:3000)
5. **Then run** the screenshot command for just that iteration
6. **Wait for completion** before starting changes for the next iteration

```bash
# CORRECT: One iteration at a time with proper waiting
# First modify component code, save, wait 15-20 seconds, verify in browser, then:
pnpm docs:design-iterations:count-1 --target="try-jods-section" --skip-other-sections

# INCORRECT: Running multiple iterations without verification
pnpm docs:design-iterations:count-3 --target="try-jods-section" --skip-other-sections
```

## Step 4: Implement Final Design

When you've found a design you're happy with, apply it to your codebase:

```bash
pnpm docs:design-iterations:apply --iteration=4 --target="features-section"
```

This applies the changes from iteration 4 to your codebase. It's recommended to:

1. Review the changes in your code editor after applying
2. Test the implementation in both light and dark mode
3. Verify on different viewport sizes
4. Run the visual regression tests to confirm everything looks as expected

If needed, you can force the application even with uncommitted changes:

```bash
pnpm docs:design-iterations:apply --iteration=4 --target="features-section" --force
```

## Step 5: Cleanup

After finalizing your design:

```bash
pnpm docs:design-iterations:cleanup
```

This removes temporary files and old screenshots to keep your workspace clean.

You can preview what would be deleted without removing anything:

```bash
pnpm docs:design-iterations:cleanup --dry-run
```

## Providing Clear Iteration Summaries

After completing iterations, always provide a structured summary to help the user understand what was created and how to proceed:

```
# Design Iterations Summary

You now have X design iterations for the [component] section:

## Review Your Designs
You can find the screenshots at:
- Light mode: /docs/static/screenshots/unified/[component]-light-[timestamp].png
- Dark mode: /docs/static/screenshots/unified/[component]-dark-[timestamp].png
- Iteration folders: /docs/temp/design-iterations/iteration-[N]/screenshots/

## Apply Your Preferred Design
Once you've chosen a design, apply it with:
```bash
pnpm docs:design-iterations:apply --iteration=[N] --target="[component]"
```

## Clean Up Artifacts
After applying, clean up with:
```bash
pnpm docs:design-iterations:cleanup
```
```

## 🔍 Checking Design Iteration Status

At any point, you can check the status of your current design iterations:

```bash
pnpm docs:design-iterations:status
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
pnpm docs:design-iterations:count-3 --target="features-section" --skip-other-sections

# Review the screenshots and fill out feedback

# Create 1 refined iteration based on feedback
pnpm docs:design-iterations:refine --target="features-section" --skip-other-sections

# Review the refined design

# If needed, make one more refinement
pnpm docs:design-iterations:refine --target="features-section" --skip-other-sections

# Apply the final design (iteration 5)
pnpm docs:design-iterations:apply --iteration=5 --target="features-section"

# Clean up
pnpm docs:design-iterations:cleanup
```

## 🔧 Troubleshooting

### Screenshots aren't being generated

- Make sure Playwright is installed: `pnpm install`
- Check browser installation: `npx playwright install chromium`
- Try running with verbose logging: `DEBUG=1 pnpm docs:design-iterations --count=1 --target="features-section" --skip-other-sections`
- Ensure the documentation site is running (the script will attempt to start it if not)

### Identical screenshots across iterations

- Not waiting long enough between design changes
- DocuSaurus hasn't rebuilt with your changes yet
- Try waiting at least 20 seconds between iterations
- Verify changes in browser before capturing screenshots

### Can't see changes in screenshots

- Try clearing browser cache: `pnpm docs:design-iterations:clear-cache`
- Ensure changes are significant enough to be visible
- Check the diff.patch file to verify changes were captured

### Error applying iteration

- Make sure you have no uncommitted changes: `git status`
- Try with the force flag: `pnpm docs:design-iterations:apply --iteration=X --target="section" --force`
- Check if the iteration exists in the expected directory

### Styling inconsistencies

- You're using a different styling approach than the component
- Analyze the imports and className patterns, then follow them
- Check for existing CSS/module files before creating new ones

## 📚 Related Guides

- [AI-Assisted Design](./with-ai.md)
- [Command Reference](./commands.md)
- [Feedback System](./feedback.md)
- [Screenshot System](../playwright-screenshots.md)

## 🤖 Guidelines for AI Collaborators

When working with AI assistants to create design iterations, the following guidelines help ensure consistency and quality:

1. **Do not change the baseline** without explicit maintainer approval
2. Save all Git diffs after each screenshot to preserve implementation details
3. Maintain a separate markdown file that collects feedback on each iteration
4. When presenting iterations to maintainers, include details about:
   - What design elements were changed
   - The reasoning behind each change
   - How the change aligns with jods branding and developer experience goals
5. Keep track of all screenshots discussed during review conversations

AI assistants working with the design iterations system should be familiar with:

- The jods documentation site branding and visual language
- Web accessibility standards
- Modern CSS practices
- The technical constraints of a Docusaurus-based site
- The importance of maintaining both light and dark themes

These guidelines help ensure that AI collaborators contribute effectively to the design iteration process while maintaining brand consistency and developer focus.

## 📋 Design Iteration Checklist

Use this comprehensive checklist to ensure you're following best practices throughout the design iteration process.

### Before Starting Iterations ✅

- [ ] Define clear goals for the design improvement 🎯
- [ ] Identify specific components or sections to focus on 🔍
- [ ] Review existing design documentation 📚
- [ ] Check for related previous iterations 🕰️
- [ ] Set up screenshots of current state as baseline 📸
- [ ] Plan for at least 3 distinct design approaches 🔢
- [ ] **Analyze the component's styling approach** 🔍

### For Each Iteration 🔄

- [ ] Create a new Git branch for this iteration (handled automatically) 🌿
- [ ] **Follow the component's established styling convention** 👣
- [ ] Implement focused CSS/HTML changes (handled by the tool) 🛠️
- [ ] Save all changes ✅
- [ ] **Wait 15-20 seconds for DocuSaurus to rebuild** ⏱️
- [ ] **Verify changes are visible in browser** 👁️
- [ ] Capture screenshot in light mode ☀️
- [ ] Capture screenshot in dark mode 🌙
- [ ] Save Git diff of changes 💾
- [ ] Document specific changes made 📝
- [ ] Provide commentary on design intent 💭
- [ ] **Wait until screenshot process is complete before starting next iteration** ⏳

### Review Process 🔍

- [ ] Compare iterations side by side 👀
- [ ] Consider all target audiences 👨‍💻👩‍💻
- [ ] Check performance impact ⚡
- [ ] Verify accessibility standards ♿
- [ ] Test responsive behavior 📱
- [ ] Document strengths and weaknesses of each approach ⚖️
- [ ] Rate each iteration (1-10) ⭐

### Implementation 🚀

- [ ] Select the best iteration or combination 🏆
- [ ] Get maintainer approval before finalizing ✅
- [ ] Clean up implementation code 🧹
- [ ] Create new baseline screenshots 📸
- [ ] Update relevant documentation 📚
- [ ] Commit final changes 💾

### Post-Implementation 🏁

- [ ] Archive iteration materials 🗃️
- [ ] Update design system documentation if needed 📋
- [ ] Share learnings with the team 🤝
- [ ] Create template for similar future iterations 📑
- [ ] Add to design pattern library if appropriate 📚

### Technical Requirements 🔧

- [ ] Screenshots captured at standard resolution 📏
- [ ] Git diffs saved properly 💾
- [ ] Feedback document follows template structure 📋
- [ ] Iterations clearly labeled and timestamped ⏱️
- [ ] Code changes well-commented 💬
- [ ] Changes are maintainable long-term ⚙️

### Common Issues to Check ⚠️

- [ ] Text contrast meets WCAG standards 👁️
- [ ] Interactive elements have appropriate states 🖱️
- [ ] Elements align properly on all screen sizes 📏
- [ ] Animation/transitions are not distracting ✨
- [ ] Font sizes are consistent and readable 📊
- [ ] Color usage follows design system 🎨 