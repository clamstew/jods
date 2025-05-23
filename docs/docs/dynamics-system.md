---
sidebar_position: 2
title: What is a Dynamics System?
description: Understanding jods as a JavaScript Object Dynamics System
---

# 🧠 What is a Dynamics System?

<div style={{float: 'right', margin: '0 0 20px 20px', maxWidth: '50%'}}>
  <img 
    src="img/articles/dynamic-system/mascots-and-the-system.png" 
    alt="jods mascots and the dynamics system" 
    style={{width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} 
  />
</div>

## 🔄 Beyond Traditional State Management

A **Dynamics System** represents a significant evolution in how we think about state management in JavaScript applications. Unlike traditional state management solutions that focus solely on storing and updating values, a Dynamics System creates a _living, responsive ecosystem_ where objects intuitively react to changes, compute derived values, and maintain consistency across your application.

## 💡 The jods Philosophy

jods (**J**avaScript **O**bject **D**ynamics **S**ystem) takes a fundamentally different approach than other state libraries. Rather than requiring you to learn complex patterns, middlewares, or actions/reducers, jods embraces the natural way developers already work with JavaScript objects.

At its core, a Dynamics System:

1. **📱 Feels Natural**: Uses direct mutations (`user.name = "Burt"`) instead of verbose action dispatchers
2. **🔄 Reacts Intelligently**: Automatically tracks dependencies and triggers updates
3. **🧮 Computes Effortlessly**: Handles derived values through simple function declarations
4. **📷 Snapshots Seamlessly**: Creates consistent, serializable snapshots of application state
5. **🧬 Bridges Environments**: Works the same way on client, server, or any JavaScript environment

## 🔍 How is a Dynamics System Different?

Let's compare jods with some other popular approaches:

<div className="table-container" id="compare" style={{width: '100%', maxWidth: '900px', margin: '0 auto', overflowX: 'auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'}}>

| FEATURE               | TRADITIONAL OBJECT    | REDUX                       | ZUSTAND                    | JODS (DYNAMICS SYSTEM)                                 |
| --------------------- | --------------------- | --------------------------- | -------------------------- | ------------------------------------------------------ |
| Updating state        | `obj.name = "Burt"`   | `dispatch(setName("Burt"))` | `setState({name: "Burt"})` | `user.name = "Burt"`                                   |
| Reactivity            | None                  | Manual subscriptions        | Selector functions         | Automatic + granular                                   |
| Computed values       | Manual functions      | Selector functions          | Selector functions         | `computed(() => user.firstName + " " + user.lastName)` |
| Serialization         | `JSON.stringify(obj)` | Need custom serializers     | Need custom serializers    | `json(user)`                                           |
| Framework integration | None                  | Requires connectors         | Hooks                      | Lightweight direct hooks                               |

</div>

## ⚡ The Power of Dynamics: Code Examples

Let's see how a Dynamics System makes development more intuitive:

```typescript
import { store, computed, onUpdate, json, diff } from "jods";

// Create a reactive store
const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  age: 36,
  department: "FBI",
});

// Add a computed property - recalculates only when dependencies change
user.fullName = computed(() => `${user.firstName} ${user.lastName}`);

// Subscribe to changes with both new and old state
onUpdate(user, (newState, oldState) => {
  console.log("Previous state:", json(oldState));
  console.log("Current state:", json(newState));

  // Agent Macklin investigates the changes with diff()
  const changes = diff(oldState, newState);
  console.log("Agent Macklin's case file:", changes);
  console.log(
    "Macklin: 'I've identified all the changes. Just as I suspected!'"
  );
});
// Make changes directly - feels like regular JavaScript!
user.firstName = "FBI Agent";
// Logs:
// Previous state: {
//   firstName: 'Burt',
//   lastName: 'Macklin',
//   age: 36,
//   department: 'FBI',
//   fullName: 'Burt Macklin'
// }
// Current state: {
//   firstName: 'FBI Agent',
//   lastName: 'Macklin',
//   age: 36,
//   department: 'FBI',
//   fullName: 'FBI Agent Macklin'
// }
// Agent Macklin's case file: {
//   firstName: { from: 'Burt', to: 'FBI Agent' },
//   fullName: { from: 'Burt Macklin', to: 'FBI Agent Macklin' }
// }
// Macklin: 'I've identified all the changes. Just as I suspected!'

// Multiple properties can be changed in a single update
Object.assign(user, {
  lastName: "Macklin Jr.",
  age: 37,
  department: "Special Agent Division",
});
// The diff() will show all changes at once, and computed properties update automatically
```

## 🦋 Dynamic Adaptability

A key aspect of a Dynamics System is its ability to adapt to how developers and AI work together 🧑‍💻🤖. As AI becomes increasingly important for code generation and maintenance, jods provides a model that:

1. **🤖 Works with AI coding**: Predictable patterns make it easy for AI tools to understand and modify
2. **📝 Requires minimal boilerplate**: Focus on business logic, not plumbing
3. **⚡ Integrates anywhere**: Works with React, Preact, Remix, or vanilla JS
4. **🔍 Makes debugging easy**: Time-travel debugging with `history(store)`
5. **🧩 Composes naturally**: Build complex state by combining simple pieces

## 🏗️ Dynamics in a Full-Stack Context

In a full-stack application, particularly with frameworks like Remix, a Dynamics System serves as the perfect bridge between server and client state:

```js
// Define a model once with jods/remix
export const todoStore = defineStore({
  name: "todos",
  schema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean(),
      })
    ),
    filter: z.enum(["all", "active", "completed"]),
  }),
  // Server-side handler
  handlers: {
    async addTodo({ current, form }) {
      return {
        ...current,
        items: [
          ...current.items,
          {
            id: crypto.randomUUID(),
            text: form.get("text"),
            completed: false,
          },
        ],
      };
    },
  },
});

// Use in component with the same simple API
function TodoApp() {
  const todos = useJodsStore(todoStore);
  const form = useJodsForm(todoStore.actions.addTodo);

  return (
    <div>
      <form {...form.props}>
        <input name="text" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.items.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => (item.completed = !item.completed)}
            />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🤝 Why "Dynamics" Matters for AI Collaboration 🤖 🧠

In the age of AI-assisted coding, the Dynamics System approach unlocks new possibilities. When you and AI tools collaborate on code, jods provides a mental model that:

- 🗣️ Is easy to explain to AI ("update this state directly")
- 💻 Is easy for AI to generate correct code for
- 📉 Minimizes boilerplate that AI has to generate
- 🔄 Provides consistent patterns that AI can understand and maintain
- 🧩 Allows AI to focus on business logic, not state plumbing

## 🌟 A living model of your application

A **Dynamics System** is more than just a state container - it's a living model of your application that reacts, computes, and synchronizes automatically. By embracing the natural way JavaScript works while adding reactivity and computed values, jods creates a development experience that is both simpler and more powerful.

The days of complex state management are coming to an end. 🎬

👋 Welcome to the era of Dynamics Systems, where your objects come alive. 🐿️ 🦆
