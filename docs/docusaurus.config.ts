import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "jods",
  tagline:
    "JavaScript Object Dynamics System - A fun, intuitive reactive state library",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://clamstew.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/jods/",

  // GitHub pages deployment config.
  organizationName: "clamstew", // Your GitHub username
  projectName: "jods", // Your repo name
  trailingSlash: false,
  deploymentBranch: "gh-pages",

  // Important: always use "warn" instead of "throw" for broken links
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/", // Serve docs at the site's root
          path: "docs",
          editUrl: "https://github.com/clamstew/jods/tree/main/docs/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          editUrl: "https://github.com/clamstew/jods/tree/main/docs/",
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "jods",
      logo: {
        alt: "jods Logo with Squirrel and Duck",
        src: "img/simple-jods-mascots-logo.png", // Using the squirrel and duck illustration
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "jodsSidebar",
          position: "left",
          label: "Docs",
        },
        { to: "/blog", label: "Blog", position: "left" },
        { to: "/about", label: "About", position: "left" },
        {
          href: "https://github.com/clamstew/jods",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "DOCUMENTATION",
          items: [
            {
              label: "📖 Getting Started",
              to: "/intro",
            },
            {
              label: "ℹ️ About jods",
              to: "/about",
            },
            {
              label: "🧩 API Reference",
              to: "/api-reference",
            },
          ],
        },
        {
          title: "COMMUNITY",
          items: [
            {
              label: "💬 Discussions",
              href: "https://github.com/clamstew/jods/discussions",
            },
            {
              label: "🐛 Issues",
              href: "https://github.com/clamstew/jods/issues",
            },
            {
              label: "👨‍💻 Creator",
              href: "https://x.com/clay_stewart",
            },
          ],
        },
        {
          title: "RESOURCES",
          items: [
            {
              label: "📝 Blog",
              to: "/blog",
            },
            {
              label: "🐙 GitHub",
              href: "https://github.com/clamstew/jods",
            },
            {
              label: "📦 npm",
              href: "https://www.npmjs.com/package/jods",
            },
          ],
        },
      ],
      copyright: `<div class="footer__signature">
        <div class="footer__mascots">🐿️ 🦆</div>
        <div class="footer__copyright">
          Built with <span class="footer__heart">♥</span> by <a href="https://github.com/clamstew">clamstew</a><br />
          Copyright © ${new Date().getFullYear()} jods contributors
        </div>
      </div>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "typescript", "jsx", "tsx"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
