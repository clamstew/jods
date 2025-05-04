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
  const emojisRef = useRef<HTMLDivElement[]>([]);
  const [colorMode, setColorMode] = useState<"dark" | "light">("light");
  const [mascotsInteracting, setMascotsInteracting] = useState(false);

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
          ".json-animation, .firefly, .hero__mascot"
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

        // Reset mascot interaction when pausing
        if (newState) {
          setMascotsInteracting(false);
        }
      }

      return newState;
    });
  };

  // Function to correctly handle speech bubble orientations
  const handleMascotHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const transform = window.getComputedStyle(element).transform;

    // If mascot is flipped, make sure speech bubble faces the right direction
    const speechBubble = element.querySelector(
      ".speech-bubble"
    ) as HTMLDivElement;
    if (speechBubble) {
      // Check if the mascot is flipped (rotateY around 180deg)
      if (
        transform.includes("matrix") &&
        transform.split(",")[0].includes("-")
      ) {
        // If mascot is flipped, counter-rotate the speech bubble
        speechBubble.style.transform = "rotateY(180deg)";
      } else {
        // If mascot is normal, keep speech bubble normal
        speechBubble.style.transform = "rotateY(0deg)";
      }
    }
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

    // Themed emojis related to reactive state
    const themeEmojis = [
      "⚛️", // atom/reactive
      "🔄", // refresh/update
      "✨", // sparkles/magic
      "🧩", // puzzle piece/composable
      "🔍", // search/computed values
      "⏱️", // timer/time-travel
      "🧠", // brain/state
      "⚡", // lightning/speed
      "📦", // package/store
      "💾", // disk/persistence
    ];

    // Create JSON floating elements
    const elements: HTMLDivElement[] = [];
    const fireflies: HTMLDivElement[] = [];
    const emojis: HTMLDivElement[] = [];

    // Number of elements to create
    const numElements = 16;
    const numFireflies = 24;
    const numEmojis = 10; // Fewer emojis to avoid making it too busy

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

    // Create faded emojis
    for (let i = 0; i < numEmojis; i++) {
      const emoji = document.createElement("div");
      emoji.className = "faded-emoji";

      // Random position throughout the container
      emoji.style.top = `${Math.random() * 100}%`;
      emoji.style.left = `${Math.random() * 100}%`;

      // Select a random emoji from the theme set
      const emojiIndex = Math.floor(Math.random() * themeEmojis.length);
      emoji.textContent = themeEmojis[emojiIndex];

      // Set a larger font size for the emojis
      emoji.style.fontSize = `${Math.random() * 2 + 2}rem`;

      // Very low opacity to keep them subtle
      emoji.style.opacity = (0.1 + Math.random() * 0.2).toString(); // 0.1 to 0.3 opacity

      // Add a blur effect to make them more ethereal
      emoji.style.filter = `blur(${Math.random() * 2 + 1}px)`;

      // Animation parameters for very slow, dreamlike movement
      const duration = Math.random() * 60 + 60; // 60-120s for ultra slow movement
      const delay = Math.random() * 15;

      emoji.style.animationDuration = `${duration}s, ${
        Math.random() * 30 + 20
      }s`;
      emoji.style.animationDelay = `${delay}s, ${delay}s`;
      emoji.style.animationName = "emoji-float, emoji-fade";
      emoji.style.animationTimingFunction = "ease-in-out, ease-in-out";
      emoji.style.animationIterationCount = "infinite, infinite";
      emoji.style.animationDirection = "alternate, alternate";

      container.appendChild(emoji);
      emojis.push(emoji);
    }

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
        
        /* Hero title glow effect */
        @keyframes title-glow {
          0% { text-shadow: 0 0 10px ${
            colorMode === "dark"
              ? "rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)"
              : "rgba(56, 189, 248, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)"
          }; }
          50% { text-shadow: 0 0 15px ${
            colorMode === "dark"
              ? "rgba(245, 158, 11, 0.6), 0 0 25px rgba(245, 158, 11, 0.3)"
              : "rgba(56, 189, 248, 0.6), 0 0 25px rgba(56, 189, 248, 0.3)"
          }; }
          100% { text-shadow: 0 0 10px ${
            colorMode === "dark"
              ? "rgba(245, 158, 11, 0.4), 0 0 20px rgba(245, 158, 11, 0.2)"
              : "rgba(56, 189, 248, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)"
          }; }
        }
        
        /* Button hover glow */
        @keyframes button-glow {
          0% { box-shadow: 0 0 5px ${
            colorMode === "dark"
              ? "rgba(255, 163, 26, 0.5)"
              : "rgba(56, 189, 248, 0.5)"
          }; }
          50% { box-shadow: 0 0 15px ${
            colorMode === "dark"
              ? "rgba(255, 163, 26, 0.8), 0 0 20px rgba(255, 163, 26, 0.4)"
              : "rgba(56, 189, 248, 0.8), 0 0 20px rgba(56, 189, 248, 0.4)"
          }; }
          100% { box-shadow: 0 0 5px ${
            colorMode === "dark"
              ? "rgba(255, 163, 26, 0.5)"
              : "rgba(56, 189, 248, 0.5)"
          }; }
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
        
        /* Emoji animations */
        @keyframes emoji-float {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(${Math.random() * 8 - 4}vw, ${
        Math.random() * 8 - 4
      }vh) rotate(${Math.random() * 10 - 5}deg); }
          50% { transform: translate(${Math.random() * 8 - 4}vw, ${
        Math.random() * 8 - 4
      }vh) rotate(${Math.random() * 10 - 5}deg); }
          75% { transform: translate(${Math.random() * 8 - 4}vw, ${
        Math.random() * 8 - 4
      }vh) rotate(${Math.random() * 10 - 5}deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        
        @keyframes emoji-fade {
          0% { opacity: 0.1; }
          50% { opacity: 0.25; }
          100% { opacity: 0.1; }
        }
        
        /* Enhanced hero content styling */
        .hero-content {
          position: relative;
          z-index: 50;
          padding: 2rem;
          background: ${
            colorMode === "dark"
              ? "rgba(30, 30, 60, 0.3)"
              : "rgba(240, 249, 255, 0.3)"
          };
          backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 1px solid ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(56, 189, 248, 0.2)"
          };
          box-shadow: 0 10px 30px ${
            colorMode === "dark"
              ? "rgba(0, 0, 0, 0.3)"
              : "rgba(14, 165, 233, 0.15)"
          };
          margin: 2rem auto;
          max-width: 800px;
          text-align: center;
          transform: translateZ(0);
        }
        
        .hero-title {
          margin-bottom: 0.5rem;
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          animation: title-glow 4s infinite alternate ease-in-out;
        }
        
        .hero-title .gradient-text {
          background-image: linear-gradient(135deg, 
            ${
              colorMode === "dark"
                ? "#f59e0b, #d97706" // Amber/orange gradient matching "minimal API"
                : "#0ea5e9, #38bdf8" // Sky blue gradient in light mode
            });
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          filter: drop-shadow(0 2px 4px ${
            colorMode === "dark"
              ? "rgba(245, 158, 11, 0.3)"
              : "rgba(56, 189, 248, 0.3)"
          });
          position: relative;
        }
        
        /* Add a subtle backdrop to the text */
        .hero-title .gradient-text::after {
          content: "";
          position: absolute;
          top: -10%;
          left: -5%;
          right: -5%;
          bottom: -10%;
          background: ${
            colorMode === "dark"
              ? "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0) 70%)"
              : "radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(56, 189, 248, 0) 70%)"
          };
          z-index: -1;
          border-radius: 50%;
        }
        
        .hero-subtitle {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          opacity: 0.95;
          text-shadow: 0 2px 4px ${
            colorMode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.2)"
          };
        }
        
        .hero-description {
          font-size: 1.35rem;
          max-width: 600px;
          margin: 0 auto 0.5rem;
          line-height: 1.5;
          font-weight: 600;
          text-shadow: 0 1px 2px ${
            colorMode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"
          };
        }
        
        .hero-sub-description {
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto 2rem;
          line-height: 1.5;
          font-weight: 500;
          opacity: 0.85;
          text-shadow: 0 1px 2px ${
            colorMode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"
          };
        }
        
        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }
        
        .hero-buttons .button {
          padding: 0.75rem 1.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .hero-buttons .button--primary {
          background: linear-gradient(135deg, 
            ${colorMode === "dark" ? "#ff9d00, #ff8500" : "#0ea5e9, #0284c7"});
          border: none;
          color: #fff;
          box-shadow: 0 4px 12px ${
            colorMode === "dark"
              ? "rgba(255, 137, 0, 0.4)"
              : "rgba(14, 165, 233, 0.4)"
          };
        }
        
        .hero-buttons .button--primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px ${
            colorMode === "dark"
              ? "rgba(255, 137, 0, 0.6)"
              : "rgba(14, 165, 233, 0.6)"
          };
          animation: button-glow 2s infinite alternate ease-in-out;
        }
        
        .hero-buttons .button--secondary {
          background: ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(240, 249, 255, 0.7)"
          };
          border: 1px solid ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(56, 189, 248, 0.3)"
          };
          color: ${colorMode === "dark" ? "#ffffff" : "#0284c7"};
          backdrop-filter: blur(5px);
          box-shadow: 0 4px 12px ${
            colorMode === "dark"
              ? "rgba(0, 0, 0, 0.4)"
              : "rgba(14, 165, 233, 0.2)"
          };
        }
        
        .hero-buttons .button--secondary:hover {
          transform: translateY(-3px);
          background: ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(240, 249, 255, 0.9)"
          };
          box-shadow: 0 8px 16px ${
            colorMode === "dark"
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(14, 165, 233, 0.3)"
          };
        }
        
        /* Fix speech bubbles to appear above hero content */
        .speech-bubble {
          z-index: 100 !important;
          position: relative;
        }
        
        .hero__mascot {
          z-index: 60;
        }
        
        .faded-emoji {
          position: absolute;
          pointer-events: none;
          z-index: 4; /* Below JSON animations, above background */
          transition: all 0.5s ease;
          filter: blur(1px);
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
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
        
        /* Hero container with more space for mascots */
        .hero-container {
          position: relative;
          overflow: hidden;
          padding-bottom: 100px; /* Add more space at the bottom for mascots */
          min-height: 520px; /* Ensure minimum height for content plus mascot space */
        }
        
        /* Improved speech bubbles with more room */
        .speech-bubble {
          position: absolute;
          min-width: 120px;
          min-height: 40px;
          background: ${
            colorMode === "dark"
              ? "rgba(30, 30, 60, 0.6)"
              : "rgba(240, 249, 255, 0.8)"
          };
          border: 1px solid ${
            colorMode === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(56, 189, 248, 0.4)"
          };
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(5px);
          top: -45px;
          z-index: 100;
          color: ${colorMode === "dark" ? "#ffffff" : "#0284c7"};
        }

        .hero__mascot--squirrel .speech-bubble {
          left: -30px;
          transform-origin: bottom left;
        }

        .hero__mascot--duck .speech-bubble {
          right: -30px;
          transform-origin: bottom right;
        }

        .speech-bubble::before {
          content: attr(data-message);
          display: block;
          text-align: center;
        }

        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -8px;
          width: 16px;
          height: 16px;
          background: inherit;
          border-right: inherit;
          border-bottom: inherit;
          border-top: 0;
          border-left: 0;
          transform: rotate(45deg);
          backdrop-filter: blur(5px);
          box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.1);
          z-index: -1;
        }

        .hero__mascot--squirrel .speech-bubble::after {
          left: 20px;
        }

        .hero__mascot--duck .speech-bubble::after {
          right: 20px;
        }
        
        /* Mascot animations and positioning */
        .hero__mascots {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 120px; /* Increased height for mascot playground */
          z-index: 55;
        }

        .hero__mascot {
          position: absolute;
          font-size: 2.5rem;
          transition: transform 0.3s ease;
          cursor: pointer;
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
        }
        
        .hero__mascot--squirrel {
          animation: mascot-roam-1 20s infinite alternate ease-in-out, 
                     mascot-bounce 8s infinite alternate ease-in-out;
        }
        
        .hero__mascot--duck {
          animation: mascot-roam-2 22s 1s infinite alternate-reverse ease-in-out,
                     mascot-bounce 9s infinite alternate-reverse ease-in-out;
        }
        
        @keyframes mascot-roam-1 {
          0% { left: 15%; bottom: 20px; }
          20% { left: 25%; bottom: 30px; }
          40% { left: 40%; bottom: 15px; }
          60% { left: 30%; bottom: 25px; }
          80% { left: 20%; bottom: 35px; }
          100% { left: 35%; bottom: 20px; }
        }
        
        @keyframes mascot-roam-2 {
          0% { right: 15%; bottom: 25px; }
          20% { right: 30%; bottom: 15px; }
          40% { right: 20%; bottom: 30px; }
          60% { right: 35%; bottom: 20px; }
          80% { right: 25%; bottom: 35px; }
          100% { right: 30%; bottom: 15px; }
        }
        
        @keyframes mascot-bounce {
          0% { transform: translateY(0) rotate(0deg); }
          20% { transform: translateY(-8px) rotate(-5deg); }
          40% { transform: translateY(0) rotate(5deg); }
          60% { transform: translateY(-5px) rotate(-2deg); }
          80% { transform: translateY(3px) rotate(3deg); }
          100% { transform: translateY(-3px) rotate(0deg); }
        }
        
        .hero__mascots.interacting .hero__mascot--squirrel {
          animation-play-state: paused;
          left: 40%;
          bottom: 40px;
          transform: rotate(15deg) scale(1.1);
        }
        
        .hero__mascots.interacting .hero__mascot--duck {
          animation-play-state: paused;
          right: 40%;
          bottom: 40px;
          transform: rotate(-15deg) scale(1.1);
        }
        
        .hero__mascots.interacting .speech-bubble::before {
          content: "I love reactive state!";
        }
      `;
      document.head.appendChild(styleSheet);
    }

    elementsRef.current = elements;
    firefliesRef.current = fireflies;
    emojisRef.current = emojis;

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

      // Very subtle changes for emojis
      emojis.forEach((emoji) => {
        const currentOpacity = parseFloat(emoji.style.opacity || "0.2");
        const opacityChange = Math.random() * 0.05 - 0.025; // -0.025 to 0.025
        const newOpacity = Math.max(
          0.1,
          Math.min(0.3, currentOpacity + opacityChange)
        );
        emoji.style.opacity = newOpacity.toString();
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

      [...elements, ...fireflies, ...emojis].forEach((element) => {
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
          <span className="gradient-text">💫 jods &#123;&#125; </span>
        </h1>
        <p className="hero-subtitle">
          <span className="gradient-text">✨</span> JavaScript Object Dynamics
          System 🔄
        </p>
        <p className="hero-description">
          Intuitive reactive state brings JS objects to life
        </p>
        <p className="hero-sub-description">
          Zero boilerplate. TypeScript-first. Blazing fast.
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

      {/* Animated Mascots - Easter Egg */}
      <div
        className={`hero__mascots ${mascotsInteracting ? "interacting" : ""}`}
      >
        <div
          className="hero__mascot hero__mascot--squirrel"
          onClick={() => setMascotsInteracting(!mascotsInteracting)}
          onMouseEnter={handleMascotHover}
          title="Click to make friends with the duck!"
        >
          🐿️
          <div className="speech-bubble"></div>
        </div>
        <div
          className="hero__mascot hero__mascot--duck"
          onClick={() => setMascotsInteracting(!mascotsInteracting)}
          onMouseEnter={handleMascotHover}
          title="Click to make friends with the squirrel!"
        >
          🦆
          <div className="speech-bubble"></div>
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
