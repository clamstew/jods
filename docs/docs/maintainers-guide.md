---
sidebar_position: 6
---

# Maintainer's Guide 🛠️ 🐿️ 🦆

This guide outlines all the places that need to be updated when adding a new feature to jods.

## Checklist for Adding New Features ✅

When adding a new feature to jods, make sure to update all of these components:

### 1. Core Implementation 🧩

- [ ] Add the feature implementation in `src/`
- [ ] Export the feature in `src/index.ts`
- [ ] Add type definitions for the feature

### 2. Testing 🧪

- [ ] Add unit tests in `src/__tests__/`
- [ ] Update existing tests if the feature changes current behavior

### 3. Documentation 📚

- [ ] Update the README.md:

  - Add the feature to the "Features" section
  - Add the feature to the "API" section
  - Add an example if appropriate
  - Update the Roadmap section if the feature was listed there

- [ ] Update or create documentation pages:
  - Add a dedicated documentation page for significant features
  - Update the API reference page
  - Add examples showing the feature in action

### 4. Examples 💡

- [ ] Add an example file in the `examples/` directory
- [ ] Ensure the example is well-commented and shows best practices

### 5. Framework Integration 🔌

If the feature interacts with frameworks:

- [ ] Update React integration in `src/react/` ⚛️
- [ ] Update Preact integration in `src/preact/` ⚡️
- [ ] Update Remix integration in `src/remix/` 💿
- [ ] Add examples showing framework integration

## Common Gotchas ⚠️

- When adding a new export, make sure it's included in both ESM and CJS builds
- Don't forget to update TypeScript types and interfaces
- Keep the bundle size minimal - consider whether the feature should be in the core or a separate module

## Documentation Site Updates 🌐

After making local changes to the documentation:

1. Run the development server to test locally:

   ```bash
   pnpm run docs:dev
   ```

2. The GitHub Action will automatically deploy the updated docs when changes are pushed to the main branch.

## Version Bumping 🔢

When ready to release a new version:

1. Update the version in `package.json`
2. Update the CHANGELOG.md file
3. Tag the release in git
4. Publish to npm

# jods Feature Implementation Rule 📋

You're helping add a new feature to jods (JavaScript Object Dynamics System 🐿️ 🦆), a minimal reactive state library. When implementing a new feature:

## Required Updates 📝

1. Add core implementation in src/ directory
2. Export the feature from src/index.ts
3. Add TypeScript types & interfaces
4. Add tests in src/**tests**/
5. Update README.md:
   - Features section
   - API section
   - Examples (if applicable)
   - Update roadmap
6. Add documentation:
   - Create dedicated markdown page for significant features
   - Update API reference
7. Add examples in examples/ directory
8. For framework integration:
   - Update src/react/ ⚛️ (if applicable)
   - Update src/preact/ ⚡️ (if applicable)
   - Update src/remix/ 💿 (if applicable)

## Style Guidelines 🎨

- Keep core functionality small and focused
- Maintain zero dependencies
- Follow existing patterns for reactivity
- Make sure types are comprehensive
- Examples should be well-commented
- Tests should cover edge cases

Follow the existing maintainers-guide.md for complete details.
