# Design Iteration Checklist

Use this checklist to ensure you follow all the necessary steps when implementing design iterations.

## Before Starting

- [ ] Review design principles in `design-iteration-principles.md`
- [ ] Check previous iteration feedback in the feedback documents
- [ ] Ensure you have a clear design direction for this iteration
- [ ] Create a branch for this design iteration if using version control
- [ ] Make sure you have the necessary tools installed

## Implementation

- [ ] Modify only the relevant CSS files for the target component
- [ ] Test in both light and dark themes
- [ ] Check responsive behavior on different screen sizes
- [ ] Validate accessibility (contrast, keyboard navigation, etc.)
- [ ] Ensure all interactive elements work properly
- [ ] Remove any temporary debugging CSS
- [ ] Document any complex or unusual CSS with comments

## Documentation

- [ ] Take screenshots of the iteration in both light and dark themes
- [ ] Save Git diff immediately after taking screenshots using:
  ```bash
  node docs/scripts/capture-diff.mjs --name="iteration-N-component-name"
  ```
- [ ] Create/update feedback template for this iteration
- [ ] Document design decisions and reasoning

## Review

- [ ] Present the iteration to stakeholders/team
- [ ] Collect feedback using the template
- [ ] Note both positive and negative aspects
- [ ] Compare with previous iterations
- [ ] Document any lessons learned

## After Selection

- [ ] If selected, prepare for baseline update
- [ ] Get maintainer sign-off before updating baseline
- [ ] Apply selected iteration using the saved diff:
  ```javascript
  import { applySelectedIteration } from "./docs/scripts/design-iterations.mjs";
  applySelectedIteration("./docs/temp/design-iterations/iteration-N");
  ```
- [ ] Update baseline screenshots
- [ ] Document final implementation details

## Common Issues Checklist

- [ ] Are there any visual regressions in other components?
- [ ] Does the design maintain consistency with the rest of the site?
- [ ] Are there any performance issues with the new design?
- [ ] Is the design accessible to all users?
- [ ] Does the implementation work in all major browsers?
- [ ] Is the CSS maintainable and using best practices?

## Final Design Review

- [ ] Does the design effectively communicate the concept?
- [ ] Is every line of code providing clear value?
- [ ] Does the design work well for new users and returning users?
- [ ] Does the design reflect the jods brand identity?
- [ ] Is the design memorable and distinctive?
- [ ] Does the design scale well as content grows?
