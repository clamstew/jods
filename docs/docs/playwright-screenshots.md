---
sidebar_position: 7
---

# 📸 Documentation Screenshots

This guide explains how to use Playwright to generate consistent, automated screenshots of the jods documentation site for review and marketing purposes.

## Overview

The documentation site includes a Playwright-based screenshot system that:

1. Captures full-page screenshots of key pages
2. Automatically captures both light and dark themes
3. Organizes screenshots in a standardized format
4. Works with both local development and production environments

## 📊 Available Commands

From the root project directory:

```bash
# Take screenshots of the local development site
pnpm docs:screenshot:homepage

# Take screenshots of the production site
pnpm docs:screenshot:production
```

From the docs directory:

```bash
# Take screenshots of the local development site
pnpm homepage:screenshot

# Take screenshots of the production site
pnpm production:screenshot
```

## 📁 Screenshot Output

Screenshots are saved to:

```
docs/static/screenshots/
```

With the naming format:

```
[page-name]-[theme].png
```

For example:

- `homepage-light.png`
- `homepage-dark.png`
- `api-reference-light.png`
- `api-reference-dark.png`

## 🔧 How It Works

The screenshot system uses Playwright, a browser automation library, to:

1. Launch a headless Chromium browser
2. Navigate to each configured page
3. Toggle between light and dark themes using the site's theme toggle button
4. Take full-page screenshots in both themes
5. Save the images with standardized naming

## ⚙️ Configuration

The screenshot system is configured in `docs/scripts/screenshot.mjs`.

### Adding New Pages

To add a new page to the screenshot list, edit the `PAGES` array:

```js
const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/intro", name: "intro" },
  { path: "/api-reference", name: "api-reference" },
  // Add your new page here
  { path: "/your-page", name: "your-page-name" },
];
```

### Path Handling

The system automatically handles path prefixes:

- For localhost environments, it adds `/jods` to the URLs
- For production environments, it uses the base path

### Theme Detection

The system automatically detects and toggles between light and dark themes by:

1. Reading the `data-theme` attribute from the document
2. Clicking the theme toggle button when needed
3. Waiting for the theme transition to complete

## 🤔 Troubleshooting

If the screenshot system encounters issues:

1. **Connection Issues**: Make sure the documentation site is running locally before taking screenshots
2. **Theme Toggle Issues**: The system uses multiple selectors to find the theme toggle button, but if the site structure changes, you may need to update the selectors in `screenshot.mjs`
3. **Missing Pages**: Verify that the URLs in the `PAGES` array match the actual site structure

## 🔄 CI/CD Integration

Currently, screenshots must be taken manually. For future CI/CD integration:

1. Add a GitHub Action that generates screenshots on PR
2. Compare screenshots to detect visual regressions
3. Store screenshot history for reference

## 📱 Responsive Screenshots

Currently, screenshots are taken at a fixed desktop viewport (1280×800). To add responsive screenshots:

1. Add a viewport configuration to the `PAGES` array
2. Create separate screenshot functions for each viewport size
3. Add a naming convention that includes the viewport size

## 🧠 Best Practices

1. Take screenshots after significant UI changes
2. Include screenshots in PR descriptions for visual reviews
3. Use screenshots for marketing materials and documentation updates
4. Store screenshot sets for each major release for reference

## 🔗 Related Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Docusaurus Theming System](https://docusaurus.io/docs/styling-layout#theme)
- [jods Maintainer's Guide](./maintainers-guide)
