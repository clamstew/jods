/**
 * Enhanced Favicon Switcher for Docusaurus
 * Watches both data-theme attribute and localStorage theme value
 */
(function () {
  // Only proceed if we detect the page was built with Docusaurus
  if (!document.querySelector('meta[content="Docusaurus"]')) {
    return;
  }

  // Icon mapping - defines all favicons and their paths in both themes
  const iconMapping = [
    {
      query: 'link[rel="icon"][sizes="16x16"]',
      dark: "/jods/img/favicon/dark/favicon-dark-16.png",
      light: "/jods/img/favicon/light/favicon-light-16.png",
    },
    {
      query: 'link[rel="icon"][sizes="32x32"]',
      dark: "/jods/img/favicon/dark/favicon-dark-32.png",
      light: "/jods/img/favicon/light/favicon-light-32.png",
    },
    {
      query: 'link[rel="icon"][type="image/svg+xml"]',
      dark: "/jods/img/favicon/dark/favicon-dark.svg",
      light: "/jods/img/favicon/light/favicon-light.svg",
    },
    {
      query: 'link[rel="apple-touch-icon"]',
      dark: "/jods/img/favicon/dark/favicon-dark-180.png",
      light: "/jods/img/favicon/light/favicon-light-180.png",
    },
    // Add a catch-all for React Helmet added icons
    {
      query: 'link[rel="icon"][data-rh="true"]',
      dark: "/jods/img/favicon/dark/favicon-dark-32.png", // Default to 32px
      light: "/jods/img/favicon/light/favicon-light-32.png",
    },
  ];

  // Function to update all favicons based on theme
  function updateFavicons(isDarkMode) {
    // Find both non-media query favicon links and data-rh favicon links
    iconMapping.forEach((icon) => {
      // Handle standard links without media attribute
      const elements = document.querySelectorAll(`${icon.query}:not([media])`);
      if (elements.length > 0) {
        elements.forEach((element) => {
          const newPath = isDarkMode ? icon.dark : icon.light;
          if (element.getAttribute("href") !== newPath) {
            element.setAttribute("href", newPath);
          }
        });
      }

      // Also handle links with data-rh attribute that might be added by React Helmet
      const rhElements = document.querySelectorAll(
        `link[rel="icon"][data-rh="true"]`
      );
      if (rhElements.length > 0) {
        rhElements.forEach((element) => {
          // Determine appropriate path based on sizes or default to 32px
          const size = element.getAttribute("sizes");
          let newPath;

          if (size === "16x16") {
            newPath = isDarkMode
              ? "/jods/img/favicon/dark/favicon-dark-16.png"
              : "/jods/img/favicon/light/favicon-light-16.png";
          } else if (element.getAttribute("type") === "image/svg+xml") {
            newPath = isDarkMode
              ? "/jods/img/favicon/dark/favicon-dark.svg"
              : "/jods/img/favicon/light/favicon-light.svg";
          } else {
            // Default to 32px
            newPath = isDarkMode
              ? "/jods/img/favicon/dark/favicon-dark-32.png"
              : "/jods/img/favicon/light/favicon-light-32.png";
          }

          if (element.getAttribute("href") !== newPath) {
            element.setAttribute("href", newPath);
          }
        });
      }
    });
  }

  // Check if system uses dark mode
  function isSystemDarkMode() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  // Get current theme state - prioritizes localStorage over data-theme over system preference
  function isDarkModeActive() {
    // First check localStorage (Docusaurus's primary storage method)
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      return storedTheme === "dark";
    }

    // Then check explicit theme setting on HTML element
    const dataTheme = document.documentElement.getAttribute("data-theme");
    if (dataTheme) {
      return dataTheme === "dark";
    }

    // Fall back to system preference if no explicit theme
    return isSystemDarkMode();
  }

  // Watch for theme changes using MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme") {
        updateFavicons(isDarkModeActive());
      }
    });
  });

  // Start observing theme changes on HTML element
  observer.observe(document.documentElement, { attributes: true });

  // Also observe head for new favicon elements (for React Helmet)
  const headObserver = new MutationObserver((mutations) => {
    let shouldUpdate = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        // Check if any added nodes are favicon links
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            node.tagName === "LINK" &&
            node.getAttribute("rel") === "icon"
          ) {
            shouldUpdate = true;
          }
        });
      }
    });

    if (shouldUpdate) {
      updateFavicons(isDarkModeActive());
    }
  });

  // Start observing head for new elements
  headObserver.observe(document.head, { childList: true, subtree: true });

  // Watch for localStorage changes
  window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
      updateFavicons(isDarkModeActive());
    }
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Modern browsers: use addEventListener
    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", (e) => {
        // Only update if site is using system theme
        if (
          !localStorage.getItem("theme") &&
          !document.documentElement.getAttribute("data-theme")
        ) {
          updateFavicons(e.matches);
        }
      });
    }
    // Fallback for older browsers
    else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener((e) => {
        if (
          !localStorage.getItem("theme") &&
          !document.documentElement.getAttribute("data-theme")
        ) {
          updateFavicons(e.matches);
        }
      });
    }
  }

  // Initial update after DOM is fully loaded
  window.addEventListener("DOMContentLoaded", () => {
    updateFavicons(isDarkModeActive());
  });

  // Run periodically to catch React Helmet updates
  setInterval(() => {
    updateFavicons(isDarkModeActive());
  }, 1000);

  // Backup - also run after a short delay to catch late DOM changes
  setTimeout(() => {
    updateFavicons(isDarkModeActive());
  }, 500);

  // Force favicon reload when tab becomes visible again
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateFavicons(isDarkModeActive());
    }
  });
})();
