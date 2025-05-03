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
      type: "category",
      label: "💿 Remix Integration",
      items: [
        "remix/index",
        "remix/migration-guide",
        "remix/common-patterns",
        "remix/performance-tips",
        "remix/api-reference",
      ],
    },
    {
      type: "doc",
      id: "maintainers-guide",
      label: "🛠️ Maintainer's Guide",
    },
  ],
};

export default sidebars;
