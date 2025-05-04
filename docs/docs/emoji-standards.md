---
id: emoji-standards
title: 🎭 Emoji Standards Guide
---

# 🎭 Emoji Standards Guide for jods

This document outlines the standardized emoji usage across jods documentation and code. Consistent emoji usage helps maintain a cohesive visual language and improves recognition of concepts across different parts of the codebase and documentation.

## Core Concepts

| Emoji | Concept             | Usage                                                   |
| ----- | ------------------- | ------------------------------------------------------- |
| 📦    | **Store/State**     | Core state containers and storage-related functionality |
| 🧮    | **Computed Values** | All references to computed values and derived state     |
| 🔄    | **Reactivity**      | Reactive updates, subscriptions, and state changes      |
| 📸    | **Snapshots**       | For `json()` and serialization functionality            |
| 🔍    | **Diff Detection**  | Diffing and comparison functionality                    |
| ⏳    | **Time-Travel**     | History and time-travel debugging features              |

## Framework Integrations

| Emoji | Framework  | Usage                                      |
| ----- | ---------- | ------------------------------------------ |
| ⚛️    | **React**  | React integration and hooks                |
| ⚡    | **Preact** | Preact integration and performance         |
| 💿    | **Remix**  | Remix integration and server-side features |

## Documentation Organization

| Emoji | Section                | Usage                                        |
| ----- | ---------------------- | -------------------------------------------- |
| 📋    | **Examples**           | Code samples and usage examples              |
| 🧪    | **API Reference**      | Function documentation and technical details |
| 🚀    | **Getting Started**    | Introductory material and quick starts       |
| 🔧    | **Configuration**      | Setup instructions and configuration options |
| 🧩    | **Features**           | Feature highlights and capabilities          |
| 🛠️    | **Maintainer's Guide** | Development and maintenance instructions     |

## Mascots/Branding

The squirrel and duck mascots 🐿️ 🦆 should be used consistently to represent jods branding:

- 🐿️ - Often used for data modeling and structure
- 🦆 - Often used for components and UI integration

## Best Practices

1. **Consistency**: Use the same emoji for the same concept across all documentation
2. **Clarity**: Choose emojis that clearly represent the concept
3. **Moderation**: Don't overuse emojis; they should enhance, not distract
4. **Accessibility**: Always include text descriptions alongside emojis

## Implementation in Code Comments

```js
// 📦 Store creation
const myStore = store({ count: 0 });

// 🧮 Computed value
myStore.doubled = computed(() => myStore.count * 2);

// 🔄 Reactivity handling
onUpdate(myStore, (newState) => {
  console.log("State updated!");
});

// 📸 Snapshot
const snapshot = json(myStore);

// 🔍 Diff detection
const changes = diff(oldState, newState);

// ⏳ Time-travel
const history = history(myStore);
```

## Review and Updates

This emoji guide should be reviewed periodically to ensure it remains relevant and consistent with jods development. New concepts may require new emoji associations, which should be added to this guide.
