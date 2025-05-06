---
sidebar_position: 3
---

# 🧩 TestID-Driven Screenshot Framework

This guide outlines our systematic approach to a screenshot testing framework driven by `data-testid` attributes. By tagging elements with proper test IDs, we can automate the entire screenshot testing process.

## Core Vision

With this framework, the developer workflow becomes:

1. **Tag components** with standardized `data-testid` attributes
2. **Run the generation script** to auto-discover elements and build the selectors file
3. **Execute screenshot tests** that reliably target the right elements

## Core Principles

1. **Explicit over implicit**: Use explicit testIDs rather than relying on text content or DOM structure
2. **Consistent naming**: Follow a consistent naming pattern for all testIDs
3. **Hierarchical structure**: Use parent/child relationships in testID naming
4. **Progressive enhancement**: Add testIDs while maintaining backward compatibility
5. **Auto-discovery**: Components with proper testIDs are automatically included in testing
6. **Opinionated patterns**: Prefer standardized approaches over endless configuration options

## TestID Naming Convention

```
data-testid="jods-[section]-[component]-[variant]"
```

Examples:

- `data-testid="jods-framework-section"` - Main framework section container
- `data-testid="jods-framework-tab-react"` - React tab in framework section
- `data-testid="jods-framework-tab-remix"` - Remix tab in framework section
- `data-testid="jods-hero-section"` - Hero section
- `data-testid="jods-features-section"` - Features section

### Remix-Specific TestID Patterns

For Remix integration components, use these additional patterns:

- `data-testid="jods-remix-form-[formName]"` - For Remix-integrated forms
- `data-testid="jods-remix-loader-demo"` - For loader data integration examples
- `data-testid="jods-remix-action-demo"` - For action integration examples
- `data-testid="jods-remix-model-[modelName]"` - For active record model examples

## Implementation in Components

### Framework Tabs Example

```jsx
// Framework card/tab
<div
  className={`framework-card ${isActive ? 'active' : ''}`}
  data-testid={`jods-framework-tab-${framework.toLowerCase()}`}
  onClick={() => selectFramework(framework)}>
  <div className="emoji">{framework === 'React' ? '⚛️' : framework === 'Remix' ? '💿' : ''}</div>
  <h3>{framework}</h3>
  <p>{description}</p>
</div>

// Framework section
<section
  id="framework-integration"
  data-testid="jods-framework-section">
  <h2>Works with your favorite frameworks</h2>
  {/* tabs and content */}
</section>
```

### Remix Integration Example

```jsx
// Remix active record model example
<div data-testid="jods-remix-model-user" className="model-example">
  <h3>User Model with jods</h3>
  <pre>
    <code>{`
const userSchema = define({
  id: types.string,
  name: types.string,
  email: types.string,
});

// Use like an active record model in Remix
export const User = {
  ...userSchema,
  async findById(id) {
    const data = await db.get('users', id);
    return userSchema.create(data);
  },
  async save(user) {
    return db.put('users', user.id, user);
  }
};
    `}</code>
  </pre>
</div>
```

## Auto-Generation of Screenshot Selectors

One of the powerful features of this approach is the ability to auto-generate the selectors configuration.

Here's how it works:

1. A **discovery script** crawls the site and finds all elements with matching `data-testid` patterns
2. It **analyzes the structure** to identify parent/child relationships and interactive elements
3. It **generates a configuration file** with optimized selectors for each element
4. Additional settings (padding, min-height, etc.) can be applied based on component type

### Using Generated Selectors

After running the generator script, you can use the generated selectors with the simplified CLI:

```bash
# Generate selectors from testIDs
pnpm generate-selectors

# Use generated selectors with screenshot command
pnpm screenshot -- --use-generated-selectors

# You can combine with other options
pnpm screenshot -- --use-generated-selectors --baseline
```

## Updating Screenshot Selectors

In `screenshot-selectors.mjs`, prioritize testIDs:

```js
{
  page: "/",
  name: "framework-section-remix",
  selector: "[data-testid='jods-framework-section']",
  fallbackStrategy: "keyword-context",
  keywords: ["favorite frameworks", "Framework Integration"],
  clickSelector: "[data-testid='jods-framework-tab-remix']",
  // Fallbacks after the testID selector...
}
```

## Testing Workflow

1. Add testIDs to key components in your React/Preact/UI code
2. Run the generator to discover and create selectors
3. Execute the screenshot tests with the `--use-generated-selectors` flag
4. Review and manually adjust generated selectors if needed

## Benefits

- **Resilience to design changes**: TestIDs don't change when styling or content changes
- **Explicit intent**: Clear indication of what elements are important for testing
- **Simplified selectors**: No need for complex CSS or XPath selectors
- **Better debugging**: Easier to identify elements in test failures
- **Cross-browser consistency**: More reliable than relying on visual appearance or text content
- **Auto-generation**: Reduces manual work in maintaining selectors
- **Self-documenting**: TestIDs make it clear what's important to test

## Integration with Design Iterations

The testID-driven approach provides a reliable foundation for design iterations by:

1. Ensuring screenshots consistently capture the same elements across iterations
2. Removing reliance on visual appearance which changes during design iterations
3. Allowing for accurate before/after comparisons of design changes
4. Providing stable selectors even when CSS classes and DOM structure changes

Learn more about using this system in the [Design Iterations workflow](../workflow).
