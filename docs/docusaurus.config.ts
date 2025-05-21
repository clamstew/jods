import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "{ jods }",
  tagline:
    "JavaScript Object Dynamics System - A fun, intuitive reactive state library",
  favicon: "img/favicon/light/favicon-light-32.png", // Default favicon, will be replaced by JS

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
    locales: ["en", "fr", "es"],
  },

  // Basic favicon setup - our JavaScript will handle theme switching
  headTags: [
    // SVG favicon - default without media query
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/svg+xml",
        href: "/jods/img/favicon/light/favicon-light.svg",
      },
    },
    // Dark mode SVG with media query
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/svg+xml",
        href: "/jods/img/favicon/dark/favicon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    },
    // Light mode SVG with media query
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/svg+xml",
        href: "/jods/img/favicon/light/favicon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
    },
    // Apple touch icon
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        href: "/jods/img/favicon/light/favicon-light-180.png",
        media: "(prefers-color-scheme: light)",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        href: "/jods/img/favicon/dark/favicon-dark-180.png",
        media: "(prefers-color-scheme: dark)",
      },
    },
    // Standard sizes with media queries
    // 16x16
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/jods/img/favicon/light/favicon-light-16.png",
        media: "(prefers-color-scheme: light)",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/jods/img/favicon/dark/favicon-dark-16.png",
        media: "(prefers-color-scheme: dark)",
      },
    },
    // 32x32
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/jods/img/favicon/light/favicon-light-32.png",
        media: "(prefers-color-scheme: light)",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/jods/img/favicon/dark/favicon-dark-32.png",
        media: "(prefers-color-scheme: dark)",
      },
    },
  ],

  // Add script for dynamic favicon switching
  scripts: [
    {
      src: "/jods/js/favicon-switch.js",
      async: true,
    },
  ],

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
          onUntruncatedBlogPosts: "ignore",
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
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/clamstew/jods",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "typescript", "jsx", "tsx"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
