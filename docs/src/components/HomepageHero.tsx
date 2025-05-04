import React, { useEffect, useRef, useState } from "react";
import Link from "@docusaurus/Link";
import useIsBrowser from "@docusaurus/useIsBrowser";

export default function HomepageHero(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isBrowser = useIsBrowser();
  const elementsRef = useRef<HTMLDivElement[]>([]);
  const firefliesRef = useRef<HTMLDivElement[]>([]);
  const [colorMode, setColorMode] = useState<"dark" | "light">("light");

  // Detect color mode on client side
  useEffect(() => {
    if (isBrowser) {
      // Check if dark mode is enabled
      const isDarkMode = document.documentElement.dataset.theme === "dark";
      setColorMode(isDarkMode ? "dark" : "light");

      // Listen for theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "data-theme") {
            const newTheme =
              document.documentElement.dataset.theme === "dark"
                ? "dark"
                : "light";
            setColorMode(newTheme);
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });

      return () => observer.disconnect();
    }
  }, [isBrowser]);

  const toggleAnimation = () => {
    setIsPaused((prev) => {
      const newState = !prev;

      if (containerRef.current) {
        const elements = containerRef.current.querySelectorAll<HTMLDivElement>(
          ".json-animation, .firefly"
        );
        elements.forEach((el) => {
          if (newState) {
            // Pause by storing current animation state
            el.style.animationPlayState = "paused";
          } else {
            // Resume animation
            el.style.animationPlayState = "running";
          }
        });
      }

      return newState;
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Create animated JSON elements
    const container = containerRef.current;
    const jsonSnippets = [
      '{ "name": "jods" }',
      '{ "reactive": true }',
      '{ "dynamic": true }',
      '{ "size": "tiny" }',
      '{ "computed": () => {} }',
      '{ "frameworks": ["remix", "react", "preact"] }',
      '{ "🐿️": "🦆" }',
      '{ "agent": "Burt Macklin, FBI" }',
      '{ "threat_level": "Midnight" }',
      '{ "agent": "Michael Scarn" }',
      '{ "time_travel": true }',
      '{ "history": ["past", "present", "future"] }',
      '{ "state": "reactive", "mood": "happy" }',
      '{ "debug": { "level": "over 9000" } }',
      '{ "zod": "schema", "validation": "✅" }',
    ];

    // Create JSON floating elements
    const elements: HTMLDivElement[] = [];
    const fireflies: HTMLDivElement[] = [];

    // Number of elements to create
    const numElements = 16;
    const numFireflies = 24;

    // Create a virtual grid for initial positioning
    const gridRows = 4;
    const gridCols = 4;

    // Used snippets tracker to avoid duplicates in nearby cells
    const usedIndices = new Set<number>();

    // Colors for the dream effect
    const darkModeColors = [
      "rgba(110, 231, 183, 0.8)", // teal
      "rgba(129, 140, 248, 0.8)", // indigo
      "rgba(251, 146, 60, 0.8)", // orange
      "rgba(236, 72, 153, 0.8)", // pink
      "rgba(139, 92, 246, 0.8)", // purple
      "rgba(52, 211, 153, 0.8)", // emerald
    ];

    const lightModeColors = [
      "rgba(6, 182, 212, 0.9)", // cyan
      "rgba(16, 185, 129, 0.9)", // green
      "rgba(236, 72, 153, 0.9)", // pink
      "rgba(79, 70, 229, 0.9)", // indigo
      "rgba(245, 158, 11, 0.9)", // amber
      "rgba(139, 92, 246, 0.9)", // purple
    ];

    // Choose color palette based on current theme
    const colors = colorMode === "dark" ? darkModeColors : lightModeColors;

    // Create fireflies first
    for (let i = 0; i < numFireflies; i++) {
      const firefly = document.createElement("div");
      firefly.className = "firefly";

      // Random position throughout the container
      firefly.style.top = `${Math.random() * 100}%`;
      firefly.style.left = `${Math.random() * 100}%`;

      // Random size (small)
      const size = Math.random() * 6 + 3; // 3-9px
      firefly.style.width = `${size}px`;
      firefly.style.height = `${size}px`;

      // Random color
      const colorIndex = Math.floor(Math.random() * colors.length);
      const color = colors[colorIndex].replace(
        /rgba\((\d+), (\d+), (\d+), [\d\.]+\)/,
        (_, r, g, b) => `rgba(${r}, ${g}, ${b}, 0.7)`
      );
      firefly.style.backgroundColor = color;
      firefly.style.boxShadow = `0 0 ${
        size * 2
      }px ${color}, 0 0 ${size}px ${color}`;

      // Animation parameters for graceful movement
      const duration = Math.random() * 50 + 40; // 40-90s for very slow movement
      const delay = Math.random() * 10;

      firefly.style.animationDuration = `${duration}s, ${
        Math.random() * 6 + 4
      }s`;
      firefly.style.animationDelay = `${delay}s, ${delay}s`;
      firefly.style.animationName = "firefly-path, firefly-glow";

      container.appendChild(firefly);
      fireflies.push(firefly);
    }

    // Now create text elements
    for (let i = 0; i < numElements; i++) {
      const element = document.createElement("div");
      element.className = "json-animation";

      // Calculate grid position for initial placement
      const row = Math.floor(i / gridCols);
      const col = i % gridCols;

      // Add some randomness within the cell
      const cellWidth = 100 / gridCols;
      const cellHeight = 100 / gridRows;

      // Position within the cell
      const xPos =
        cellWidth * col + cellWidth * 0.1 + Math.random() * cellWidth * 0.8;
      const yPos =
        cellHeight * row + cellHeight * 0.1 + Math.random() * cellHeight * 0.8;

      element.style.fontSize = `${Math.random() * 0.5 + 1}rem`;
      element.style.top = `${yPos}%`;
      element.style.left = `${xPos}%`;

      // Make it more faded by reducing opacity and adding overlay
      element.style.opacity = (0.2 + Math.random() * 0.3).toString(); // 0.2 to 0.5 opacity

      // Select a color for the element
      const colorIndex = Math.floor(Math.random() * colors.length);
      element.style.color = colors[colorIndex];

      // Make shadow more subtle
      element.style.textShadow = `0 0 8px ${colors[colorIndex].replace(
        ")",
        ", 0.2)"
      )}, 
                                  0 0 15px ${colors[colorIndex].replace(
                                    ")",
                                    ", 0.1)"
                                  )}`;

      // Select a snippet that hasn't been used recently
      let snippetIndex;
      do {
        snippetIndex = Math.floor(Math.random() * jsonSnippets.length);
      } while (
        usedIndices.has(snippetIndex) &&
        usedIndices.size < jsonSnippets.length / 2
      );

      usedIndices.add(snippetIndex);
      // Keep the set limited to recent snippets
      if (usedIndices.size > 5) {
        usedIndices.delete([...usedIndices][0]);
      }

      element.innerHTML = jsonSnippets[snippetIndex];

      // More graceful, dreamscape animation
      const duration = Math.random() * 40 + 50; // 50-90s for very slow movement
      const delay = Math.random() * 15; // 0-15s

      element.style.animationDuration = `${duration}s, ${
        Math.random() * 20 + 15
      }s, ${Math.random() * 25 + 15}s`;
      element.style.animationDelay = `${delay}s, ${delay}s, ${delay}s`;

      // Use multiple animations for dreamlike effect
      element.style.animationName = "text-float, text-fade, text-rotate";
      element.style.animationTimingFunction =
        "ease-in-out, ease-in-out, ease-in-out";
      element.style.animationIterationCount = "infinite, infinite, infinite";
      element.style.animationDirection = "alternate, alternate, normal";

      // Add 3D transform for depth
      element.style.transform = `perspective(1000px) rotateX(${
        Math.random() * 10 - 5
      }deg) rotateY(${Math.random() * 10 - 5}deg)`;

      container.appendChild(element);
      elements.push(element);
    }

    // Add CSS animations if they don't exist yet
    if (!document.getElementById("json-animations-css")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "json-animations-css";
      styleSheet.textContent = `
        /* Dreamscape text animations */
        @keyframes text-float {
          0% { transform: translate(0, 0) perspective(1000px) rotateX(0deg) rotateY(0deg); }
          25% { transform: translate(${Math.random() * 5 - 2.5}vw, ${
        Math.random() * 5 - 2.5
      }vh) perspective(1000px) rotateX(${Math.random() * 10 - 5}deg) rotateY(${
        Math.random() * 10 - 5
      }deg); }
          50% { transform: translate(${Math.random() * 5 - 2.5}vw, ${
        Math.random() * 5 - 2.5
      }vh) perspective(1000px) rotateX(${Math.random() * 10 - 5}deg) rotateY(${
        Math.random() * 10 - 5
      }deg); }
          75% { transform: translate(${Math.random() * 5 - 2.5}vw, ${
        Math.random() * 5 - 2.5
      }vh) perspective(1000px) rotateX(${Math.random() * 10 - 5}deg) rotateY(${
        Math.random() * 10 - 5
      }deg); }
          100% { transform: translate(0, 0) perspective(1000px) rotateX(0deg) rotateY(0deg); }
        }
        
        @keyframes text-fade {
          0% { opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { opacity: 0.2; }
        }
        
        @keyframes text-rotate {
          0% { transform: rotate(-1deg); }
          100% { transform: rotate(1deg); }
        }
        
        /* Firefly animations */
        @keyframes firefly-path {
          0% { transform: translate(0, 0) scale(1); }
          10% { transform: translate(${Math.random() * 20 - 10}vw, ${
        Math.random() * 20 - 10
      }vh) scale(0.8); }
          20% { transform: translate(${Math.random() * 30 - 15}vw, ${
        Math.random() * 10 - 5
      }vh) scale(1.2); }
          30% { transform: translate(${Math.random() * 20 - 10}vw, ${
        Math.random() * 20 - 10
      }vh) scale(0.9); }
          40% { transform: translate(${Math.random() * 30 - 15}vw, ${
        Math.random() * 20 - 10
      }vh) scale(1.1); }
          50% { transform: translate(${Math.random() * 30 - 15}vw, ${
        Math.random() * 30 - 15
      }vh) scale(1); }
          60% { transform: translate(${Math.random() * 20 - 10}vw, ${
        Math.random() * 20 - 10
      }vh) scale(0.8); }
          70% { transform: translate(${Math.random() * 30 - 15}vw, ${
        Math.random() * 10 - 5
      }vh) scale(1.2); }
          80% { transform: translate(${Math.random() * 20 - 10}vw, ${
        Math.random() * 20 - 10
      }vh) scale(0.9); }
          90% { transform: translate(${Math.random() * 15 - 7.5}vw, ${
        Math.random() * 15 - 7.5
      }vh) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        @keyframes firefly-glow {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
        
        .firefly {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 10;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: blur(1px);
        }
        
        .json-animation {
          position: absolute;
          pointer-events: none;
          z-index: 5;
          transition: all 0.3s ease;
          filter: blur(0.5px);
        }
        
        .animation-control-button {
          position: absolute;
          bottom: 15px;
          right: 15px;
          z-index: 100;
          background: ${
            colorMode === "dark"
              ? "rgba(30, 30, 30, 0.6)"
              : "rgba(240, 240, 240, 0.6)"
          };
          border: 1px solid ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)"
          };
          color: ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)"
          };
          backdrop-filter: blur(5px);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .animation-control-button:hover {
          background: ${
            colorMode === "dark"
              ? "rgba(40, 40, 40, 0.8)"
              : "rgba(230, 230, 230, 0.8)"
          };
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .animation-control-button svg {
          margin-right: 6px;
        }
        
        .hero-container {
          position: relative;
          overflow: hidden;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    elementsRef.current = elements;
    firefliesRef.current = fireflies;

    // Additional dreamscape effect with subtle movement
    animationRef.current = setInterval(() => {
      if (isPaused) return;

      // Subtle changes to maintain dreamlike quality for text
      elements.forEach((element) => {
        const currentOpacity = parseFloat(element.style.opacity || "0.3");
        const opacityChange = Math.random() * 0.1 - 0.05; // -0.05 to 0.05
        const newOpacity = Math.max(
          0.1,
          Math.min(0.5, currentOpacity + opacityChange)
        );
        element.style.opacity = newOpacity.toString();
      });

      // More dynamic changes for fireflies
      fireflies.forEach((firefly) => {
        const currentOpacity = parseFloat(firefly.style.opacity || "0.5");
        const opacityChange = Math.random() * 0.3 - 0.15; // -0.15 to 0.15
        const newOpacity = Math.max(
          0.2,
          Math.min(0.9, currentOpacity + opacityChange)
        );
        firefly.style.opacity = newOpacity.toString();

        // Occasionally change size slightly
        if (Math.random() > 0.7) {
          const size =
            parseFloat(firefly.style.width || "5") *
            (0.9 + Math.random() * 0.2);
          firefly.style.width = `${size}px`;
          firefly.style.height = `${size}px`;
        }
      });
    }, 2000); // Subtle changes every 2 seconds

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      [...elements, ...fireflies].forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      const styleElement = document.getElementById("json-animations-css");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [colorMode]);

  return (
    <div className="hero-container" ref={containerRef}>
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="gradient-text">💫 jods {}</span>
        </h1>
        <p className="hero-subtitle">
          <span className="gradient-text">✨</span> JavaScript Object Dynamics
          System 🔄
        </p>
        <p className="hero-description">
          A fun, intuitive reactive state library that makes JavaScript objects
          come alive
        </p>
        <div className="hero-buttons">
          <Link className="button button--primary button--lg" to="/intro">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to="/examples">
            See Examples
          </Link>
        </div>
      </div>

      {/* Accessibility: Animation control button */}
      <button
        onClick={toggleAnimation}
        className="animation-control-button"
        aria-label={isPaused ? "Play animations" : "Pause animations"}
        title={isPaused ? "Play animations" : "Pause animations"}
      >
        {isPaused ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Pause
          </>
        )}
      </button>
    </div>
  );
}
