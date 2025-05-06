#!/bin/bash

# Initialize Design Iterations Directory Structure
# This script creates the basic directory structure for design iterations

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="$ROOT_DIR/temp"
ITERATIONS_DIR="$TEMP_DIR/design-iterations"

# Create base directories
mkdir -p "$ITERATIONS_DIR"

# Create README file
cat > "$ITERATIONS_DIR/README.md" << 'EOF'
# Design Iterations

This directory contains design iterations created by the AI-driven design iteration system.

## Directory Structure

```
/iteration-1/
  /screenshots/         # Screenshots of the iteration
  diff.patch            # Git diff of the changes made
  metadata.json         # Metadata about the iteration
/iteration-2/
  ...
```

## Running Design Iterations

From the root directory:

```bash
pnpm docs:design-iterations              # Run a single iteration
pnpm docs:design-iterations:count-5      # Run 5 iterations
pnpm docs:design-iterations:hero-features # Focus on hero and features sections
```

From the docs directory:

```bash
pnpm design-iterations                   # Run a single iteration
pnpm design-iterations:count-5           # Run 5 iterations
pnpm design-iterations:hero-features     # Focus on hero and features sections
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

EOF

# Create placeholder for inspiration images
mkdir -p "$ITERATIONS_DIR/inspiration"
touch "$ITERATIONS_DIR/inspiration/.gitkeep"

echo "✅ Design iterations directory structure created at $ITERATIONS_DIR"
echo "📄 README created with usage instructions"
echo "🚀 Ready to run design iterations!" 