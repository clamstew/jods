import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Define a manual sidebar structure
  jodsSidebar: [
    {
      type: "doc",
      id: "about",
      label: "✨ About jods",
    },
    {
      type: "doc",
      id: "intro",
      label: "🚀 Introduction",
    },
    {
      type: "doc",
      id: "api-reference",
      label: "📚 API Reference",
    },
    {
      type: "doc",
      id: "examples",
      label: "💡 Examples",
    },
    {
      type: "doc",
      id: "time-travel-debugging",
      label: "🕰️ Time-Travel Debugging",
    },
    {
      type: "doc",
      id: "time-travel-debugging-old",
      label: "🕰️ Time-Travel Debugging (Old)",
    },
    {
      type: "doc",
      id: "state-persistence",
      label: "💾 State Persistence",
    },
    {
      type: "doc",
      id: "storage-adapters",
      label: "🗄️ Storage Adapters",
    },
    {
      type: "doc",
      id: "fine-grained-reactivity",
      label: "🧬 Fine-Grained Reactivity",
    },
    {
      type: "doc",
      id: "batch",
      label: "🔋 Batch Updates",
    },
    {
      type: "category",
      label: "🔄 sync",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "sync/framework-integration",
          label: "🔌 Framework Integration",
        },
        {
          type: "doc",
          id: "sync/framework-usage",
          label: "🛠️ Framework Usage",
        },
        {
          type: "doc",
          id: "sync/framework-examples",
          label: "🖼️ Framework Examples",
        },
        {
          type: "doc",
          id: "sync/api-reference",
          label: "📚 API Reference",
        },
      ],
    },
    {
      type: "doc",
      id: "guides/framework-integrations",
      label: "🔌 Framework Integrations",
    },
    {
      type: "category",
      label: "💿 Remix Integration",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "remix/index",
          label: "🌐 Overview",
        },
        {
          type: "doc",
          id: "remix/useJods",
          label: "🪝 useJods - Unified Hook",
        },
        {
          type: "doc",
          id: "remix/migration-guide",
          label: "🔄 Migration Guide",
        },
        {
          type: "doc",
          id: "remix/common-patterns",
          label: "🧩 Common Patterns",
        },
        {
          type: "doc",
          id: "remix/performance-tips",
          label: "⚡ Performance Tips",
        },
        {
          type: "doc",
          id: "remix/api-reference",
          label: "📚 API Reference",
        },
      ],
    },
  ],
};

export default sidebars;
