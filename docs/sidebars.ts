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
    {
      type: "doc",
      id: "maintainers-guide",
      label: "🛠️ Maintainer's Guide",
    },
    {
      type: "category",
      label: "🎨 Design Iterations",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "design-iterations/index",
          label: "🌟 Overview",
        },
        {
          type: "doc",
          id: "design-iterations/vision",
          label: "🔮 Vision",
        },
        {
          type: "doc",
          id: "design-iterations/workflow",
          label: "🔄 Complete Workflow",
        },
        {
          type: "doc",
          id: "design-iterations/with-ai",
          label: "✨ With AI",
        },
        {
          type: "doc",
          id: "design-iterations/commands",
          label: "🔍 Command Reference",
        },
        {
          type: "doc",
          id: "design-iterations/feedback",
          label: "📝 Feedback System",
        },
        {
          type: "category",
          label: "📸 Screenshot System",
          collapsed: false,
          items: [
            {
              type: "doc",
              id: "design-iterations/screenshot-system/index",
              label: "📷 Overview",
            },
            {
              type: "doc",
              id: "design-iterations/screenshot-system/getting-started",
              label: "🚀 Getting Started",
            },
            {
              type: "doc",
              id: "design-iterations/screenshot-system/testid-guidelines",
              label: "🧩 TestID Guidelines",
            },
            {
              type: "doc",
              id: "design-iterations/screenshot-system/advanced",
              label: "⚙️ Advanced Usage",
            },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
