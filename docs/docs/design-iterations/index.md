---
sidebar_position: 1
---

# 🎨 Design Iterations System

The Design Iterations system is a powerful workflow that combines Playwright screenshots with AI assistance to rapidly evolve UI components through multiple iterations, providing a systematic approach to improving our documentation site's user interface.

## ✨ Why Design Iterations?

Design iterations allow you to:

- **Explore multiple design directions** simultaneously
- **Generate visual variations** directly in code without manual mockups
- **Capture screenshots automatically** for comparison
- **Collect structured feedback** on each iteration
- **Refine designs incrementally** based on feedback
- **Maintain a visual history** of your design evolution
- **Apply your favorite designs** with simple commands

## 🚀 Quick Start

```bash
# From the /docs directory, run:
pnpm design-iterations --count=3 --target="features-section"

# Review the screenshots and provide feedback in the generated template
# Then run another iteration if needed:
pnpm design-iterations --count=1 --target="features-section" --refine
```

## 📚 Guide Contents

This guide covers the complete Design Iterations workflow:

1. [**Complete Workflow**](./workflow.md) - Step-by-step guide to using design iterations
2. [**AI-Assisted Design**](./with-ai.md) - How AI powers the design iteration process
3. [**Command Reference**](./commands.md) - Detailed command documentation
4. [**Feedback System**](./feedback.md) - How to provide structured feedback
5. [**Screenshots System**](../playwright-screenshots.md) - How the screenshot system works

## 🎯 Available Targets

The following UI components can be targeted for design iterations:

- `hero-section` - The main hero section on the homepage
- `features-section` - The features grid on the homepage
- `framework-section-react` - The React framework comparison section
- `framework-section-remix` - The Remix framework section
- `compare-section` - The comparison section with other libraries

## 💡 Best Practices

1. **Focus on one component** at a time rather than redesigning everything at once
2. **Be specific in your feedback** about what elements you like/dislike
3. **Try 3-5 iterations** before finalizing a design
4. **Evaluate in both light and dark mode**
5. **Save all feedback** for future reference
6. **Clean up** after finalizing to avoid cluttering your workspace

## 🌟 Success Story: Remix Integration Section

We recently used this process to redesign the "Remix State, Reimagined" section with excellent results:

<div className="iterations-comparison">
  <h3 className="comparison-heading">Remix Integration Section Redesign</h3>
  
  <div className="iterations-grid">
    <!-- Light Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (Before)</div>
      <img className="iteration-image" src="/jods/screenshots/redesign-comparison/remix-section-before-light.png" alt="Remix section before redesign (light mode)" />
    </div>
    
    <!-- Light Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label light-theme-label">Light Mode (After)</div>
      <img className="iteration-image" src="/jods/screenshots/redesign-comparison/remix-section-after-light.png" alt="Remix section after redesign (light mode)" />
    </div>
    
    <!-- Dark Mode Before -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (Before)</div>
      <img className="iteration-image" src="/jods/screenshots/redesign-comparison/remix-section-before-dark.png" alt="Remix section before redesign (dark mode)" />
    </div>
    
    <!-- Dark Mode After -->
    <div className="iteration-image-container">
      <div className="iteration-label dark-theme-label">Dark Mode (After)</div>
      <img className="iteration-image" src="/jods/screenshots/redesign-comparison/remix-section-after-dark.png" alt="Remix section after redesign (dark mode)" />
    </div>
  </div>
</div>

Read the [complete guide](./workflow.md) to start using design iterations for your UI improvements!
