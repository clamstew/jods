# Design Iteration Process for jods Documentation

## Overview

This repository contains tools and documentation for managing design iterations for the jods documentation site. The goal is to provide a structured approach to exploring and implementing design improvements while maintaining a record of changes and feedback.

## Directory Structure

```
docs/
├── design-iteration-workflow.md      # Workflow guidelines
├── design-iteration-feedback-template.md  # Template for feedback
├── design-iteration-summary.md       # Summary of iterations
├── design-iteration-review.md        # Detailed analysis of iterations
├── examples/
│   └── remix-section-design-feedback.md  # Example feedback document
├── scripts/
│   └── design-iterations.mjs         # Main script for automation
├── temp/
│   ├── design-iterations/            # Storage for iteration metadata
│   └── possible-diffs/               # Storage for Git diffs
└── static/
    └── screenshots/
        └── unified/                  # Screenshots of iterations
```

## Quick Start

1. **Review the workflow documentation:**

   ```
   docs/design-iteration-workflow.md
   ```

2. **Run the design iterations script:**

   ```bash
   node docs/scripts/design-iterations.mjs --count=3 --target="framework-section-remix"
   ```

3. **Review the generated screenshots and provide feedback** using the generated feedback template

4. **Apply selected iteration** after maintainer approval:
   ```javascript
   import { applySelectedIteration } from "./docs/scripts/design-iterations.mjs";
   applySelectedIteration("./docs/temp/design-iterations/iteration-2");
   ```

## Key Features

- **Multiple design iterations** - Systematically explore different design approaches
- **Screenshot capture** - Automatically capture screenshots of each iteration
- **Git diff preservation** - Save exact implementation details for each iteration
- **Feedback templates** - Structured approach to collecting and analyzing feedback
- **Maintainer approval** - Required sign-off before baseline changes
- **Comprehensive documentation** - Guidelines for the entire process

## Workflow Summary

1. **Planning** - Identify design targets and goals
2. **Implementation** - Create distinct design variations
3. **Documentation** - Capture screenshots and implementation details
4. **Review** - Analyze strengths and weaknesses of each approach
5. **Selection** - Choose and refine preferred design
6. **Implementation** - Apply selected design with maintainer approval

## Best Practices

1. Always save Git diffs after taking screenshots
2. Document feedback promptly using the provided templates
3. Never change the baseline without explicit maintainer approval
4. Keep iterations focused on specific design goals
5. Preserve all screenshots and diffs for reference

## Tool Usage

### Design Iterations Script

The main script (`design-iterations.mjs`) automates many aspects of the process:

```bash
# Basic usage
node docs/scripts/design-iterations.mjs

# Generate multiple iterations for specific components
node docs/scripts/design-iterations.mjs --count=3 --target="hero-section,features-section"

# Skip signoff requirement (for testing only)
node docs/scripts/design-iterations.mjs --signoff=false
```

## Contribution Guidelines

When contributing design improvements:

1. Follow the established workflow
2. Use the provided templates and tools
3. Focus on developer experience and brand consistency
4. Ensure accessibility is maintained
5. Consider both dark and light themes

## Example Usage

See `docs/examples/remix-section-design-feedback.md` for a complete example of the design iteration feedback process.
