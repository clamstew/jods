# Simplified Component Names

The Design Iterations workflow now supports simplified component names, making it easier to target specific UI sections without needing to remember their exact numeric prefixes.

## Available Components

You can now reference components using either format:

| Simplified Name           | Full Name with Prefix        | Description                   |
| ------------------------- | ---------------------------- | ----------------------------- |
| `hero-section`            | `01-hero-section`            | Main hero section on homepage |
| `features-section`        | `02-features-section`        | Features grid showcase        |
| `try-jods-section`        | `03-try-jods-section`        | Interactive demo section      |
| `framework-section-react` | `04-framework-section-react` | React integration tab         |
| `framework-section-remix` | `04-framework-section-remix` | Remix integration tab         |
| `remix-section`           | `05-remix-section`           | Remix integration section     |
| `compare-section`         | `06-compare-section`         | Library comparison section    |
| `footer-section`          | `07-footer-section`          | Footer section                |

## Usage Examples

```bash
# These commands are equivalent:
pnpm docs:design-iterations:count-5 --target="try-jods-section" --skip-other-sections
pnpm docs:design-iterations:count-5 --target="03-try-jods-section" --skip-other-sections

# Apply a specific iteration
pnpm docs:design-iterations:apply --iteration=2 --target="try-jods-section"

# Refine an existing iteration
pnpm docs:design-iterations:refine --target="framework-section-react"
```

## How it Works

The system performs automatic name mapping in the following order:

1. Check if the name already has a numeric prefix (like "03-try-jods-section")
2. Look up the name in a predefined mapping table
3. Attempt to match by removing the numeric prefix from existing components
4. If no match is found, use the name as provided

Debug logs will show the mapping process:

```
Mapped simplified name "try-jods-section" to "03-try-jods-section"
```

## Best Practices

- Use simplified names for better readability in commands
- Always include the `--skip-other-sections` flag to avoid unwanted screenshots
- When reviewing debug logs or generated artifacts, be aware that file paths will still use the full prefixed component names

## Common Issues

If your component isn't found, check:

- Spelling matches exactly (e.g., "try-jods-section" not "try-jod-section")
- Hyphens are in the correct places
- You're using a valid component name from the table above
