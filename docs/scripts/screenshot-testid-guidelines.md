# Screenshot Testing with Data TestIDs

This document outlines a systematic approach to using `data-testid` attributes to make screenshot testing more robust and maintainable.

## Core Principles

1. **Explicit over implicit**: Use explicit testIDs rather than relying on text content or DOM structure
2. **Consistent naming**: Follow a consistent naming pattern for all testIDs
3. **Hierarchical structure**: Use parent/child relationships in testID naming
4. **Progressive enhancement**: Add testIDs while maintaining backward compatibility

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

1. Add testIDs to key components
2. Update selectors to prioritize testIDs
3. Keep fallback strategies for backward compatibility
4. Gradually move to testID-first approach for all sections

## Benefits

- **Resilience to design changes**: TestIDs don't change when styling or content changes
- **Explicit intent**: Clear indication of what elements are important for testing
- **Simplified selectors**: No need for complex CSS or XPath selectors
- **Better debugging**: Easier to identify elements in test failures
- **Cross-browser consistency**: More reliable than relying on visual appearance or text content

## Integration with Unified Screenshot Approach

The unified screenshot script can be enhanced to:

1. First try finding elements by testID
2. Fall back to existing selectors if testIDs aren't found
3. Report elements found by testID vs fallback in logs

This provides a gradual migration path without breaking existing tests.
