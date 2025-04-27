---
sidebar_position: 1
---

# Introduction to jods

> "Got state to track? Just jods it down"

jods (JSON On Demand Store) is a minimal, reactive JSON state layer for Node.js and the browser. Create lightweight observable stores that emit JSON snapshots on demand.

## What is jods?

jods is a tiny state management library designed to be simple, flexible, and powerful. It's perfect for:

- Syncing app state
- Powering APIs
- Building reactive UIs without heavy frameworks

## Key Features

- ☁️ Zero dependencies
- 🧠 Computed values are built-in
- ⚡ Works with React/Preact via useSyncExternalStore
- 🪞 Built-in deep cloning with json()
- 🧬 Minimal API, no boilerplate actions or reducers
- 🧪 Diff detection baked in
- 🧩 Framework agnostic, but integrates well with React/Preact

## Installation

```bash
npm install jods
```

## Basic Usage

```js
import { store, json, onUpdate, computed } from "jods";

const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// Subscribe to changes
onUpdate(user, (newUserState) => {
  console.log("User state updated:", json(newUserState));
});

// Mutate existing fields
user.firstName = "Burt Macklin";
user.mood = "sneaky";

// Add new computed field
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

console.log(json(user));
// { firstName: "Burt Macklin", lastName: "Macklin", mood: "sneaky", fullName: "Burt Macklin Macklin" }
```

## Why Choose jods?

jods takes state management back to basics. It provides a simple, intuitive API that feels like working with regular JavaScript objects, while adding powerful reactive capabilities.

Ready to learn more? Let's explore jods in depth.
