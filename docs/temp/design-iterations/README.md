# Design Iterations

This directory contains design iterations created by the AI-driven design iteration system.

## Directory Structure

```
/iteration-1/
  /screenshots/         # Screenshots of the iteration
  /diffs/               # Visual diffs between iterations
  diff.patch            # Git diff of the changes made
  metadata.json         # Metadata about the iteration
/iteration-2/
  ...
```

## Running Design Iterations

From the root directory:

```bash
pnpm docs:design-iterations              # Run a single iteration
pnpm docs:design-iterations --count=5    # Run 5 iterations
pnpm docs:design-iterations --target=hero-section,features-section # Focus on specific sections
```

From the docs directory:

```bash
pnpm design-iterations                   # Run a single iteration
pnpm design-iterations --count=5         # Run 5 iterations
pnpm design-iterations --target=hero-section,features-section # Focus on specific sections
```

## Available Options

- `--count=N`: Number of iterations to run (default: 1)
- `--target="component1,component2"`: Components to focus on
- `--prompt="Custom design prompt"`: Custom prompt for design guidance
- `--compare-with="lib1,lib2"`: Libraries to compare with

## Viewing Results

Each iteration contains:

1. Screenshots of the components before/after changes
2. A diff file showing the exact changes made
3. Metadata about the iteration's goals and results
4. Visual diffs highlighting the changes between iterations

## Relation to Active Record Model

The design iterations system follows the same opinionated approach as jods itself.
By providing one good way to do design iterations rather than endless configuration,
we create a streamlined workflow that follows convention over configuration.
