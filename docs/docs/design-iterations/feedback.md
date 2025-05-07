---
sidebar_position: 5
---

# 📝 Feedback System

Effective feedback is the heart of the Design Iterations process. This guide explains how to provide structured feedback that leads to better design outcomes.

## 📋 Feedback Template

When you run a design iteration, the system automatically generates a feedback template at:

```
docs/temp/design-iterations/iteration-X/feedback-template.md
```

This Markdown file has a structured format for documenting your reactions to each design:

```markdown
# Design Iteration Feedback (Iteration X)

## Session Information

- **Date:** YYYY-MM-DD
- **Components:** [component-names]
- **Timestamp:** [screenshot-timestamp]

## Screenshots

### [component-name]

- Light theme: [path-to-light-theme-screenshot]
- Dark theme: [path-to-dark-theme-screenshot]

#### Feedback

- **What works well:**

  -
  -
  -

- **What could be improved:**

  -
  -
  -

- **General notes:**

#### Rating: [1-10]
```

## 📊 Structured Feedback Format

The template is structured to capture specific aspects of your design feedback:

### 1. What Works Well

List specific elements, characteristics, or aspects of the design that are successful:

```markdown
**What works well:**

- The gradient background creates depth without being distracting
- The card layout maintains good information hierarchy
- The spacing between elements feels balanced and consistent
- Typography choices match our brand voice
```

### 2. What Could Be Improved

Identify specific areas where the design could be enhanced:

```markdown
**What could be improved:**

- Dark mode contrast is too low for code examples
- Card shadows feel too heavy on mobile viewports
- Button hover states aren't distinctive enough
- Animation timing feels slightly too slow
```

### 3. General Notes

Add any overarching observations or contextual information:

```markdown
**General notes:**
Overall this iteration is heading in the right direction, particularly with the typography choices and layout. The main areas for refinement are dark mode contrast and responsive behavior.
```

### 4. Rating

Provide a numerical rating (typically 1-10) to help compare iterations:

```markdown
**Rating: 7/10**
```

## 📈 Summary and Decision Section

The template includes a summary section to help make decisions about next steps:

```markdown
## Summary and Decision

### Overall Preferences

- **Favorite component design:** features-section from iteration 2
- **Best visual elements:**
  - Typography from iteration 1
  - Color scheme from iteration 3
  - Layout from iteration 2

### Implementation Plan

- [x] Create new iterations with specific focus
- [ ] Proceed with current designs as is
- [ ] Combine elements from different iterations

### Additional Notes

Would like to try one more iteration that combines the typography from iteration 1 with the layout from iteration 2, but with improved dark mode contrast.

### Baseline Decision

- [ ] Approved for baseline update
- [ ] Not approved for baseline update
- [x] Pending additional refinements before baseline approval
```

## 💡 Effective Feedback Techniques

### Be Specific and Actionable

✅ Good feedback:

```
The contrast between the text and background is too low (approximately 3:1), making it hard to read for users with visual impairments.
```

❌ Vague feedback:

```
The colors don't look right.
```

### Focus on Both Positive and Negative

Include both what's working and what needs improvement. This helps the AI understand what to preserve and what to change.

### Consider Multiple Dimensions

Evaluate the design across different dimensions:

1. **Visual design**: aesthetics, color, typography, spacing
2. **Usability**: clarity, information hierarchy, readability
3. **Accessibility**: contrast, focus states, text sizes
4. **Responsiveness**: behavior across different viewport sizes
5. **Consistency**: alignment with overall site design
6. **Performance**: animation smoothness, loading experience

### Compare Light and Dark Modes

Always review both light and dark mode screenshots, as designs can look dramatically different between themes.

### Use Design Vocabulary

Using precise design terminology helps communicate your feedback clearly:

```markdown
**What works well:**

- The visual hierarchy effectively guides the eye from the headline to the CTA
- The negative space around components creates a clean, uncluttered feel
- The monochromatic color scheme with accent colors creates a cohesive look
```

## 📸 Referencing Screenshots

When discussing specific elements, clearly reference which screenshot you're talking about:

```markdown
In the hero-section (light mode), the heading text appears too small relative to the surrounding elements. However, in dark mode, the same text feels appropriately sized due to the contrast.
```

## 🔄 Feedback for Refinement Iterations

When providing feedback on refinement iterations, reference how they compare to previous attempts:

```markdown
This iteration successfully addresses the dark mode contrast issues from iteration 2, while preserving the clean typography from iteration 1. The card spacing is now much more balanced than in all previous iterations.
```

## 📊 Feedback Examples

### For a Hero Section

```markdown
### hero-section

#### What works well:

- The large, bold headline immediately captures attention
- The gradient background adds visual interest without competing with content
- The clear CTA stands out and has excellent contrast
- Spacing feels generous and modern

#### What could be improved:

- The subtitle text is slightly too small at mobile viewport sizes
- Dark mode gradient could use more contrast with the foreground elements
- Animation of the CTA feels slightly too subtle to notice
- The hero image position creates awkward whitespace on tablet sizes

#### General notes:

This iteration feels much more polished than previous attempts. The overall direction is excellent, with just a few refinements needed for optimal responsiveness.

#### Rating: 8/10
```

### For a Features Section

```markdown
### features-section

#### What works well:

- The card layout creates clear visual separation between features
- The icon style is consistent and visually distinctive
- The use of subtle hover effects adds interactivity without distraction
- Typography scale works well across all viewport sizes

#### What could be improved:

- The third card appears misaligned at certain viewport widths
- Card shadows are inconsistent between light and dark modes
- Feature descriptions could use more vertical spacing for readability
- The "Learn more" links need more visual distinction

#### General notes:

This iteration shows significant improvement in organization and visual hierarchy. The main focus should be on fixing the responsive alignment issues and ensuring consistent treatment in dark mode.

#### Rating: 7/10
```

## 🧠 Using Feedback for AI Refinement

The quality of your feedback directly impacts how well the AI can refine designs in subsequent iterations:

1. **Connect specific elements to outcomes**: "The increased spacing between cards improves readability" helps the AI understand cause and effect
2. **Mention both what and why**: "The dark text on dark background reduces readability" is more helpful than just "fix the colors"
3. **Describe desired outcomes**: "The CTA should stand out more prominently against the background" is better than "the CTA is bad"

## 📝 Finalizing Feedback

After completing your feedback:

1. Save the feedback template
2. When running the next refinement iteration with `--refine`, the system will automatically incorporate your feedback

## 🔍 Related Guides

- [Complete Workflow](./workflow.md)
- [AI-Assisted Design](./with-ai.md)
- [Command Reference](./commands.md)
