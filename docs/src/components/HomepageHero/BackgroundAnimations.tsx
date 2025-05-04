import React, { useEffect, useRef } from "react";
import {
  getThemeColors,
  jsonSnippets,
  themeEmojis,
  createKeyframesString,
  randomBetween,
} from "./utils";

interface BackgroundAnimationsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isPaused: boolean;
  colorMode: "dark" | "light";
}

export default function BackgroundAnimations({
  containerRef,
  isPaused,
  colorMode,
}: BackgroundAnimationsProps): React.ReactElement | null {
  const elementsRef = useRef<HTMLDivElement[]>([]);
  const firefliesRef = useRef<HTMLDivElement[]>([]);
  const emojisRef = useRef<HTMLDivElement[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const elements: HTMLDivElement[] = [];
    const fireflies: HTMLDivElement[] = [];
    const emojis: HTMLDivElement[] = [];

    // Number of elements to create
    const numElements = 16;
    const numFireflies = 24;
    const numEmojis = 10;

    // Create a virtual grid for initial positioning
    const gridRows = 4;
    const gridCols = 4;

    // Used snippets tracker to avoid duplicates in nearby cells
    const usedIndices = new Set<number>();

    // Choose color palette based on current theme
    const colors = getThemeColors(colorMode);

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
      emoji.style.opacity = (0.1 + Math.random() * 0.2).toString();

      // Add a blur effect to make them more ethereal
      emoji.style.filter = `blur(${Math.random() * 2 + 1}px)`;

      // Animation parameters for dreamlike movement
      const duration = Math.random() * 60 + 60;
      const delay = Math.random() * 15;

      emoji.style.animationDuration = `${duration}s, ${randomBetween(20, 50)}s`;
      emoji.style.animationDelay = `${delay}s, ${delay}s`;
      emoji.style.animationName = "emoji-float, emoji-fade";
      emoji.style.animationTimingFunction = "ease-in-out, ease-in-out";
      emoji.style.animationIterationCount = "infinite, infinite";
      emoji.style.animationDirection = "alternate, alternate";

      container.appendChild(emoji);
      emojis.push(emoji);
    }

    // Create fireflies
    for (let i = 0; i < numFireflies; i++) {
      const firefly = document.createElement("div");
      firefly.className = "firefly";

      // Random position throughout the container
      firefly.style.top = `${Math.random() * 100}%`;
      firefly.style.left = `${Math.random() * 100}%`;

      // Random size (small)
      const size = Math.random() * 6 + 3;
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
      const duration = Math.random() * 50 + 40;
      const delay = Math.random() * 10;

      firefly.style.animationDuration = `${duration}s, ${randomBetween(
        4,
        10
      )}s`;
      firefly.style.animationDelay = `${delay}s, ${delay}s`;
      firefly.style.animationName = "firefly-path, firefly-glow";

      container.appendChild(firefly);
      fireflies.push(firefly);
    }

    // Create JSON text elements
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

      // Make it more faded by reducing opacity
      element.style.opacity = (0.2 + Math.random() * 0.3).toString();

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
      const duration = Math.random() * 40 + 50;
      const delay = Math.random() * 15;

      element.style.animationDuration = `${duration}s, ${randomBetween(
        15,
        35
      )}s, ${randomBetween(15, 40)}s`;
      element.style.animationDelay = `${delay}s, ${delay}s, ${delay}s`;
      element.style.animationName = "text-float, text-fade, text-rotate";
      element.style.animationTimingFunction =
        "ease-in-out, ease-in-out, ease-in-out";
      element.style.animationIterationCount = "infinite, infinite, infinite";
      element.style.animationDirection = "alternate, alternate, normal";

      // Add 3D transform for depth
      element.style.transform = `perspective(1000px) rotateX(${randomBetween(
        -5,
        5
      )}deg) rotateY(${randomBetween(-5, 5)}deg)`;

      container.appendChild(element);
      elements.push(element);
    }

    // Add CSS animations if they don't exist yet
    if (!document.getElementById("json-animations-css")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "json-animations-css";

      // Create keyframes string for animations
      styleSheet.textContent = createKeyframesString(colorMode);

      document.head.appendChild(styleSheet);
    }

    elementsRef.current = elements;
    firefliesRef.current = fireflies;
    emojisRef.current = emojis;

    // Subtle animation effects for dreamlike quality
    animationRef.current = setInterval(() => {
      if (isPaused) return;

      // Update JSON elements opacity
      elements.forEach((element) => {
        const currentOpacity = parseFloat(element.style.opacity || "0.3");
        const opacityChange = Math.random() * 0.1 - 0.05;
        const newOpacity = Math.max(
          0.1,
          Math.min(0.5, currentOpacity + opacityChange)
        );
        element.style.opacity = newOpacity.toString();
      });

      // Update emoji opacity
      emojis.forEach((emoji) => {
        const currentOpacity = parseFloat(emoji.style.opacity || "0.2");
        const opacityChange = Math.random() * 0.05 - 0.025;
        const newOpacity = Math.max(
          0.1,
          Math.min(0.3, currentOpacity + opacityChange)
        );
        emoji.style.opacity = newOpacity.toString();
      });

      // Update firefly opacity and size
      fireflies.forEach((firefly) => {
        const currentOpacity = parseFloat(firefly.style.opacity || "0.5");
        const opacityChange = Math.random() * 0.3 - 0.15;
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
    }, 2000);

    // Cleanup function
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
  }, [containerRef, colorMode, isPaused]);

  // This component doesn't render anything directly, it just adds elements to the DOM
  return null;
}
