# JODS Emoji Guidelines

This document provides guidelines for using emojis consistently across JODS documentation.

## Core Principles

- Emojis should enhance communication, not distract from it
- Use emojis consistently for the same concepts
- Prefer Unicode emojis over custom images for compatibility

## Standard Emoji Mappings

### Feature Categories

| Emoji | Usage                                  |
| ----- | -------------------------------------- |
| 🔥    | Performance-related features           |
| 🧠    | Intelligence/computation concepts      |
| 🚀    | Speed/optimization features            |
| 💿    | Persistence/storage features           |
| ⚡    | Reactivity/signal features             |
| 🪶    | Lightweight/small bundle features      |
| ✨    | Enhanced developer experience          |
| 🔄    | Synchronization/updating features      |
| 🔌    | Integration with other tools/libraries |
| 📊    | Data visualization/analysis features   |
| 🔒    | Security features                      |
| 🧩    | Component/modular architecture         |
| 📷    | Snapshots/serialization features       |

### Documentation Sections

| Emoji | Usage                                      |
| ----- | ------------------------------------------ |
| 📋    | Prerequisites                              |
| 🛠️    | Installation instructions                  |
| 🧪    | Examples                                   |
| ⚠️    | Warning/caution                            |
| 💡    | Tips and insights                          |
| 📝    | Notes                                      |
| 🔍    | Details/deep dives                         |
| 🏆    | Best practices                             |
| 🐛    | Common issues/debugging                    |
| 🧭    | Navigation/guidance through complex topics |

## Note About Multiple Emoji Standards

This document focuses on general documentation guidelines. For official technical documentation and code comments, please refer to the more comprehensive [`docs/docs/emoji-standards.md`](./docs/emoji-standards.md) file.

In the future, these two documents may be merged to provide a unified set of emoji guidelines.

## Usage Guidelines

### Headers

- Section headers should use at most one emoji as a prefix
- The emoji should be related to the content of the section
- Be consistent with emoji choice across similar sections

**Good:**

```md
## 🚀 Getting Started

## 🧪 Example: Using computed()

## 📊 Performance Comparison
```

**Avoid:**

```md
## 🔥 🚀 ⚡ Super Fast Performance Section 🔥 🚀 ⚡

## Getting Started 🚀 (emoji at end)

## 🧪 Example: Using computed() 🧠 (too many emojis)
```

### In-line Usage

- Use emojis sparingly within paragraphs
- Emojis can be used to highlight important points
- Avoid using multiple emojis in succession

**Good:**

```md
The `json()` method ✨ makes it easy to serialize your state.
```

**Avoid:**

```md
The `json()` method ✨🔥🚀 makes it easy to serialize your state.
```

### Code Examples

- Do not use emojis inside code blocks or examples
- Emojis can be used in comments above code examples
- Use consistent emojis for similar types of examples

### Tables

- Tables can use emojis in headers for better scanning
- Use emojis consistently across similar tables
- Avoid using emojis in every cell

## Accessibility Considerations

- Remember that emojis are read aloud by screen readers
- Use emojis that enhance meaning rather than just decoration
- Consider adding appropriate alt text for complex emoji usage

## Framework-Specific Guidelines

### React Documentation

- Use ⚛️ for React-specific features
- Use 🪝 for React hooks

### Remix Documentation

- Use 💿 for Remix-specific features
- Use 🔄 for Remix data flow concepts

---

These guidelines help maintain a consistent, accessible, and professional documentation style while still keeping the friendly, approachable tone that makes JODS documentation engaging.
