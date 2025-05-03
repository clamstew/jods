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
    "about",
    "intro",
    "api-reference",
    "examples",
    "time-travel-debugging",
    {
      type: "category",
      label: "Remix Integration",
      items: [
        "remix/index",
        "remix/migration-guide",
        "remix/common-patterns",
        "remix/performance-tips",
        "remix/api-reference",
      ],
    },
    "maintainers-guide",
  ],
};

export default sidebars;
