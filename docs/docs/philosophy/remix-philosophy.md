---
title: The Philosophy Behind Remixing Remix
description: How jods brings Rails-like conventions to Remix for a more seamless full-stack experience
sidebar_position: 3
---

# The Philosophy Behind Remixing Remix

## A Brief History of Web Development Patterns

The evolution of web development has taken us through several paradigms:

1. **Traditional Server Rendering** - PHP, Rails, Django (2000s)

   - Server generated all HTML
   - Forms submitted to endpoints that returned new pages
   - Simple mental model with clear data flow

2. **Client-Side SPA Revolution** (2010s)

   - JavaScript frameworks took over rendering
   - API-based data fetching
   - Powerful UX, but complex state management
   - Often disconnected from server-side logic

3. **Remix's Return to Server Principles** (2020s)
   - Brought back forms, progressive enhancement
   - Server-side rendering with client hydration
   - Nested routing with data loading
   - Simplified mental model with clear boundaries

## Where jods Fits In: Remixing the Remix

Remix reintroduced many of the benefits of traditional server-side rendering while maintaining modern frontend capabilities. But we saw an opportunity to take it further by adding Rails-like "convention over configuration" principles:

### The Rails Philosophy Applied to Remix

[Ruby on Rails](https://rubyonrails.org/) revolutionized web development with its opinionated approach and emphasis on developer happiness. Key principles included:

- **Convention over Configuration** - Sensible defaults that "just work"
- **Don't Repeat Yourself (DRY)** - Minimize redundancy in your codebase
- **Active Record Pattern** - Models that know how to persist themselves

jods brings these principles to Remix through:

1. **Durable, Reusable Objects**

   - Server and client state unified in one model
   - Objects that know how to hydrate, persist, and validate themselves
   - Automatically synchronized across the full stack

2. **Declarative Data Layer**

   - Define your data model once, use it everywhere
   - Type-safe across the entire application
   - Implicit actions that don't require manual handlers

3. **Convention-Based Form Handling**
   - Forms that automatically dispatch to the right actions
   - Built-in validation using Zod schemas
   - Progressive enhancement that works with or without JavaScript

## The Best of All Worlds

jods aims to combine:

- Remix's server-first approach and nested routing
- Rails' convention over configuration philosophy
- Modern TypeScript's strong typing and developer experience
- React's component model and client-side capabilities

The result is a development experience that feels both familiar to those who remember the simplicity of Rails/PHP development, yet fully equipped for modern application requirements.

## Getting Started with Remix on jods

If you're ready to experience this unified approach:

- [Remix Integration Guide](/remix)
- [Active Record Pattern in jods](/concepts/active-record)
- [Migration Guide for Rails Developers](/guides/rails-to-jods)
