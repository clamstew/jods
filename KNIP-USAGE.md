# Knip Usage Guide

## What is Knip?

Knip is a tool that finds and removes unused dependencies, exports, and files in JavaScript and TypeScript projects. It helps keep the codebase clean and maintainable by identifying dead code that can be safely removed.

## Running Knip

You can run Knip using the following commands:

```bash
# Run Knip with all configured rules
pnpm knip

# Run Knip with specific rules for source files only
pnpm knip:src
```

## Configuration

Knip is configured in `knip.json` in the project root. The current configuration includes:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/index.ts",
    "src/react.ts",
    "src/preact.ts",
    "src/remix.ts",
    "src/zod.ts"
  ],
  "project": ["src/**/*.{js,ts,tsx}"],
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "ignoreDependencies": ["@testing-library/*"],
  "ignoreExportsUsedInFile": true,
  "rules": {
    "binaries": "error",
    "dependencies": "error",
    "devDependencies": "error",
    "exports": "error",
    "files": "error",
    "nsExports": "error",
    "nsTypes": "error",
    "types": "error",
    "unlisted": "error"
  }
}
```

### Key Configuration Elements

- **entry**: Entry points for the application
- **project**: Files to include in the analysis
- **ignore**: Files to exclude from the analysis
- **ignoreDependencies**: Dependencies to exclude from the analysis
- **ignoreExportsUsedInFile**: Ignore exports used within the same file
- **rules**: Rules to apply and their error levels

## Interpreting Knip Results

Knip reports several types of issues:

1. **Unused dependencies**: Dependencies listed in `package.json` but not used in code
2. **Unused devDependencies**: Development dependencies not used in the project
3. **Unused files**: Files that aren't imported or used anywhere
4. **Unused exports**: Exported functions, variables, or types that aren't used

## When to Ignore Knip Warnings

While Knip is powerful, there are cases where it's appropriate to ignore its warnings:

1. **Public API modules**: Exports intended for external consumption may be flagged as unused within the project
2. **Test utilities**: Files used only for testing but not directly imported
3. **Dev-only code**: Code that's only used during development (like debuggers)
4. **Build-time assets**: Files used during builds but not explicitly imported

## CI Integration

Knip is integrated into our CI pipeline in GitHub Actions. It runs as part of the CI checks with the following configuration:

```yaml
- name: Run Knip for unused code analysis
  run: pnpm knip
  continue-on-error: true # Optional during initial integration
```

During the initial integration phase, Knip errors won't fail the build, but they should be addressed when possible.

## Best Practices

1. **Run Knip before major PRs**: Check for unused code before submitting large PRs
2. **Address warnings progressively**: Fix warnings in small batches rather than all at once
3. **Document exceptions**: When ignoring Knip warnings, document why in code comments
4. **Keep configuration updated**: Update ignoreLists as project requirements change
5. **Use with TypeScript**: Knip works best with TypeScript projects where types can help analyze usage

## Resources

- [Knip Documentation](https://knip.dev/)
- [GitHub Repository](https://github.com/webpro/knip)
- [Knip Plugins](https://knip.dev/reference/plugins)
