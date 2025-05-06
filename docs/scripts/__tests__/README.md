# Screenshot Framework Tests

This directory contains unit tests for the screenshot framework modules. The tests focus on verifying the core functionality of utilities and helper functions.

## Running Tests

To run the tests, use:

```bash
npm test
```

Or to run tests in watch mode during development:

```bash
npm run test:watch
```

## Test Philosophy

The tests follow these principles:

1. **Focus on utilities**: We prioritize testing reusable utilities and helper functions that form the core of the framework.

2. **Lightweight approach**: Tests are kept minimal but meaningful, focusing on key functionality rather than exhaustive coverage.

3. **Mocking dependencies**: External dependencies (fs, path, etc.) are mocked to isolate module functionality.

4. **Test organization**: Tests mirror the structure of the framework, with separate test files for each module.

## Refactoring Guidelines

Some modules were originally designed as standalone scripts rather than reusable modules. For those files, the tests may include TODOs for refactoring:

1. Extract key functionality from scripts into named, exported functions
2. Separate configuration from functionality
3. Use dependency injection for easier testing
4. Add tests for the extracted functions

## Coverage

Test coverage is collected from all `.mjs` files in the scripts directory. To generate a coverage report:

```bash
npm test -- --coverage
```

## Adding New Tests

When adding new script modules to the framework:

1. Create a corresponding test file in this directory
2. Focus on testing the core utilities and functionality
3. Mock external dependencies appropriately
4. Follow existing test patterns for consistency
