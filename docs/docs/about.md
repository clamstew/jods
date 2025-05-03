---
sidebar_position: 1
title: About jods
description: History and motivation behind the jods library
---

# About jods

jods (JavaScript Object Dynamics System) is a fun, intuitive reactive state library that makes JavaScript objects come alive. It emphasizes simplicity and composability while providing powerful state management capabilities.

## Core Philosophy

jods was built around a few fundamental beliefs:

1. **Simplicity Matters**: State management shouldn't require complex mental models
2. **Direct Manipulation**: Mutating state directly is intuitive and straightforward
3. **Framework Agnostic**: Core reactivity should work without framework dependencies
4. **Composition Over Configuration**: Combine small, focused pieces instead of monolithic patterns
5. **Zero Dependencies**: Keep the library small and focused

## History

jods was created by [clamstew](https://github.com/clamstew) in early 2025. What began as a name registration on npm quickly evolved into a full-featured reactive state library incorporating ideas from various state management approaches:

- The proxy-based reactivity from Vue
- The simplicity of Zustand's API
- The fine-grained updates of Signal-based systems
- The server integration capabilities of Remix

The project went from concept to implementation in under two weeks, with the addition of React, Preact, and Remix integrations showing the versatility of the core reactive system. The development process was accelerated through the thoughtful application of AI tools like LLMs and Cursor, while maintaining high code quality and developer experience standards.

## Why Another State Library?

With so many state management options available, you might wonder why jods needed to exist. The answer lies in its unique combination of features:

- **JSON Snapshots**: First-class support for getting serializable snapshots
- **Computed Values**: Built-in support for reactive computed properties
- **Direct Mutations**: No actions, reducers, or immutable patterns required
- **Framework Integration**: Deep integrations with React, Preact, and Remix
- **Fine-Grained Reactivity**: Signal-based tracking for optimal performance
- **Server + Client**: Bridges the gap between server and client state

For Remix users in particular, jods provides a model-oriented approach that combines schema validation, server-side data loading, form handling, and client-side reactivity in a cohesive package.

[See how jods compares to other state management libraries →](/#compare)

## Contributing

jods is open to contributions! Check out our [contribution guidelines](https://github.com/clamstew/jods/blob/main/CONTRIBUTING.md) to get started.

## Creator

**Clay Stewart** is a software developer with a passion for creating intuitive developer experiences. You can find him on:

- [GitHub](https://github.com/clamstew)
- [X](https://x.com/clay_stewart)
- [LinkedIn](https://www.linkedin.com/in/claystewart/)
