---
sidebar_position: 1
title: About jods
description: History and motivation behind the jods library
---

# ✨ About jods

**jods (JavaScript Object Dynamics System)** is a fun, intuitive reactive state library that makes JavaScript objects come alive. It emphasizes simplicity and composability while providing powerful state management capabilities.

🤔 What is a [Dynamics System](./dynamics-system)?

## 🧭 Core Philosophy

jods was built around a few fundamental beliefs:

1. **🔍 Simplicity Matters**: State management shouldn't require complex mental models
2. **🖋️ Direct Manipulation**: Mutating state directly is intuitive and straightforward
3. **🌐 Framework Agnostic**: Core reactivity should work without framework dependencies
4. **🧩 Composition Over Configuration**: Combine small, focused pieces instead of monolithic patterns
5. **☁️ Zero Dependencies**: Keep the library small and focused

## 📜 History

jods was created by [clamstew](https://github.com/clamstew) in early 2025. What began as a name registration on npm (😅) quickly evolved into a full-featured reactive state library incorporating ideas from various state management approaches (🤯):

- 🔄 The proxy-based reactivity from Vue
- 🧠 The simplicity of Zustand's API
- ⚡ The fine-grained updates of Signal-based systems
- 🚀 The server integration capabilities of Remix

The project went from concept to implementation in under two weeks, with the addition of React, Preact, and Remix integrations showing the versatility of the core reactive system. The development process was accelerated through the thoughtful application of AI tools like LLMs and Cursor, while maintaining high code quality and developer experience standards.

## 🤔 Why Another State Library?

With so many state management options available, you might wonder why jods needed to exist. The answer lies in its unique combination of features:

- 📷 **JSON Snapshots**: First-class support for getting serializable snapshots
- 🧮 **Computed Values**: Built-in support for reactive computed properties
- ✏️ **Direct Mutations**: No actions, reducers, or immutable patterns required
- 🔌 **Framework Integration**: Deep integrations with React, Preact, and Remix
- ⚡ **Fine-Grained Reactivity**: Signal-based tracking for optimal performance
- 🌉 **Server + Client**: Bridges the gap between server and client state

For Remix users in particular, jods provides a model-oriented approach that combines schema validation, server-side data loading, form handling, and client-side reactivity in a cohesive package.

[See how jods compares to other state management libraries →](/#compare)

## 🤝 Contributing

jods is open to contributions! Check out our [contribution guidelines](https://github.com/clamstew/jods/blob/main/CONTRIBUTING.md) to get started.

## 👨‍💻 Creator

**clamstew** is a software developer with a passion for creating intuitive developer experiences.

<div className="social-links">
  <a href="https://github.com/clamstew" target="_blank" rel="noopener noreferrer" className="social-link github-link">
    <span className="social-icon github-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 250" preserveAspectRatio="xMidYMid" style={{color: 'var(--ifm-color-primary)'}}><path fill="currentColor" d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46 6.397 1.185 8.746-2.777 8.746-6.158 0-3.052-.12-13.135-.174-23.83-35.61 7.742-43.124-15.103-43.124-15.103-5.823-14.795-14.213-18.73-14.213-18.73-11.613-7.944.876-7.78.876-7.78 12.853.902 19.621 13.19 19.621 13.19 11.417 19.568 29.945 13.911 37.249 10.64 1.149-8.272 4.466-13.92 8.127-17.116-28.431-3.236-58.318-14.212-58.318-63.258 0-13.975 5-25.394 13.188-34.358-1.329-3.224-5.71-16.242 1.24-33.874 0 0 10.749-3.44 35.21 13.121 10.21-2.836 21.16-4.258 32.038-4.307 10.878.049 21.837 1.47 32.066 4.307 24.431-16.56 35.165-13.12 35.165-13.12 6.967 17.63 2.584 30.65 1.255 33.873 8.207 8.964 13.173 20.383 13.173 34.358 0 49.163-29.944 59.988-58.447 63.157 4.591 3.972 8.682 11.762 8.682 23.704 0 17.126-.148 30.91-.148 35.126 0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002 256 57.307 198.691 0 128.001 0Zm-80.06 182.34c-.282.636-1.283.827-2.194.39-.929-.417-1.45-1.284-1.15-1.922.276-.655 1.279-.838 2.205-.399.93.418 1.46 1.293 1.139 1.931Zm6.296 5.618c-.61.566-1.804.303-2.614-.591-.837-.892-.994-2.086-.375-2.66.63-.566 1.787-.301 2.626.591.838.903 1 2.088.363 2.66Zm4.32 7.188c-.785.545-2.067.034-2.86-1.104-.784-1.138-.784-2.503.017-3.05.795-.547 2.058-.055 2.861 1.075.782 1.157.782 2.522-.019 3.08Zm7.304 8.325c-.701.774-2.196.566-3.29-.49-1.119-1.032-1.43-2.496-.726-3.27.71-.776 2.213-.558 3.315.49 1.11 1.03 1.45 2.505.701 3.27Zm9.442 2.81c-.31 1.003-1.75 1.459-3.199 1.033-1.448-.439-2.395-1.613-2.103-2.626.301-1.01 1.747-1.484 3.207-1.028 1.446.436 2.396 1.602 2.095 2.622Zm10.744 1.193c.036 1.055-1.193 1.93-2.715 1.95-1.53.034-2.769-.82-2.786-1.86 0-1.065 1.202-1.932 2.733-1.958 1.522-.03 2.768.818 2.768 1.868Zm10.555-.405c.182 1.03-.875 2.088-2.387 2.37-1.485.271-2.861-.365-3.05-1.386-.184-1.056.893-2.114 2.376-2.387 1.514-.263 2.868.356 3.061 1.403Z"></path></svg>
    </span>
    <span>GitHub</span>
  </a>
  
  <a href="https://x.com/clay_stewart" target="_blank" rel="noopener noreferrer" className="social-link">
    <span className="social-icon">𝕏</span>
    <span>X / Twitter</span>
  </a>
  
  <a href="https://www.linkedin.com/in/claystewart/" target="_blank" rel="noopener noreferrer" className="social-link">
    <span className="social-icon">🔗</span>
    <span>LinkedIn</span>
  </a>
</div>

<style jsx>{`
  .social-links {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 20px;
  }
  
  .social-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    text-decoration: none !important;
    transition: all 0.3s ease;
    font-weight: 500;
    color: var(--ifm-font-color-base);
    background-color: var(--ifm-color-emphasis-100);
  }
  
  .social-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  html[data-theme='dark'] .social-link {
    background-color: var(--ifm-color-emphasis-200);
  }
  
  html[data-theme='dark'] .social-link:hover {
    background-color: var(--ifm-color-emphasis-300);
  }
  
  .social-icon {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
  }
  
  .github-icon svg {
    color: var(--ifm-color-primary);
  }
  
  .github-link:hover .github-icon svg {
    color: #333;
  }
  
  html[data-theme='dark'] .github-link:hover .github-icon svg {
    color: #fff;
  }
`}</style>
