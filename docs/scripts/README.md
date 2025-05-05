# Website Screenshot Tools

This directory contains tools for generating full-page screenshots of the jods documentation website.

## Available Scripts

- `pnpm screenshot` - Takes screenshots using the default localhost:3000 URL
- `pnpm homepage:screenshot` - Explicitly takes screenshots from localhost:3000
- `pnpm production:screenshot` - Takes screenshots from the production site (jods.dev)

## How Screenshots Work

The script uses Playwright to:

1. Open a headless Chromium browser
2. Navigate to each configured page
3. Wait for the page to fully load (network idle)
4. Capture screenshots in both light and dark themes
5. Save the images to `/static/screenshots/[page-name]-[theme].png`

## Theme Toggling

The script automatically captures each page in both light and dark themes by:

1. Detecting the current theme
2. Clicking the theme toggle button when needed
3. Taking separate screenshots for each theme

## Customizing

To add additional pages to screenshot, edit the `PAGES` array in `scripts/screenshot.mjs`:

```js
const PAGES = [
  { path: "/", name: "homepage" },
  { path: "/intro", name: "intro" },
  { path: "/api-reference", name: "api-reference" },
  // Add your new page here
  { path: "/your-page", name: "your-page-name" },
];
```

## Path Handling

The script automatically detects whether to use `/jods` in the URL path:

- For localhost environments, it adds `/jods` to the path
- For production environments, it uses the base path

## Requirements

- Node.js (v16+)
- Playwright with Chromium installed

## Usage Example

To take screenshots of the locally running site:

```bash
# Start the dev server
pnpm start

# Open another terminal and run
pnpm homepage:screenshot
```

The screenshots will be saved to the `/static/screenshots` directory with naming pattern `[page-name]-[theme].png`.
